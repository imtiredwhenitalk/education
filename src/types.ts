export type Role = "student" | "teacher" | "admin";
export type Theme = "light";

export type SchoolUser = {
  id: string;
  email: string;
  fullName: string;
  className: string;
  role: Role;
  assignedTeacherId?: string | null;
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

export type AdmissionStatus = "pending" | "accepted" | "rejected";

export type AdmissionApplication = {
  id: string;
  fullName: string;
  studentBirthDate: string;
  classGoal: string;
  parentName: string;
  parentPhone: string;
  email: string;
  studentEmail?: string;
  notes: string;
  status: AdmissionStatus;
  assignedTeacherId?: string | null;
  linkedStudentId?: string;
  adminComment?: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: NewsAttachment[];
};

export type Stats = {
  users: number;
  students: number;
  teachers: number;
  grades: number;
  averageGrade: number;
  myGradesCount: number;
};
