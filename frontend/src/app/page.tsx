"use client";

import React, { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Task, TaskCreate, TaskUpdate } from "@/types/task";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { TaskFilterBar } from "@/components/tasks/TaskFilterBar";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskGrid } from "@/components/tasks/TaskGrid";
import { Pagination } from "@/components/tasks/Pagination";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { DeleteConfirmModal } from "@/components/tasks/DeleteConfirmModal";
import { SummaryCardSkeleton, TableRowSkeleton, GridCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

export default function HomePage() {
  const {
    tasks,
    summary,
    total,
    totalPages,
    page,
    limit,
    status,
    priority,
    assignee,
    search,
    isOverdueFilter,
    sortBy,
    isLoading,
    isSummaryLoading,
    error,
    setPage,
    setLimit,
    setStatus,
    setPriority,
    setAssignee,
    setSearch,
    setSortBy,
    toggleStatusFilter,
    toggleOverdueFilter,
    resetFilters,
    refreshTasks,
    refreshSummary,
    createTask,
    updateTask,
    quickUpdateStatus,
    deleteTask,
  } = useTasks();

  // UI view mode: "table" or "grid" (default table)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [taskToView, setTaskToView] = useState<Task | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsFormModalOpen(true);
  };

  const handleOpenViewModal = (task: Task) => {
    setTaskToView(task);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: TaskCreate | TaskUpdate) => {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, data);
    } else {
      await createTask(data as TaskCreate);
    }
  };

  const isFiltered =
    Boolean(search) ||
    (status && status !== "All") ||
    (priority && priority !== "All") ||
    Boolean(assignee) ||
    isOverdueFilter;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-tight">
                iT
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 tracking-tight">
                  iTasks
                </span>
                <span className="text-slate-300 font-light">/</span>
                <span className="text-xs font-medium text-slate-500">
                  Workspace
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-4">
              <span className="px-2.5 py-1 text-xs font-semibold text-slate-900 bg-slate-100 rounded-md">
                Tasks
              </span>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-50 transition-colors"
                title="Buka Dokumentasi Swagger API"
              >
                <span>API Docs</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </nav>
          </div>

          {/* Right: Sync Status & User Profile */}
          <div className="flex items-center gap-3">
            {/* Real-time sync status indicator */}
            <button
              onClick={() => {
                refreshTasks();
                refreshSummary();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-200/80 transition-colors shadow-xs"
              title="Klik untuk menyinkronkan data"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLoading ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                }`}
              />
              <span className="hidden sm:inline">
                {isLoading ? "Syncing..." : "Synced"}
              </span>
              <RefreshCw
                className={`w-3 h-3 text-slate-400 ml-0.5 ${
                  isLoading ? "animate-spin text-slate-600" : ""
                }`}
              />
            </button>

            {/* User Avatar */}
            <div
              className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold shadow-xs cursor-default"
              title="User Profile"
            >
              U
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6 w-full">
        {/* Dashboard Overview Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Ringkasan Dasbor
              </h2>
              <p className="text-xs text-slate-500">
                Statistik metrik dan progres pengerjaan tugas secara real-time
              </p>
            </div>
          </div>

          {isSummaryLoading && !summary ? (
            <SummaryCardSkeleton />
          ) : (
            <>
              <SummaryCards
                summary={summary}
                onSelectStatusFilter={toggleStatusFilter}
                onToggleOverdueFilter={toggleOverdueFilter}
                activeStatusFilter={status}
                isOverdueActive={isOverdueFilter}
              />
              <ProgressBar summary={summary} />
            </>
          )}
        </section>

        {/* Task Management Section */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Daftar Tugas
              </h2>
              <p className="text-xs text-slate-500">
                Kelola, cari, saring, dan perbarui tugas-tugas proyek Anda
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <TaskFilterBar
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            priority={priority}
            onPriorityChange={setPriority}
            assignee={assignee}
            onAssigneeChange={setAssignee}
            onResetFilters={resetFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenCreateModal={handleOpenCreateModal}
            totalTasks={total}
            isOverdueFilter={isOverdueFilter}
            onToggleOverdueFilter={toggleOverdueFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
              <button
                onClick={() => refreshTasks()}
                className="px-3 py-1 rounded-lg bg-rose-100 font-semibold text-xs text-rose-800 hover:bg-rose-200 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading ? (
            viewMode === "table" ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <TableRowSkeleton count={limit > 5 ? 5 : limit} />
                  </tbody>
                </table>
              </div>
            ) : (
              <GridCardSkeleton count={limit > 6 ? 6 : limit} />
            )
          ) : tasks.length === 0 ? (
            /* Empty State */
            <EmptyState
              isFiltered={isFiltered}
              onResetFilters={resetFilters}
              onAddNew={handleOpenCreateModal}
            />
          ) : (
            /* Data Views */
            <>
              {viewMode === "table" ? (
                <TaskTable
                  tasks={tasks}
                  onView={handleOpenViewModal}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                  onQuickStatusChange={quickUpdateStatus}
                />
              ) : (
                <TaskGrid
                  tasks={tasks}
                  onView={handleOpenViewModal}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                  onQuickStatusChange={quickUpdateStatus}
                />
              )}

              {/* Pagination */}
              <Pagination
                page={page}
                limit={limit}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            </>
          )}
        </section>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} iTasks &bull; Workspace Task Management
      </footer>

      {/* Modals */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        onSubmit={handleFormSubmit}
      />

      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setTaskToView(null);
        }}
        task={taskToView}
        onEdit={(task) => {
          setIsDetailModalOpen(false);
          handleOpenEditModal(task);
        }}
        onDelete={(task) => {
          setIsDetailModalOpen(false);
          handleOpenDeleteModal(task);
        }}
        onQuickStatusChange={async (task, newStatus) => {
          const updated = await quickUpdateStatus(task, newStatus);
          setTaskToView(updated);
        }}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        task={taskToDelete}
        onConfirmDelete={deleteTask}
      />
    </div>
  );
}
