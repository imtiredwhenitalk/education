import { useState } from "react";
import LoginPanel from "../login/login";

type AuthSectionProps = {
	onLogin: (email: string, password: string) => void;
	loading: boolean;
};

export default function AuthSection({ onLogin, loading }: AuthSectionProps) {
	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");

	return (
		<section className="grid gap-4">
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
