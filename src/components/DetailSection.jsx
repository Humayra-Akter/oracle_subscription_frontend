export function DetailSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DetailGrid({ children }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
  );
}

export function DetailItem({ label, value, fullWidth = false }) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white px-4 py-4 ${
        fullWidth ? "md:col-span-2 xl:col-span-3" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <div className="mt-2 text-sm font-medium text-black break-words">
        {value || "-"}
      </div>
    </div>
  );
}
