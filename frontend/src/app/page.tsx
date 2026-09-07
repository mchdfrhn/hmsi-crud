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
import { CheckSquare, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-none tracking-tight">
                  Antigravity Tasks
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> Pro
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Task Management System &bull; HMSI Technical Test
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI Backend Active</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                refreshTasks();
                refreshSummary();
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
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

      {/* Clean White Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
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
