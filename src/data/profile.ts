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
  orcid: string;
  scholar: string;
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
  orcid: "https://orcid.org/0009-0007-0867-8552",
  scholar: "https://scholar.google.com/citations?hl=id&user=0uA99LwAAAAJ",
  photo: "/pfp_salsa.jpeg",
  cvPath: "/cv/Curriculum-Vitae-Salsabillah-2026.pdf",
  // Domain produksi. Dipakai untuk canonical, hreflang, OG image, sitemap, dan
  // RSS — kalau salah, Google diberi tahu alamat yang keliru. Bisa ditimpa
  // lewat NEXT_PUBLIC_SITE_URL saat pindah ke domain sendiri, tanpa ubah kode.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://salsabilah.vercel.app",
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
  menuLabel: { en: "Menu", id: "Menu" },
  themeLabel: { en: "Theme", id: "Tema" },
  themeLight: { en: "Light theme", id: "Tema terang" },
  themeDark: { en: "Dark theme", id: "Tema gelap" },
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
    kicker: { en: "05 · Contact", id: "05 · Kontak" },
    title: { en: "Contact", id: "Kontak" },
    lead: {
      en: "For research collaboration, peer review, or advisory work — I would be glad to hear from you:",
      id: "Untuk kolaborasi riset, telaah sejawat, atau kerja sama kepakaran — saya senang mendengar dari Anda:",
    },
    emailLabel: { en: "Email", id: "Email" },
    linkedinLabel: { en: "LinkedIn", id: "LinkedIn" },
    orcidLabel: { en: "ORCID", id: "ORCID" },
    scholarLabel: { en: "Google Scholar", id: "Google Scholar" },
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
      // Dipakai saat NEXT_PUBLIC_FORMSPREE_ID belum diisi. Lebih baik menawarkan
      // jalur yang benar-benar jalan daripada formulir yang pesannya hilang.
      fallbackNote: {
        en: "Email is the most reliable way to reach me — your message arrives directly in my inbox.",
        id: "Email adalah cara paling andal untuk menghubungi saya — pesan Anda langsung masuk ke surel saya.",
      },
      fallbackCta: { en: "Email me", id: "Kirim email" },
      mailSubject: {
        en: "Enquiry from your website",
        id: "Pesan dari situs web Anda",
      },
    },
  },
  footer: {
    tag: {
      en: "Agricultural economics · International trade · Agribusiness",
      id: "Ekonomi pertanian · Perdagangan internasional · Agribisnis",
    },
    rights: {
      en: "© 2026 jek · All rights reserved.",
      id: "© 2026 jek · Hak cipta dilindungi.",
    },
  },
  blog: {
    navLabel: { en: "Blog", id: "Blog" },
    kicker: { en: "Writing", id: "Tulisan" },
    title: { en: "Blog", id: "Blog" },
    lead: {
      en: "Notes on agricultural trade, commodity markets, and research life — written for a general audience.",
      id: "Catatan tentang perdagangan pertanian, pasar komoditas, dan kehidupan riset — ditulis untuk pembaca umum.",
    },
    searchLabel: { en: "Search articles", id: "Cari artikel" },
    searchPlaceholder: { en: "e.g. coconut, clove", id: "mis. kelapa, cengkeh" },
    searchSubmit: { en: "Search", id: "Cari" },
    allCategories: { en: "All", id: "Semua" },
    readMore: { en: "Read", id: "Baca" },
    minuteRead: { en: "min read", id: "menit baca" },
    backToBlog: { en: "Back to all articles", id: "Kembali ke semua artikel" },
    empty: {
      en: "No articles yet.",
      id: "Belum ada artikel.",
    },
    noResults: {
      en: "No articles match that search.",
      id: "Tidak ada artikel yang cocok dengan pencarian itu.",
    },
    resultCount: {
      en: "article(s) found",
      id: "artikel ditemukan",
    },
    publishedOn: { en: "Published", id: "Terbit" },
    otherLanguageNotice: {
      en: "This article is also available in Indonesian.",
      id: "Artikel ini juga tersedia dalam bahasa Inggris.",
    },
    readInOther: {
      en: "Baca dalam Bahasa Indonesia",
      id: "Read in English",
    },
    latestKicker: { en: "04 · Writing", id: "04 · Tulisan" },
    latestTitle: { en: "Recent writing", id: "Tulisan terbaru" },
    latestLead: {
      en: "Short pieces on agricultural trade and commodity markets, written for readers outside the field.",
      id: "Tulisan ringkas tentang perdagangan pertanian dan pasar komoditas, untuk pembaca di luar bidang ini.",
    },
    viewAll: { en: "View all writing", id: "Lihat semua tulisan" },
  },
  notFound: {
    code: { en: "404", id: "404" },
    kicker: { en: "Page not found", id: "Halaman tidak ditemukan" },
    title: {
      en: "This page isn't here",
      id: "Halaman ini tidak ada",
    },
    body: {
      en: "The address may have changed, or the link that brought you here may be out of date. Nothing is broken on your side.",
      id: "Alamatnya mungkin sudah berubah, atau tautan yang membawa Anda ke sini sudah tidak berlaku. Tidak ada yang salah dari sisi Anda.",
    },
    backHome: { en: "Back to home", id: "Kembali ke beranda" },
    goContact: { en: "Get in touch", id: "Hubungi saya" },
    chooseLanguage: {
      en: "Choose a language to continue:",
      id: "Pilih bahasa untuk melanjutkan:",
    },
  },

  engagement: {
    like: { en: "Helpful", id: "Bermanfaat" },
    liked: { en: "Marked helpful", id: "Ditandai bermanfaat" },
    likeCount: { en: "found this helpful", id: "menandai bermanfaat" },
    share: { en: "Share", id: "Bagikan" },
    copyLink: { en: "Copy link", id: "Salin tautan" },
    copied: { en: "Link copied", id: "Tautan tersalin" },
  },

  comments: {
    title: { en: "Comments", id: "Komentar" },
    empty: {
      en: "No comments yet. Yours would be the first.",
      id: "Belum ada komentar. Punya Anda akan jadi yang pertama.",
    },
    loading: { en: "Loading comments…", id: "Memuat komentar…" },
    loadFailed: {
      en: "Comments could not be loaded. Try refreshing the page.",
      id: "Komentar gagal dimuat. Coba muat ulang halaman.",
    },
    anonymous: { en: "Anonymous", id: "Tanpa nama" },
    name: { en: "Name (optional)", id: "Nama (opsional)" },
    namePlaceholder: { en: "Leave blank to stay anonymous", id: "Kosongkan untuk tanpa nama" },
    body: { en: "Comment", id: "Komentar" },
    bodyPlaceholder: { en: "Write your comment…", id: "Tulis komentar Anda…" },
    send: { en: "Post comment", id: "Kirim komentar" },
    sending: { en: "Sending…", id: "Mengirim…" },
    sent: { en: "Thank you — your comment is published.", id: "Terima kasih — komentar Anda sudah tayang." },

    rulesTitle: { en: "Before you comment", id: "Sebelum berkomentar" },
    rules: {
      en: "Comments appear immediately, without review. Keep them relevant to the article and civil. No advertising, no personal attacks, no personal data of other people. Salsabilah may remove any comment.",
      id: "Komentar langsung tayang tanpa ditinjau lebih dulu. Jaga agar tetap relevan dengan artikel dan santun. Tanpa iklan, tanpa serangan pribadi, dan jangan memuat data pribadi orang lain. Salsabilah berhak menghapus komentar mana pun.",
    },
    privacy: {
      en: "No email or account is required, and none is stored. To keep out spam this site stores a random identifier in your browser, plus the time your comment was posted. Removing that identifier from your browser storage removes the link.",
      id: "Tidak perlu email maupun akun, dan keduanya tidak disimpan. Untuk menahan spam, situs ini menyimpan satu penanda acak di peramban Anda beserta waktu komentar dikirim. Menghapus penanda itu dari penyimpanan peramban memutus kaitannya.",
    },
    report: { en: "Report a comment", id: "Laporkan komentar" },
    reportHint: {
      en: "Found something abusive or off-limits? Email me and I will take it down.",
      id: "Menemukan komentar kasar atau tidak pantas? Kirim email ke saya dan akan saya turunkan.",
    },
    reportSubject: { en: "Report a comment", id: "Laporan komentar" },

    errors: {
      "artikel-mati": {
        en: "This article is no longer open for comments.",
        id: "Artikel ini sudah tidak menerima komentar.",
      },
      "terlalu-cepat": {
        en: "Too many comments in a short time. Please try again later.",
        id: "Terlalu banyak komentar dalam waktu singkat. Coba lagi nanti.",
      },
      kosong: { en: "Write something first.", id: "Tulis dulu isinya." },
      kepanjangan: {
        en: "Comment is longer than 2000 characters.",
        id: "Komentar lebih dari 2000 karakter.",
      },
      "nama-panjang": {
        en: "Name is longer than 60 characters.",
        id: "Nama lebih dari 60 karakter.",
      },
      "terlalu-banyak-tautan": {
        en: "Too many links. Keep it to two at most.",
        id: "Terlalu banyak tautan. Maksimal dua.",
      },
      umum: {
        en: "Your comment could not be sent. Please try again.",
        id: "Komentar gagal dikirim. Coba lagi.",
      },
    },
  },

  error: {
    kicker: { en: "Something went wrong", id: "Ada yang tidak beres" },
    title: {
      en: "This page could not be loaded",
      id: "Halaman ini gagal dimuat",
    },
    body: {
      en: "The problem is on this site, not with your connection. Trying again often works; if it does not, the page will be back shortly.",
      id: "Masalahnya ada di situs ini, bukan di koneksi Anda. Mencoba lagi biasanya berhasil; kalau tidak, halaman ini akan segera pulih.",
    },
    retry: { en: "Try again", id: "Coba lagi" },
    backHome: { en: "Back to home", id: "Kembali ke beranda" },
  },

  loading: { en: "Loading articles…", id: "Memuat artikel…" },
} as const;
