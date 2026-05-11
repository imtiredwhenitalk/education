from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    full_name: Mapped[str] = mapped_column(String(255))
    class_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), index=True)
    avatar_url: Mapped[str] = mapped_column(Text)
    bio: Mapped[str] = mapped_column(Text, default="")
    theme: Mapped[str] = mapped_column(String(32), default="light")
    assigned_teacher_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)


class Admission(Base):
    __tablename__ = "admissions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255))
    student_birth_date: Mapped[str] = mapped_column(String(32))
    class_goal: Mapped[str] = mapped_column(String(255))
    parent_name: Mapped[str] = mapped_column(String(255))
    parent_phone: Mapped[str] = mapped_column(String(64))
    email: Mapped[str] = mapped_column(String(255), index=True)
    student_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), index=True)
    assigned_teacher_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    linked_student_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    admin_comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    attachments: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)


class SiteContent(Base):
    __tablename__ = "site_content"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    content: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class News(Base):
    __tablename__ = "news"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(32), index=True)
    title: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    attachments: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)


def user_to_dict(item: User) -> Dict[str, Any]:
    return {
        "id": item.id,
        "email": item.email,
        "passwordHash": item.password_hash,
        "fullName": item.full_name,
        "className": item.class_name,
        "role": item.role,
        "assignedTeacherId": item.assigned_teacher_id,
        "avatarUrl": item.avatar_url,
        "bio": item.bio or "",
        "theme": item.theme or "light",
    }


def admission_to_dict(item: Admission) -> Dict[str, Any]:
    return {
        "id": item.id,
        "fullName": item.full_name,
        "studentBirthDate": item.student_birth_date,
        "classGoal": item.class_goal,
        "parentName": item.parent_name,
        "parentPhone": item.parent_phone,
        "email": item.email,
        "studentEmail": item.student_email,
        "notes": item.notes or "",
        "status": item.status,
        "assignedTeacherId": item.assigned_teacher_id,
        "linkedStudentId": item.linked_student_id,
        "adminComment": item.admin_comment or "",
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
        "attachments": item.attachments or [],
    }


def site_content_to_dict(item: SiteContent) -> Dict[str, Any]:
    return dict(item.content or {})


def news_to_public_dict(item: News) -> Dict[str, Any]:
    return {
        "id": item.id,
        "ownerId": item.owner_id,
        "title": item.title,
        "body": item.body,
        "author": item.author,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
        "attachments": item.attachments or [],
    }
