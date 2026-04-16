import { X } from "lucide-react";

export default function DataModal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.42)] backdrop-blur-[6px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-white/70 bg-white shadow-md">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-6 py-5 backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase  text-zinc-400">
                Detail View
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
                {title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[78vh] overflow-y-auto px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
