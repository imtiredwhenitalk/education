import { useState } from "react";
import type { NewsAttachment, NewsItem, Role, SchoolUser } from "../types";

type NewsBoardProps = {
	items: NewsItem[];
	role: Role;
	currentUser: SchoolUser;
	onPublish: (title: string, body: string, attachments: NewsAttachment[]) => void;
	onUpdate: (id: string, title: string, body: string, attachments: NewsAttachment[]) => void;
	onDelete: (id: string) => void;
};

export default function NewsBoard({
	items,
	role,
	currentUser,
	onPublish,
	onUpdate,
	onDelete,
}: NewsBoardProps) {
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [editingId, setEditingId] = useState("");
	const [editingTitle, setEditingTitle] = useState("");
	const [editingBody, setEditingBody] = useState("");
	const [attachments, setAttachments] = useState<NewsAttachment[]>([]);
	const [editingAttachments, setEditingAttachments] = useState<NewsAttachment[]>([]);

	const canPublish = role === "teacher" || role === "admin";

	const toAttachment = (file: File): Promise<NewsAttachment> =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result !== "string") {
					reject(new Error("Invalid file"));
					return;
				}

				resolve({
					id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
					name: file.name,
					mimeType: file.type || "application/octet-stream",
					dataUrl: reader.result,
				});
			};
			reader.onerror = () => reject(new Error("Failed to read file"));
			reader.readAsDataURL(file);
		});

	const onSelectFiles = async (files: FileList | null, editMode = false) => {
		if (!files || !files.length) return;
		const accepted = Array.from(files).filter((file) => {
			const isImage = file.type.startsWith("image/");
			const isPdf = file.type === "application/pdf";
			const isDoc =
				file.type === "application/msword" ||
				file.type ===
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
			return isImage || isPdf || isDoc;
		});

		const prepared = await Promise.all(accepted.map((file) => toAttachment(file)));
		if (editMode) {
			setEditingAttachments((prev) => [...prev, ...prepared]);
		} else {
			setAttachments((prev) => [...prev, ...prepared]);
		}
	};

	const removeAttachment = (id: string, editMode = false) => {
		if (editMode) {
			setEditingAttachments((prev) => prev.filter((item) => item.id !== id));
			return;
		}
		setAttachments((prev) => prev.filter((item) => item.id !== id));
	};

	const publish = () => {
		onPublish(title, body, attachments);
		setTitle("");
		setBody("");
		setAttachments([]);
	};

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<div className="space-y-4 lg:col-span-2">
				{items.map((item) => {
					const canManage =
						role === "admin" || item.ownerId === currentUser.id || item.author === currentUser.fullName;
					const inEdit = editingId === item.id;

					return (
						<article
							key={item.id}
							className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel"
						>
							{inEdit ? (
								<div className="grid gap-2">
									<input
										className="rounded-lg border border-slate-300 px-3 py-2"
										value={editingTitle}
										onChange={(e) => setEditingTitle(e.target.value)}
									/>
									<textarea
										className="min-h-28 rounded-lg border border-slate-300 px-3 py-2"
										value={editingBody}
										onChange={(e) => setEditingBody(e.target.value)}
									/>
									<div className="flex flex-wrap gap-2">
										<button
											onClick={() => {
												onUpdate(item.id, editingTitle, editingBody, editingAttachments);
												setEditingId("");
											}}
											className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
										>
											Зберегти
										</button>
										<button
											onClick={() => {
												setEditingId("");
												setEditingAttachments([]);
											}}
											className="rounded-xl bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800"
										>
											Скасувати
										</button>
									</div>
									<div className="grid gap-2">
										<input
											type="file"
											multiple
											accept="image/*,.pdf,.doc,.docx"
											onChange={(e) => onSelectFiles(e.target.files, true)}
										/>
										<div className="flex flex-wrap gap-2">
											{editingAttachments.map((file) => (
												<span
													key={file.id}
													className="rounded-full bg-slate-100 px-3 py-1 text-xs"
												>
													{file.name}
													<button
														onClick={() => removeAttachment(file.id, true)}
														className="ml-2 text-rose-600"
													>
														x
													</button>
												</span>
											))}
										</div>
									</div>
								</div>
							) : (
								<>
									<h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
									<p className="mt-2 whitespace-pre-line text-slate-700">{item.body}</p>
									<p className="mt-3 text-xs text-slate-500">
										{new Date(item.createdAt).toLocaleString()} | {item.author}
									</p>
									{item.attachments?.length ? (
										<div className="mt-3 grid gap-2">
											{item.attachments.map((file) => (
												<div key={file.id} className="rounded-xl border border-slate-200 p-2 text-xs">
													<a
														href={file.dataUrl}
														target="_blank"
														rel="noreferrer"
														className="font-semibold text-sky-700"
													>
														{file.name}
													</a>
													{file.mimeType.startsWith("image/") ? (
														<img
															src={file.dataUrl}
															alt={file.name}
															className="mt-2 max-h-48 rounded-lg object-cover"
														/>
													) : null}
												</div>
											))}
										</div>
									) : null}
									{canManage ? (
										<div className="mt-3 flex flex-wrap gap-2">
											<button
												onClick={() => {
													setEditingId(item.id);
													setEditingTitle(item.title);
													setEditingBody(item.body);
													setEditingAttachments(item.attachments || []);
												}}
												className="rounded-xl bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white"
											>
												Редагувати
											</button>
											<button
												onClick={() => onDelete(item.id)}
												className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white"
											>
												Видалити
											</button>
										</div>
									) : null}
								</>
							)}
						</article>
					);
				})}
			</div>

			{canPublish ? (
				<aside className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
					<h3 className="mb-3 text-lg font-bold text-slate-900">Опублікувати новину</h3>
					<div className="grid gap-3">
						<input
							className="rounded-lg border border-slate-300 px-3 py-2"
							placeholder="Заголовок"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
						<textarea
							className="min-h-32 rounded-lg border border-slate-300 px-3 py-2"
							placeholder="Текст"
							value={body}
							onChange={(e) => setBody(e.target.value)}
						/>
						<input
							type="file"
							multiple
							accept="image/*,.pdf,.doc,.docx"
							onChange={(e) => onSelectFiles(e.target.files)}
						/>
						{attachments.length ? (
							<div className="flex flex-wrap gap-2">
								{attachments.map((file) => (
									<span key={file.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs">
										{file.name}
										<button
											onClick={() => removeAttachment(file.id)}
											className="ml-2 text-rose-600"
										>
											x
										</button>
									</span>
								))}
							</div>
						) : null}
						<button
							onClick={publish}
							className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white"
						>
							Опублікувати
						</button>
					</div>
				</aside>
			) : null}
		</div>
	);
}
