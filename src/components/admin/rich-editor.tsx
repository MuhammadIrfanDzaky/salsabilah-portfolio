"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { ArticleImage } from "@/components/admin/article-image-node";
import { uploadArticleImage } from "@/app/admin/(dasbor)/artikel/actions";
import { inputClasses } from "@/components/admin/field";
import { sanitizeDoc, type Doc } from "@/lib/doc";

/**
 * Editor isi artikel — pengganti kotak teks bertanda baca.
 *
 * Salsabilah bukan developer, dan menghafal `## ` serta `*miring*` adalah pajak
 * yang tidak ada alasannya. Toolbar ini memberi perilaku yang sudah dia kenal
 * dari pengolah kata.
 *
 * **Yang keluar dari sini adalah JSON, bukan HTML.** Itu keputusan yang menjaga
 * aturan keras proyek: karena isi disimpan sebagai pohon bertipe, halaman
 * publik merendernya jadi elemen React satu per satu dan tidak pernah butuh
 * `dangerouslySetInnerHTML`. Menyimpan HTML akan menuntut sanitizer sendiri —
 * persis risiko yang sengaja dihindari untuk situs ber-`+public-ugc`.
 *
 * Dokumen yang keluar dari editor tetap dibersihkan ulang **di server** sebelum
 * disimpan. Pembersihan di sini hanya untuk yang masuk; apa pun yang dikirim
 * peramban tidak boleh dipercaya, termasuk yang dikirim peramban Salsabilah.
 */

/** Ekstensi yang dipakai bersama oleh editor dan pratinjau. */
export const ARTICLE_EXTENSIONS = [
  StarterKit.configure({
    // H1–H6 atas permintaan pemilik (2026-07-29). Judul artikel sendiri sudah
    // menjadi <h1> halaman, jadi memakai H1 di dalam isi membuat satu halaman
    // punya dua judul utama — pembaca layar menavigasi lewat daftar heading,
    // dan daftar itu jadi berbohong tentang mana judulnya. Untuk subjudul
    // biasa, mulai dari H2.
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    codeBlock: false,
    code: false,
    link: false,
  }),
  Underline,
  Subscript,
  Superscript,
  Link.configure({
    openOnClick: false,
    autolink: false,
    // Daftar putih skema; `javascript:` berubah jadi eksekusi kode saat diklik.
    // Diulang di server oleh `sanitizeDoc()` — ini kenyamanan, bukan penjagaan.
    protocols: ["http", "https", "mailto"],
    HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
  }),
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  ArticleImage,
];

function Tombol({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      // Wajib. Tanpa ini setiap tombol toolbar mengirim formulir artikel, dan
      // menekan "Tebal" akan menyimpan draf.
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active ?? false}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[7px] border px-2 text-[13px] font-semibold transition-colors disabled:opacity-40 ${
        active
          ? "border-accent-strong bg-accent/15 text-accent-strong"
          : "border-line bg-surface text-ink hover:bg-accent/5"
      }`}
    >
      {children}
    </button>
  );
}

function Pemisah() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px self-center bg-line" />;
}


/**
 * Modal tautan.
 *
 * Menggantikan `window.prompt`, yang tidak bisa ditata sama sekali, memaksa
 * kotak abu-abu peramban dengan judul domain di atasnya, dan tidak punya tempat
 * untuk menjelaskan alamat seperti apa yang diterima. Yang di sini bisa: satu
 * kolom, aturan penulisannya terlihat, dan tombol Lepas tautan berdiri sendiri
 * alih-alih disembunyikan di balik "kosongkan untuk melepas".
 */
function ModalTautan({
  awal,
  sedangMenaut,
  onSimpan,
  onLepas,
  onTutup,
}: {
  awal: string;
  sedangMenaut: boolean;
  onSimpan: (href: string) => void;
  onLepas: () => void;
  onTutup: () => void;
}) {
  const [nilai, setNilai] = useState(awal || "https://");
  const [galat, setGalat] = useState<string | null>(null);
  const kolom = useRef<HTMLInputElement>(null);

  useEffect(() => {
    kolom.current?.focus();
    kolom.current?.select();
  }, []);

  function simpan() {
    const bersih = nilai.trim();
    if (!bersih) {
      setGalat("Alamat tidak boleh kosong. Pakai Lepas tautan untuk menghapusnya.");
      return;
    }
    if (!/^(https?:\/\/|mailto:|\/)/i.test(bersih)) {
      setGalat("Harus diawali https://, http://, mailto:, atau / untuk halaman di situs ini.");
      return;
    }
    onSimpan(bersih);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      // Klik di luar kotak menutup. Tidak menyimpan apa pun — membatalkan
      // adalah tindakan yang aman, menyimpan tidak.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-tautan"
        className="w-full max-w-[440px] rounded-[14px] border border-line bg-surface p-6 shadow-xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") onTutup();
          if (e.key === "Enter") {
            e.preventDefault();
            simpan();
          }
        }}
      >
        <h2
          id="judul-tautan"
          className="m-0 mb-1 font-serif text-[20px] font-semibold text-ink"
        >
          {sedangMenaut ? "Ubah tautan" : "Tambah tautan"}
        </h2>
        <p className="m-0 mb-4 text-[13px] leading-relaxed text-muted">
          Alamat lengkap situs lain (<code>https://…</code>), alamat email
          (<code>mailto:…</code>), atau halaman di situs ini (<code>/id/blog</code>).
        </p>

        <input
          ref={kolom}
          type="text"
          value={nilai}
          onChange={(e) => {
            setNilai(e.target.value);
            setGalat(null);
          }}
          aria-invalid={galat ? true : undefined}
          className={`${inputClasses} font-mono text-[14px]`}
        />

        {galat ? (
          <p role="alert" className="m-0 mt-2 text-[13px] font-semibold text-accent-strong">
            {galat}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {sedangMenaut ? (
            <button
              type="button"
              onClick={onLepas}
              className="mr-auto inline-flex items-center rounded-full border border-accent-strong/50 bg-surface px-4 py-2 text-[14px] font-semibold text-accent-strong transition-opacity hover:opacity-85"
            >
              Lepas tautan
            </button>
          ) : null}
          <button
            type="button"
            onClick={onTutup}
            className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-2 text-[14px] font-semibold text-ink transition-opacity hover:opacity-85"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={simpan}
            className="inline-flex items-center rounded-full bg-accent-strong px-5 py-2 text-[14px] font-semibold text-on-accent transition-opacity hover:opacity-85"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function Toolbar({
  editor,
  onInsertImage,
  mengunggah,
}: {
  editor: Editor;
  onInsertImage?: () => void;
  mengunggah?: boolean;
}) {
  // Toolbar harus digambar ulang setiap kali seleksi berpindah, kalau tidak
  // keadaan aktif tombolnya berbohong. `useEditorState` belum dipakai supaya
  // tidak menambah dependensi; langganan manual sudah cukup untuk satu editor.
  const [modalTautan, setModalTautan] = useState(false);

  const [, paksaGambarUlang] = useState(0);
  useEffect(() => {
    const tandai = () => paksaGambarUlang((n) => n + 1);
    editor.on("selectionUpdate", tandai);
    editor.on("transaction", tandai);
    return () => {
      editor.off("selectionUpdate", tandai);
      editor.off("transaction", tandai);
    };
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-2 py-2">
      <Tombol label="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Tombol>
      <Tombol label="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </Tombol>
      <Tombol label="Garis bawah" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Tombol>
      <Tombol label="Coret" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </Tombol>
      <Tombol label="Subskrip" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}>
        X<sub>2</sub>
      </Tombol>
      <Tombol label="Superskrip" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
        X<sup>2</sup>
      </Tombol>

      <Pemisah />

      {/* Satu dropdown, bukan enam tombol. Enam tombol H akan memakan separuh
          toolbar dan membuat yang benar-benar sering dipakai — tebal, daftar —
          terdorong ke baris berikutnya. */}
      <select
        aria-label="Tingkat judul"
        title="Tingkat judul"
        value={
          ([1, 2, 3, 4, 5, 6] as const).find((n) => editor.isActive("heading", { level: n }))?.toString() ??
          "p"
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else
            editor
              .chain()
              .focus()
              .setHeading({ level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 })
              .run();
        }}
        className="h-8 rounded-[7px] border border-line bg-surface px-2 text-[13px] font-semibold text-ink"
      >
        <option value="p">Paragraf</option>
        <option value="1">Judul 1</option>
        <option value="2">Judul 2</option>
        <option value="3">Judul 3</option>
        <option value="4">Judul 4</option>
        <option value="5">Judul 5</option>
        <option value="6">Judul 6</option>
      </select>
      <Tombol label="Daftar berpoin" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •—
      </Tombol>
      <Tombol label="Daftar bernomor" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </Tombol>
      <Tombol label="Kutipan" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        &ldquo;
      </Tombol>

      <Pemisah />

      <Tombol label="Tautan" active={editor.isActive("link")} onClick={() => setModalTautan(true)}>
        🔗
      </Tombol>
      {onInsertImage ? (
        <Tombol
          label={mengunggah ? "Mengunggah gambar…" : "Sisipkan gambar"}
          disabled={mengunggah}
          onClick={onInsertImage}
        >
          {mengunggah ? "…" : "🖼"}
        </Tombol>
      ) : null}
      <Tombol label="Garis pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        —
      </Tombol>

      <Pemisah />

      <Tombol
        label="Sisipkan tabel"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        ▦
      </Tombol>
      {/* Kontrol tabel hanya muncul saat kursor benar-benar berada di dalam
          tabel. Sebelumnya ia selalu tampil dalam keadaan nonaktif, yang cuma
          menambah tombol mati di toolbar dan menyulitkan menemukan yang hidup. */}
      {editor.isActive("table") ? (
        <>
          <Tombol label="Sisipkan baris di atas" disabled={!editor.can().addRowBefore()} onClick={() => editor.chain().focus().addRowBefore().run()}>
            ↑baris
          </Tombol>
          <Tombol label="Sisipkan baris di bawah" disabled={!editor.can().addRowAfter()} onClick={() => editor.chain().focus().addRowAfter().run()}>
            ↓baris
          </Tombol>
          <Tombol label="Hapus baris ini" disabled={!editor.can().deleteRow()} onClick={() => editor.chain().focus().deleteRow().run()}>
            ×baris
          </Tombol>
          <Tombol label="Sisipkan kolom di kiri" disabled={!editor.can().addColumnBefore()} onClick={() => editor.chain().focus().addColumnBefore().run()}>
            ←kolom
          </Tombol>
          <Tombol label="Sisipkan kolom di kanan" disabled={!editor.can().addColumnAfter()} onClick={() => editor.chain().focus().addColumnAfter().run()}>
            →kolom
          </Tombol>
          <Tombol label="Hapus kolom ini" disabled={!editor.can().deleteColumn()} onClick={() => editor.chain().focus().deleteColumn().run()}>
            ×kolom
          </Tombol>
          <Tombol label="Jadikan/batalkan baris judul" disabled={!editor.can().toggleHeaderRow()} onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
            baris judul
          </Tombol>
          <Tombol label="Gabungkan atau pisahkan sel" disabled={!editor.can().mergeOrSplit()} onClick={() => editor.chain().focus().mergeOrSplit().run()}>
            gabung/pisah
          </Tombol>
          <Tombol label="Hapus seluruh tabel" disabled={!editor.can().deleteTable()} onClick={() => editor.chain().focus().deleteTable().run()}>
            ▦×
          </Tombol>
        </>
      ) : null}

      <Pemisah />

      <Tombol label="Urungkan" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </Tombol>
      <Tombol label="Ulangi" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </Tombol>

      {modalTautan ? (
        <ModalTautan
          awal={(editor.getAttributes("link").href as string | undefined) ?? ""}
          sedangMenaut={editor.isActive("link")}
          onTutup={() => {
            setModalTautan(false);
            editor.chain().focus().run();
          }}
          onLepas={() => {
            setModalTautan(false);
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
          }}
          onSimpan={(href) => {
            setModalTautan(false);
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
          }}
        />
      ) : null}
    </div>
  );
}

export function RichEditor({
  name,
  initialDoc,
  onChange,
}: {
  /** Nama input tersembunyi yang membawa JSON dokumen dalam pengiriman formulir. */
  name: string;
  initialDoc: Doc;
  onChange?: (doc: Doc) => void;
}) {
  const [json, setJson] = useState(() => JSON.stringify(initialDoc));
  const [galat, setGalat] = useState<string | null>(null);
  const [mengunggah, setMengunggah] = useState(false);
  const pemilihBerkas = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: ARTICLE_EXTENSIONS,
    content: initialDoc,
    // Wajib di App Router: merender editor saat SSR menghasilkan markup yang
    // berbeda dari sisi klien, dan React akan mengeluh soal hydration.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-none min-h-[320px] px-4 py-3 text-[16px] leading-[1.75] text-ink focus:outline-none",
      },
    },
    onUpdate({ editor: instance }) {
      const doc = sanitizeDoc(instance.getJSON());
      setJson(JSON.stringify(doc));
      onChange?.(doc);
    },
  });

  async function sisipkanGambar(file: File) {
    if (!editor) return;
    setGalat(null);
    setMengunggah(true);
    try {
      const data = new FormData();
      data.append("image", file);
      const hasil = await uploadArticleImage(data);

      if (!hasil.ok) {
        setGalat(hasil.message);
        return;
      }

      // Hanya teks alternatif bahasa sumber yang ditanyakan. Sisi Inggrisnya
      // diisi jalur terjemahan bersama isi artikel — meminta dua bahasa di
      // sini menggandakan pekerjaan untuk sesuatu yang memang akan
      // diterjemahkan juga.
      const alt = window.prompt("Keterangan gambar (untuk pembaca layar):", "") ?? "";

      editor.chain().focus().insertContent({
        type: "image",
        attrs: { src: hasil.path, altId: alt.trim(), altEn: "" },
      }).run();
    } finally {
      setMengunggah(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-bg">
      {editor ? (
        <Toolbar
          editor={editor}
          mengunggah={mengunggah}
          onInsertImage={() => pemilihBerkas.current?.click()}
        />
      ) : null}

      {/* Sengaja TANPA atribut `name`: input tanpa nama tidak ikut dalam
          FormData, jadi berkas ini tidak akan tercampur dengan `cover` saat
          formulir artikel dikirim. */}
      <input
        ref={pemilihBerkas}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Dikosongkan supaya memilih berkas yang sama dua kali tetap memicu
          // `change` — tanpa ini, mengunggah ulang gambar yang sama diam saja.
          e.target.value = "";
          if (file) void sisipkanGambar(file);
        }}
      />

      <EditorContent editor={editor} />

      {galat ? (
        <p role="alert" className="m-0 border-t border-line px-4 py-2 text-[13px] font-semibold text-accent-strong">
          {galat}
        </p>
      ) : null}

      {/* Dokumen ikut pengiriman formulir lewat input tersembunyi. Server tetap
          membersihkannya lagi — nilai ini datang dari peramban. */}
      <input type="hidden" name={name} value={json} readOnly />
    </div>
  );
}
