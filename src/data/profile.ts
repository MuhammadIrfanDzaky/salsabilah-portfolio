import type { Localized } from "@/lib/i18n";

/*
 * All site content lives here, extracted from
 * "Curriculum Vitae Salsabillah 2026.pdf". Nothing in the JSX carries copy of
 * its own — every visible string is a { en, id } pair defined in this file.
 */

export type Publication = {
  title: Localized;
  venue: Localized;
  authors: string;
  year: number;
  url: string;
};

export type Experience = {
  role: Localized;
  organization: Localized;
  period: Localized;
  details: Localized[];
};

export type Profile = {
  name: string;
  credentials: string;
  displayName: string;
  role: Localized;
  kicker: Localized;
  tagline: Localized;
  bio: Localized[];
  facts: { label: Localized; value: Localized }[];
  stats: { value: string; label: Localized }[];
  location: Localized;
  institution: Localized;
  email: string;
  linkedin: string;
  photo: string;
  cvPath: string;
  siteUrl: string;
  seo: {
    title: Localized;
    description: Localized;
  };
};

export const profile: Profile = {
  name: "Salsabilah",
  credentials: "S.P., M.P.",
  displayName: "Salsabilah, S.P., M.P.",
  role: {
    en: "Agricultural Economist · Researcher",
    id: "Ekonom Pertanian · Peneliti",
  },
  kicker: {
    en: "Agricultural Economics · International Trade",
    id: "Ekonomi Pertanian · Perdagangan Internasional",
  },
  tagline: {
    en: "I study the competitiveness of Indonesia's agricultural exports — from coconut and clove to nutmeg and palm oil — and what global markets mean for farmers and food systems.",
    id: "Saya meneliti daya saing ekspor pertanian Indonesia — dari kelapa dan cengkeh hingga pala dan kelapa sawit — serta makna pasar global bagi petani dan sistem pangan.",
  },
  bio: [
    {
      en: "I am an agricultural economics researcher at Universitas Sumatera Utara in Medan, where I serve as assistant to the Dean of the Faculty of Agriculture and have worked as a research assistant since 2023. My research examines the export performance and international competitiveness of Indonesian agricultural commodities — coconut, clove, nutmeg, palm oil, and edible bird's nest among them.",
      id: "Saya adalah peneliti ekonomi pertanian di Universitas Sumatera Utara, Medan, tempat saya bertugas sebagai Asisten Dekan Fakultas Pertanian dan bekerja sebagai asisten peneliti sejak 2023. Riset saya mengkaji kinerja ekspor dan daya saing internasional komoditas pertanian Indonesia — di antaranya kelapa, cengkeh, pala, kelapa sawit, dan sarang burung walet.",
    },
    {
      en: "I hold a Bachelor of Agribusiness (S.P.) from Universitas Sumatera Utara (GPA 3.58 of 4.00, 2019–2023), with coursework spanning econometrics, research methods, operations research, risk management, credit and banking, human resource management, and agricultural project evaluation.",
      id: "Saya meraih gelar Sarjana Agribisnis (S.P.) dari Universitas Sumatera Utara (IPK 3,58 dari 4,00, 2019–2023), dengan bidang minat meliputi ekonometrika, metode penelitian, riset operasional, manajemen risiko, perkreditan dan perbankan, manajemen sumber daya manusia, serta evaluasi proyek pertanian.",
    },
    {
      en: "My work pairs careful empirical analysis — RCA, gravity models, ARDL, and time-series methods in SPSS and EViews — with policy relevance, and I welcome collaboration with researchers and institutions working on trade, food systems, and rural development.",
      id: "Karya saya memadukan analisis empiris yang cermat — RCA, model gravitasi, ARDL, dan metode runtun waktu dengan SPSS dan EViews — dengan relevansi kebijakan, dan saya terbuka untuk kolaborasi dengan peneliti maupun institusi di bidang perdagangan, sistem pangan, dan pembangunan perdesaan.",
    },
  ],
  facts: [
    {
      label: { en: "Degree", id: "Gelar" },
      value: {
        en: "B.Agribusiness (S.P.) · Universitas Sumatera Utara, 2023",
        id: "Sarjana Agribisnis (S.P.) · Universitas Sumatera Utara, 2023",
      },
    },
    {
      label: { en: "Institution", id: "Institusi" },
      value: {
        en: "Faculty of Agriculture, Universitas Sumatera Utara",
        id: "Fakultas Pertanian, Universitas Sumatera Utara",
      },
    },
    {
      label: { en: "Focus areas", id: "Bidang fokus" },
      value: {
        en: "Agricultural export competitiveness · Commodity markets",
        id: "Daya saing ekspor pertanian · Pasar komoditas",
      },
    },
    {
      label: { en: "Methods", id: "Metode" },
      value: {
        en: "RCA & gravity models · ARDL · Time-series (SPSS, EViews)",
        id: "RCA & model gravitasi · ARDL · Runtun waktu (SPSS, EViews)",
      },
    },
    {
      label: { en: "Location", id: "Lokasi" },
      value: { en: "Medan, Indonesia", id: "Medan, Indonesia" },
    },
  ],
  stats: [
    {
      value: "6",
      label: { en: "Publications & registered works", id: "Publikasi & karya tercatat" },
    },
    {
      value: "3",
      label: { en: "Research projects", id: "Proyek penelitian" },
    },
    {
      value: "2+",
      label: { en: "Years of research experience", id: "Tahun pengalaman riset" },
    },
  ],
  location: { en: "Medan, Indonesia", id: "Medan, Indonesia" },
  institution: {
    en: "Universitas Sumatera Utara · Medan, Indonesia",
    id: "Universitas Sumatera Utara · Medan, Indonesia",
  },
  email: "ssalsabillah62@gmail.com",
  linkedin: "https://www.linkedin.com/in/salsabillah62",
  photo: "/pfp_salsa.jpeg",
  cvPath: "/cv/Curriculum-Vitae-Salsabillah-2026.pdf",
  siteUrl: "https://salsabilah-portfolio.vercel.app",
  seo: {
    title: {
      en: "Salsabilah, S.P., M.P. — Agricultural Economist & Researcher",
      id: "Salsabilah, S.P., M.P. — Ekonom Pertanian & Peneliti",
    },
    description: {
      en: "Agricultural economics researcher at Universitas Sumatera Utara studying the export competitiveness of Indonesian agricultural commodities in international markets.",
      id: "Peneliti ekonomi pertanian di Universitas Sumatera Utara yang mengkaji daya saing ekspor komoditas pertanian Indonesia di pasar internasional.",
    },
  },
};

export const publications: Publication[] = [
  {
    title: {
      en: "Sustainable Competitiveness and Market Share of Indonesia's Coconut Exports in Major Destination Countries",
      id: "Sustainable Competitiveness and Market Share of Indonesia's Coconut Exports in Major Destination Countries",
    },
    venue: {
      en: "IOP Conference Series: Earth and Environmental Science — international proceedings",
      id: "IOP Conference Series: Earth and Environmental Science — prosiding internasional",
    },
    authors: "Salsabillah, Rahmanta, Tasya Chairuna Pane",
    year: 2026,
    url: "https://doi.org/10.1088/1755-1315/1583/1/012048",
  },
  {
    title: {
      en: "Determinants of the Sustainability of Indonesia's CPO Exports to India",
      id: "Determinants of the Sustainability of Indonesia's CPO Exports to India",
    },
    venue: {
      en: "IOP Conference Series: Earth and Environmental Science — international proceedings",
      id: "IOP Conference Series: Earth and Environmental Science — prosiding internasional",
    },
    authors: "Elia Kontesta Sidabutar, Tasya Chairuna Pane, Salsabillah",
    year: 2026,
    url: "https://doi.org/10.1088/1755-1315/1583/1/012046",
  },
  {
    title: {
      en: "Pelatihan GAP Tanaman Kopi di Samosir oleh Fakultas Pertanian USU dan IDNA",
      id: "Pelatihan GAP Tanaman Kopi di Samosir oleh Fakultas Pertanian USU dan IDNA",
    },
    venue: {
      en: "Registered copyright — Directorate General of Intellectual Property, Indonesia",
      id: "Hak cipta terdaftar (Surat Pencatatan Ciptaan) — Direktorat Jenderal Kekayaan Intelektual",
    },
    authors: "Fakultas Pertanian USU & IDNA",
    year: 2025,
    url: "https://www.youtube.com/watch?v=zTryxoFI9DQ",
  },
  {
    title: {
      en: "Analysis of Factors Affecting Indonesian Nutmeg Export Volumes to Sustainability of Indonesian Nutmeg Production",
      id: "Analysis of Factors Affecting Indonesian Nutmeg Export Volumes to Sustainability of Indonesian Nutmeg Production",
    },
    venue: {
      en: "IOP Conference Series: Earth and Environmental Science — international proceedings",
      id: "IOP Conference Series: Earth and Environmental Science — prosiding internasional",
    },
    authors: "T. Supriana, T.C. Pane, L. Simboling, Salsabillah",
    year: 2024,
    url: "https://doi.org/10.1088/1755-1315/1413/1/012099",
  },
  {
    title: {
      en: "Evaluating Climatic Factors Affecting Cassava Production in North Sumatera, Indonesia",
      id: "Evaluating Climatic Factors Affecting Cassava Production in North Sumatera, Indonesia",
    },
    venue: {
      en: "IOP Conference Series: Earth and Environmental Science — international proceedings",
      id: "IOP Conference Series: Earth and Environmental Science — prosiding internasional",
    },
    authors: "T.C. Pane, A.N. Syaifullah, Salsabillah",
    year: 2024,
    url: "https://doi.org/10.1088/1755-1315/1413/1/012109",
  },
  {
    title: {
      en: "Indonesia's Clove Exports in the Global Market: Trends, Forecasts, and Competitiveness",
      id: "Indonesia's Clove Exports in the Global Market: Trends, Forecasts, and Competitiveness",
    },
    venue: {
      en: "International Program Publication, Syracuse University — poster",
      id: "Publikasi Program Internasional, Syracuse University — poster",
    },
    authors: "Tasya Pane, Tavi Supriana, Salsabillah, Annisa Ayu Ramadhani",
    year: 2024,
    url: "https://surface.syr.edu/eli/277/",
  },
];

export const experience: Experience[] = [
  {
    role: {
      en: "Assistant to the Dean, Faculty of Agriculture",
      id: "Asisten Dekan Fakultas Pertanian",
    },
    organization: {
      en: "Universitas Sumatera Utara, Medan",
      id: "Universitas Sumatera Utara, Medan",
    },
    period: { en: "July 2023 – Present", id: "Juli 2023 – Sekarang" },
    details: [
      {
        en: "Supporting the Dean's office of the Faculty of Agriculture in academic administration and faculty programmes.",
        id: "Mendukung kantor Dekan Fakultas Pertanian dalam administrasi akademik dan program fakultas.",
      },
    ],
  },
  {
    role: { en: "Research Assistant", id: "Asisten Peneliti" },
    organization: {
      en: "Universitas Sumatera Utara, Medan",
      id: "Universitas Sumatera Utara, Medan",
    },
    period: { en: "July 2023 – July 2024", id: "Juli 2023 – Juli 2024" },
    details: [
      {
        en: "Research project: trend and competitiveness analysis of Indonesia's edible bird's nest exports, and the factors shaping export demand and competitiveness in international markets.",
        id: "Proyek penelitian: analisis trend dan daya saing ekspor sarang burung walet Indonesia serta faktor-faktor yang mempengaruhi permintaan ekspor dan daya saing di pasar internasional.",
      },
      {
        en: "Research project: comprehensive analysis of the competitiveness and exports of Indonesian clove in international markets and their contribution to Indonesia's economic growth.",
        id: "Proyek penelitian: analisis komprehensif daya saing dan ekspor cengkeh Indonesia di pasar internasional serta kontribusinya terhadap pertumbuhan ekonomi Indonesia.",
      },
    ],
  },
  {
    role: { en: "Research Team Member", id: "Tim Peneliti" },
    organization: {
      en: "Universitas Sumatera Utara, Medan",
      id: "Universitas Sumatera Utara, Medan",
    },
    period: { en: "August 2025 – November 2025", id: "Agustus 2025 – November 2025" },
    details: [
      {
        en: "Study on the downstreaming potential of red chili and tomato as a key to price stability and farmer welfare in North Sumatra — a collaboration between the Faculty of Agriculture and Bank Indonesia.",
        id: "Kajian potensi hilirisasi cabai merah dan tomat sebagai kunci stabilitas harga dan peningkatan kesejahteraan petani Sumatera Utara — kerja sama Fakultas Pertanian dan Bank Indonesia.",
      },
    ],
  },
  {
    role: { en: "Secretariat", id: "Sekretariat" },
    organization: {
      en: "Universitas Sumatera Utara, Medan",
      id: "Universitas Sumatera Utara, Medan",
    },
    period: { en: "August 2025 – September 2025", id: "Agustus 2025 – September 2025" },
    details: [
      {
        en: "9th International Conference on Agriculture, Environment, and Food Security (ICAEFS).",
        id: "9th International Conference on Agriculture, Environment, and Food Security (ICAEFS).",
      },
    ],
  },
];

/* Every UI string on the site, in both languages. */
export const ui = {
  skipToContent: { en: "Skip to content", id: "Lewati ke konten" },
  primaryNav: { en: "Primary navigation", id: "Navigasi utama" },
  languageLabel: { en: "Language", id: "Bahasa" },
  switchToEnglish: { en: "EN — English", id: "EN — Bahasa Inggris" },
  switchToIndonesian: {
    en: "ID — Indonesian",
    id: "ID — Bahasa Indonesia",
  },
  themeToggle: { en: "Toggle dark mode", id: "Ganti mode gelap" },
  nav: {
    about: { en: "About", id: "Tentang" },
    publications: { en: "Publications", id: "Publikasi" },
    experience: { en: "Experience", id: "Pengalaman" },
    contact: { en: "Contact", id: "Kontak" },
  },
  hero: {
    cta1: { en: "View publications", id: "Lihat publikasi" },
    cta2: { en: "Get in touch", id: "Hubungi saya" },
    photoAlt: {
      en: "Portrait of Salsabilah",
      id: "Foto potret Salsabilah",
    },
  },
  about: {
    kicker: { en: "01 · Profile", id: "01 · Profil" },
    title: { en: "About", id: "Tentang" },
    factsTitle: { en: "At a glance", id: "Sekilas" },
  },
  publications: {
    kicker: { en: "02 · Publications", id: "02 · Publikasi" },
    title: { en: "Research & publications", id: "Riset & publikasi" },
    lead: {
      en: "Peer-reviewed proceedings, posters, and registered works on the trade and competitiveness of Indonesian agricultural commodities.",
      id: "Prosiding telaah sejawat, poster, dan karya tercatat tentang perdagangan dan daya saing komoditas pertanian Indonesia.",
    },
    view: { en: "View", id: "Lihat" },
    resume: { en: "My Resume (PDF)", id: "Resume Saya (PDF)" },
  },
  experienceSection: {
    kicker: { en: "03 · Experience", id: "03 · Pengalaman" },
    title: { en: "Experience", id: "Pengalaman" },
    lead: {
      en: "Professional and research roles at the Faculty of Agriculture, Universitas Sumatera Utara.",
      id: "Peran profesional dan riset di Fakultas Pertanian, Universitas Sumatera Utara.",
    },
  },
  contact: {
    kicker: { en: "04 · Contact", id: "04 · Kontak" },
    title: { en: "Contact", id: "Kontak" },
    lead: {
      en: "For research collaboration, peer review, or advisory work — I would be glad to hear from you:",
      id: "Untuk kolaborasi riset, telaah sejawat, atau kerja sama kepakaran — saya senang mendengar dari Anda:",
    },
    emailLabel: { en: "Email", id: "Email" },
    linkedinLabel: { en: "LinkedIn", id: "LinkedIn" },
    institutionLabel: { en: "Institution", id: "Institusi" },
    form: {
      title: { en: "Send a message", id: "Kirim pesan" },
      name: { en: "Name", id: "Nama" },
      email: { en: "Email", id: "Email" },
      message: { en: "Message", id: "Pesan" },
      namePlaceholder: { en: "Your name", id: "Nama Anda" },
      emailPlaceholder: { en: "name@university.edu", id: "nama@universitas.ac.id" },
      messagePlaceholder: {
        en: "How would you like to collaborate?",
        id: "Kolaborasi seperti apa yang Anda usulkan?",
      },
      note: {
        en: "Messages go straight to my inbox — email works too.",
        id: "Pesan langsung masuk ke surel saya — email juga bisa.",
      },
      send: { en: "Send message", id: "Kirim pesan" },
    },
  },
  footer: {
    tag: {
      en: "Agricultural economics · International trade · Agribusiness",
      id: "Ekonomi pertanian · Perdagangan internasional · Agribisnis",
    },
    rights: {
      en: "© 2026 Salsabilah · All rights reserved.",
      id: "© 2026 Salsabilah · Hak cipta dilindungi.",
    },
  },
} as const;
