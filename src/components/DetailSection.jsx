import { cn } from "../utils/ui";

export function DetailSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] p-5 shadow-md">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold uppercase text-zinc-500">{title}</h3>
          {description ? (
            <p className="mt-2 text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

export function DetailGrid({ children, cols = "grid-cols-4" }) {
  return <div className={cn("grid gap-4 grid-cols-4", cols)}>{children}</div>;
}

export function DetailItem({
  label,
  value,
  fullWidth = false,
  emphasis = false,
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm",
        fullWidth ? "col-span-3" : "",
      )}
    >
      <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
      <div
        className={cn(
          "mt-2 break-words text-sm",
          emphasis
            ? "font-semibold text-zinc-800"
            : "font-medium text-zinc-700",
        )}
      >
        {value || "-"}
      </div>
    </div>
  );
}
