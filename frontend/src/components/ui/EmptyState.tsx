import React from "react";
import { ClipboardList, Plus, SearchX } from "lucide-react";

interface EmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onAddNew?: () => void;
}

export function EmptyState({
  isFiltered = false,
  onResetFilters,
  onAddNew,
}: EmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          Tidak Ada Tugas yang Cocok
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
          Tidak ditemukan tugas dengan kriteria filter atau pencarian Anda. Coba reset filter atau ubah kata kunci.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-sm font-medium rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-colors"
          >
            Reset Semua Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
        <ClipboardList className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        Belum Ada Tugas
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        Mulai atur pekerjaan Anda dengan membuat tugas pertama Anda sekarang.
      </p>
      {onAddNew && (
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Buat Tugas Baru
        </button>
      )}
    </div>
  );
}
