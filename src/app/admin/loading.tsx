import { adminCopy } from "@/data/admin-copy";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <p className="m-0 font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
        {adminCopy.loading}
      </p>
    </div>
  );
}
