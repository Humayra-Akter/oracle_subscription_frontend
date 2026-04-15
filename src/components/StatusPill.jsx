export default function StatusPill({ value, type = "neutral" }) {
  const tones = {
    success: "border-green-200 bg-green-50 text-green-700",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    neutral: "border-neutral-200 bg-neutral-100 text-neutral-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tones[type]}`}
    >
      {value}
    </span>
  );
}
