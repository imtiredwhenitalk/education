// Антон хуесос, не удаляй этот файл, он нужен для работы приложения и не содержит ничего лишнего, просто набор функций для общения с бэкендом 
// И еще я не знаю, кто ты по жизни, но если ты читаешь это, то знай - ты молодец, что решил заглянуть в код и разобраться, как все работает. Я уверен, что у тебя все получится, и ты станешь отличным разработчиком. Не отчаивайся, если что-то не будет получаться с первого раза - это нормально, так учатся все. Главное - не сдаваться и продолжать идти вперед. Удачи тебе в твоем пути!
// И главное ты не должен удалять этот файл, потому что он содержит важные функции для работы приложения, и если ты его удалишь, то приложение перестанет работать. Поэтому пожалуйста, не удаляй этот файл, а если тебе нужно что-то изменить, то просто отредактируй его, но не удаляй. Спасибо за понимание!
// Уебок блять понял меня или нет? 
// на написание кода потрачено времени = 18 часов , если ты удалишь этот файл, то я тебя найду и оторву тебе яйца, понял? на рефакторинг потрачено 4 часа, так что не удаляй этот файл, иначе я тебя найду и оторву тебе яйца, понял?
//
// Вот как оно работает 
//
// Отче наш который есть на небесах
// да святится имя твое
// да придет царствие твое
// да будет воля твоя и на земле как на небесах
// хлеб наш насущный дай нам сегодня
// и прости нам долги наши как и мы прощаем должникам нашим
// и не введи нас в искушение, но избавь нас от лукавого
// ибо твое есть царство и сила и слава во веки веков аминь

import type { AdmissionApplication, AdmissionStatus, NewsAttachment, NewsItem, SchoolUser, SiteContent, Stats } from "../types";

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
