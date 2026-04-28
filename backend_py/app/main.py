import json
import os
import secrets
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_key")
JWT_ALG = "HS256"
TOKEN_EXPIRE_DAYS = 7
PORT = int(os.getenv("PORT", "8000"))

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT_DIR / "backend_py" / "data" / "store.json"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
lock = threading.Lock()

class RegisterPayload(BaseModel):
    fullName: str
    email: str
    password: str
    className: str
    role: str


class LoginPayload(BaseModel):
    email: str
    password: str

class ProfileUpdatePayload(BaseModel):
    fullName: Optional[str] = None
    className: Optional[str] = None
    bio: Optional[str] = None
    avatarUrl: Optional[str] = None
    theme: Optional[str] = None


class AttachmentPayload(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    mimeType: Optional[str] = None
    dataUrl: Optional[str] = None


class NewsPayload(BaseModel):
    title: str
    body: str
    attachments: List[AttachmentPayload] = Field(default_factory=list)


class AdmissionCreatePayload(BaseModel):
    fullName: str
    studentBirthDate: str
    classGoal: str
    parentName: str
    parentPhone: str
    email: str
    notes: str = ""
    attachments: List[AttachmentPayload] = Field(default_factory=list)


class AdmissionUpdatePayload(BaseModel):
    status: str
    assignedTeacherId: Optional[str] = None
    adminComment: Optional[str] = None


class SiteContentUpdatePayload(BaseModel):
    content: Dict[str, Any]


app = FastAPI(title="Суський ліцей, Волинської області Python API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def read_db() -> Dict[str, Any]:
    with lock:
        if not DATA_FILE.exists():
            return {"users": [], "news": [], "admissions": [], "siteContent": {}}
        with DATA_FILE.open("r", encoding="utf-8") as f:
            db = json.load(f)

    if "users" not in db:
        db["users"] = []
    if "news" not in db:
        db["news"] = []
    if "admissions" not in db:
        db["admissions"] = []
    if "siteContent" not in db:
        db["siteContent"] = {}

    return db


def write_db(db: Dict[str, Any]) -> None:
    with lock:
        with DATA_FILE.open("w", encoding="utf-8") as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
            f.write("\n")


def uid(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(6)}"


def public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(user)
    out.pop("passwordHash", None)
    return out


def verify_password(raw: str, stored: str) -> bool:
    if stored.startswith("$2"):
        return pwd_context.verify(raw, stored)
    return raw == stored


def create_token(user: Dict[str, Any]) -> str:
    payload = {
        "id": user["id"],
        "role": user["role"],
        "email": user["email"],
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def sanitize_attachments(items: List[AttachmentPayload]) -> List[Dict[str, str]]:
    clean: List[Dict[str, str]] = []
    for item in items:
        data_url = (item.dataUrl or "").strip()
        if not data_url.startswith("data:"):
            continue
        clean.append(
            {
                "id": item.id or uid("a"),
                "name": (item.name or "file")[:120],
                "mimeType": item.mimeType or "application/octet-stream",
                "dataUrl": data_url,
            }
        )
    return clean


def unique_student_email(db: Dict[str, Any], base_email: str, app_id: str) -> str:
    requested = (base_email or "").strip().lower()
    if requested and not any(u["email"] == requested for u in db["users"]):
        return requested

    fallback = f"admission-{app_id}@school.local"
    if not any(u["email"] == fallback for u in db["users"]):
        return fallback

    index = 1
    while True:
        candidate = f"admission-{app_id}-{index}@school.local"
        if not any(u["email"] == candidate for u in db["users"]):
            return candidate
        index += 1


def upsert_student_from_admission(db: Dict[str, Any], admission: Dict[str, Any], assigned_teacher_id: str) -> str:
    linked_id = admission.get("linkedStudentId")
    current = next((u for u in db["users"] if u["id"] == linked_id and u["role"] == "student"), None)

    if current:
        current["fullName"] = admission["fullName"]
        current["className"] = admission["classGoal"]
        current["assignedTeacherId"] = assigned_teacher_id
        return current["id"]

    student = {
        "id": uid("u"),
        "email": unique_student_email(db, admission.get("studentEmail") or admission.get("email", ""), admission["id"]),
        "passwordHash": pwd_context.hash(secrets.token_urlsafe(10)),
        "fullName": admission["fullName"],
        "className": admission["classGoal"],
        "role": "student",
        "avatarUrl": "https://i.pravatar.cc/120",
        "bio": "Створено з заявки на вступ",
        "theme": "light",
        "assignedTeacherId": assigned_teacher_id,
    }
    db["users"].append(student)
    return student["id"]


def auth_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    db = read_db()
    user = next((u for u in db["users"] if u["id"] == payload.get("id")), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    return user


def require_role(user: Dict[str, Any], roles: List[str]) -> None:
    if user.get("role") not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "service": "school-portal-python-api"}


@app.get("/api/public/news")
def public_news() -> Dict[str, Any]:
    db = read_db()
    rows = sorted(db["news"], key=lambda x: x.get("createdAt", ""), reverse=True)[:8]
    return {"news": rows}


@app.get("/api/public/site-content")
def public_site_content() -> Dict[str, Any]:
    db = read_db()
    content = db.get("siteContent")
    if not isinstance(content, dict):
        content = {}
    return {"content": content}


@app.post("/api/auth/register")
def register(payload: RegisterPayload) -> Dict[str, Any]:
    if payload.role not in ["student", "teacher"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    db = read_db()
    exists = any(u["email"].lower() == payload.email.lower().strip() for u in db["users"])
    if exists:
        raise HTTPException(status_code=409, detail="Email already used")

    user = {
        "id": uid("u"),
        "email": payload.email.lower().strip(),
        "passwordHash": pwd_context.hash(payload.password),
        "fullName": payload.fullName.strip(),
        "className": payload.className.strip(),
        "role": payload.role,
        "avatarUrl": "https://i.pravatar.cc/120",
        "bio": "",
        "theme": "light",
    }
    db["users"].append(user)
    write_db(db)

    return {"user": public_user(user)}


@app.post("/api/auth/login")
def login(payload: LoginPayload) -> Dict[str, Any]:
    db = read_db()
    user = next((u for u in db["users"] if u["email"] == payload.email.lower().strip()), None)

    if not user or not verify_password(payload.password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user)
    return {"token": token, "user": public_user(user)}


@app.get("/api/users/me")
def me(user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    return {"user": public_user(user)}


@app.put("/api/users/me")
def update_me(payload: ProfileUpdatePayload, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    db = read_db()
    index = next((i for i, u in enumerate(db["users"]) if u["id"] == user["id"]), -1)
    if index == -1:
        raise HTTPException(status_code=404, detail="User not found")

    allowed_themes = {"light"}
    current = db["users"][index]

    if payload.fullName is not None:
        current["fullName"] = payload.fullName
    if payload.className is not None:
        current["className"] = payload.className
    if payload.bio is not None:
        current["bio"] = payload.bio
    if payload.avatarUrl is not None:
        current["avatarUrl"] = payload.avatarUrl
    if payload.theme is not None and payload.theme in allowed_themes:
        current["theme"] = payload.theme

    db["users"][index] = current
    write_db(db)

    return {"user": public_user(current)}


@app.get("/api/users")
def get_users(user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["admin", "teacher"])
    db = read_db()

    if user["role"] == "teacher":
        visible: List[Dict[str, Any]] = []
        for row in db["users"]:
            if row["id"] == user["id"]:
                visible.append(row)
                continue
            if row.get("role") != "student":
                continue
            assigned = row.get("assignedTeacherId")
            if not assigned or assigned == user["id"]:
                visible.append(row)
        return {"users": [public_user(u) for u in visible]}

    return {"users": [public_user(u) for u in db["users"]]}


@app.delete("/api/users/{user_id}")
def delete_user(user_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["admin"])

    db = read_db()
    index = next((i for i, u in enumerate(db["users"]) if u["id"] == user_id), -1)
    if index == -1:
        raise HTTPException(status_code=404, detail="User not found")

    # Не дозволяємо видаляти самого себе
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Видаляємо всі пов'язані дані: новини, заявки
    db["news"] = [n for n in db["news"] if n.get("ownerId") != user_id]
    db["admissions"] = [a for a in db["admissions"] if a.get("linkedStudentId") != user_id]

    # Якщо видаляється вчитель, відв'язуємо його від учнів.
    for candidate in db["users"]:
        if candidate.get("assignedTeacherId") == user_id:
            candidate["assignedTeacherId"] = None

    # Видаляємо користувача
    db["users"].pop(index)
    write_db(db)
    return {"ok": True}


@app.post("/api/public/admissions")
def create_admission(payload: AdmissionCreatePayload) -> Dict[str, Any]:
    if not payload.fullName.strip() or not payload.classGoal.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="Required fields are missing")

    db = read_db()
    row = {
        "id": uid("adm"),
        "fullName": payload.fullName.strip(),
        "studentBirthDate": payload.studentBirthDate.strip(),
        "classGoal": payload.classGoal.strip(),
        "parentName": payload.parentName.strip(),
        "parentPhone": payload.parentPhone.strip(),
        "email": payload.email.strip().lower(),
        "studentEmail": payload.email.strip().lower(),
        "notes": payload.notes.strip(),
        "status": "pending",
        "assignedTeacherId": None,
        "adminComment": "",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "attachments": sanitize_attachments(payload.attachments),
    }
    db["admissions"].insert(0, row)
    write_db(db)
    return {"admission": row}


@app.get("/api/admissions")
def get_admissions(user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["admin"])
    db = read_db()
    rows = sorted(db["admissions"], key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"admissions": rows}


@app.put("/api/admissions/{admission_id}")
def update_admission(admission_id: str, payload: AdmissionUpdatePayload, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["admin"])
    db = read_db()

    index = next((i for i, x in enumerate(db["admissions"]) if x["id"] == admission_id), -1)
    if index == -1:
        raise HTTPException(status_code=404, detail="Admission not found")

    admission = db["admissions"][index]
    next_status = payload.status.strip().lower()
    if next_status not in ["pending", "accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    teacher_id = payload.assignedTeacherId
    if next_status == "accepted":
        if not teacher_id:
            raise HTTPException(status_code=400, detail="Select teacher before accepting")
        teacher = next((u for u in db["users"] if u["id"] == teacher_id and u["role"] == "teacher"), None)
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")

        linked_student_id = upsert_student_from_admission(db, admission, teacher_id)
        admission["linkedStudentId"] = linked_student_id
        admission["assignedTeacherId"] = teacher_id

        # Повертаємо admission перед видаленням
        result = {"admission": admission}

        # Видаляємо заявку після прийняття
        db["admissions"].pop(index)
        write_db(db)
        return result
    elif teacher_id:
        teacher = next((u for u in db["users"] if u["id"] == teacher_id and u["role"] == "teacher"), None)
        if teacher:
            admission["assignedTeacherId"] = teacher_id

    admission["status"] = next_status
    admission["adminComment"] = (payload.adminComment or "").strip()
    admission["updatedAt"] = datetime.now(timezone.utc).isoformat()

    db["admissions"][index] = admission
    write_db(db)
    return {"admission": admission}

@app.get("/api/news")
def get_news(_user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    db = read_db()
    rows = sorted(db["news"], key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"news": rows}


@app.post("/api/news")
def create_news(payload: NewsPayload, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["teacher", "admin"])
    if not payload.title.strip() or not payload.body.strip():
        raise HTTPException(status_code=400, detail="Title and body required")

    db = read_db()
    row = {
        "id": uid("n"),
        "ownerId": user["id"],
        "title": payload.title.strip(),
        "body": payload.body.strip(),
        "author": user["fullName"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "attachments": sanitize_attachments(payload.attachments),
    }
    db["news"].insert(0, row)
    write_db(db)
    return {"news": row}


@app.put("/api/news/{news_id}")
def update_news(news_id: str, payload: NewsPayload, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["teacher", "admin"])
    if not payload.title.strip() or not payload.body.strip():
        raise HTTPException(status_code=400, detail="Title and body required")

    db = read_db()

    index = next((i for i, x in enumerate(db["news"]) if x["id"] == news_id), -1)
    if index == -1:
        raise HTTPException(status_code=404, detail="News not found")

    item = db["news"][index]
    can_edit = user["role"] == "admin" or item.get("ownerId") == user["id"] or item.get("author") == user["fullName"]
    if not can_edit:
        raise HTTPException(status_code=403, detail="You can edit only your own news")

    item["title"] = payload.title.strip()
    item["body"] = payload.body.strip()
    item["attachments"] = sanitize_attachments(payload.attachments)
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    db["news"][index] = item
    write_db(db)

    return {"news": item}


@app.delete("/api/news/{news_id}")
def delete_news(news_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["teacher", "admin"])
    db = read_db()

    index = next((i for i, x in enumerate(db["news"]) if x["id"] == news_id), -1)
    if index == -1:
        raise HTTPException(status_code=404, detail="News not found")

    item = db["news"][index]
    can_delete = user["role"] == "admin" or item.get("ownerId") == user["id"] or item.get("author") == user["fullName"]
    if not can_delete:
        raise HTTPException(status_code=403, detail="You can delete only your own news")

    db["news"].pop(index)
    write_db(db)
    return {"ok": True}


@app.get("/api/dashboard")
def dashboard(user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    db = read_db()
    students = [u for u in db["users"] if u["role"] == "student"]
    teachers = [u for u in db["users"] if u["role"] == "teacher"]

    return {
        "stats": {
            "users": len(db["users"]),
            "students": len(students),
            "teachers": len(teachers),
        }
    }

@app.put("/api/site-content")
def update_site_content(payload: SiteContentUpdatePayload, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["admin"])
    if not isinstance(payload.content, dict):
        raise HTTPException(status_code=400, detail="Invalid content payload")

    db = read_db()
    db["siteContent"] = payload.content
    write_db(db)
    return {"content": db["siteContent"]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
