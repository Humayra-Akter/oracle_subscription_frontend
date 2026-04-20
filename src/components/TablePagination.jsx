import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils/ui";

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = [];
  const from = Math.max(1, page - 1);
  const to = Math.min(safeTotalPages, page + 1);

  for (let i = from; i <= to; i += 1) pages.push(i);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-700">
          Showing {start}-{end} of {totalItems}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Clean pagination for large operational datasets
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-zinc-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        {page > 2 && safeTotalPages > 3 ? (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              1
            </button>
            {page > 3 ? <span className="px-1 text-zinc-400">…</span> : null}
          </>
        ) : null}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition",
              p === page
                ? "border-black bg-indigo-700 text-white shadow-md"
                : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
            )}
          >
            {p}
          </button>
        ))}

        {page < safeTotalPages - 1 && safeTotalPages > 3 ? (
          <>
            {page < safeTotalPages - 2 ? (
              <span className="px-1 text-indigo-400">…</span>
            ) : null}
            <button
              type="button"
              onClick={() => onPageChange(safeTotalPages)}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              {safeTotalPages}
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
