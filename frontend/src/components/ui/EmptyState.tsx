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
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Tidak Ada Tugas yang Cocok
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-5 font-medium">
          Tidak ditemukan tugas dengan kriteria filter atau pencarian Anda. Coba atur ulang filter atau kata kunci pencarian.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            Reset Semua Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-4">
        <ClipboardList className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        Belum Ada Tugas
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 font-medium">
        Mulai atur pekerjaan Anda dengan membuat tugas pertama Anda sekarang.
      </p>
      {onAddNew && (
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Buat Tugas Baru
        </button>
      )}
    </div>
  );
}
