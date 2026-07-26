import { Fragment } from "react";

/**
 * Minimal, deliberately un-clever article renderer.
 *
 * It supports paragraphs, `## ` headings and `*emphasis*` — nothing else, and
 * critically it never touches `dangerouslySetInnerHTML`. Everything becomes a
 * React element, so React escapes the text for us and stored content can never
 * turn into markup (competency 27 — the non-negotiable for +public-ugc).
 *
 * A full markdown pipeline can replace this later; it would need its own
 * sanitiser, which is exactly the risk being avoided for now.
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
