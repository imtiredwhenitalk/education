import { useMemo, useState } from "react";
import type { SchoolUser } from "../types";

type AdminPanelProps = {
	users: SchoolUser[];
};

export default function AdminPanel({ users }: AdminPanelProps) {
	const [query, setQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");

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

	return (
		<section className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
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
				{filtered.map((user) => (
					<article key={user.id} className="rounded-xl border border-slate-300 bg-white p-4">
						<p className="font-semibold text-slate-900">{user.fullName}</p>
						<p className="text-sm text-slate-600">{user.email}</p>
						<p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{user.role}</p>
						<p className="text-xs text-slate-500">{user.className}</p>
					</article>
				))}
			</div>
		</section>
	);
}
