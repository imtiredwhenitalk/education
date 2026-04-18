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

export type QuickInfoItem = {
  title: string;
  intro: string;
  details: string[];
  attachments?: NewsAttachment[];
  linkUrl?: string;
};

export type DistanceLearningLinks = Record<string, string>;

export type InfoCard = {
  title: string;
  text: string;
  accent: string;
};

export type SiteContent = {
  headerKicker: string;
  headerTitle: string;
  headerSubtitle: string;
  heroKicker: string;
  heroTitle: string;
  heroText: string;
  ctaAdmission: string;
  ctaCabinet: string;
  ctaNews: string;
  newsTitle: string;
  newsSubtitle: string;
  newsButtonText: string;
  distanceLearningTitle: string;
  distanceLearningSubtitle: string;
  quickInfoMap: Record<string, QuickInfoItem>;
  distanceLearningLinks: DistanceLearningLinks;
  infoCards: InfoCard[];
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
};
