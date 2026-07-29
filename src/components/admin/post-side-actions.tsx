"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field, inputClasses } from "@/components/admin/field";
import { adminCopy } from "@/data/admin-copy";
import {
  archivePost,
  deletePostPermanently,
  generateTranslationDraft,
  markTranslationReviewed,
  restorePost,
  unpublish,
} from "@/app/admin/(dasbor)/artikel/actions";
import type { ActionResult } from "@/lib/admin/guard";
import type { PostStatus } from "@/lib/admin/status";

/**
 * Aksi di luar penyimpanan isi artikel.
 *
 * Dipisahkan dari <PostForm> karena HTML tidak mengizinkan formulir bersarang,
 * dan masing-masing aksi ini memanggil Server Action-nya sendiri.
 */

function Submit({
  label,
  variant = "ghost",
  busy,
}: {
  label: string;
  variant?: "ghost" | "danger";
  /** Label saat berjalan. Terjemahan bisa memakan puluhan detik — "Menyimpan…" akan menyesatkan. */
  busy?: string;
}) {
  const { pending } = useFormStatus();
  const classes =
    variant === "danger"
      ? "border border-accent-strong/50 text-accent-strong"
      : "border border-line text-ink";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center rounded-full bg-surface px-4 py-2 text-[14px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60 ${classes}`}
    >
      {pending ? (busy ?? adminCopy.editor.saving) : label}
    </button>
  );
}

function Pesan({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`m-0 mt-2 text-[13px] ${state.ok ? "text-muted" : "font-semibold text-accent-strong"}`}
    >
      {state.message}
    </p>
  );
}

export function TranslationPanel({
  postId,
  translationStatus,
  showSourceEditedWarning,
  canGenerate,
}: {
  postId: string;
  translationStatus: string;
  showSourceEditedWarning: boolean;
  canGenerate: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    markTranslationReviewed,
    null,
  );
  const [draftState, draftAction] = useActionState<ActionResult | null, FormData>(
    generateTranslationDraft,
    null,
  );
  const reviewed = translationStatus === "reviewed";

  return (
    <section className="rounded-[14px] border border-line bg-surface p-6">
      <h2 className="m-0 mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
        {adminCopy.editor.groupTranslation}
      </h2>

      <p className="m-0 mb-4 text-[14px] text-ink">
        {reviewed ? adminCopy.editor.translationReviewed : adminCopy.editor.translationPending}
      </p>

      {showSourceEditedWarning ? (
        <p className="m-0 mb-4 rounded-[10px] border border-accent-strong/40 bg-accent/10 px-3.5 py-2.5 text-[13px] text-ink">
          {adminCopy.editor.sourceEditedWarning}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {!reviewed ? (
          <form action={formAction}>
            <input type="hidden" name="postId" value={postId} />
            <Submit label={adminCopy.editor.markReviewed} />
          </form>
        ) : null}

        {canGenerate ? (
          <form action={draftAction}>
            <input type="hidden" name="postId" value={postId} />
            <Submit label={adminCopy.editor.generateDraft} busy={adminCopy.editor.generateDraftBusy} />
          </form>
        ) : (
          <button
            type="button"
            disabled
            title={adminCopy.editor.generateDraftBlocked}
            className="inline-flex cursor-not-allowed items-center rounded-full border border-line bg-surface px-4 py-2 text-[14px] text-muted opacity-60"
          >
            {adminCopy.editor.generateDraft}
          </button>
        )}
      </div>

      <p className="m-0 mt-2 text-[12.5px] leading-relaxed text-muted">
        {canGenerate ? adminCopy.editor.generateDraftHint : adminCopy.editor.generateDraftBlocked}
      </p>
      <Pesan state={draftState} />
      <Pesan state={state} />
    </section>
  );
}

export function LifecyclePanel({
  postId,
  slug,
  status,
}: {
  postId: string;
  slug: string;
  status: PostStatus;
}) {
  const [unpublishState, unpublishAction] = useActionState<ActionResult | null, FormData>(
    unpublish,
    null,
  );
  const [archiveState, archiveAction] = useActionState<ActionResult | null, FormData>(
    archivePost,
    null,
  );
  const [restoreState, restoreAction] = useActionState<ActionResult | null, FormData>(
    restorePost,
    null,
  );
  const [deleteState, deleteAction] = useActionState<ActionResult | null, FormData>(
    deletePostPermanently,
    null,
  );

  const archived = status === "archived";
  const live = status === "published" || status === "scheduled";

  return (
    <section className="rounded-[14px] border border-line bg-surface p-6">
      <h2 className="m-0 mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
        Daur hidup
      </h2>

      <div className="flex flex-wrap gap-3">
        {live ? (
          <form action={unpublishAction}>
            <input type="hidden" name="postId" value={postId} />
            <Submit label={adminCopy.editor.unpublish} />
          </form>
        ) : null}

        {!archived ? (
          <form action={archiveAction}>
            <input type="hidden" name="postId" value={postId} />
            <Submit label={adminCopy.editor.archive} />
          </form>
        ) : (
          <form action={restoreAction}>
            <input type="hidden" name="postId" value={postId} />
            <Submit label={adminCopy.editor.restore} />
          </form>
        )}
      </div>

      <Pesan state={unpublishState} />
      <Pesan state={archiveState} />
      <Pesan state={restoreState} />

      {/* Hapus permanen hanya muncul untuk artikel yang sudah diarsipkan —
          urutan yang membuat penghancuran data selalu butuh dua langkah sadar. */}
      {archived ? (
        <div className="mt-6 border-t border-line pt-6">
          <p className="m-0 mb-4 text-[13px] leading-relaxed text-muted">
            {adminCopy.editor.deleteWarning}
          </p>
          <form action={deleteAction} className="flex flex-col gap-3">
            <input type="hidden" name="postId" value={postId} />
            <Field
              id="konfirmasiSlug"
              label={adminCopy.editor.deleteConfirmLabel}
              hint={slug}
              error={deleteState && !deleteState.ok ? deleteState.fields?.konfirmasiSlug : undefined}
            >
              {(props) => (
                <input
                  {...props}
                  name="konfirmasiSlug"
                  type="text"
                  autoComplete="off"
                  className={`${inputClasses} font-mono`}
                />
              )}
            </Field>
            <div>
              <Submit label={adminCopy.editor.deleteForever} variant="danger" />
            </div>
            <Pesan state={deleteState} />
          </form>
        </div>
      ) : null}
    </section>
  );
}
