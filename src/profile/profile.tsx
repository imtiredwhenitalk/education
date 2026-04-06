import { useEffect, useState } from "react";
import type { SchoolUser, Theme } from "../types";

type ProfilePageProps = {
	user: SchoolUser;
	onSave: (payload: Partial<SchoolUser>) => void;
};

export default function ProfilePage({ user, onSave }: ProfilePageProps) {
	const [fullName, setFullName] = useState(user.fullName);
	const [className, setClassName] = useState(user.className);
	const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
	const [bio, setBio] = useState(user.bio);
	const [theme, setTheme] = useState<Theme>(user.theme || "light");

	useEffect(() => {
		setFullName(user.fullName);
		setClassName(user.className);
		setAvatarUrl(user.avatarUrl);
		setBio(user.bio);
		setTheme(user.theme || "light");
	}, [user]);

	const uploadAvatar = (file: File | null) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result === "string") {
				setAvatarUrl(result);
			}
		};
		reader.readAsDataURL(file);
	};

	return (
		<section className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
			<h2 className="mb-4 text-xl font-bold text-slate-900">Профіль</h2>
			<div className="grid gap-5 lg:grid-cols-[240px_1fr]">
				<div className="rounded-xl border border-slate-300 bg-white p-4 text-center">
					<img
						src={avatarUrl || "https://i.pravatar.cc/120"}
						alt="Avatar"
						className="mx-auto h-28 w-28 rounded-full border object-cover"
					/>
					<label className="mt-4 block text-xs text-slate-500">Завантажити аватар</label>
					<input type="file" accept="image/*" onChange={(e) => uploadAvatar(e.target.files?.[0] || null)} />
				</div>

				<div className="grid gap-3">
					<input
						className="rounded-lg border border-slate-300 px-3 py-2"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
						placeholder="ПІБ"
					/>
					<input
						className="rounded-lg border border-slate-300 px-3 py-2"
						value={className}
						onChange={(e) => setClassName(e.target.value)}
						placeholder="Клас/кафедра"
					/>
					<input
						className="rounded-lg border border-slate-300 px-3 py-2"
						value={avatarUrl}
						onChange={(e) => setAvatarUrl(e.target.value)}
						placeholder="URL аватарки"
					/>
					<select
						className="rounded-lg border border-slate-300 px-3 py-2"
						value={theme}
						onChange={(e) => setTheme(e.target.value as Theme)}
					>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
						<option value="ocean">Ocean</option>
					</select>
					<textarea
						className="min-h-28 rounded-lg border border-slate-300 px-3 py-2"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						placeholder="Про себе"
					/>
					<button
						onClick={() => onSave({ fullName, className, avatarUrl, bio, theme })}
						className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white"
					>
						Зберегти профіль
					</button>
				</div>
			</div>
		</section>
	);
}
