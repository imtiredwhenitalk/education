import { useState } from "react";
import { isSupportedAttachment, toAttachment } from "../utils/attachments";
import type { NewsAttachment, NewsItem, Role, SchoolUser } from "../types";

type PhotoGalleryProps = {
	images: NewsAttachment[];
};

function PhotoGallery({ images }: PhotoGalleryProps) {
	const [activeIndex, setActiveIndex] = useState(0);

	if (!images.length) return null;

	const safeIndex = Math.min(activeIndex, images.length - 1);
	const active = images[safeIndex];

	const prev = () => setActiveIndex((index) => (index - 1 + images.length) % images.length);
	const next = () => setActiveIndex((index) => (index + 1) % images.length);

	return (
		<div className="space-y-2">
			<div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
				<img
					src={active.dataUrl}
					alt="Фото новини"
					className="h-[55vh] max-h-[78vh] w-full rounded-lg bg-slate-100 object-contain"
				/>
				{images.length > 1 ? (
					<>
						<button
							onClick={prev}
							className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
							aria-label="Попереднє фото"
						>
							‹
						</button>
						<button
							onClick={next}
							className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
							aria-label="Наступне фото"
						>
							›
						</button>
					</>
				) : null}
			</div>

			{images.length > 1 ? (
				<div className="flex gap-2 overflow-x-auto pb-1">
					{images.map((file, index) => (
						<button
							key={file.id}
							onClick={() => setActiveIndex(index)}
							className={`shrink-0 overflow-hidden rounded-lg border-2 ${
								index === safeIndex ? "border-sky-500" : "border-transparent"
							}`}
							aria-label={`Фото ${index + 1}`}
						>
							<img src={file.dataUrl} alt="Мініатюра" className="h-16 w-24 object-cover" />
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}

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

	const onSelectFiles = async (files: FileList | null, editMode = false) => {
		if (!files || !files.length) return;
		const accepted = Array.from(files).filter((file) => isSupportedAttachment(file));

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
											className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-emerald-700 hover:scale-105"
										>
											Зберегти
										</button>
										<button
											onClick={() => {
												setEditingId("");
												setEditingAttachments([]);
											}}
											className="rounded-xl bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800 transition-all duration-300 hover:bg-slate-300 hover:scale-105"
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
										<div className="mt-3 space-y-3">
											{item.attachments.filter((file) => file.mimeType.startsWith("image/")).length ? (
												<div>
													<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
														Фото ({item.attachments.filter((file) => file.mimeType.startsWith("image/")).length})
													</p>
													<PhotoGallery images={item.attachments.filter((file) => file.mimeType.startsWith("image/"))} />
												</div>
											) : null}

											{item.attachments
												.filter((file) => file.mimeType === "application/pdf")
												.map((file) => (
													<article key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
														<p className="mb-2 font-semibold text-slate-700">{file.name}</p>
														<iframe
															title={file.name}
															src={`${file.dataUrl}#toolbar=1&navpanes=1&scrollbar=1`}
															className="h-[78vh] w-full rounded-lg border border-slate-200 bg-white"
														/>
													</article>
												))}

											<div className="grid gap-2">
												{item.attachments
													.filter(
														(file) => !file.mimeType.startsWith("image/") && file.mimeType !== "application/pdf",
													)
													.map((file) => (
														<a
															key={file.id}
															href={file.dataUrl}
															target="_blank"
															rel="noreferrer"
															className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-sky-700"
														>
															{file.name}
														</a>
													))}
											</div>
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
							className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white transition-all duration-300 hover:bg-indigo-700 hover:scale-105 hover:shadow-lg"
						>
							Опублікувати
						</button>
					</div>
				</aside>
			) : null}
		</div>
	);
}
