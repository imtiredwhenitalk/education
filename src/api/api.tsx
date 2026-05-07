import type { AdmissionApplication, AdmissionStatus, NewsAttachment, NewsItem, SchoolUser, SiteContent, Stats } from "../types";

const API_BASE = import.meta.env.VITE_API_TARGET || "";
const TOKEN_KEY = "school_token";

const readToken = () => window.localStorage.getItem(TOKEN_KEY);
const writeToken = (token: string) => window.localStorage.setItem(TOKEN_KEY, token);
const removeToken = () => window.localStorage.removeItem(TOKEN_KEY);

const request = async <T,>(url: string, options: RequestInit = {}) => {
	const token = readToken();
	const headers = new Headers(options.headers || {});

	if (!headers.has("Content-Type") && options.body) {
		headers.set("Content-Type", "application/json");
	}

	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	const response = await fetch(url, { ...options, headers });
	const contentType = response.headers.get("content-type") || "";
	const hasJson = contentType.includes("application/json");
	const payload = hasJson ? await response.json().catch(() => ({})) : {};

	if (!response.ok) {
		const errorPayload = payload as { message?: string; detail?: string };
		throw new Error(errorPayload.message || errorPayload.detail || `HTTP ${response.status}`);
	}

	return payload as T;
};

export const api = {
	tokenKey: TOKEN_KEY,
	getSavedToken: readToken,
	clearToken: removeToken,

	login: async (email: string, password: string) => {
		const result = await request<{ token: string; user: SchoolUser }>("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});

		writeToken(result.token);
		return result.user;
	},

	register: async (payload: {
		fullName: string;
		email: string;
		password: string;
		className: string;
		role: "student" | "teacher";
	}) => {
		return request<{ user: SchoolUser }>("/api/auth/register", {
			method: "POST",
			body: JSON.stringify(payload),
		});
	},

	me: async () => {
		const result = await request<{ user: SchoolUser }>("/api/users/me");
		return result.user;
	},

	updateProfile: async (payload: Partial<SchoolUser>) => {
		const result = await request<{ user: SchoolUser }>("/api/users/me", {
			method: "PUT",
			body: JSON.stringify(payload),
		});
		return result.user;
	},

	getUsers: async () => {
		const result = await request<{ users: SchoolUser[] }>("/api/users");
		return result.users;
	},

	deleteUser: async (id: string) => {
		return request<{ ok: boolean }>(`/api/users/${id}`, {
			method: "DELETE",
		});
	},

	getNews: async () => {
		const result = await request<{ news: NewsItem[] }>("/api/news");
		return result.news;
	},

	getPublicNews: async () => {
		const result = await request<{ news: NewsItem[] }>("/api/public/news", {
			headers: {
				"Content-Type": "application/json",
			},
		});
		return result.news;
	},

	getPublicSiteContent: async () => {
		const result = await request<{ content: Partial<SiteContent> }>("/api/public/site-content", {
			headers: {
				"Content-Type": "application/json",
			},
		});
		return result.content;
	},

	createNews: async (title: string, body: string, attachments: NewsAttachment[] = []) => {
		return request<{ news: NewsItem }>("/api/news", {
			method: "POST",
			body: JSON.stringify({ title, body, attachments }),
		});
	},

	updateNews: async (id: string, title: string, body: string, attachments: NewsAttachment[] = []) => {
		return request<{ news: NewsItem }>(`/api/news/${id}`, {
			method: "PUT",
			body: JSON.stringify({ title, body, attachments }),
		});
	},

	deleteNews: async (id: string) => {
		return request<{ ok: boolean }>(`/api/news/${id}`, {
			method: "DELETE",
		});
	},

	getStats: async () => {
		const result = await request<{ stats: Stats }>("/api/dashboard");
		return result.stats;
	},

	createAdmission: async (payload: {
		fullName: string;
		studentBirthDate: string;
		classGoal: string;
		parentName: string;
		parentPhone: string;
		email: string;
		notes: string;
		attachments: NewsAttachment[];
	}) => {
		return request<{ admission: AdmissionApplication }>("/api/public/admissions", {
			method: "POST",
			body: JSON.stringify(payload),
		});
	},

	getAdmissions: async () => {
		const result = await request<{ admissions: AdmissionApplication[] }>("/api/admissions");
		return result.admissions; 
	},

	updateAdmission: async (
		id: string,
		payload: { status: AdmissionStatus; assignedTeacherId?: string; adminComment?: string },
	) => {
		return request<{ admission: AdmissionApplication }>(`/api/admissions/${id}`, {
			method: "PUT",
			body: JSON.stringify(payload),
		});
	},

	updateSiteContent: async (content: SiteContent) => {
		const result = await request<{ content: SiteContent }>("/api/site-content", {
			method: "PUT",
			body: JSON.stringify({ content }),
		});
		return result.content;
	},
};
