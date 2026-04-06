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
from pydantic import BaseModel

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
    attachments: List[AttachmentPayload] = []


class GradeCreatePayload(BaseModel):
    studentId: str
    subject: str
    grade: int
    comment: str = ""


class GradeUpdatePayload(BaseModel):
    subject: str
    grade: int
    comment: str = ""


app = FastAPI(title="School Portal Python API")

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
            return {"users": [], "grades": [], "news": []}
        with DATA_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)


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

    allowed_themes = {"light", "dark", "ocean"}
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
    return {"users": [public_user(u) for u in db["users"]]}


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


@app.get("/api/grades")
def get_grades(user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    db = read_db()
    grades = db["grades"]

    if user["role"] == "student":
        grades = [row for row in db["grades"] if row["studentId"] == user["id"]]
    elif user["role"] == "teacher":
        grades = [row for row in db["grades"] if row["teacherId"] == user["id"] or row["studentId"] == user["id"]]

    return {"grades": grades}


@app.post("/api/grades")
def create_grade(payload: GradeCreatePayload, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["teacher"])

    if payload.grade < 1 or payload.grade > 12:
        raise HTTPException(status_code=400, detail="Invalid grade payload")

    db = read_db()
    student = next((u for u in db["users"] if u["id"] == payload.studentId and u["role"] == "student"), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    row = {
        "id": uid("g"),
        "studentId": payload.studentId,
        "teacherId": user["id"],
        "subject": payload.subject.strip(),
        "grade": payload.grade,
        "comment": payload.comment.strip(),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    db["grades"].insert(0, row)
    write_db(db)
    return {"grade": row}


@app.put("/api/grades/{grade_id}")
def update_grade(grade_id: str, payload: GradeUpdatePayload, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["teacher", "admin"])

    if payload.grade < 1 or payload.grade > 12:
        raise HTTPException(status_code=400, detail="Invalid grade payload")

    db = read_db()
    index = next((i for i, x in enumerate(db["grades"]) if x["id"] == grade_id), -1)
    if index == -1:
        raise HTTPException(status_code=404, detail="Grade not found")

    current = db["grades"][index]
    can_edit = user["role"] == "admin" or current["teacherId"] == user["id"]
    if not can_edit:
        raise HTTPException(status_code=403, detail="You can edit only your own grades")

    current["subject"] = payload.subject.strip()
    current["grade"] = payload.grade
    current["comment"] = payload.comment.strip()
    current["updatedAt"] = datetime.now(timezone.utc).isoformat()
    db["grades"][index] = current
    write_db(db)

    return {"grade": current}


@app.delete("/api/grades/{grade_id}")
def delete_grade(grade_id: str, user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    require_role(user, ["teacher", "admin"])

    db = read_db()
    index = next((i for i, x in enumerate(db["grades"]) if x["id"] == grade_id), -1)
    if index == -1:
        raise HTTPException(status_code=404, detail="Grade not found")

    current = db["grades"][index]
    can_delete = user["role"] == "admin" or current["teacherId"] == user["id"]
    if not can_delete:
        raise HTTPException(status_code=403, detail="You can delete only your own grades")

    db["grades"].pop(index)
    write_db(db)
    return {"ok": True}


@app.get("/api/dashboard")
def dashboard(user: Dict[str, Any] = Depends(auth_user)) -> Dict[str, Any]:
    db = read_db()
    students = [u for u in db["users"] if u["role"] == "student"]
    teachers = [u for u in db["users"] if u["role"] == "teacher"]

    avg = 0.0
    if db["grades"]:
        avg = sum(int(row["grade"]) for row in db["grades"]) / len(db["grades"])

    if user["role"] == "student":
        my_grades = [row for row in db["grades"] if row["studentId"] == user["id"]]
    elif user["role"] == "teacher":
        my_grades = [row for row in db["grades"] if row["teacherId"] == user["id"]]
    else:
        my_grades = db["grades"]

    return {
        "stats": {
            "users": len(db["users"]),
            "students": len(students),
            "teachers": len(teachers),
            "grades": len(db["grades"]),
            "averageGrade": round(avg, 2),
            "myGradesCount": len(my_grades),
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
