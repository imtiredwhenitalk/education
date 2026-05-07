type LoginPanelProps = {
	email: string;
	password: string;
	onEmailChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: () => void;
	loading: boolean;
};

export default function LoginPanel(props: LoginPanelProps) {
	const { email, password, onEmailChange, onPasswordChange, onSubmit, loading } = props;

	return (
		<article className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
			<h2 className="mb-4 text-xl font-bold text-slate-900">Вхід у систему</h2>
			<div className="grid gap-3">
				<input
					className="rounded-lg border border-slate-300 px-3 py-2"
					placeholder="Email"
					value={email}
					onChange={(e) => onEmailChange(e.target.value)}
				/>
				<input
					className="rounded-lg border border-slate-300 px-3 py-2"
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => onPasswordChange(e.target.value)}
				/>
				<button
					onClick={onSubmit}
					disabled={loading}
					className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none"
				>
					{loading ? "Завантаження..." : "Увійти"}
				</button>
			</div>
		</article>
	);
}
