import React from "react";

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-500">
        Showing {start}-{end} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <span className="px-3 text-sm text-neutral-600">
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
