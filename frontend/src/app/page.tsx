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
import { CheckSquare, RefreshCw, AlertCircle } from "lucide-react";

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
    isLoading,
    isSummaryLoading,
    error,
    setPage,
    setLimit,
    setStatus,
    setPriority,
    setAssignee,
    setSearch,
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
    Boolean(assignee);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none">
                Antigravity Tasks
              </h1>
              <span className="text-xs text-slate-400">
                HMSI Technical Test
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI Backend Connected</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                refreshTasks();
                refreshSummary();
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6 w-full">
        {/* Dashboard Overview Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Ringkasan Dasbor
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Agregasi metrik tugas real-time
            </span>
          </div>

          {isSummaryLoading && !summary ? (
            <SummaryCardSkeleton />
          ) : (
            <>
              <SummaryCards
                summary={summary}
                onSelectStatusFilter={(s) => setStatus(s)}
                activeStatusFilter={status}
              />
              <ProgressBar summary={summary} />
            </>
          )}
        </section>

        {/* Task Management Section */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Daftar Tugas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola, saring, dan perbarui tugas proyek Anda
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
          />

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => refreshTasks()}
                className="px-3 py-1 rounded-lg bg-rose-200 dark:bg-rose-900 font-medium text-xs hover:bg-rose-300 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading ? (
            viewMode === "table" ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        Task Management System &bull; Technical Test HMSI &bull; Next.js 16 + FastAPI
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
