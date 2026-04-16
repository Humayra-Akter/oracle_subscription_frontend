import {
  CheckCircle2,
  AlertTriangle,
  Clock3,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "../utils/ui";

const cardTone = {
  default: {
    shell:
      "border-zinc-200/80 bg-gradient-to-br from-zinc-100 to-slate-200 shadow-md",
    badge: "bg-slate-100 text-zinc-700 border-zinc-200",
    title: "text-zinc-600",
    value: "text-zinc-800",
    subtitle: "text-zinc-600",
    icon: null,
  },
  success: {
    shell:
      "border-emerald-200/80 bg-gradient-to-br from-green-50 to-emerald-100 shadow-md",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    title: "text-emerald-700",
    value: "text-emerald-800",
    subtitle: "text-emerald-700/80",
    icon: <CheckCircle2 size={16} />,
  },
  warning: {
    shell:
      "border-amber-200/80 bg-gradient-to-br from-amber-50 to-yellow-100 shadow-md",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    title: "text-amber-700",
    value: "text-amber-800",
    subtitle: "text-amber-700/80",
    icon: <Clock3 size={16} />,
  },
  error: {
    shell:
      "border-red-200/80 bg-gradient-to-br from-red-50 to-rose-100 shadow-md",
    badge: "bg-red-100 text-red-700 border-red-200",
    title: "text-red-700",
    value: "text-red-800",
    subtitle: "text-red-700/80",
    icon: <ShieldAlert size={16} />,
  },
  processing: {
    shell:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-indigo-50 shadow-md",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    title: "text-sky-700",
    value: "text-sky-800",
    subtitle: "text-sky-700/80",
    icon: <AlertTriangle size={16} />,
  },
};

export default function StatusCard({
  title,
  value,
  subtitle,
  status = "default",
}) {
  const tone = cardTone[status] || cardTone.default;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border py-3 px-5 transition duration-300 hover:-translate-y-[1px]",
        tone.shell,
      )}
    >
      {/* <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" /> */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn("text-xl font-semibold", tone.title)}>{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <h3 className={cn("text-3xl font-bold tracking-tight", tone.value)}>
              {value}
            </h3>
          </div>
        </div>

        <div
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full border",
            tone.badge,
          )}
        >
          {tone.icon || <ArrowUpRight size={16} />}
        </div>
      </div>

      {subtitle ? (
        <p className={cn("mt-2 text-sm", tone.subtitle)}>{subtitle}</p>
      ) : null}
    </div>
  );
}
