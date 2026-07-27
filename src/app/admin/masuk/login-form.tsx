"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adminCopy } from "@/data/admin-copy";
import type { ActionResult } from "@/lib/admin/guard";
import { signIn } from "./actions";

const inputClasses =
  "w-full box-border rounded-[10px] border border-line bg-surface px-3.5 py-3 text-[15px] text-ink transition-colors focus:border-accent-strong focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 text-[15px] font-semibold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
    >
      {pending ? adminCopy.login.submitting : adminCopy.login.submit}
    </button>
  );
}

export function LoginForm({ lanjut }: { lanjut: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(signIn, null);
  const failed = state && !state.ok ? state.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lanjut" value={lanjut} />

      {/*
        role="alert" supaya pembaca layar mengumumkan kegagalan tanpa perlu
        memindahkan fokus, dan aria-describedby di bawah menautkannya ke kedua
        isian — pesannya memang tentang pasangan email + kata sandi, bukan
        salah satunya.
      */}
      {failed ? (
        <p
          id="masuk-error"
          role="alert"
          className="m-0 rounded-[10px] border border-accent-strong/40 bg-accent/10 px-3.5 py-3 text-[14px] text-ink"
        >
          {failed}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="masuk-email"
          className="mb-1.5 block text-[13px] font-semibold tracking-[0.02em] text-ink"
        >
          {adminCopy.login.email}
        </label>
        <input
          id="masuk-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          aria-invalid={failed ? true : undefined}
          aria-describedby={failed ? "masuk-error" : undefined}
          placeholder={adminCopy.login.emailPlaceholder}
          className={inputClasses}
        />
      </div>

      <div>
        <label
          htmlFor="masuk-password"
          className="mb-1.5 block text-[13px] font-semibold tracking-[0.02em] text-ink"
        >
          {adminCopy.login.password}
        </label>
        <input
          id="masuk-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={failed ? true : undefined}
          aria-describedby={failed ? "masuk-error" : undefined}
          className={inputClasses}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
