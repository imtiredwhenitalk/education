import { useEffect, useMemo, useState } from "react";
import AdminPanel from "./admin/admin";
import AboutPage from "./about/about";
import { api } from "./api/api";
import { defaultSiteContent, normalizeSiteContent } from "./content/siteContent";
import AuthSection from "./auth/auth";
import NewsBoard from "./news/news";
import ProfilePage from "./profile/profile";
import { isSupportedAttachment, toAttachment } from "./utils/attachments";
import type { AdmissionApplication, NewsAttachment, NewsItem, QuickInfoItem, SchoolUser, SiteContent, Stats } from "./types";

type Tab = "home" | "news" | "admin" | "profile" | "about";
type PublicPage = "landing" | "auth" | "news" | "admission" | "app" | "quickinfo" | "distance-learning";

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
  attachments: NewsAttachment[];
  linkUrl: string;
};

type AudienceKey = "parents" | "students" | "teachers";

type AudienceSection = {
  title: string;
  items: string[];
};

type AudienceDetails = {
  title: string;
  intro: string;
  sections: AudienceSection[];
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

const audienceDetailsMap: Record<AudienceKey, AudienceDetails> = {
  parents: {
    title: "Інформація для батьків",
    intro:
      "У цьому розділі зібрано все, що потрібно батькам для щоденної взаємодії зі школою: навчання, комунікація, безпека, документи та підтримка дитини.",
    sections: [
      {
        title: "Комунікація зі школою",
        items: [
          "Основний канал зв'язку з класним керівником доступний у профілі класу.",
          "Офіційні оголошення публікуються на головній сторінці та в новинах.",
          "Термінові повідомлення дублюються через адміністратора і класних керівників.",
          "Для індивідуальних звернень використовуй контакти приймальні та email закладу.",
        ],
      },
      {
        title: "Навчальний процес",
        items: [
          "Розклад уроків та зміни публікуються централізовано в розділі ліцею.",
          "Актуальні події та навчальні активності виносяться в стрічку новин.",
          "Важливі дедлайни вступу, олімпіад і консультацій доступні у quick info.",
          "За потреби можна відслідковувати документи для вступу або переведення дитини.",
        ],
      },
      {
        title: "Документи та довідки",
        items: [
          "Заяви та супровідні документи можна подавати в цифровому вигляді.",
          "PDF-файли відображаються прямо на сторінці для зручної перевірки.",
          "Рекомендовано завантажувати скани хорошої якості з читабельним текстом.",
          "Оригінали документів подаються відповідно до графіка приймальної комісії.",
        ],
      },
      {
        title: "Психологічна та безпекова підтримка",
        items: [
          "Працює шкільний психолог для індивідуальних консультацій.",
          "У разі булінгу діє чіткий алгоритм звернення до відповідальних осіб.",
          "Питання безпечної поведінки онлайн винесені в окремий інформаційний блок.",
          "Школа підтримує конфіденційність звернень і супровід родини.",
        ],
      },
      {
        title: "Участь у шкільному житті",
        items: [
          "Батьки можуть слідкувати за подіями, проєктами та досягненнями класу.",
          "Відкриті зустрічі адміністрації анонсуються заздалегідь на порталі.",
          "Звіт директора, кошторис і ключові рішення публікуються прозоро.",
          "Рекомендується регулярно переглядати розділи новин і quick info.",
        ],
      },
    ],
  },
  students: {
    title: "Інформація для учнів",
    intro:
      "Тут зібрано практичні інструкції для навчання: як користуватись порталом, де шукати матеріали, як готуватись до оцінювання і куди звертатись по допомогу.",
    sections: [
      {
        title: "Щоденне навчання",
        items: [
          "Оперативно перевіряй розклад уроків і зміни перед початком занять.",
          "Слідкуй за новинами класу, конкурсами, олімпіадами та гуртками.",
          "Зберігай важливі файли з новин: методички, положення, інструкції.",
          "Плануй підготовку до контрольних на основі шкільного календаря.",
        ],
      },
      {
        title: "Підготовка до ДПА/НМТ",
        items: [
          "У розділах порталу є дедлайни реєстрації та важливі дати кампаній.",
          "Ознайомлюйся з рекомендаціями, демо-матеріалами та минулорічними прикладами.",
          "Регулярно відпрацьовуй теми з базових предметів: мова, математика, історія.",
          "Використовуй консультації вчителів для закриття складних тем.",
        ],
      },
      {
        title: "Цифрова безпека",
        items: [
          "Не передавай логін і пароль стороннім особам.",
          "Використовуй складні паролі та періодично їх оновлюй.",
          "Довіряй лише офіційним оголошенням на порталі школи.",
          "Повідомляй вчителя або адміністратора про підозрілі повідомлення.",
        ],
      },
      {
        title: "Підтримка і розвиток",
        items: [
          "Психологічна підтримка доступна за попереднім записом.",
          "Учнівське самоврядування дозволяє впливати на шкільні ініціативи.",
          "Бери участь у волонтерських та проєктних активностях ліцею.",
          "Формуй власне портфоліо досягнень на основі участі в подіях.",
        ],
      },
      {
        title: "Правила академічної доброчесності",
        items: [
          "Самостійне виконання завдань - основа чесного оцінювання.",
          "Плагіат і списування заборонені та впливають на результати.",
          "Під час підготовки робіт коректно посилайся на використані джерела.",
          "За порушення правил застосовуються шкільні процедури реагування.",
        ],
      },
    ],
  },
  teachers: {
    title: "Інформація для вчителів",
    intro:
      "Розділ для педагогів з практичними орієнтирами: організація навчання, робота з контентом порталу, комунікація з батьками, супровід учнів і професійний розвиток.",
    sections: [
      {
        title: "Робота з контентом порталу",
        items: [
          "Публікуй новини структуровано: заголовок, короткий опис, вкладення.",
          "Для документів використовуй зрозумілі назви файлів з датою та темою.",
          "Візуальні матеріали завантажуй у читабельній якості без обрізання змісту.",
          "Оновлюй застарілі оголошення, щоб учні і батьки бачили актуальні дані.",
        ],
      },
      {
        title: "Організація навчального процесу",
        items: [
          "Синхронізуй календар оцінювань з шкільними подіями та дедлайнами.",
          "Плануй консультації для класів із нижчими результатами моніторингу.",
          "Регулярно інформуй учнів про критерії оцінювання і вимоги до робіт.",
          "Використовуй новини порталу для централізованої комунікації з класом.",
        ],
      },
      {
        title: "Взаємодія з батьками",
        items: [
          "Заздалегідь публікуй оголошення про збори, зміни і позакласні події.",
          "Надавай чіткі інструкції щодо документів і форматів подачі.",
          "Фіксуй ключові домовленості після важливих зустрічей.",
          "Підтримуй єдиний тон комунікації: фактично, прозоро, без двозначностей.",
        ],
      },
      {
        title: "Підтримка учнів",
        items: [
          "Виявляй ризики перевантаження і спрямовуй учнів до психолога за потреби.",
          "Оперативно реагуй на сигнали булінгу згідно з внутрішнім алгоритмом.",
          "Створюй безпечний простір для зворотного зв'язку від класу.",
          "Підсилюй мотивацію через участь учнів у проєктах та конкурсах.",
        ],
      },
      {
        title: "Професійний розвиток",
        items: [
          "План атестації і підвищення кваліфікації ведеться в межах шкільного графіка.",
          "Фіксуй методичні напрацювання та результати педагогічних практик.",
          "Обмінюйся кейсами на педрадах для поширення ефективних підходів.",
          "Використовуй аналітику успішності для корекції навчальних стратегій.",
        ],
      },
    ],
  },
};

const resolveAudienceByCardTitle = (title: string): AudienceKey => {
  const normalized = title.trim().toLowerCase();
  if (normalized.includes("бать")) return "parents";
  if (normalized.includes("учн")) return "students";
  if (normalized.includes("вчител")) return "teachers";
  return "students";
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
  const [selectedQuickInfoImageIndex, setSelectedQuickInfoImageIndex] = useState(0);
  const [selectedAudience, setSelectedAudience] = useState<AudienceKey | null>(null);
  const [selectedDistanceClass, setSelectedDistanceClass] = useState("1");

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

  const onAdmissionFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const accepted = Array.from(files).filter((file) => isSupportedAttachment(file));

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

  const quickButtonEntries = Object.entries(siteContent.quickInfoMap || {});
  const distanceClassOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

  const normalizeExternalUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  };

  const openExternalLink = (value: string) => {
    const normalized = normalizeExternalUrl(value);
    if (!normalized) return;
    window.open(normalized, "_blank", "noopener,noreferrer");
  };

  const toQuickInfoDraftRows = (map: Record<string, QuickInfoItem>): QuickInfoEditorRow[] =>
    Object.entries(map).map(([label, item]) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label,
      title: item.title,
      intro: item.intro,
      detailsText: item.details.join("\n"),
      attachments: item.attachments || [],
      linkUrl: item.linkUrl || "",
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

  const onQuickInfoFiles = async (rowId: string, files: FileList | null) => {
    if (!files || !files.length) return;
    const accepted = Array.from(files).filter((file) => isSupportedAttachment(file));
    if (!accepted.length) return;

    const prepared = await Promise.all(accepted.map((file) => toAttachment(file)));
    setQuickInfoDraftRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, attachments: [...row.attachments, ...prepared] } : row,
      ),
    );
  };

  const removeQuickInfoAttachment = (rowId: string, attachmentId: string) => {
    setQuickInfoDraftRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, attachments: row.attachments.filter((item) => item.id !== attachmentId) }
          : row,
      ),
    );
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
        attachments: [],
        linkUrl: "",
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
        attachments: row.attachments,
        linkUrl: normalizeExternalUrl(row.linkUrl),
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
      return item.title.toLowerCase().includes(query);
    });
  }, [publicNews, publicNewsQuery]);

  const selectedPublicNewsImages = selectedPublicNews?.attachments?.filter((file) => file.mimeType.startsWith("image/")) || [];
  const selectedQuickInfoSection = siteContent.quickInfoMap[selectedQuickInfoPage];
  const selectedQuickInfoAttachments = selectedQuickInfoSection?.attachments || [];
  const selectedQuickInfoImages = selectedQuickInfoAttachments.filter((file) => file.mimeType.startsWith("image/"));
  const selectedQuickInfoPdfFiles = selectedQuickInfoAttachments.filter((file) => file.mimeType === "application/pdf");
  const selectedQuickInfoOtherFiles = selectedQuickInfoAttachments.filter(
    (file) => !file.mimeType.startsWith("image/") && file.mimeType !== "application/pdf",
  );
  const selectedDistanceLearningLink = normalizeExternalUrl(siteContent.distanceLearningLinks?.[selectedDistanceClass] || "");

  useEffect(() => {
    setSelectedPublicNewsImageIndex(0);
  }, [selectedPublicNewsId]);

  useEffect(() => {
    setSelectedQuickInfoImageIndex(0);
  }, [selectedQuickInfoPage]);

  useEffect(() => {
    if (!selectedAudience) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAudience(null);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [selectedAudience]);

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
                  title="Сторінка входу"
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
              <button
                onClick={() => setPublicPage("distance-learning")}
                className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-100 hover:scale-105 hover:shadow-lg"
              >
                Дистанційне навчання
              </button>

              {quickButtonEntries.map(([label, item]) => (
                <button
                  key={label}
                  onClick={() => {
                    if (item.linkUrl) {
                      openExternalLink(item.linkUrl);
                      return;
                    }
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
                      <input className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" value={row.linkUrl} onChange={(e) => updateQuickInfoRow(row.id, { linkUrl: e.target.value })} placeholder="Гіперпосилання кнопки (https://drive.google.com/... або інше)" />
                      <textarea className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" rows={2} value={row.intro} onChange={(e) => updateQuickInfoRow(row.id, { intro: e.target.value })} placeholder="Короткий вступ" />
                      <textarea className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" rows={4} value={row.detailsText} onChange={(e) => updateQuickInfoRow(row.id, { detailsText: e.target.value })} placeholder="Пункти списку (кожен з нового рядка)" />
                      <div className="md:col-span-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => onQuickInfoFiles(row.id, e.target.files)}
                        />
                        {row.attachments.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {row.attachments.map((file) => (
                              <button
                                key={file.id}
                                onClick={() => removeQuickInfoAttachment(row.id, file.id)}
                                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                              >
                                {file.name} x
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <button onClick={() => removeQuickInfoRow(row.id)} className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Видалити</button>
                  </article>
                ))}
              </section>

              <section className="mt-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Дистанційне навчання (класи 1-11)</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.distanceLearningTitle} onChange={(e) => updateLandingField("distanceLearningTitle", e.target.value)} placeholder="Заголовок вкладки дистанційного навчання" />
                  <input className="rounded-lg border border-slate-300 px-3 py-2" value={landingDraft.distanceLearningSubtitle} onChange={(e) => updateLandingField("distanceLearningSubtitle", e.target.value)} placeholder="Підзаголовок вкладки дистанційного навчання" />
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {distanceClassOptions.map((classNumber) => (
                    <label key={classNumber} className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Клас {classNumber}</span>
                      <input
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        value={landingDraft.distanceLearningLinks?.[classNumber] || ""}
                        onChange={(e) =>
                          setLandingDraft((prev) => ({
                            ...prev,
                            distanceLearningLinks: {
                              ...prev.distanceLearningLinks,
                              [classNumber]: e.target.value,
                            },
                          }))
                        }
                        placeholder="https://drive.google.com/..."
                      />
                    </label>
                  ))}
                </div>
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
                <button
                  onClick={() => setSelectedAudience(resolveAudienceByCardTitle(card.title))}
                  className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
                >
                  Детальніше
                </button>
              </article>
            ))}
          </section>
        ) : null}

        {selectedAudience ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3">
            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Детальна інформація</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">{audienceDetailsMap[selectedAudience].title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{audienceDetailsMap[selectedAudience].intro}</p>
                </div>
                <button
                  onClick={() => setSelectedAudience(null)}
                  className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
                >
                  Закрити
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {audienceDetailsMap[selectedAudience].sections.map((section) => (
                  <article key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {section.items.map((item, index) => (
                        <li key={`${section.title}-${index}`} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {!user && publicPage === "auth" ? (
          <section className="mb-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Сторінка авторизації</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Вхід у систему</h2>
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

            </div>

            <AuthSection onLogin={login} loading={loading} />
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

                {selectedQuickInfoAttachments.length ? (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-lg font-bold text-slate-900">Файли розділу</h4>

                    {selectedQuickInfoImages.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Фото ({selectedQuickInfoImages.length})
                        </p>
                        <div className="space-y-2">
                          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                            <img
                              src={selectedQuickInfoImages[selectedQuickInfoImageIndex]?.dataUrl}
                              alt={selectedQuickInfoImages[selectedQuickInfoImageIndex]?.name || "Фото розділу"}
                              className="h-[55vh] max-h-[78vh] w-full rounded-lg bg-white object-contain"
                            />
                            {selectedQuickInfoImages.length > 1 ? (
                              <>
                                <button
                                  onClick={() =>
                                    setSelectedQuickInfoImageIndex((index) =>
                                      (index - 1 + selectedQuickInfoImages.length) % selectedQuickInfoImages.length,
                                    )
                                  }
                                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-900"
                                  aria-label="Попереднє фото"
                                >
                                  ‹
                                </button>
                                <button
                                  onClick={() =>
                                    setSelectedQuickInfoImageIndex((index) =>
                                      (index + 1) % selectedQuickInfoImages.length,
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

                          {selectedQuickInfoImages.length > 1 ? (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {selectedQuickInfoImages.map((file, index) => (
                                <button
                                  key={file.id}
                                  onClick={() => setSelectedQuickInfoImageIndex(index)}
                                  className={`shrink-0 overflow-hidden rounded-lg border-2 ${
                                    index === selectedQuickInfoImageIndex ? "border-sky-500" : "border-transparent"
                                  }`}
                                  aria-label={`Фото ${index + 1}`}
                                >
                                  <img src={file.dataUrl} alt={file.name} className="h-16 w-24 object-cover" />
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {selectedQuickInfoPdfFiles.length ? (
                      <div className="space-y-3">
                        {selectedQuickInfoPdfFiles.map((file) => (
                          <article key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                            <p className="mb-2 text-sm font-semibold text-slate-700">{file.name}</p>
                            <iframe
                              title={file.name}
                              src={`${file.dataUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                              className="h-[78vh] w-full rounded-lg border border-slate-200 bg-white"
                            />
                            <div className="mt-2 flex flex-wrap gap-2">
                              <a
                                href={file.dataUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800"
                              >
                                Відкрити PDF
                              </a>
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
                    ) : null}

                    <div className="grid gap-2">
                      {selectedQuickInfoOtherFiles.map((file) => (
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
              </div>
            </article>
          </section>
        ) : null}

        {publicPage === "distance-learning" ? (
          <section className="mb-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Онлайн формат</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">{siteContent.distanceLearningTitle}</h2>
                  <p className="text-sm text-slate-600">{siteContent.distanceLearningSubtitle}</p>
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
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Оберіть клас</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={selectedDistanceClass}
                    onChange={(e) => setSelectedDistanceClass(e.target.value)}
                  >
                    {distanceClassOptions.map((classNumber) => (
                      <option key={classNumber} value={classNumber}>Клас {classNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-bold text-slate-900">Матеріали для {selectedDistanceClass} класу</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Тут розміщуються посилання на Google Drive, Classroom, відеоуроки, домашні завдання та інші матеріали дистанційного навчання.
                  </p>

                  {selectedDistanceLearningLink ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={selectedDistanceLearningLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-sky-700"
                      >
                        Відкрити матеріали класу
                      </a>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm font-semibold text-amber-700">
                      Для цього класу поки не додано посилання. Звернись до адміністратора або перевір пізніше.
                    </p>
                  )}
                </div>
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
