import type { GradeItem, NewsAttachment, NewsItem, SchoolUser, Stats } from "../types";

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
	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || payload.detail || "API error");
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

	getGrades: async () => {
		const result = await request<{ grades: GradeItem[] }>("/api/grades");
		return result.grades;
	},

	createGrade: async (payload: {
		studentId: string;
		subject: string;
		grade: number;
		comment: string;
	}) => {
		return request<{ grade: GradeItem }>("/api/grades", {
			method: "POST",
			body: JSON.stringify(payload),
		});
	},

	updateGrade: async (id: string, payload: { subject: string; grade: number; comment: string }) => {
		return request<{ grade: GradeItem }>(`/api/grades/${id}`, {
			method: "PUT",
			body: JSON.stringify(payload),
		});
	},

	deleteGrade: async (id: string) => {
		return request<{ ok: boolean }>(`/api/grades/${id}`, {
			method: "DELETE",
		});
	},

	getStats: async () => {
		const result = await request<{ stats: Stats }>("/api/dashboard");
		return result.stats;
	},
};
