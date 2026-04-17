import { cn } from "../utils/ui";

export default function DataTableShell({
  title,
  subtitle,
  toolbar,
  children,
  footer,
  rightActions,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
      <div className="border-b border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] px-6 py-3">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex rounded-full border border-zinc-300 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase text-zinc-600">
              Operational Grid
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-indigo-700">
              {title}
            </h2>

            {subtitle ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                {subtitle}
              </p>
            ) : null}
          </div>

          {rightActions ? <div>{rightActions}</div> : null}
        </div>

        {toolbar ? <div className="mt-5">{toolbar}</div> : null}
      </div>

      <div className="overflow-x-auto">{children}</div>

      {footer ? (
        <div className="border-t border-zinc-200 bg-slate-50/80 px-6 py-4">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
