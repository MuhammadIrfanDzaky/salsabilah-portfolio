import { Fragment, type ReactNode } from "react";
import type { Doc, DocMark, DocNode } from "@/lib/doc";
import type { Locale } from "@/lib/i18n";

/**
 * Renderer dokumen isi artikel.
 *
 * Menggantikan `<PostBody>` berbasis teks polos. Yang **tidak** berubah adalah
 * hal terpentingnya: nol `dangerouslySetInnerHTML`. Dokumen datang sebagai
 * pohon bertipe, dan setiap tipe dipetakan ke elemen React di sini — jadi teks
 * apa pun yang tersimpan tetap di-escape React, dan node yang tidak dikenali
 * tidak punya cabang untuk dirender.
 *
 * Bersama `sanitizeDoc()` di sisi simpan, ini dua lapis yang saling menutup:
 * yang satu menolak node asing sebelum masuk database, yang satu tidak punya
 * cara merendernya seandainya lolos.
 *
 * Dipakai halaman publik maupun pratinjau dasbor — komponen yang sama, supaya
 * yang dilihat Salsabilah saat menulis benar-benar yang akan terbit.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Path Storage → URL publik. Nilai yang sudah berupa URL dibiarkan apa adanya. */
function imageUrl(src: string): string {
  if (src.startsWith("/") || src.startsWith("http") || src.startsWith("blob:")) return src;
  return `${SUPABASE_URL}/storage/v1/object/public/post-covers/${src}`;
}

/** Membungkus teks dengan mark-nya, dari dalam ke luar. */
function withMarks(text: string, marks: DocMark[] | undefined, key: string): ReactNode {
  if (!marks || marks.length === 0) return text;

  return marks.reduce<ReactNode>((isi, mark, i) => {
    const k = `${key}-m${i}`;
    switch (mark.type) {
      case "bold":
        return <strong key={k}>{isi}</strong>;
      case "italic":
        return <em key={k}>{isi}</em>;
      case "underline":
        return <u key={k}>{isi}</u>;
      case "strike":
        return <s key={k}>{isi}</s>;
      case "subscript":
        return <sub key={k}>{isi}</sub>;
      case "superscript":
        return <sup key={k}>{isi}</sup>;
      case "link":
        // `rel` lengkap karena href-nya bisa menunjuk ke mana saja. `noopener`
        // menutup akses `window.opener` dari halaman tujuan.
        return (
          <a
            key={k}
            href={mark.attrs.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-ink underline decoration-accent-strong/50 underline-offset-2 hover:decoration-accent-strong"
          >
            {isi}
          </a>
        );
      default:
        return isi;
    }
  }, text);
}

function renderNodes(nodes: DocNode[] | undefined, locale: Locale, prefix: string): ReactNode[] {
  return (nodes ?? []).map((node, i) => renderNode(node, locale, `${prefix}-${i}`));
}

function renderNode(node: DocNode, locale: Locale, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return <Fragment key={key}>{withMarks(node.text ?? "", node.marks, key)}</Fragment>;

    case "hardBreak":
      return <br key={key} />;

    case "paragraph":
      return (
        <p key={key} className="m-0 text-[17px] leading-[1.75] text-ink/90 [text-wrap:pretty]">
          {renderNodes(node.content, locale, key)}
        </p>
      );

    case "heading": {
      const level = node.attrs?.level === 3 ? 3 : 2;
      const Tag = level === 3 ? "h3" : "h2";
      const size = level === 3 ? "text-[clamp(19px,2.4vw,22px)]" : "text-[clamp(22px,3vw,28px)]";
      return (
        <Tag
          key={key}
          className={`mb-0 mt-4 font-serif ${size} font-semibold leading-[1.25] text-ink`}
        >
          {renderNodes(node.content, locale, key)}
        </Tag>
      );
    }

    case "bulletList":
      return (
        <ul key={key} className="m-0 flex list-disc flex-col gap-2 pl-6">
          {renderNodes(node.content, locale, key)}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="m-0 flex list-decimal flex-col gap-2 pl-6">
          {renderNodes(node.content, locale, key)}
        </ol>
      );

    case "listItem":
      return (
        <li key={key} className="text-[17px] leading-[1.75] text-ink/90 [text-wrap:pretty]">
          {/* Isi <li> adalah paragraf; margin-nya dinolkan lewat kelas paragraf
              itu sendiri, jadi tidak ada jarak ganda di dalam butir. */}
          {renderNodes(node.content, locale, key)}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="m-0 flex flex-col gap-3 border-l-2 border-accent-strong/40 pl-5 text-ink/80 italic"
        >
          {renderNodes(node.content, locale, key)}
        </blockquote>
      );

    case "horizontalRule":
      return <hr key={key} className="my-2 border-0 border-t border-line" />;

    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      if (!src) return null;
      const alt =
        (locale === "en" ? node.attrs?.altEn : node.attrs?.altId) ?? node.attrs?.altId ?? "";
      return (
        <figure key={key} className="m-0 flex flex-col gap-2">
          <div className="overflow-hidden rounded-[12px] border border-line">
            {/* <img> biasa, bukan next/image: tinggi gambar dalam isi tidak
                diketahui sebelum dimuat, dan memaksa rasio tetap akan memotong
                grafik atau tabel foto yang justru jadi isi informasinya. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(src)}
              alt={typeof alt === "string" ? alt : ""}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </div>
          {typeof alt === "string" && alt ? (
            <figcaption className="m-0 text-[13.5px] leading-relaxed text-muted">{alt}</figcaption>
          ) : null}
        </figure>
      );
    }

    case "table":
      return (
        // Tabel lebar tidak boleh membuat seluruh halaman bergeser horizontal;
        // yang menggulung adalah pembungkusnya, bukan badan halaman.
        <div key={key} className="-mx-1 overflow-x-auto px-1">
          <table className="w-full border-collapse text-[15.5px]">
            <tbody>{renderNodes(node.content, locale, key)}</tbody>
          </table>
        </div>
      );

    case "tableRow":
      return <tr key={key}>{renderNodes(node.content, locale, key)}</tr>;

    case "tableHeader":
      return (
        <th
          key={key}
          scope="col"
          className="border border-line bg-surface px-3 py-2 text-left align-top font-semibold text-ink"
        >
          {renderNodes(node.content, locale, key)}
        </th>
      );

    case "tableCell":
      return (
        <td key={key} className="border border-line px-3 py-2 align-top text-ink/90">
          {renderNodes(node.content, locale, key)}
        </td>
      );

    default:
      // Tipe tak dikenal tidak dirender. Bersama daftar putih di
      // `sanitizeDoc()`, ini lapis kedua yang membuat node asing tidak punya
      // jalan ke layar pembaca.
      return null;
  }
}

export function PostDoc({ doc, locale }: { doc: Doc; locale: Locale }) {
  return <div className="flex flex-col gap-5">{renderNodes(doc.content, locale, "n")}</div>;
}
