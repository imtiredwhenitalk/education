import { useEffect, useMemo, useState } from "react";
import type { AdmissionApplication, AdmissionStatus, SchoolUser, SiteContent } from "../types";

type AdminPanelProps = {
	users: SchoolUser[];
	admissions: AdmissionApplication[];
	onUpdateAdmission: (
		id: string,
		payload: { status: AdmissionStatus; assignedTeacherId?: string; adminComment?: string },
	) => Promise<void>;
	onDeleteUser: (id: string) => Promise<void>;
	onSaveSiteContent: (content: SiteContent) => Promise<unknown>;
	siteContent: SiteContent;
	user: SchoolUser;
};

type AdmissionDraft = {
	status: AdmissionStatus;
	assignedTeacherId: string;
	adminComment: string;
};

export default function AdminPanel({ users, admissions, onUpdateAdmission, onDeleteUser, onSaveSiteContent, siteContent, user }: AdminPanelProps) {
	const [query, setQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [savingId, setSavingId] = useState("");
	const [drafts, setDrafts] = useState<Record<string, AdmissionDraft>>({});
	const [contentJson, setContentJson] = useState(() => JSON.stringify(siteContent, null, 2));
	const [contentError, setContentError] = useState("");
	const [savingContent, setSavingContent] = useState(false);

	const classOptions = useMemo(
		() => Array.from(new Set(users.map((u) => u.className))).sort((a, b) => a.localeCompare(b)),
		[users],
	);
	const [classFilter, setClassFilter] = useState("all");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return users.filter((user) => {
			const byRole = roleFilter === "all" || user.role === roleFilter;
			const byClass = classFilter === "all" || user.className === classFilter;
			const byQuery =
				!q ||
				user.fullName.toLowerCase().includes(q) ||
				user.email.toLowerCase().includes(q) ||
				user.className.toLowerCase().includes(q);
			return byRole && byClass && byQuery;
		});
	}, [users, query, roleFilter, classFilter]);

	const teachers = useMemo(() => users.filter((u) => u.role === "teacher"), [users]);

	useEffect(() => {
		setDrafts((prev) => {
			const next = { ...prev };
			admissions.forEach((item) => {
				if (next[item.id]) return;
				next[item.id] = {
					status: item.status,
					assignedTeacherId: item.assignedTeacherId || "",
					adminComment: item.adminComment || "",
				};
			});
			return next;
		});
	}, [admissions]);

	useEffect(() => {
		setContentJson(JSON.stringify(siteContent, null, 2));
	}, [siteContent]);

	const updateDraft = (id: string, patch: Partial<AdmissionDraft>) => {
		setDrafts((prev) => {
			const current = prev[id] || {
				status: "pending",
				assignedTeacherId: "",
				adminComment: "",
			};
			return {
				...prev,
				[id]: {
					...current,
					...patch,
				},
			};
		});
	};

	const saveAdmission = async (id: string) => {
		const draft = drafts[id];
		if (!draft) return;

		setSavingId(id);
		try {
			await onUpdateAdmission(id, {
				status: draft.status,
				assignedTeacherId: draft.assignedTeacherId || undefined,
				adminComment: draft.adminComment,
			});
		} finally {
			setSavingId("");
		}
	};

	const saveSiteContent = async () => {
		setContentError("");
		let parsed: unknown;

		try {
			parsed = JSON.parse(contentJson);
		} catch {
			setContentError("Невірний JSON. Перевір формат.");
			return;
		}

		if (!parsed || typeof parsed !== "object") {
			setContentError("Контент має бути JSON-об'єктом.");
			return;
		}

		setSavingContent(true);
		try {
			await onSaveSiteContent(parsed as SiteContent);
		} catch {
			setContentError("Не вдалося зберегти контент.");
		} finally {
			setSavingContent(false);
		}
	};

	return (
		<section className="space-y-6">
			<article className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
				<h2 className="mb-4 text-xl font-bold text-slate-900">Заявки на вступ</h2>
				<div className="space-y-4">
					{admissions.length ? (
						admissions.map((item) => {
							const draft = drafts[item.id] || {
								status: item.status,
								assignedTeacherId: item.assignedTeacherId || "",
								adminComment: item.adminComment || "",
							};

							return (
								<article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
									<div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
										<div>
											<p className="text-xs uppercase tracking-wide text-slate-500">
												{new Date(item.createdAt).toLocaleString()}
											</p>
											<h3 className="text-lg font-bold text-slate-900">{item.fullName}</h3>
											<p className="text-sm text-slate-600">Клас вступу: {item.classGoal}</p>
											<p className="text-sm text-slate-600">Батьки: {item.parentName}</p>
											<p className="text-sm text-slate-600">Телефон: {item.parentPhone}</p>
											<p className="text-sm text-slate-600">Email: {item.email}</p>
											{item.notes ? <p className="mt-2 text-sm text-slate-700">{item.notes}</p> : null}
										</div>
										<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
											Статус: {item.status}
										</span>
									</div>

									{item.attachments?.length ? (
										<div className="mt-3 flex flex-wrap gap-2">
											{item.attachments.map((file) => (
												<a
													key={file.id}
													href={file.dataUrl}
													target="_blank"
													rel="noreferrer"
													className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-sky-700"
												>
													{file.name}
												</a>
											))}
										</div>
									) : null}

									<div className="mt-4 grid gap-3 md:grid-cols-3">
										<select
											className="rounded-lg border border-slate-300 px-3 py-2"
											value={draft.status}
											onChange={(e) =>
												updateDraft(item.id, { status: e.target.value as AdmissionStatus })
											}
										>
											<option value="pending">pending</option>
											<option value="accepted">accepted</option>
											<option value="rejected">rejected</option>
										</select>

										<select
											className="rounded-lg border border-slate-300 px-3 py-2"
											value={draft.assignedTeacherId}
											onChange={(e) => updateDraft(item.id, { assignedTeacherId: e.target.value })}
										>
											<option value="">Обери вчителя</option>
											{teachers.map((teacher) => (
												<option key={teacher.id} value={teacher.id}>
													{teacher.fullName}
												</option>
											))}
										</select>

										<input
											className="rounded-lg border border-slate-300 px-3 py-2"
											placeholder="Коментар адміністратора"
											value={draft.adminComment}
											onChange={(e) => updateDraft(item.id, { adminComment: e.target.value })}
										/>
									</div>

									<button
										onClick={() => saveAdmission(item.id)}
										disabled={savingId === item.id}
										className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-all duration-300 hover:bg-emerald-700 hover:scale-105 hover:shadow-lg"
									>
										{savingId === item.id ? "Збереження..." : "Зберегти рішення"}
									</button>
								</article>
							);
						})
					) : (
						<p className="text-sm text-slate-500">Заявок поки немає.</p>
					)}
				</div>
			</article>

			<article className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
				<h2 className="mb-4 text-xl font-bold text-slate-900">Інформаційна панель адміністратора</h2>
				<div className="mb-4 grid gap-3 md:grid-cols-3">
				<input
					className="rounded-lg border border-slate-300 px-3 py-2"
					placeholder="Пошук: ПІБ, email, клас"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				<select
					className="rounded-lg border border-slate-300 px-3 py-2"
					value={roleFilter}
					onChange={(e) => setRoleFilter(e.target.value)}
				>
					<option value="all">Всі ролі</option>
					<option value="student">Учні</option>
					<option value="teacher">Вчителі</option>
					<option value="admin">Адміни</option>
				</select>
				<select
					className="rounded-lg border border-slate-300 px-3 py-2"
					value={classFilter}
					onChange={(e) => setClassFilter(e.target.value)}
				>
					<option value="all">Всі класи/кафедри</option>
					{classOptions.map((className) => (
						<option key={className} value={className}>
							{className}
						</option>
					))}
				</select>
			</div>
			<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
				{filtered.map((u) => (
					<article key={u.id} className="rounded-xl border border-slate-300 bg-white p-4">
						<p className="font-semibold text-slate-900">{u.fullName}</p>
						<p className="text-sm text-slate-600">{u.email}</p>
						<p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{u.role}</p>
						<p className="text-xs text-slate-500">{u.className}</p>
						{u.id !== user.id && (
							<button
								onClick={() => {
									if (window.confirm(`Видалити користувача ${u.fullName}? Цю дію неможливо скасувати.`)) {
										onDeleteUser(u.id);
									}
								}}
								className="mt-2 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition-all duration-300 hover:bg-rose-700 hover:scale-105"
							>
								Видалити
							</button>
						)}
					</article>
				))}
			</div>
			</article>

			<article className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
				<h2 className="mb-2 text-xl font-bold text-slate-900">Редагування головної сторінки</h2>
				<p className="mb-3 text-sm text-slate-600">
					Тут можна змінити весь контент головної через JSON. Редагуй тексти, блоки quick info, кнопки і картки.
				</p>

				<textarea
					className="min-h-[420px] w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
					value={contentJson}
					onChange={(e) => setContentJson(e.target.value)}
				/>

				{contentError ? <p className="mt-2 text-sm text-rose-600">{contentError}</p> : null}

				<div className="mt-3 flex flex-wrap gap-2">
					<button
						onClick={saveSiteContent}
						disabled={savingContent}
						className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-sky-700 hover:scale-105 disabled:opacity-60"
					>
						{savingContent ? "Збереження..." : "Зберегти контент головної"}
					</button>
					<button
						onClick={() => {
							setContentJson(JSON.stringify(siteContent, null, 2));
							setContentError("");
						}}
						className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-all duration-300 hover:bg-slate-300 hover:scale-105"
					>
						Скинути зміни
					</button>
				</div>
			</article>
		</section>
	);
}
