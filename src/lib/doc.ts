/**
 * Dokumen isi artikel — bentuk, pembersihan, dan turunannya.
 *
 * Format dokumennya ProseMirror/TipTap: pohon `{ type, attrs, content, marks }`.
 * Berkas ini sengaja **tidak** mengimpor apa pun dari TipTap. Alasannya bukan
 * kerapian: kalau bentuk dokumen hanya dijamin oleh pustaka editornya, maka
 * yang menjaga isi artikel adalah kode yang berjalan di peramban — dan itu
 * bukan penjagaan sama sekali. Aturan bentuknya ditulis di sini, di server,
 * dan diterapkan pada setiap dokumen yang masuk.
 *
 * `sanitizeDoc()` adalah pengganti sanitizer HTML yang tidak pernah dipakai
 * proyek ini. Karena isi disimpan sebagai pohon bertipe, bukan string HTML,
 * penjagaannya berupa **daftar putih**: tipe node dan mark yang tidak dikenal
 * dibuang, bukan di-escape. Renderer di `post-body.tsx` hanya mengenali tipe
 * yang sama, jadi tidak ada jalan bagi node asing untuk sampai ke layar
 * pembaca — dan `dangerouslySetInnerHTML` tetap nol di seluruh proyek
 * (competency 27, wajib untuk situs ber-`+public-ugc`).
 */

export type DocMark =
  | { type: "bold" | "italic" | "underline" | "strike" | "subscript" | "superscript" }
  | { type: "link"; attrs: { href: string } };

export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: DocMark[];
  text?: string;
};

export type Doc = { type: "doc"; content: DocNode[] };

export const EMPTY_DOC: Doc = { type: "doc", content: [] };

/** Mark yang boleh menempel pada teks. Selain ini dibuang. */
const MARK_TYPES = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "subscript",
  "superscript",
  "link",
]);

/**
 * Node yang boleh ada, beserta apakah ia boleh memuat node lain.
 *
 * `image` sengaja tidak punya `content`: teks alternatifnya ada di `attrs`,
 * bukan sebagai anak, supaya tidak ada tempat menyelipkan node lain di
 * dalamnya.
 */
const NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "hardBreak",
  "image",
  "table",
  "tableRow",
  "tableCell",
  "tableHeader",
  "text",
]);

/**
 * Skema tautan yang boleh dipakai.
 *
 * `javascript:` adalah alasan daftar ini ada. Sebuah `href` yang dimulai
 * dengannya berubah jadi eksekusi kode saat diklik, dan itu tetap berlaku
 * meski seluruh isi lain sudah aman. Skema di luar daftar ini dibuang bersama
 * mark-nya; teksnya tetap tampil, hanya tidak lagi jadi tautan.
 */
const SAFE_LINK = /^(https?:|mailto:|\/)/i;

/** Tingkat subjudul yang tersedia. H1 milik judul artikel, jadi tidak ada di isi. */
const HEADING_LEVELS = new Set([2, 3]);

function sanitizeMarks(value: unknown): DocMark[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const hasil: DocMark[] = [];
  for (const mark of value) {
    if (typeof mark !== "object" || mark === null) continue;
    const type = (mark as { type?: unknown }).type;
    if (typeof type !== "string" || !MARK_TYPES.has(type)) continue;

    if (type === "link") {
      const href = (mark as { attrs?: { href?: unknown } }).attrs?.href;
      if (typeof href !== "string" || !SAFE_LINK.test(href.trim())) continue;
      hasil.push({ type: "link", attrs: { href: href.trim() } });
      continue;
    }

    hasil.push({ type } as DocMark);
  }

  return hasil.length > 0 ? hasil : undefined;
}

function sanitizeNode(value: unknown): DocNode | null {
  if (typeof value !== "object" || value === null) return null;

  const node = value as Record<string, unknown>;
  const type = node.type;
  if (typeof type !== "string" || !NODE_TYPES.has(type)) return null;

  if (type === "text") {
    if (typeof node.text !== "string" || node.text.length === 0) return null;
    return { type: "text", text: node.text, marks: sanitizeMarks(node.marks) };
  }

  const hasil: DocNode = { type };

  if (type === "heading") {
    const level = (node.attrs as { level?: unknown } | undefined)?.level;
    hasil.attrs = { level: typeof level === "number" && HEADING_LEVELS.has(level) ? level : 2 };
  }

  if (type === "image") {
    const attrs = (node.attrs ?? {}) as Record<string, unknown>;
    const src = attrs.src;
    // Tanpa src, node gambar tidak berarti apa-apa selain lubang di halaman.
    if (typeof src !== "string" || src.trim().length === 0) return null;
    hasil.attrs = {
      src: src.trim(),
      altId: typeof attrs.altId === "string" ? attrs.altId : "",
      altEn: typeof attrs.altEn === "string" ? attrs.altEn : "",
    };
    return hasil;
  }

  if (Array.isArray(node.content)) {
    const anak = node.content.map(sanitizeNode).filter((n): n is DocNode => n !== null);
    if (anak.length > 0) hasil.content = anak;
  }

  return hasil;
}

/**
 * Membersihkan dokumen yang datang dari peramban.
 *
 * Mengembalikan dokumen kosong bila bentuknya tidak dikenali sama sekali —
 * bukan `null` — supaya pemanggilnya tidak perlu menangani dua bentuk
 * kegagalan. Isi yang kosong sudah ditolak oleh gate terbit di database.
 */
export function sanitizeDoc(value: unknown): Doc {
  if (typeof value === "string") {
    try {
      return sanitizeDoc(JSON.parse(value));
    } catch {
      return EMPTY_DOC;
    }
  }

  if (typeof value !== "object" || value === null) return EMPTY_DOC;
  const raw = value as Record<string, unknown>;
  if (raw.type !== "doc" || !Array.isArray(raw.content)) return EMPTY_DOC;

  return {
    type: "doc",
    content: raw.content.map(sanitizeNode).filter((n): n is DocNode => n !== null),
  };
}

/** Node blok yang berdiri sendiri sebagai satu baris teks polos. */
const BLOCK_BREAK = new Set([
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "tableRow",
  "horizontalRule",
]);

/**
 * Cermin teks polos dari sebuah dokumen.
 *
 * Inilah yang masuk ke `body_id`/`body_en`, dan karenanya yang diindeks
 * pencarian full-text. Sel tabel dipisah spasi, blok dipisah baris baru —
 * bentuknya tidak perlu cantik, ia tidak pernah ditampilkan; yang penting
 * setiap kata yang terlihat pembaca ikut terindeks.
 */
export function docToPlainText(doc: Doc): string {
  const baris: string[] = [];

  function walk(node: DocNode, buffer: string[]): void {
    if (node.type === "text") {
      buffer.push(node.text ?? "");
      return;
    }
    if (node.type === "image") {
      // Teks alternatif ikut terindeks: pembaca yang mencari "kelulut" pantas
      // menemukan artikel yang menyebutnya hanya di keterangan gambar.
      const alt = [node.attrs?.altId, node.attrs?.altEn].filter(
        (v): v is string => typeof v === "string" && v.length > 0,
      );
      if (alt.length > 0) buffer.push(alt.join(" "));
      return;
    }

    if (BLOCK_BREAK.has(node.type)) {
      const lokal: string[] = [];
      for (const anak of node.content ?? []) walk(anak, lokal);
      const teks = lokal.join("").trim();
      if (teks) baris.push(teks);
      return;
    }

    for (const anak of node.content ?? []) walk(anak, buffer);
  }

  for (const node of doc.content) walk(node, []);
  return baris.join("\n\n");
}

/**
 * Semua potongan teks dalam dokumen, berurutan.
 *
 * Dipakai jalur terjemahan: potongan-potongan ini dikirim ke DeepL sebagai
 * array, lalu hasilnya dipasang kembali ke posisi yang sama oleh
 * `applyTexts()`. Pendekatan ini menggantikan pengiriman HTML ber-`tag_handling`
 * — yang sudah terbukti merusak struktur (lihat catatan di `provider.ts`).
 * Di sini strukturnya tidak pernah dikirim ke mana pun; yang bepergian hanya
 * teksnya.
 */
export function collectTexts(doc: Doc): string[] {
  const hasil: string[] = [];

  function walk(node: DocNode): void {
    if (node.type === "text") {
      hasil.push(node.text ?? "");
      return;
    }
    if (node.type === "image") {
      hasil.push(typeof node.attrs?.altId === "string" ? node.attrs.altId : "");
      return;
    }
    for (const anak of node.content ?? []) walk(anak);
  }

  for (const node of doc.content) walk(node);
  return hasil;
}

/**
 * Menyusun ulang dokumen dengan teks yang sudah diterjemahkan.
 *
 * Urutan kunjungannya identik dengan `collectTexts()`, jadi pemetaannya per
 * indeks. Kalau panjangnya tidak cocok, dokumen dikembalikan apa adanya —
 * memasang sebagian akan menghasilkan artikel setengah dua bahasa yang tampak
 * sah, jenis kerusakan yang paling lama tidak ketahuan.
 *
 * Untuk node gambar, yang diisi adalah `altEn`: sisi sumbernya `altId`, dan
 * terjemahan tidak boleh menimpa apa yang ditulis Salsabilah sendiri.
 */
export function applyTexts(doc: Doc, texts: readonly string[]): Doc | null {
  if (texts.length !== collectTexts(doc).length) return null;

  let i = 0;

  function walk(node: DocNode): DocNode {
    if (node.type === "text") {
      return { ...node, text: texts[i++] ?? "" };
    }
    if (node.type === "image") {
      return { ...node, attrs: { ...node.attrs, altEn: texts[i++] ?? "" } };
    }
    if (node.content) {
      return { ...node, content: node.content.map(walk) };
    }
    return node;
  }

  return { type: "doc", content: doc.content.map(walk) };
}

/**
 * Path Storage setiap gambar yang dirujuk dokumen.
 *
 * Dipakai untuk membuang gambar yatim: berkas yang pernah diunggah lalu
 * dihapus dari isi tidak boleh tertinggal di bucket selamanya, dan tidak ada
 * yang akan mengingatnya kalau tidak dihitung dari dokumennya sendiri.
 */
export function collectImagePaths(doc: Doc): string[] {
  const hasil = new Set<string>();

  function walk(node: DocNode): void {
    if (node.type === "image" && typeof node.attrs?.src === "string") {
      hasil.add(node.attrs.src);
    }
    for (const anak of node.content ?? []) walk(anak);
  }

  for (const node of doc.content) walk(node);
  return [...hasil];
}
