import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full px-6 py-8">
          <div
            className={`mx-auto overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl ${width}`}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold text-black">{title}</h2>
                {subtitle ? (
                  <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-black transition hover:bg-neutral-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
