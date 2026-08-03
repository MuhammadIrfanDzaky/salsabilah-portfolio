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
    heading: { levels: [2, 3] },
    // Judul artikel adalah satu-satunya H1 di halaman. Membiarkan editor
    // membuat H1 lagi merusak hierarki heading yang dinilai pembaca layar.
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

  function pasangTautan() {
    const sekarang = editor.getAttributes("link").href as string | undefined;
    const isi = window.prompt("Alamat tautan (kosongkan untuk melepas):", sekarang ?? "https://");
    if (isi === null) return;

    const bersih = isi.trim();
    if (bersih === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:|\/)/i.test(bersih)) {
      window.alert("Alamat harus diawali https://, http://, mailto:, atau /");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: bersih }).run();
  }

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

      <Tombol label="Subjudul" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Tombol>
      <Tombol label="Sub-subjudul" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </Tombol>
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

      <Tombol label="Tautan" active={editor.isActive("link")} onClick={pasangTautan}>
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
      <Tombol label="Tambah baris" disabled={!editor.can().addRowAfter()} onClick={() => editor.chain().focus().addRowAfter().run()}>
        +baris
      </Tombol>
      <Tombol label="Tambah kolom" disabled={!editor.can().addColumnAfter()} onClick={() => editor.chain().focus().addColumnAfter().run()}>
        +kolom
      </Tombol>
      <Tombol label="Hapus tabel" disabled={!editor.can().deleteTable()} onClick={() => editor.chain().focus().deleteTable().run()}>
        ▦×
      </Tombol>

      <Pemisah />

      <Tombol label="Urungkan" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </Tombol>
      <Tombol label="Ulangi" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </Tombol>
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
