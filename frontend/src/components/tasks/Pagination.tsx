import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs text-xs text-slate-600 font-medium">
      {/* Items Range & Limit Selector */}
      <div className="flex items-center gap-3">
        <span>
          Menampilkan <span className="font-bold text-slate-900">{startItem}</span>-
          <span className="font-bold text-slate-900">{endItem}</span> dari{" "}
          <span className="font-bold text-slate-900">{total}</span> tugas
        </span>

        <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
          <span>Baris:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-xs"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Sebelumnya"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Buttons */}
        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 5) return true;
              return Math.abs(p - page) <= 1 || p === 1 || p === totalPages;
            })
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;

              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition-all ${
                      p === page
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Selanjutnya"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
