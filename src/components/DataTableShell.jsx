export default function DataTableShell({
  title,
  subtitle,
  toolbar,
  children,
  footer,
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
            ) : null}
          </div>
          {toolbar ? <div>{toolbar}</div> : null}
        </div>
      </div>

      <div className="overflow-x-auto">{children}</div>

      {footer ? (
        <div className="border-t border-neutral-200 px-6 py-4">{footer}</div>
      ) : null}
    </div>
  );
}
