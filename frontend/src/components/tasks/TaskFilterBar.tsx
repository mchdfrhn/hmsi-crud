import React from "react";
import { Search, LayoutGrid, Table, Plus, RotateCcw, X, ArrowUpDown, Clock } from "lucide-react";

interface TaskFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  assignee: string;
  onAssigneeChange: (value: string) => void;
  onResetFilters: () => void;
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
  onOpenCreateModal: () => void;
  totalTasks: number;
  isOverdueFilter?: boolean;
  onToggleOverdueFilter?: () => void;
  sortBy?: string;
  onSortByChange?: (val: string) => void;
}

export function TaskFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  onResetFilters,
  viewMode,
  onViewModeChange,
  onOpenCreateModal,
  totalTasks,
  isOverdueFilter = false,
  onToggleOverdueFilter,
  sortBy = "created_at",
  onSortByChange,
}: TaskFilterBarProps) {
  const isAnyFilterActive =
    Boolean(search) ||
    (status && status !== "All") ||
    (priority && priority !== "All") ||
    Boolean(assignee) ||
    isOverdueFilter;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Top row: Search and Action Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar with Clear Button */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onSearchChange("");
            }}
            placeholder="Cari judul tugas..."
            className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
              title="Bersihkan pencarian"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher & Create Task Button */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => onViewModeChange("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Tampilan Tabel"
            >
              <Table className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Tampilan Kartu / Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tugas</span>
          </button>
        </div>
      </div>

      {/* Middle row: Filter Dropdowns, Sort, and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Status:
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-xs"
            >
              <option value="All">Semua Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Prioritas:
            </label>
            <select
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-xs"
            >
              <option value="All">Semua Prioritas</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Assignee Filter with Clear Button */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Assignee:
            </label>
            <div className="relative">
              <input
                type="text"
                value={assignee}
                onChange={(e) => onAssigneeChange(e.target.value)}
                placeholder="Cari nama..."
                className="text-xs pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 w-28 focus:w-36 transition-all focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
              {assignee && (
                <button
                  onClick={() => onAssigneeChange("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label="Clear assignee filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Sort By Dropdown */}
          {onSortByChange && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-xs font-semibold text-slate-600">
                Urutkan:
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-xs"
              >
                <option value="created_at">Terbaru</option>
                <option value="due_date">Tenggat Waktu</option>
                <option value="title">Judul (A-Z)</option>
              </select>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 hidden md:block font-medium">
          Ditemukan <span className="font-bold text-slate-800">{totalTasks}</span> tugas
        </div>
      </div>

      {/* Active Filter Badges / Chips */}
      {isAnyFilterActive && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Filter Aktif:</span>

          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              Judul: &quot;{search}&quot;
              <button onClick={() => onSearchChange("")} className="hover:text-slate-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {status !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              Status: {status}
              <button onClick={() => onStatusChange("All")} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {priority !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium">
              Prioritas: {priority}
              <button onClick={() => onPriorityChange("All")} className="hover:text-orange-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {assignee && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              Assignee: {assignee}
              <button onClick={() => onAssigneeChange("")} className="hover:text-slate-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {isOverdueFilter && onToggleOverdueFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
              <Clock className="w-3 h-3 text-rose-600" />
              Overdue
              <button onClick={onToggleOverdueFilter} className="hover:text-rose-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-md hover:bg-rose-50 border border-rose-100 transition-colors ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Semua
          </button>
        </div>
      )}
    </div>
  );
}
