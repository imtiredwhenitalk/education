import { useEffect, useMemo, useState } from "react";
import AdminPanel from "./admin/admin";
import AboutPage from "./about/about";
import { api } from "./api/api";
import AuthSection from "./auth/auth";
import NewsBoard from "./news/news";
import ProfilePage from "./profile/profile";
import type { AdmissionApplication, NewsAttachment, NewsItem, QuickInfoItem, SchoolUser, SiteContent, Stats } from "./types";

type Tab = "home" | "news" | "admin" | "profile" | "about";
type PublicPage = "landing" | "auth" | "news" | "admission" | "app" | "quickinfo";

type AdmissionFormState = {
  fullName: string;
  studentBirthDate: string;
  classGoal: string;
  parentName: string;
  parentPhone: string;
  email: string;
  notes: string;
};

type QuickInfoEditorRow = {
  id: string;
  label: string;
  title: string;
  intro: string;
  detailsText: string;
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
  admin: "Адмінка",
  profile: "Профіль",
  about: "Про сайт",
};

const defaultQuickInfoMap: Record<string, QuickInfoItem> = {
  "Головна сторінка": {
    title: "Головна сторінка",
    intro: "Короткий огляд усіх ключових розділів порталу.",
    details: [
      "На головній розміщено швидкий доступ до вступу, новин та контактів.",
      "Оновлення по подіям і важливих оголошеннях з'являються одразу після публікації.",
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
  "Новини ліцею": {
    title: "Новини ліцею",
    intro: "Оголошення, події та досягнення шкільної спільноти.",
    details: [
      "Публікуємо результати конкурсів, заходи, зустрічі та важливі повідомлення.",
      "Кнопка \"Всі новини\" відкриває повний перелік новин із можливістю читати повний текст.",
    ],
  },
};

const defaultInfoCards = [
  {
    title: "Для батьків",
    text: "Контакти з класними керівниками, оголошення про збори та важливі шкільні події.",
    accent: "from-cyan-500 to-sky-500",
  },
  {
    title: "Для учнів",
    text: "Доступ до навчальних ресурсів, новин школи та персонального профілю.",
    accent: "from-emerald-500 to-lime-500",
  },
  {
    title: "Для вчителів",
    text: "Публікація новин, керування навчальною інформацією та підтримка учнів.",
    accent: "from-blue-500 to-indigo-500",
  },
];

const defaultSiteContent: SiteContent = {
  headerKicker: "Офіційний вебпортал ліцею",
  headerTitle: "School Portal",
  headerSubtitle: "Сучасний сайт школи з новинами, навчальними сервісами і персональними кабінетами.",
  heroKicker: "Головна сторінка школи",
  heroTitle: "Луцький ліцей нового покоління: освіта, безпека, розвиток і технології в одному просторі",
  heroText:
    "Тут зібрана вся ключова інформація про заклад: освітні програми, вступ, правила, новини, контакти, а також цифрові сервіси для учнів, вчителів і батьків.",
  ctaAdmission: "Подати заявку на вступ",
  ctaCabinet: "Увійти до кабінету",
  ctaNews: "Переглянути всі новини",
  newsTitle: "Новини ліцею",
  newsSubtitle: "Події, оголошення та важлива інформація",
  newsButtonText: "Всі новини",
  quickInfoMap: defaultQuickInfoMap,
  infoCards: defaultInfoCards,
};

const normalizeSiteContent = (incoming: Partial<SiteContent> | null | undefined): SiteContent => {
  if (!incoming || typeof incoming !== "object") {
    return defaultSiteContent;
  }

  const map =
    incoming.quickInfoMap && typeof incoming.quickInfoMap === "object"
      ? (incoming.quickInfoMap as Record<string, QuickInfoItem>)
      : defaultSiteContent.quickInfoMap;

  const cards = Array.isArray(incoming.infoCards) && incoming.infoCards.length
    ? incoming.infoCards
    : defaultSiteContent.infoCards;

  return {
    ...defaultSiteContent,
    ...incoming,
    quickInfoMap: map,
    infoCards: cards,
  };
};

export default function Page() {
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SchoolUser | null>(null);
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [publicNews, setPublicNews] = useState<NewsItem[]>([]);
  const [selectedPublicNewsId, setSelectedPublicNewsId] = useState("");
  const [selectedQuickInfoPage, setSelectedQuickInfoPage] = useState<string>("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);
  const [message, setMessage] = useState("");
  const [publicPage, setPublicPage] = useState<PublicPage>("landing");
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);
  const [isLandingEditorOpen, setIsLandingEditorOpen] = useState(false);
  const [landingDraft, setLandingDraft] = useState<SiteContent>(defaultSiteContent);
  const [quickInfoDraftRows, setQuickInfoDraftRows] = useState<QuickInfoEditorRow[]>([]);
  const [landingEditorError, setLandingEditorError] = useState("");
  const [landingSaving, setLandingSaving] = useState(false);
  const [publicNewsQuery, setPublicNewsQuery] = useState("");
  const [selectedPublicNewsImageIndex, setSelectedPublicNewsImageIndex] = useState(0);

  const [searchStudent, setSearchStudent] = useState("");
  const [admissionForm, setAdmissionForm] = useState<AdmissionFormState>(defaultAdmissionForm);
  const [admissionAttachments, setAdmissionAttachments] = useState<NewsAttachment[]>([]);

  const clearMessageLater = () => {
    window.setTimeout(() => setMessage(""), 2600);
  };

  const refreshPublicNews = async () => {
    const latest = await api.getPublicNews();
    setPublicNews(latest);
  };

  const refreshSiteContent = async () => {
    const latest = await api.getPublicSiteContent();
    setSiteContent(normalizeSiteContent(latest));
  };

  const refresh = async () => {
    const [profile, newsRows, dashboard] = await Promise.all([
      api.me(),
      api.getNews(),
      api.getStats(),
    ]);

    setUser(profile);
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

    refreshSiteContent().catch(() => {
      setSiteContent(defaultSiteContent);
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
    const base: Tab[] = ["home", "news", "profile", "about"];
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
    setNews([]);
    setStats(null);
    setAdmissions([]);
    setPublicPage("landing");
    setTab("home");
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

  const deleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      await refresh();
      setMessage("Користувача видалено");
      clearMessageLater();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося видалити користувача");
      clearMessageLater();
    }
  };

  const saveSiteContent = async (payload: SiteContent) => {
    try {
      const saved = await api.updateSiteContent(payload);
      setSiteContent(normalizeSiteContent(saved));
      setMessage("Контент головної сторінки збережено");
      clearMessageLater();
      return saved;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося зберегти контент головної");
      clearMessageLater();
      throw error;
    }
  };

  const quickButtons = Object.keys(siteContent.quickInfoMap || {});

  const toQuickInfoDraftRows = (map: Record<string, QuickInfoItem>): QuickInfoEditorRow[] =>
    Object.entries(map).map(([label, item]) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label,
      title: item.title,
      intro: item.intro,
      detailsText: item.details.join("\n"),
    }));

  useEffect(() => {
    if (isLandingEditorOpen) return;
    const normalized = normalizeSiteContent(siteContent);
    setLandingDraft(normalized);
    setQuickInfoDraftRows(toQuickInfoDraftRows(normalized.quickInfoMap));
  }, [siteContent, isLandingEditorOpen]);

  const openLandingEditor = () => {
    const normalized = normalizeSiteContent(siteContent);
    setLandingDraft(normalized);
    setQuickInfoDraftRows(toQuickInfoDraftRows(normalized.quickInfoMap));
    setLandingEditorError("");
    setIsLandingEditorOpen(true);
  };

  const updateLandingField = (key: keyof SiteContent, value: string) => {
    setLandingDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateInfoCard = (index: number, key: "title" | "text" | "accent", value: string) => {
    setLandingDraft((prev) => ({
      ...prev,
      infoCards: prev.infoCards.map((card, cardIndex) => (cardIndex === index ? { ...card, [key]: value } : card)),
    }));
  };

  const addInfoCard = () => {
    setLandingDraft((prev) => ({
      ...prev,
      infoCards: [
        ...prev.infoCards,
        {
          title: "Нова картка",
          text: "Текст картки",
          accent: "from-sky-500 to-cyan-500",
        },
      ],
    }));
  };

  const removeInfoCard = (index: number) => {
    setLandingDraft((prev) => ({
      ...prev,
      infoCards: prev.infoCards.filter((_, cardIndex) => cardIndex !== index),
    }));
  };

  const updateQuickInfoRow = (id: string, patch: Partial<QuickInfoEditorRow>) => {
    setQuickInfoDraftRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addQuickInfoRow = () => {
    setQuickInfoDraftRows((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        label: "Новий розділ",
        title: "Новий розділ",
        intro: "Короткий опис",
        detailsText: "Пункт 1",
      },
    ]);
  };

  const removeQuickInfoRow = (id: string) => {
    setQuickInfoDraftRows((prev) => prev.filter((row) => row.id !== id));
  };

  const saveLandingEditor = async () => {
    setLandingEditorError("");

    const normalizedRows = quickInfoDraftRows
      .map((row) => ({ ...row, label: row.label.trim(), title: row.title.trim(), intro: row.intro.trim() }))
      .filter((row) => row.label);

    const uniqueLabels = new Set(normalizedRows.map((row) => row.label));
    if (!normalizedRows.length) {
      setLandingEditorError("Додай хоча б один розділ швидкої інформації.");
      return;
    }
    if (uniqueLabels.size !== normalizedRows.length) {
      setLandingEditorError("Назви швидких розділів мають бути унікальні.");
      return;
    }

    const quickInfoMap: Record<string, QuickInfoItem> = {};
    normalizedRows.forEach((row) => {
      quickInfoMap[row.label] = {
        title: row.title || row.label,
        intro: row.intro,
        details: row.detailsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      };
    });

    const nextCards = landingDraft.infoCards
      .map((card) => ({
        title: card.title.trim(),
        text: card.text.trim(),
        accent: card.accent.trim() || "from-sky-500 to-cyan-500",
      }))
      .filter((card) => card.title && card.text);

    if (!nextCards.length) {
      setLandingEditorError("Додай хоча б одну інформаційну картку.");
      return;
    }

    const payload = normalizeSiteContent({
      ...landingDraft,
      quickInfoMap,
      infoCards: nextCards,
    });

    setLandingSaving(true);
    try {
      await saveSiteContent(payload);
      setIsLandingEditorOpen(false);
    } catch {
      setLandingEditorError("Помилка збереження. Спробуй ще раз.");
    } finally {
      setLandingSaving(false);
    }
  };

  const selectedPublicNews = publicNews.find((item) => item.id === selectedPublicNewsId) || null;

  const latestPublicNews = useMemo(() => {
    return [...publicNews]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [publicNews]);

  const filteredPublicNews = useMemo(() => {
    const query = publicNewsQuery.trim().toLowerCase();
    if (!query) return publicNews;

    return publicNews.filter((item) => {
      const byTitle = item.title.toLowerCase().includes(query);
      const dateUa = new Date(item.createdAt).toLocaleDateString("uk-UA").toLowerCase();
      const dateIso = item.createdAt.slice(0, 10).toLowerCase();
      return byTitle || dateUa.includes(query) || dateIso.includes(query);
    });
  }, [publicNews, publicNewsQuery]);

  const selectedPublicNewsImages = selectedPublicNews?.attachments?.filter((file) => file.mimeType.startsWith("image/")) || [];

  useEffect(() => {
    setSelectedPublicNewsImageIndex(0);
  }, [selectedPublicNewsId]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 transition-all duration-500">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-5 text-slate-900 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-600">{siteContent.headerKicker}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">{siteContent.headerTitle}</h1>
              <p className="text-sm text-slate-600 md:text-base">
                {siteContent.headerSubtitle}
              </p>
            </div>
            <div className="relative flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => setPublicPage("app")}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-sky-700 hover:scale-105 hover:shadow-lg"
                  >
                    Кабінет
                  </button>
                  <button
                    onClick={() => setPublicPage("landing")}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-amber-600 hover:scale-105 hover:shadow-lg"
                  >
                    Головна
                  </button>
                  <button
                    onClick={logout}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-rose-700 hover:scale-105 hover:shadow-lg"
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
                  className="rounded-full border border-slate-300 bg-white p-2 shadow transition-all duration-300 hover:shadow-md hover:scale-110"
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

            <p className="relative text-xs uppercase tracking-[0.2em] text-sky-700">{siteContent.heroKicker}</p>
            <h2 className="relative mt-2 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
              {siteContent.heroTitle}
            </h2>
            <p className="relative mt-4 max-w-5xl text-sm leading-7 text-slate-700 md:text-base">
              {siteContent.heroText}
            </p>

            <div className="relative mt-5 flex flex-wrap gap-2">
              {quickButtons.map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    setSelectedQuickInfoPage(label);
                    setPublicPage("quickinfo");
                  }}
                  className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:scale-105 hover:shadow-lg"
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
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-cyan-700 hover:scale-105 hover:shadow-lg"
              >
                {siteContent.ctaAdmission}
              </button>
              <button
                onClick={() => (user ? setPublicPage("app") : setPublicPage("auth"))}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-lg"
              >
                {user ? "Повернутись в кабінет" : siteContent.ctaCabinet}
              </button>
              <button
                onClick={() => {
                  setPublicPage("news");
                  setSelectedPublicNewsId("");
                }}
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 transition-all duration-300 hover:bg-slate-100 hover:scale-105 hover:shadow-lg"
              >
                {siteContent.ctaNews}
              </button>
            </div>
          </article>
          </section>
        ) : null}

        {user?.role === "admin" && publicPage === "landing" ? (
          <button
            onClick={openLandingEditor}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-slate-800"
            title="Редагувати головну сторінку"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 20h4l10-10a2.1 2.1 0 0 0-4-1.4L4 18v2z" stroke="currentColor" strokeWidth="1.8" />
              <path d="m12.5 6.5 5 5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Змінити головну
          </button>
        ) : null}

        {isLandingEditorOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3">
            <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Редактор головної сторінки</h2>
                  <p className="text-sm text-slate-600">Просто зміни поля і натисни зберегти.</p>
                </div>
                <button
                  onClick={() => setIsLandingEditorOpen(false)}
                  className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
                >
                  Закрити
                </button>
              </div>

              <section className="grid gap-3 md:grid-cols-2">
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.headerKicker} onChange={(e) => updateLandingField("headerKicker", e.target.value)} placeholder="Підпис у шапці" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.headerTitle} onChange={(e) => updateLandingField("headerTitle", e.target.value)} placeholder="Заголовок сайту" />
                <textarea className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" rows={2} value={landingDraft.headerSubtitle} onChange={(e) => updateLandingField("headerSubtitle", e.target.value)} placeholder="Опис у шапці" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.heroKicker} onChange={(e) => updateLandingField("heroKicker", e.target.value)} placeholder="Підпис hero" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.heroTitle} onChange={(e) => updateLandingField("heroTitle", e.target.value)} placeholder="Головний заголовок" />
                <textarea className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" rows={3} value={landingDraft.heroText} onChange={(e) => updateLandingField("heroText", e.target.value)} placeholder="Опис hero" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.ctaAdmission} onChange={(e) => updateLandingField("ctaAdmission", e.target.value)} placeholder="Текст кнопки вступу" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.ctaCabinet} onChange={(e) => updateLandingField("ctaCabinet", e.target.value)} placeholder="Текст кнопки кабінету" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.ctaNews} onChange={(e) => updateLandingField("ctaNews", e.target.value)} placeholder="Текст кнопки новин" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.newsTitle} onChange={(e) => updateLandingField("newsTitle", e.target.value)} placeholder="Заголовок блоку новин" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.newsSubtitle} onChange={(e) => updateLandingField("newsSubtitle", e.target.value)} placeholder="Підзаголовок блоку новин" />
                <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.newsButtonText} onChange={(e) => updateLandingField("newsButtonText", e.target.value)} placeholder="Текст кнопки новин" />
              </section>

              <section className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Інформаційні картки</h3>
                  <button onClick={addInfoCard} className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white">Додати картку</button>
                </div>
                {landingDraft.infoCards.map((card, index) => (
                  <article key={`${card.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input className="rounded-lg border border-slate-300 px-3 py-2" value={card.title} onChange={(e) => updateInfoCard(index, "title", e.target.value)} placeholder="Заголовок картки" />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" value={card.accent} onChange={(e) => updateInfoCard(index, "accent", e.target.value)} placeholder="Градієнт tailwind (наприклад from-sky-500 to-cyan-500)" />
                      <textarea className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" rows={2} value={card.text} onChange={(e) => updateInfoCard(index, "text", e.target.value)} placeholder="Текст картки" />
                    </div>
                    <button onClick={() => removeInfoCard(index)} className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Видалити</button>
                  </article>
                ))}
              </section>

              <section className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Розділи швидкої інформації</h3>
                  <button onClick={addQuickInfoRow} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">Додати розділ</button>
                </div>
                {quickInfoDraftRows.map((row) => (
                  <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input className="rounded-lg border border-slate-300 px-3 py-2" value={row.label} onChange={(e) => updateQuickInfoRow(row.id, { label: e.target.value })} placeholder="Назва кнопки/розділу" />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" value={row.title} onChange={(e) => updateQuickInfoRow(row.id, { title: e.target.value })} placeholder="Заголовок сторінки" />
                      <textarea className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" rows={2} value={row.intro} onChange={(e) => updateQuickInfoRow(row.id, { intro: e.target.value })} placeholder="Короткий вступ" />
                      <textarea className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" rows={4} value={row.detailsText} onChange={(e) => updateQuickInfoRow(row.id, { detailsText: e.target.value })} placeholder="Пункти списку (кожен з нового рядка)" />
                    </div>
                    <button onClick={() => removeQuickInfoRow(row.id)} className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Видалити</button>
                  </article>
                ))}
              </section>

              {landingEditorError ? <p className="mt-4 text-sm font-semibold text-rose-600">{landingEditorError}</p> : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={saveLandingEditor}
                  disabled={landingSaving}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-sky-700 disabled:opacity-60"
                >
                  {landingSaving ? "Збереження..." : "Зберегти зміни"}
                </button>
                <button
                  onClick={() => setIsLandingEditorOpen(false)}
                  className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {publicPage === "landing" ? (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{siteContent.newsTitle}</h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{siteContent.newsSubtitle}</p>
              </div>
              <button
                onClick={() => {
                  setPublicPage("news");
                  setSelectedPublicNewsId("");
                }}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-sky-700 hover:scale-105 hover:shadow-lg"
              >
                {siteContent.newsButtonText}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {latestPublicNews.length ? (
                latestPublicNews.map((item) => (
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
                      className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-100 hover:scale-105 hover:shadow-md"
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
            {siteContent.infoCards.map((card) => (
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
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-lg"
                >
                  Назад на головну
                </button>
              </div>

              <div className="mt-3">
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Пошук новин за назвою або датою (наприклад: 16.04.2026 або 2026-04-16)"
                  value={publicNewsQuery}
                  onChange={(e) => setPublicNewsQuery(e.target.value)}
                />
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
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-lg"
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
                    {selectedPublicNewsImages.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Фото ({selectedPublicNewsImages.length})
                        </p>
                        <div className="space-y-2">
                          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                            <img
                              src={selectedPublicNewsImages[selectedPublicNewsImageIndex]?.dataUrl}
                              alt="Фото новини"
                              className="h-[55vh] max-h-[78vh] w-full rounded-lg bg-slate-100 object-contain"
                            />
                            {selectedPublicNewsImages.length > 1 ? (
                              <>
                                <button
                                  onClick={() =>
                                    setSelectedPublicNewsImageIndex((index) =>
                                      (index - 1 + selectedPublicNewsImages.length) % selectedPublicNewsImages.length,
                                    )
                                  }
                                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                                  aria-label="Попереднє фото"
                                >
                                  ‹
                                </button>
                                <button
                                  onClick={() =>
                                    setSelectedPublicNewsImageIndex((index) =>
                                      (index + 1) % selectedPublicNewsImages.length,
                                    )
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                                  aria-label="Наступне фото"
                                >
                                  ›
                                </button>
                              </>
                            ) : null}
                          </div>

                          {selectedPublicNewsImages.length > 1 ? (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {selectedPublicNewsImages.map((file, index) => (
                                <button
                                  key={file.id}
                                  onClick={() => setSelectedPublicNewsImageIndex(index)}
                                  className={`shrink-0 overflow-hidden rounded-lg border-2 ${
                                    index === selectedPublicNewsImageIndex ? "border-sky-500" : "border-transparent"
                                  }`}
                                  aria-label={`Фото ${index + 1}`}
                                >
                                  <img src={file.dataUrl} alt="Мініатюра" className="h-16 w-24 object-cover" />
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

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
              {filteredPublicNews.length ? (
                filteredPublicNews.map((item) => (
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
                <p className="text-sm text-slate-500">
                  {publicNewsQuery.trim() ? "Нічого не знайдено за цим запитом." : "Поки новин немає."}
                </p>
              )}
            </div>
          </section>
        ) : null}

        {publicPage === "quickinfo" ? (
          <section className="mb-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Інформація про ліцей</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">{selectedQuickInfoPage}</h2>
                  <p className="text-sm text-slate-600">
                    Детальна інформація про вибраний розділ ліцею.
                  </p>
                </div>
                <button
                  onClick={() => setPublicPage("landing")}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-lg"
                >
                  Назад на головну
                </button>
              </div>
            </div>

            <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="prose prose-slate max-w-none">
                <h3 className="text-xl font-black text-slate-900">{siteContent.quickInfoMap[selectedQuickInfoPage]?.title}</h3>
                <p className="mt-2 text-slate-700">{siteContent.quickInfoMap[selectedQuickInfoPage]?.intro}</p>
                <ul className="mt-4 space-y-2">
                  {siteContent.quickInfoMap[selectedQuickInfoPage]?.details?.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-sky-500 flex-shrink-0"></div>
                      <span className="text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
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
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-lg"
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
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 transition-all duration-300 hover:bg-slate-200 hover:scale-105"
                    >
                      {file.name} x
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={submitAdmissionForm}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-cyan-700 hover:scale-105 hover:shadow-lg"
                >
                  Надіслати заявку
                </button>
                <button
                  onClick={() => {
                    setAdmissionForm(defaultAdmissionForm);
                    setAdmissionAttachments([]);
                  }}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 transition-all duration-300 hover:bg-slate-200 hover:scale-105 hover:shadow-lg"
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
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                    tab === id
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-lg"
                      : "border-slate-300 bg-white/80 text-slate-900 hover:bg-white hover:shadow-md"
                  }`}
                >
                  {tabLabels[id]}
                </button>
              ))}
            </nav>

            {tab === "home" && stats ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <p className="text-xs uppercase text-slate-500">Користувач</p>
                  <h3 className="mt-2 text-lg font-bold">{user.fullName}</h3>
                  <p className="text-slate-600">Роль: {user.role}</p>
                </article>
                <article className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <p className="text-xs uppercase text-slate-500">Учні</p>
                  <h3 className="mt-2 text-3xl font-black">{stats.students}</h3>
                </article>
                <article className="rounded-2xl border border-slate-300 bg-white/80 p-5 text-slate-900 shadow-panel transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <p className="text-xs uppercase text-slate-500">Вчителі</p>
                  <h3 className="mt-2 text-3xl font-black">{stats.teachers}</h3>
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

            {tab === "admin" && user.role === "admin" ? (
              <AdminPanel
                users={users}
                admissions={admissions}
                onUpdateAdmission={updateAdmissionStatus}
                onDeleteUser={deleteUser}
                onSaveSiteContent={saveSiteContent}
                siteContent={siteContent}
                user={user}
              />
            ) : null}

            {tab === "profile" ? <ProfilePage user={user} onSave={saveProfile} /> : null}

            {tab === "about" ? <AboutPage /> : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
