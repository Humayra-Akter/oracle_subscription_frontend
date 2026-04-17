import {
  CheckCircle2,
  AlertTriangle,
  Clock3,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { cn } from "../utils/ui";

const cardTone = {
  default: {
    shell:
      "border-indigo-100/70 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50 shadow-sm hover:shadow-md hover:border-indigo-200/80",
    glow: "from-indigo-400/10 via-violet-400/10 to-transparent",
    rail: "bg-indigo-400/70",
    badge:
      "border-indigo-100 bg-white/90 text-indigo-700 shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50",
    overline: "text-slate-500",
    title: "text-slate-700",
    value: "text-slate-950",
    subtitle: "text-slate-500",
    icon: <ArrowUpRight size={16} />,
  },
  success: {
    shell:
      "border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/40 shadow-sm hover:shadow-md hover:border-emerald-200/90",
    glow: "from-emerald-400/15 via-teal-300/10 to-transparent",
    rail: "bg-emerald-500",
    badge:
      "border-emerald-100 bg-white/90 text-emerald-700 shadow-sm group-hover:border-emerald-200 group-hover:bg-emerald-50",
    overline: "text-emerald-700",
    title: "text-slate-700",
    value: "text-slate-950",
    subtitle: "text-slate-500",
    icon: <CheckCircle2 size={16} />,
  },
  warning: {
    shell:
      "border-amber-100/80 bg-gradient-to-br from-white via-amber-50/60 to-yellow-50/40 shadow-sm hover:shadow-md hover:border-amber-200/90",
    glow: "from-amber-400/15 via-yellow-300/10 to-transparent",
    rail: "bg-amber-500",
    badge:
      "border-amber-100 bg-white/90 text-amber-700 shadow-sm group-hover:border-amber-200 group-hover:bg-amber-50",
    overline: "text-amber-700",
    title: "text-slate-700",
    value: "text-slate-950",
    subtitle: "text-slate-500",
    icon: <Clock3 size={16} />,
  },
  error: {
    shell:
      "border-red-100/80 bg-gradient-to-br from-white via-red-50/60 to-rose-50/40 shadow-sm hover:shadow-md hover:border-red-200/90",
    glow: "from-red-400/15 via-rose-300/10 to-transparent",
    rail: "bg-red-500",
    badge:
      "border-red-100 bg-white/90 text-red-700 shadow-sm group-hover:border-red-200 group-hover:bg-red-50",
    overline: "text-red-700",
    title: "text-slate-700",
    value: "text-slate-950",
    subtitle: "text-slate-500",
    icon: <ShieldAlert size={16} />,
  },
  processing: {
    shell:
      "border-amber-100/80 bg-gradient-to-br from-white via-amber-50/60 to-yellow-50/40 shadow-sm hover:shadow-md hover:border-amber-200/90",
    glow: "from-amber-400/15 via-yellow-300/10 to-transparent",
    rail: "bg-amber-500",
    badge:
      "border-amber-100 bg-white/90 text-amber-700 shadow-sm group-hover:border-amber-200 group-hover:bg-amber-50",
    overline: "text-amber-700",
    title: "text-slate-700",
    value: "text-slate-950",
    subtitle: "text-slate-500",
    icon: <Clock3 size={16} />,
  },
  info: {
    shell:
      "border-sky-100/80 bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/40 shadow-sm hover:shadow-md hover:border-sky-200/90",
    glow: "from-sky-400/15 via-indigo-300/10 to-transparent",
    rail: "bg-sky-500",
    badge:
      "border-sky-100 bg-white/90 text-sky-700 shadow-sm group-hover:border-sky-200 group-hover:bg-sky-50",
    overline: "text-sky-700",
    title: "text-slate-700",
    value: "text-slate-950",
    subtitle: "text-slate-500",
    icon: <AlertTriangle size={16} />,
  },
};

export default function StatusCard({
  title,
  value,
  subtitle,
  status = "default",
  meta,
  trend,
  className,
}) {
  const tone = cardTone[status] || cardTone.default;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border px-5 py-4 transition-all duration-200 hover:-translate-y-[1px]",
        tone.shell,
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-1",
          tone.rail,
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl",
          tone.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "truncate text-[11px] font-bold uppercase tracking-[0.14em]",
                tone.overline,
              )}
            >
              {title}
            </p>

            {trend ? (
              <span className="inline-flex shrink-0 items-center rounded-full border border-white/70 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                {trend}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-end gap-2">
            <h3
              className={cn(
                "truncate text-3xl font-bold tracking-tight",
                tone.value,
              )}
            >
              {value}
            </h3>
          </div>

          {subtitle ? (
            <p className={cn("mt-2 text-sm", tone.subtitle)}>{subtitle}</p>
          ) : null}

          {meta ? (
            <div className="mt-3 inline-flex max-w-full items-center rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur-sm">
              <span className="truncate">{meta}</span>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
            tone.badge,
          )}
        >
          {tone.icon}
        </div>
      </div>
    </div>
  );
}
