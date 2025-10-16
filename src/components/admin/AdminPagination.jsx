import React from "react";

const AdminPagination = ({ page, totalPages, onPageChange }) => {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
      <div>
        Page <span className="font-semibold text-gray-900">{page}</span> of
        <span className="font-semibold text-gray-900"> {totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => hasPrev && onPageChange(page - 1)}
          disabled={!hasPrev}
          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => hasNext && onPageChange(page + 1)}
          disabled={!hasNext}
          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
