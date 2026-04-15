export default function AboutPage() {
	return (
		<section className="rounded-2xl border border-slate-300 bg-white/80 p-5 shadow-panel">
			<h2 className="text-xl font-bold text-slate-900">Про проєкт</h2>
			<p className="mt-3 text-sm leading-6 text-slate-700">
				School Portal - це головний сайт школи, де зібрано і публічну інформацію, і внутрішню
				систему для навчального процесу. Користувачі можуть читати шкільні новини, переглядати
				статистику і працювати з персональними кабінетами.
			</p>

			<div className="mt-4 grid gap-3 md:grid-cols-2">
				<div className="rounded-xl border border-slate-300 bg-white p-3">
					<h3 className="font-semibold text-slate-900">Що є на сайті</h3>
					<p className="mt-1 text-sm text-slate-600">
						Публічна головна сторінка, стрічка новин, розділ про школу, авторизація, профілі
						та адмін-панель.
					</p>
				</div>
				<div className="rounded-xl border border-slate-300 bg-white p-3">
					<h3 className="font-semibold text-slate-900">Для кого</h3>
					<p className="mt-1 text-sm text-slate-600">
						Учні читають новини та працюють з профілем, вчителі публікують новини, а адміністрація
						керує користувачами й інформаційними розділами.
					</p>
				</div>
			</div>
		</section>
	);
}
