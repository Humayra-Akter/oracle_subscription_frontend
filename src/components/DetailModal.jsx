import { X } from "lucide-react";
import { cn } from "../utils/ui";

export default function DetailModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  width = "max-w-6xl",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.46)] backdrop-blur-[8px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 overflow-y-auto px-8 py-10">
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-xl border border-white/60 bg-white shadow-md",
            width,
          )}
        >
          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
            <div className="flex items-start justify-between gap-4 px-7 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Detailed Record
                </p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-800">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white transition hover:bg-red-50"
              >
                <X size={20} className="text-red-700" />
              </button>
            </div>
          </div>

          <div className="px-7 py-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
