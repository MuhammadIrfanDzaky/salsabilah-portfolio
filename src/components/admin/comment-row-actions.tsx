"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteComment, restoreComment } from "@/app/admin/(dasbor)/komentar/actions";
import { adminCopy } from "@/data/admin-copy";
import type { ActionResult } from "@/lib/admin/guard";

function Submit({ label, danger }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center rounded-full border bg-surface px-3.5 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60 ${
        danger ? "border-accent-strong/50 text-accent-strong" : "border-line text-ink"
      }`}
    >
      {pending ? adminCopy.editor.saving : label}
    </button>
  );
}

export function CommentRowActions({ commentId, deleted }: { commentId: string; deleted: boolean }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    deleted ? restoreComment : deleteComment,
    null,
  );

  return (
    <div className="flex flex-col items-start gap-1.5">
      <form action={formAction}>
        <input type="hidden" name="commentId" value={commentId} />
        <Submit
          label={deleted ? adminCopy.moderation.restore : adminCopy.moderation.delete}
          danger={!deleted}
        />
      </form>
      {state ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={`m-0 text-[12px] ${state.ok ? "text-muted" : "font-semibold text-accent-strong"}`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
