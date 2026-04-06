import { useEffect, useMemo, useState } from "react";
import AdminPanel from "./admin/admin";
import AboutPage from "./about/about";
import { api } from "./api/api";
import AuthSection from "./auth/auth";
import NewsBoard from "./news/news";
import ProfilePage from "./profile/profile";
import type { GradeItem, NewsAttachment, NewsItem, SchoolUser, Stats, Theme } from "./types";

type Tab = "home" | "news" | "diary" | "gradebook" | "admin" | "profile" | "about";
type PublicPage = "landing" | "auth";

type GradeFormState = {
  studentId: string;
  subject: string;
  grade: number;
  comment: string;
};

const themeClass: Record<Theme, string> = {
  light: "bg-slate-100 text-slate-900",
  dark: "bg-slate-950 text-slate-100",
  ocean: "bg-cyan-950 text-cyan-50",
};

const defaultGradeForm: GradeFormState = {
  studentId: "",
  subject: "",
  grade: 10,
  comment: "",
};

const tabLabels: Record<Tab, string> = {
  home: "Головна",
  news: "Новини",
  diary: "Е-щоденник",
  gradebook: "Журнал",
  admin: "Адмінка",
  profile: "Профіль",
  about: "Про сайт",
};

const quickButtons = [
  "Головна сторінка",
  "Основна інформація",
  "Про нас",
  "Педагогічна рада",
  "Виховна робота",
  "Вступ 2026",
  "Прийом учнів до 1-го класу",
  "Розклад уроків",
  "Освітні програми",
  "ДПА / ЗНО",
  "Внутрішня система якості освіти",
  "Моніторинг якості освіти",
  "Академічна доброчесність",
  "Психологічна підтримка",
  "Булінг: план дій",
  "Інформаційна безпека",
  "Атестація педагогічних працівників",
  "Звіт директора",
  "Кошторис",
  "Учнівське самоврядування",
  "Контакти",
  "Електронний щоденник",
  "Новини ліцею",
];

const infoCards = [
  {
    title: "Для батьків",
    text: "Оцінки, коментарі вчителів, новини класу, оголошення про збори та події.",
    accent: "from-cyan-500 to-sky-500",
  },
  {
    title: "Для учнів",
    text: "Е-щоденник, прогрес по предметах, шкільні новини, індивідуальний профіль.",
    accent: "from-emerald-500 to-lime-500",
  },
  {
    title: "Для вчителів",
    text: "Журнал оцінок, публікація новин, керування навчальною інформацією класів.",
    accent: "from-blue-500 to-indigo-500",
  },
];

export default function Page() {
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SchoolUser | null>(null);
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [publicNews, setPublicNews] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState("");
  const [publicPage, setPublicPage] = useState<PublicPage>("landing");

  const [gradeForm, setGradeForm] = useState<GradeFormState>(defaultGradeForm);
  const [editingGradeId, setEditingGradeId] = useState("");
  const [editingGrade, setEditingGrade] = useState<{ subject: string; grade: number; comment: string }>(
    {
      subject: "",
      grade: 10,
      comment: "",
    },
  );

  const [searchStudent, setSearchStudent] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  const clearMessageLater = () => {
    window.setTimeout(() => setMessage(""), 2600);
  };

  const refreshPublicNews = async () => {
    const latest = await api.getPublicNews();
    setPublicNews(latest);
  };

  const refresh = async () => {
    const [profile, gradeRows, newsRows, dashboard] = await Promise.all([
      api.me(),
      api.getGrades(),
      api.getNews(),
      api.getStats(),
    ]);

    setUser(profile);
    setGrades(gradeRows);
    setNews(newsRows);
    setStats(dashboard);

    if (profile.role === "admin" || profile.role === "teacher") {
      const allUsers = await api.getUsers();
      setUsers(allUsers);
    } else {
      setUsers([profile]);
    }
  };

  useEffect(() => {
    refreshPublicNews().catch(() => {
      setPublicNews([]);
    });

    if (!api.getSavedToken()) return;

    setLoading(true);
    refresh()
      .catch(() => {
        api.clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const allowedTabs = useMemo(() => {
    if (!user) return [] as Tab[];
    const base: Tab[] = ["home", "news", "diary", "profile", "about"];
    if (user.role === "teacher" || user.role === "admin") base.push("gradebook");
    if (user.role === "admin") base.push("admin");
    return base;
  }, [user]);

  const safeSetTab = (nextTab: Tab) => {
    if (!user) return;
    if (!allowedTabs.includes(nextTab)) {
      setMessage("Немає доступу до цього розділу");
      clearMessageLater();
      setTab("home");
      return;
    }
    setTab(nextTab);
  };

  useEffect(() => {
    if (!user) return;
    if (!allowedTabs.includes(tab)) {
      setTab("home");
    }
  }, [user, tab, allowedTabs]);

  const students = useMemo(() => users.filter((candidate) => candidate.role === "student"), [users]);

  const studentById = useMemo(() => {
    const map = new Map<string, SchoolUser>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const classOptions = useMemo(() => {
    const values = students.map((s) => s.className);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const subjectOptions = useMemo(() => {
    const values = grades.map((g) => g.subject);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [grades]);

  const filteredGrades = useMemo(() => {
    const query = searchStudent.trim().toLowerCase();
    return grades.filter((row) => {
      const student = studentById.get(row.studentId);
      const studentName = student?.fullName || "";
      const studentClass = student?.className || "";

      const bySubject = filterSubject === "all" || row.subject === filterSubject;
      const byClass = filterClass === "all" || studentClass === filterClass;
      const bySearch =
        !query ||
        studentName.toLowerCase().includes(query) ||
        studentClass.toLowerCase().includes(query) ||
        row.subject.toLowerCase().includes(query);

      return bySubject && byClass && bySearch;
    });
  }, [grades, studentById, searchStudent, filterClass, filterSubject]);

  const teacherManageGrades = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return filteredGrades;
    return filteredGrades.filter((g) => g.teacherId === user.id);
  }, [filteredGrades, user]);

  const register = async (payload: {
    fullName: string;
    email: string;
    password: string;
    className: string;
    role: "student" | "teacher";
  }) => {
    try {
      setLoading(true);
      await api.register(payload);
      setMessage("Акаунт створено. Тепер увійди в систему.");
      setPublicPage("auth");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Помилка реєстрації");
      clearMessageLater();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const me = await api.login(email, password);
      setUser(me);
      setPublicPage("landing");
      await refresh();
      setMessage(`Вітаю, ${me.fullName}`);
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Помилка входу");
      clearMessageLater();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setUsers([]);
    setGrades([]);
    setNews([]);
    setStats(null);
    setPublicPage("landing");
    setTab("home");
    setEditingGradeId("");
  };

  const publishNews = async (title: string, body: string, attachments: NewsAttachment[]) => {
    if (!title || !body) {
      setMessage("Заповни заголовок і текст новини");
      clearMessageLater();
      return;
    }

    try {
      await api.createNews(title, body, attachments);
      await Promise.all([refresh(), refreshPublicNews()]);
      setMessage("Новину опубліковано");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося опублікувати");
      clearMessageLater();
    }
  };

  const updateNews = async (id: string, title: string, body: string, attachments: NewsAttachment[]) => {
    if (!title || !body) {
      setMessage("Заповни заголовок і текст новини");
      clearMessageLater();
      return;
    }

    try {
      await api.updateNews(id, title, body, attachments);
      await Promise.all([refresh(), refreshPublicNews()]);
      setMessage("Новину оновлено");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося оновити новину");
      clearMessageLater();
    }
  };

  const deleteNews = async (id: string) => {
    try {
      await api.deleteNews(id);
      await Promise.all([refresh(), refreshPublicNews()]);
      setMessage("Новину видалено");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося видалити новину");
      clearMessageLater();
    }
  };

  const addGrade = async () => {
    if (!gradeForm.studentId || !gradeForm.subject) {
      setMessage("Обери учня і предмет");
      clearMessageLater();
      return;
    }

    try {
      await api.createGrade(gradeForm);
      await refresh();
      setGradeForm(defaultGradeForm);
      setMessage("Оцінку додано");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Помилка додавання оцінки");
      clearMessageLater();
    }
  };

  const startEditGrade = (row: GradeItem) => {
    setEditingGradeId(row.id);
    setEditingGrade({
      subject: row.subject,
      grade: row.grade,
      comment: row.comment,
    });
  };

  const saveGrade = async () => {
    if (!editingGradeId) return;

    try {
      await api.updateGrade(editingGradeId, editingGrade);
      await refresh();
      setEditingGradeId("");
      setMessage("Оцінку оновлено");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося оновити оцінку");
      clearMessageLater();
    }
  };

  const removeGrade = async (id: string) => {
    try {
      await api.deleteGrade(id);
      await refresh();
      setMessage("Оцінку видалено");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося видалити оцінку");
      clearMessageLater();
    }
  };

  const saveProfile = async (payload: Partial<SchoolUser>) => {
    try {
      const updated = await api.updateProfile(payload);
      setUser(updated);
      await refresh();
      setMessage("Профіль оновлено");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося оновити профіль");
      clearMessageLater();
    }
  };

  const currentTheme = user?.theme || "light";

  return (
    <main className={`min-h-screen ${themeClass[currentTheme]} transition-colors`}>
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-5 text-slate-900 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-600">Офіційний вебпортал ліцею</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">School Portal</h1>
              <p className="text-sm text-slate-600 md:text-base">
                Сучасний сайт школи з новинами, навчальними сервісами, електронним щоденником і
                персональними кабінетами.
              </p>
            </div>
            <div className="relative flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={logout}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Вийти
                  </button>
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-11 w-11 rounded-full border-2 border-slate-200 object-cover"
                  />
                </>
              ) : (
                <button
                  onClick={() => setPublicPage("auth")}
                  className="rounded-full border border-slate-300 bg-white p-2 shadow transition hover:shadow-md"
                  title="Сторінка входу і реєстрації"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" stroke="#0f172a" strokeWidth="1.8" />
                    <path d="M4 20c1.6-3.2 4.3-5 8-5s6.4 1.8 8 5" stroke="#0f172a" strokeWidth="1.8" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        {!user && publicPage === "landing" ? (
          <section className="mb-6">
          <article className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-emerald-100 p-7 text-slate-900 shadow-panel">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-300/50 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-emerald-300/50 blur-2xl" />

            <p className="relative text-xs uppercase tracking-[0.2em] text-sky-700">Головна сторінка школи</p>
            <h2 className="relative mt-2 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
              Луцький ліцей нового покоління: освіта, безпека, розвиток і технології в одному просторі
            </h2>
            <p className="relative mt-4 max-w-5xl text-sm leading-7 text-slate-700 md:text-base">
              Тут зібрана вся ключова інформація про заклад: освітні програми, вступ, правила,
              новини, електронний щоденник, контакти, а також цифрові сервіси для учнів, вчителів
              і батьків.
            </p>

            <div className="relative mt-5 flex flex-wrap gap-2">
              {quickButtons.map((label) => (
                <button
                  key={label}
                  className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative mt-6 flex flex-wrap gap-3">
              <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-700">
                Подати заявку на вступ
              </button>
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800">
                Перейти в електронний щоденник
              </button>
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-100">
                Переглянути всі новини
              </button>
            </div>
          </article>
          </section>
        ) : null}

        {!user && publicPage === "landing" ? (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Новини ліцею</h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">Події, оголошення та важлива інформація</p>
              </div>
              <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
                Всі новини
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {publicNews.length ? (
                publicNews.slice(0, 6).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900">{item.title}</h4>
                    <p className="mt-2 text-sm text-slate-600">{item.body.slice(0, 130)}...</p>
                    <button className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                      Читати далі
                    </button>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">Поки новин немає.</p>
              )}
            </div>
          </section>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {message}
          </div>
        ) : null}

        {!user && publicPage === "landing" ? (
          <section className="mb-6 grid gap-4 md:grid-cols-3">
            {infoCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur"
              >
                <div className={`h-1.5 w-24 rounded-full bg-gradient-to-r ${card.accent}`} />
                <h3 className="mt-3 text-xl font-black text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
                <button className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200">
                  Детальніше
                </button>
              </article>
            ))}
          </section>
        ) : null}

        {!user && publicPage === "auth" ? (
          <section className="mb-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Сторінка авторизації</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Вхід або реєстрація</h2>
                  <p className="text-sm text-slate-600">
                    Після входу ти отримаєш доступ до кабінету. Адміністратор може змінювати контент сайту.
                  </p>
                </div>
                <button
                  onClick={() => setPublicPage("landing")}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Назад на головну
                </button>
              </div>
            </div>

            <AuthSection onRegister={register} onLogin={login} loading={loading} />
          </section>
        ) : null}

        {user ? (
          <>
            <nav className="mb-6 flex flex-wrap gap-2">
              {allowedTabs.map((id) => (
                <button
                  key={id}
                  onClick={() => safeSetTab(id)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                    tab === id
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white/80 text-slate-900"
                  }`}
                >
                  {tabLabels[id]}
                </button>
              ))}
            </nav>

            {tab === "home" && stats ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel">
                  <p className="text-xs uppercase text-slate-500">Користувач</p>
                  <h3 className="mt-2 text-lg font-bold">{user.fullName}</h3>
                  <p className="text-slate-600">Роль: {user.role}</p>
                </article>
                <article className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel">
                  <p className="text-xs uppercase text-slate-500">Учні</p>
                  <h3 className="mt-2 text-3xl font-black">{stats.students}</h3>
                </article>
                <article className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel">
                  <p className="text-xs uppercase text-slate-500">Вчителі</p>
                  <h3 className="mt-2 text-3xl font-black">{stats.teachers}</h3>
                </article>
                <article className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel">
                  <p className="text-xs uppercase text-slate-500">Середній бал</p>
                  <h3 className="mt-2 text-3xl font-black">{stats.averageGrade}</h3>
                </article>
              </section>
            ) : null}

            {tab === "news" ? (
              <NewsBoard
                items={news}
                role={user.role}
                currentUser={user}
                onPublish={publishNews}
                onUpdate={updateNews}
                onDelete={deleteNews}
              />
            ) : null}

            {tab === "diary" ? (
              <section className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel">
                <h2 className="mb-4 text-xl font-bold">Електронний щоденник</h2>
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Пошук: учень, клас, предмет"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                  />
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    disabled={user.role === "student"}
                  >
                    <option value="all">Всі класи</option>
                    {classOptions.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="all">Всі предмети</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-300 text-left">
                        <th className="py-2">Дата</th>
                        {user.role !== "student" ? <th className="py-2">Учень</th> : null}
                        <th className="py-2">Предмет</th>
                        <th className="py-2">Оцінка</th>
                        <th className="py-2">Коментар</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((row) => {
                        const student = studentById.get(row.studentId);
                        return (
                          <tr key={row.id} className="border-b border-slate-200">
                            <td className="py-2">{new Date(row.createdAt).toLocaleDateString()}</td>
                            {user.role !== "student" ? (
                              <td className="py-2">
                                {student?.fullName || "-"} ({student?.className || "-"})
                              </td>
                            ) : null}
                            <td className="py-2">{row.subject}</td>
                            <td className="py-2 font-bold">{row.grade}</td>
                            <td className="py-2">{row.comment || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {tab === "gradebook" && (user.role === "teacher" || user.role === "admin") ? (
              <section className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel">
                <h2 className="mb-4 text-xl font-bold">Журнал вчителя / модерація оцінок</h2>

                {user.role === "teacher" ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        value={gradeForm.studentId}
                        onChange={(e) => setGradeForm((prev) => ({ ...prev, studentId: e.target.value }))}
                      >
                        <option value="">Обери учня</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.fullName} ({student.className})
                          </option>
                        ))}
                      </select>

                      <input
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Предмет"
                        value={gradeForm.subject}
                        onChange={(e) => setGradeForm((prev) => ({ ...prev, subject: e.target.value }))}
                      />

                      <input
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        type="number"
                        min={1}
                        max={12}
                        value={gradeForm.grade}
                        onChange={(e) =>
                          setGradeForm((prev) => ({ ...prev, grade: Number(e.target.value) }))
                        }
                      />

                      <input
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Коментар"
                        value={gradeForm.comment}
                        onChange={(e) => setGradeForm((prev) => ({ ...prev, comment: e.target.value }))}
                      />
                    </div>
                    <button
                      onClick={addGrade}
                      className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white"
                    >
                      Додати оцінку
                    </button>
                  </>
                ) : null}

                <div className="mt-6 mb-4 grid gap-3 md:grid-cols-3">
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Пошук: учень, клас, предмет"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                  />
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                  >
                    <option value="all">Всі класи</option>
                    {classOptions.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="all">Всі предмети</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-300 text-left">
                        <th className="py-2">Учень</th>
                        <th className="py-2">Предмет</th>
                        <th className="py-2">Оцінка</th>
                        <th className="py-2">Коментар</th>
                        <th className="py-2">Дії</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherManageGrades.map((row) => {
                        const student = studentById.get(row.studentId);
                        const inEdit = editingGradeId === row.id;
                        return (
                          <tr key={row.id} className="border-b border-slate-200">
                            <td className="py-2">
                              {student?.fullName || "-"} ({student?.className || "-"})
                            </td>
                            {inEdit ? (
                              <>
                                <td className="py-2">
                                  <input
                                    className="w-full rounded-lg border border-slate-300 px-2 py-1"
                                    value={editingGrade.subject}
                                    onChange={(e) =>
                                      setEditingGrade((prev) => ({ ...prev, subject: e.target.value }))
                                    }
                                  />
                                </td>
                                <td className="py-2">
                                  <input
                                    className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={editingGrade.grade}
                                    onChange={(e) =>
                                      setEditingGrade((prev) => ({
                                        ...prev,
                                        grade: Number(e.target.value),
                                      }))
                                    }
                                  />
                                </td>
                                <td className="py-2">
                                  <input
                                    className="w-full rounded-lg border border-slate-300 px-2 py-1"
                                    value={editingGrade.comment}
                                    onChange={(e) =>
                                      setEditingGrade((prev) => ({ ...prev, comment: e.target.value }))
                                    }
                                  />
                                </td>
                                <td className="py-2">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={saveGrade}
                                      className="rounded-xl bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                                    >
                                      Зберегти
                                    </button>
                                    <button
                                      onClick={() => setEditingGradeId("")}
                                      className="rounded-xl bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-800"
                                    >
                                      Скасувати
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2">{row.subject}</td>
                                <td className="py-2 font-bold">{row.grade}</td>
                                <td className="py-2">{row.comment || "-"}</td>
                                <td className="py-2">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => startEditGrade(row)}
                                      className="rounded-xl bg-amber-500 px-2 py-1 text-xs font-semibold text-white"
                                    >
                                      Ред.
                                    </button>
                                    <button
                                      onClick={() => removeGrade(row.id)}
                                      className="rounded-xl bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                                    >
                                      Вид.
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {tab === "admin" && user.role === "admin" ? <AdminPanel users={users} /> : null}

            {tab === "profile" ? <ProfilePage user={user} onSave={saveProfile} /> : null}

            {tab === "about" ? <AboutPage /> : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
