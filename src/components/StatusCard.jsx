import { CheckCircle2, AlertCircle, Clock3, RefreshCw } from "lucide-react";

const STATUS_STYLES = {
  success: {
    border: "border-green-200 shadow-sm",
    bg: "bg-gradient-to-br from-green-50 to-emerald-100",
    text: "text-emerald-800",
    sub: "text-emerald-600",
    icon: <CheckCircle2 size={18} />,
  },
  error: {
    border: "border-red-200 shadow-sm",
    bg: "bg-gradient-to-br from-red-50 to-rose-100",
    text: "text-red-700",
    sub: "text-red-600",
    icon: <AlertCircle size={18} />,
  },
  warning: {
    border: "border-amber-200 shadow-sm",
    bg: "bg-gradient-to-br from-yellow-50 to-amber-100",
    text: "text-yellow-800",
    sub: "text-yellow-600",
    icon: <Clock3 size={18} />,
  },
  processing: {
    border: "border-amber-200 shadow-sm",
    bg: "bg-gradient-to-br from-yellow-50 to-amber-100",
    text: "text-yellow-800",
    sub: "text-yellow-600",
    icon: <RefreshCw size={18} className="animate-spin" />,
  },
  default: {
    border: "border-neutral-200 shadow-sm",
    bg: "bg-gradient-to-br from-black/5 to-black/10",
    text: "text-black",
    sub: "text-neutral-600",
    icon: null,
  },
};

export default function StatusCard({
  title,
  value,
  subtitle,
  status = "default",
}) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.default;

  return (
    <div className={`rounded-xl border p-5 ${style.border} ${style.bg}`}>
      {/* Top row */}
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${style.sub}`}>{title}</p>
        {style.icon && <div className={`${style.text}`}>{style.icon}</div>}
      </div>

      {/* Value */}
      <h3 className={`mt-3 text-3xl font-semibold ${style.text}`}>{value}</h3>

      {/* Subtitle */}
      {subtitle && <p className={`mt-2 text-sm ${style.sub}`}>{subtitle}</p>}
    </div>
  );
}
