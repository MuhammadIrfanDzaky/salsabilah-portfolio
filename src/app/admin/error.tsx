"use client";

import { useEffect } from "react";
import { adminCopy } from "@/data/admin-copy";

/**
 * Batas kesalahan dasbor (competency 46).
 *
 * Pesan aslinya tidak ditampilkan: `error.message` dari Server Component sudah
 * disamarkan Next di produksi, tapi menampilkannya tetap tidak berguna bagi
 * Salsabilah dan bisa membocorkan bentuk skema kalau kelak ada yang lolos.
 * `digest` ditampilkan karena itulah satu-satunya cara mencocokkan layar ini
 * dengan baris log di Vercel.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-[46ch]">
        <p className="m-0 mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-accent-strong">
          {adminCopy.brand}
        </p>
        <h1 className="m-0 mb-3 font-serif text-[28px] font-semibold leading-tight text-ink">
          {adminCopy.error.title}
        </h1>
        <p className="m-0 mb-6 text-muted">{adminCopy.error.body}</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-full bg-accent-strong px-6 py-3 text-[15px] font-semibold text-on-accent transition-opacity hover:opacity-85"
        >
          {adminCopy.error.retry}
        </button>
        {error.digest ? (
          <p className="mt-6 font-mono text-[11px] tracking-[0.08em] text-muted">
            digest: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
