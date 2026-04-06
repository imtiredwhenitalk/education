import { useState } from "react";
import LoginPanel from "../login/login";
import type { Role } from "../types";

type AuthSectionProps = {
	onRegister: (payload: {
		fullName: string;
		email: string;
		password: string;
		className: string;
		role: "student" | "teacher";
	}) => void;
	onLogin: (email: string, password: string) => void;
	loading: boolean;
};

export default function AuthSection({ onRegister, onLogin, loading }: AuthSectionProps) {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [className, setClassName] = useState("");
	const [role, setRole] = useState<Role>("student");

	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");

	const handleRegister = () => {
		onRegister({ fullName, email, password, className, role: role as "student" | "teacher" });
		setFullName("");
		setEmail("");
		setPassword("");
		setClassName("");
		setRole("student");
	};

	return (
		<section className="grid gap-4 lg:grid-cols-2">
			<article className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
				<h2 className="mb-4 text-xl font-bold text-slate-900">Реєстрація (учень/вчитель)</h2>
				<div className="grid gap-3">
					<input
						className="rounded-lg border border-slate-300 px-3 py-2"
						placeholder="ПІБ"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
					/>
					<input
						className="rounded-lg border border-slate-300 px-3 py-2"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<input
						className="rounded-lg border border-slate-300 px-3 py-2"
						type="password"
						placeholder="Пароль"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<input
						className="rounded-lg border border-slate-300 px-3 py-2"
						placeholder="Клас або кафедра"
						value={className}
						onChange={(e) => setClassName(e.target.value)}
					/>
					<select
						className="rounded-lg border border-slate-300 px-3 py-2"
						value={role}
						onChange={(e) => setRole(e.target.value as Role)}
					>
						<option value="student">Учень</option>
						<option value="teacher">Вчитель</option>
					</select>
					<button
						onClick={handleRegister}
						disabled={loading}
						className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? "Завантаження..." : "Створити акаунт"}
					</button>
				</div>
			</article>

			<LoginPanel
				email={loginEmail}
				password={loginPassword}
				onEmailChange={setLoginEmail}
				onPasswordChange={setLoginPassword}
				onSubmit={() => onLogin(loginEmail, loginPassword)}
				loading={loading}
			/>
		</section>
	);
}
