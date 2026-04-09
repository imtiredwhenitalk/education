import { useEffect, useMemo, useState } from "react";
import AdminPanel from "./admin/admin";
import AboutPage from "./about/about";
import { api } from "./api/api";
import AuthSection from "./auth/auth";
import NewsBoard from "./news/news";
import ProfilePage from "./profile/profile";
import type { AdmissionApplication, GradeItem, NewsAttachment, NewsItem, SchoolUser, Stats, Theme } from "./types";

type Tab = "home" | "news" | "diary" | "gradebook" | "admin" | "profile" | "about";
type PublicPage = "landing" | "auth" | "news" | "admission" | "app";

type QuickInfoItem = {
  title: string;
  intro: string;
  details: string[];
};

type GradeFormState = {
  studentId: string;
  subject: string;
  grade: number;
  comment: string;
};

type AdmissionFormState = {
  fullName: string;
  studentBirthDate: string;
  classGoal: string;
  parentName: string;
  parentPhone: string;
  email: string;
  notes: string;
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

const defaultAdmissionForm: AdmissionFormState = {
  fullName: "",
  studentBirthDate: "",
  classGoal: "",
  parentName: "",
  parentPhone: "",
  email: "",
  notes: "",
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

const quickInfoMap: Record<string, QuickInfoItem> = {
  "Головна сторінка": {
    title: "Головна сторінка",
    intro: "Короткий огляд усіх ключових розділів порталу.",
    details: [
      "На головній розміщено швидкий доступ до вступу, новин, щоденника та контактів.",
      "Оновлення по подіях і важливих оголошеннях з'являються одразу після публікації.",
    ],
  },
  "Основна інформація": {
    title: "Основна інформація",
    intro: "Базові відомості про ліцей, структуру навчання та документи.",
    details: [
      "Форма навчання: очна та змішана (за потреби).",
      "Профільні напрями: математичний, філологічний, ІТ-напрям.",
      "Режим роботи, правила внутрішнього розпорядку, контакти адміністрації.",
    ],
  },
  "Про нас": {
    title: "Про нас",
    intro: "Місія ліцею та освітні цінності.",
    details: [
      "Ліцей формує компетентності для навчання, кар'єри і життя в цифровому суспільстві.",
      "Пріоритети: якість освіти, безпека, партнерство з батьками та розвиток учнів.",
    ],
  },
  "Педагогічна рада": {
    title: "Педагогічна рада",
    intro: "Рішення та напрями розвитку освітнього процесу.",
    details: [
      "Розглядаються результати навчання, інноваційні методики та план підвищення кваліфікації.",
      "Протоколи педради доступні адміністрації та педагогам у внутрішній частині порталу.",
    ],
  },
  "Виховна робота": {
    title: "Виховна робота",
    intro: "Позаурочні ініціативи та громадянське виховання.",
    details: [
      "Працюють гуртки, тематичні тижні, волонтерські та спортивні активності.",
      "Класні керівники публікують плани і звіти про виховні події.",
    ],
  },
  "Вступ 2026": {
    title: "Вступ 2026",
    intro: "Інформація для вступників на 2026 навчальний рік.",
    details: [
      "Реєстрація заявок: з 1 березня до 15 червня 2026 року.",
      "Пакет документів: заява, свідоцтво, медична довідка, паспорт одного з батьків.",
      "Для профільних класів передбачено співбесіду або діагностичну роботу.",
    ],
  },
  "Прийом учнів до 1-го класу": {
    title: "Прийом до 1-го класу",
    intro: "Календар подачі документів для майбутніх першокласників.",
    details: [
      "Прийом заяв триває відповідно до графіка, затвердженого закладом.",
      "Першочергово зараховуються діти, які проживають на території обслуговування.",
      "Результати зарахування публікуються на сайті та інформаційному стенді закладу.",
    ],
  },
  "Розклад уроків": {
    title: "Розклад уроків",
    intro: "Актуальний розклад занять, факультативів та консультацій.",
    details: [
      "Оновлення публікуються щотижня або оперативно у випадку змін.",
      "У профілі учня відображається персоналізований розклад класу.",
    ],
  },
  "Освітні програми": {
    title: "Освітні програми",
    intro: "Опис навчальних програм, компетентностей і результатів.",
    details: [
      "Програми відповідають державному стандарту та профілю ліцею.",
      "Публікуються навчальні плани, очікувані результати і критерії оцінювання.",
    ],
  },
  "ДПА / ЗНО / НМТ": {
    title: "ДПА, ЗНО, НМТ",
    intro: "Підготовка до підсумкової атестації та вступних тестувань.",
    details: [
      "Розділ містить календар реєстрації на НМТ, пробні тести та важливі дедлайни.",
      "Публікуються рекомендації з підготовки, матеріали минулих років і зміни процедур.",
      "Для випускників доступні консультації з української, математики та історії України.",
    ],
  },
  "Внутрішня система якості освіти": {
    title: "Внутрішня система якості освіти",
    intro: "Прозорі механізми оцінювання якості освітнього процесу.",
    details: [
      "Щорічно проводиться самооцінювання за напрямами: управління, навчання, безпека.",
      "За підсумками формуються плани покращення та пріоритети розвитку закладу.",
    ],
  },
  "Моніторинг якості освіти": {
    title: "Моніторинг якості освіти",
    intro: "Аналітика успішності та динаміки навчальних результатів.",
    details: [
      "Відстежуються середні бали по класах, предметах і паралелях.",
      "Результати моніторингу допомагають вчасно коригувати навчальний процес.",
    ],
  },
  "Академічна доброчесність": {
    title: "Академічна доброчесність",
    intro: "Політика чесного навчання та відповідального використання джерел.",
    details: [
      "Заборонено плагіат, списування, фабрикацію даних та несанкціоновану допомогу.",
      "Учні і вчителі ознайомлюються з правилами цитування та етичної поведінки.",
    ],
  },
  "Психологічна підтримка": {
    title: "Психологічна підтримка",
    intro: "Допомога учням, батькам і педагогам у складних ситуаціях.",
    details: [
      "Працюють індивідуальні консультації, групові заняття та профілактичні зустрічі.",
      "Звернення до психолога конфіденційні та доступні за попереднім записом.",
    ],
  },
  "Булінг: план дій": {
    title: "Булінг: план дій",
    intro: "Алгоритм дій у разі виявлення булінгу.",
    details: [
      "Негайно повідом класного керівника, психолога або адміністрацію.",
      "Фіксуй факти та звертайся до відповідальних осіб для офіційного розгляду.",
      "Ліцей забезпечує захист учасників освітнього процесу та супровід ситуації.",
    ],
  },
  "Інформаційна безпека": {
    title: "Інформаційна безпека",
    intro: "Правила безпечної поведінки в інтернеті і захисту даних.",
    details: [
      "Використовуй складні паролі, не передавай персональні дані стороннім.",
      "Офіційні оголошення публікуються лише через перевірені канали ліцею.",
    ],
  },
  "Атестація педагогічних працівників": {
    title: "Атестація педагогічних працівників",
    intro: "План і критерії професійного оцінювання педагогів.",
    details: [
      "Проводиться згідно з чинним законодавством та внутрішнім графіком.",
      "Результати враховують методичну діяльність, підвищення кваліфікації та успішність учнів.",
    ],
  },
  "Звіт директора": {
    title: "Звіт директора",
    intro: "Публічний звіт про діяльність закладу за навчальний рік.",
    details: [
      "Охоплює результати навчання, фінанси, кадровий склад та стратегічні цілі.",
      "Звіт презентується на відкритій зустрічі для батьківської і педагогічної спільноти.",
    ],
  },
  Кошторис: {
    title: "Кошторис",
    intro: "Інформація про бюджет і використання коштів закладу.",
    details: [
      "Опубліковано основні статті витрат: обладнання, господарські потреби, розвиток інфраструктури.",
      "Фінансова інформація оновлюється відповідно до звітних періодів.",
    ],
  },
  "Учнівське самоврядування": {
    title: "Учнівське самоврядування",
    intro: "Ініціативи учнів та участь у шкільному житті.",
    details: [
      "Працює учнівська рада, яка пропонує та реалізує проєкти й події.",
      "Учні беруть участь у прийнятті рішень щодо позакласної діяльності.",
    ],
  },
  Контакти: {
    title: "Контакти",
    intro: "Канали зв'язку з адміністрацією та відповідальними особами.",
    details: [
      "Приймальня: +380 (33) 000-00-00.",
      "Email: office@lyceum.edu.ua.",
      "Адреса: м. Луцьк, вул. Шкільна, 10.",
    ],
  },
  "Електронний щоденник": {
    title: "Електронний щоденник",
    intro: "Оцінки, домашні завдання та коментарі вчителів онлайн.",
    details: [
      "Після входу доступні поточні оцінки, історія успішності та зауваження.",
      "Для батьків передбачено зручний моніторинг прогресу дитини.",
    ],
  },
  "Новини ліцею": {
    title: "Новини ліцею",
    intro: "Оголошення, події та досягнення шкільної спільноти.",
    details: [
      "Публікуємо результати конкурсів, заходи, зустрічі та важливі повідомлення.",
      "Кнопка \"Всі новини\" відкриває повний перелік новин із можливістю читати повний текст.",
    ],
  },
};

const quickButtons = Object.keys(quickInfoMap);

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
  const [selectedPublicNewsId, setSelectedPublicNewsId] = useState("");
  const [selectedQuickButton, setSelectedQuickButton] = useState(quickButtons[0]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);
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
  const [admissionForm, setAdmissionForm] = useState<AdmissionFormState>(defaultAdmissionForm);
  const [admissionAttachments, setAdmissionAttachments] = useState<NewsAttachment[]>([]);

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

    if (profile.role === "admin") {
      const admissionRows = await api.getAdmissions();
      setAdmissions(admissionRows);
    } else {
      setAdmissions([]);
    }
  };

  useEffect(() => {
    refreshPublicNews().catch(() => {
      setPublicNews([]);
    });

    if (!api.getSavedToken()) return;

    setLoading(true);
    refresh()
      .then(() => setPublicPage("app"))
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
      setTab("home");
      setPublicPage("app");
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
    setAdmissions([]);
    setPublicPage("landing");
    setTab("home");
    setEditingGradeId("");
  };

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

  const onAdmissionFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const accepted = Array.from(files).filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const isDoc =
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      return isImage || isPdf || isDoc;
    });

    const prepared = await Promise.all(accepted.map((file) => toAttachment(file)));
    setAdmissionAttachments((prev) => [...prev, ...prepared]);
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

  const submitAdmissionForm = async () => {
    if (
      !admissionForm.fullName ||
      !admissionForm.studentBirthDate ||
      !admissionForm.classGoal ||
      !admissionForm.parentName ||
      !admissionForm.parentPhone ||
      !admissionForm.email
    ) {
      setMessage("Заповни обов'язкові поля заявки");
      clearMessageLater();
      return;
    }

    try {
      await api.createAdmission({
        ...admissionForm,
        attachments: admissionAttachments,
      });
      setMessage("Заявку на вступ надіслано. Очікуй зворотного зв'язку від приймальної комісії.");
      clearMessageLater();
      setAdmissionForm(defaultAdmissionForm);
      setAdmissionAttachments([]);
      setPublicPage("landing");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося надіслати заявку");
      clearMessageLater();
    }
  };

  const updateAdmissionStatus = async (
    id: string,
    payload: { status: "pending" | "accepted" | "rejected"; assignedTeacherId?: string; adminComment?: string },
  ) => {
    try {
      await api.updateAdmission(id, payload);
      await refresh();
      setMessage("Статус заявки оновлено");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося оновити заявку");
      clearMessageLater();
    }
  };

  const currentTheme = user?.theme || "light";
  const selectedQuickInfo = quickInfoMap[selectedQuickButton];
  const selectedPublicNews = publicNews.find((item) => item.id === selectedPublicNewsId) || null;

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
                    onClick={() => setPublicPage("app")}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Кабінет
                  </button>
                  <button
                    onClick={() => setPublicPage("landing")}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Головна
                  </button>
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

        {publicPage === "landing" ? (
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
                  onClick={() => setSelectedQuickButton(label)}
                  className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setPublicPage("admission");
                }}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-700"
              >
                Подати заявку на вступ
              </button>
              <button
                onClick={() => (user ? setPublicPage("app") : setPublicPage("auth"))}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {user ? "Повернутись в кабінет" : "Перейти в електронний щоденник"}
              </button>
              <button
                onClick={() => {
                  setPublicPage("news");
                  setSelectedPublicNewsId("");
                }}
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-100"
              >
                Переглянути всі новини
              </button>
            </div>

            <div className="relative mt-6 rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-sm md:p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Детальна інформація розділу</p>
              <h3 className="mt-2 text-xl font-black text-slate-900">{selectedQuickInfo.title}</h3>
              <p className="mt-2 text-sm text-slate-700 md:text-base">{selectedQuickInfo.intro}</p>
              <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                {selectedQuickInfo.details.map((point) => (
                  <li key={point} className="rounded-lg bg-slate-50 px-3 py-2">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </article>
          </section>
        ) : null}

        {publicPage === "landing" ? (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Новини ліцею</h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">Події, оголошення та важлива інформація</p>
              </div>
              <button
                onClick={() => {
                  setPublicPage("news");
                  setSelectedPublicNewsId("");
                }}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
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
                    {item.attachments?.length ? (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {item.attachments
                            .filter((file) => file.mimeType.startsWith("image/"))
                            .slice(0, 2)
                            .map((file) => (
                              <img
                                key={file.id}
                                src={file.dataUrl}
                                alt={file.name}
                                className="h-24 w-full rounded-lg object-cover"
                              />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.attachments
                            .filter((file) => !file.mimeType.startsWith("image/"))
                            .slice(0, 2)
                            .map((file) => (
                              <a
                                key={file.id}
                                href={file.dataUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700"
                              >
                                {file.name}
                              </a>
                            ))}
                        </div>
                      </div>
                    ) : null}
                    <button
                      onClick={() => {
                        setSelectedPublicNewsId(item.id);
                        setPublicPage("news");
                      }}
                      className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
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

        {publicPage === "landing" ? (
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

        {publicPage === "news" ? (
          <section className="mb-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Публічний розділ</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Всі новини ліцею</h2>
                  <p className="text-sm text-slate-600">
                    Тут можна переглядати повні тексти новин, дати публікації та додані файли.
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

            {selectedPublicNews ? (
              <article className="rounded-2xl border border-cyan-200 bg-white/95 p-5 shadow-panel">
                <p className="text-xs uppercase tracking-wider text-cyan-700">
                  Обрана новина · {new Date(selectedPublicNews.createdAt).toLocaleDateString()}
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{selectedPublicNews.title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 md:text-base">
                  {selectedPublicNews.body}
                </p>
                {selectedPublicNews.attachments?.length ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3">
                      {selectedPublicNews.attachments
                        .filter((file) => file.mimeType.startsWith("image/"))
                        .map((file) => (
                          <figure key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                            <img
                              src={file.dataUrl}
                              alt={file.name}
                              className="max-h-[80vh] w-full rounded-lg object-contain"
                            />
                            <figcaption className="mt-2 text-xs font-semibold text-slate-600">{file.name}</figcaption>
                          </figure>
                        ))}
                    </div>

                    <div className="space-y-3">
                      {selectedPublicNews.attachments
                        .filter((file) => file.mimeType === "application/pdf")
                        .map((file) => (
                          <article key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                            <p className="mb-2 text-sm font-semibold text-slate-700">{file.name}</p>
                            <iframe
                              title={file.name}
                              src={`${file.dataUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                              className="h-[78vh] w-full rounded-lg border border-slate-200 bg-white"
                            />
                            <div className="mt-2 flex justify-end">
                              <a
                                href={file.dataUrl}
                                download={file.name}
                                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Завантажити PDF
                              </a>
                            </div>
                          </article>
                        ))}
                    </div>

                    <div className="grid gap-2">
                      {selectedPublicNews.attachments
                        .filter(
                          (file) => !file.mimeType.startsWith("image/") && file.mimeType !== "application/pdf",
                        )
                        .map((file) => (
                          <a
                            key={file.id}
                            href={file.dataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-sky-700"
                          >
                            {file.name}
                          </a>
                        ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {publicNews.length ? (
                publicNews.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-panel">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900">{item.title}</h4>
                    <p className="mt-2 text-sm text-slate-600">{item.body.slice(0, 170)}...</p>
                    {item.attachments?.length ? (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {item.attachments
                            .filter((file) => file.mimeType.startsWith("image/"))
                            .slice(0, 2)
                            .map((file) => (
                              <img
                                key={file.id}
                                src={file.dataUrl}
                                alt={file.name}
                                className="h-24 w-full rounded-lg object-cover"
                              />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.attachments
                            .filter((file) => !file.mimeType.startsWith("image/"))
                            .slice(0, 2)
                            .map((file) => (
                              <a
                                key={file.id}
                                href={file.dataUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-sky-700"
                              >
                                {file.name}
                              </a>
                            ))}
                        </div>
                      </div>
                    ) : null}
                    <button
                      onClick={() => setSelectedPublicNewsId(item.id)}
                      className="mt-3 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
                    >
                      Відкрити новину
                    </button>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">Поки новин немає.</p>
              )}
            </div>
          </section>
        ) : null}

        {publicPage === "admission" ? (
          <section className="mb-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Вступна кампанія</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Заявка на вступ</h2>
                  <p className="text-sm text-slate-600">
                    Заповни форму нижче, і приймальна комісія зв'яжеться з тобою для уточнення деталей.
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

            <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="ПІБ дитини *"
                  value={admissionForm.fullName}
                  onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fullName: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  type="date"
                  value={admissionForm.studentBirthDate}
                  onChange={(e) =>
                    setAdmissionForm((prev) => ({ ...prev, studentBirthDate: e.target.value }))
                  }
                />
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Клас вступу (наприклад: 1, 5, 10) *"
                  value={admissionForm.classGoal}
                  onChange={(e) => setAdmissionForm((prev) => ({ ...prev, classGoal: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="ПІБ одного з батьків *"
                  value={admissionForm.parentName}
                  onChange={(e) => setAdmissionForm((prev) => ({ ...prev, parentName: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Телефон *"
                  value={admissionForm.parentPhone}
                  onChange={(e) => setAdmissionForm((prev) => ({ ...prev, parentPhone: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  type="email"
                  placeholder="Email *"
                  value={admissionForm.email}
                  onChange={(e) => setAdmissionForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <textarea
                className="mt-3 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Додаткова інформація (пільги, побажання, досягнення дитини)"
                value={admissionForm.notes}
                onChange={(e) => setAdmissionForm((prev) => ({ ...prev, notes: e.target.value }))}
              />

              <input
                className="mt-3"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => onAdmissionFiles(e.target.files)}
              />

              {admissionAttachments.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {admissionAttachments.map((file) => (
                    <button
                      key={file.id}
                      onClick={() =>
                        setAdmissionAttachments((prev) => prev.filter((item) => item.id !== file.id))
                      }
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {file.name} x
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={submitAdmissionForm}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-700"
                >
                  Надіслати заявку
                </button>
                <button
                  onClick={() => {
                    setAdmissionForm(defaultAdmissionForm);
                    setAdmissionAttachments([]);
                  }}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
                >
                  Очистити форму
                </button>
              </div>
            </article>
          </section>
        ) : null}

        {user && publicPage === "app" ? (
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

            {tab === "admin" && user.role === "admin" ? (
              <AdminPanel users={users} admissions={admissions} onUpdateAdmission={updateAdmissionStatus} />
            ) : null}

            {tab === "profile" ? <ProfilePage user={user} onSave={saveProfile} /> : null}

            {tab === "about" ? <AboutPage /> : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
