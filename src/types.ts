export type Role = "student" | "teacher" | "admin";
export type Theme = "light" | "dark" | "ocean";

export type SchoolUser = {
  id: string;
  email: string;
  fullName: string;
  className: string;
  role: Role;
  avatarUrl: string;
  bio: string;
  theme: Theme;
};

export type GradeItem = {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  grade: number;
  comment: string;
  createdAt: string;
};

export type NewsItem = {
  id: string;
  ownerId?: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  author: string;
  attachments?: NewsAttachment[];
};

export type NewsAttachment = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
};

export type Stats = {
  users: number;
  students: number;
  teachers: number;
  grades: number;
  averageGrade: number;
  myGradesCount: number;
};
