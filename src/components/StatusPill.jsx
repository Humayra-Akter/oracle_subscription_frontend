import { cn } from "../utils/ui";

const tones = {
  success:
    "border-emerald-200/80 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/60",
  warning:
    "border-amber-200/80 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100/60",
  error: "border-red-200/80 bg-red-50 text-red-700 shadow-sm shadow-red-100/60",
  info: "border-sky-200/80 bg-sky-50 text-sky-700 shadow-sm shadow-sky-100/60",
  neutral:
    "border-zinc-200 bg-zinc-50 text-zinc-700 shadow-sm shadow-zinc-100/70",
  dark: "border-zinc-800 bg-zinc-950 text-white shadow-sm shadow-black/20",
};

export default function StatusPill({
  value,
  type = "neutral",
  size = "md",
  dot = false,
}) {
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-2 py-1 text-xs",
    lg: "px-2 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold tracking-[0.02em] w-28 justify-center",
        tones[type] || tones.neutral,
        sizes[size],
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {value}
    </span>
  );
}
