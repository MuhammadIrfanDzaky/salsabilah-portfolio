import { Fragment } from "react";

/**
 * Minimal, deliberately un-clever article renderer.
 *
 * It supports paragraphs, `## ` headings, `- ` bullet lists and `*emphasis*` —
 * nothing else, and critically it never touches `dangerouslySetInnerHTML`.
 * Everything becomes a React element, so React escapes the text for us and
 * stored content can never turn into markup (competency 27 — the non-negotiable
 * for +public-ugc).
 *
 * A full markdown pipeline can replace this later; it would need its own
 * sanitiser, which is exactly the risk being avoided for now.
 *
 * Daftar ditambahkan 2026-07-28 karena artikel nyata pertama membutuhkannya —
 * empat pemangsa dan tiga produk olahan yang, ditulis sebagai prosa, berhenti
 * terbaca sebagai daftar. Tabel dan gambar dalam isi **sengaja tetap tidak ada**:
 * keduanya menuntut jauh lebih banyak (tabel merumitkan terjemahan per sel;
 * gambar menuntut skema, unggahan jamak, dan caption dua bahasa), dan
 * keputusannya tercatat di PROJECT-SCOPE.md.
 *
 * Awalan `- ` selamat melewati DeepL: ia teks biasa, dan `preserve_formatting`
 * menjaga barisnya. Terverifikasi lewat panggilan sungguhan.
 */

function withEmphasis(text: string, keyPrefix: string) {
  // Odd-indexed fragments sit between a matched pair of asterisks.
  return text.split(/\*([^*]+)\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <em key={`${keyPrefix}-${i}`}>{part}</em>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
    ),
  );
}

export function PostBody({ body }: { body: string }) {
  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        // Satu blok jadi daftar hanya bila **setiap** barisnya berawalan "- ".
        // Sebagian saja tidak cukup: paragraf yang kebetulan memuat tanda hubung
        // di awal satu baris tidak boleh diam-diam berubah bentuk.
        const baris = block.split("\n").map((line) => line.trim());
        if (baris.length > 0 && baris.every((line) => line.startsWith("- "))) {
          return (
            <ul key={i} className="m-0 flex list-disc flex-col gap-2 pl-6">
              {baris.map((line, j) => (
                <li key={j} className="text-[17px] leading-[1.75] text-ink/90 [text-wrap:pretty]">
                  {withEmphasis(line.slice(2), `${i}-${j}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="mb-0 mt-4 font-serif text-[clamp(22px,3vw,28px)] font-semibold leading-[1.25] text-ink"
            >
              {block.slice(3)}
            </h2>
          );
        }
        return (
          <p key={i} className="m-0 text-[17px] leading-[1.75] text-ink/90 [text-wrap:pretty]">
            {withEmphasis(block, String(i))}
          </p>
        );
      })}
    </div>
  );
}
