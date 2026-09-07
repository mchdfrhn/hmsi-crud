import React from "react";
import { Task, TaskStatus } from "@/types/task";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/ui/Badge";
import { formatDateTime, isOverdue } from "@/lib/dateUtils";
import {
  Calendar,
  User,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onQuickStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export function TaskCard({
  task,
  onView,
  onEdit,
  onDelete,
  onQuickStatusChange,
}: TaskCardProps) {
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div
      className={`group relative flex flex-col justify-between p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-200 ${
        overdue
          ? "border-rose-300/80 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={task.status} size="sm" />
            <PriorityBadge priority={task.priority} size="sm" />
            {overdue && <OverdueBadge />}
          </div>
          <span className="text-xs font-mono text-slate-400">#{task.id}</span>
        </div>

        {/* Title */}
        <h4
          onClick={() => onView(task)}
          className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer transition-colors line-clamp-2 mb-1.5"
          title={task.title}
        >
          {task.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-8 mb-4">
          {task.description || "Tidak ada deskripsi tambahan."}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {/* Assignee */}
          <div className="flex items-center gap-1.5 truncate max-w-[50%]">
            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <User className="w-3 h-3" />
            </div>
            <span className="truncate">{task.assignee || "Unassigned"}</span>
          </div>

          {/* Due Date */}
          <div
            className={`flex items-center gap-1 shrink-0 ${
              overdue ? "text-rose-600 dark:text-rose-400 font-medium" : ""
            }`}
            title={`Tenggat: ${formatDateTime(task.due_date)}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDateTime(task.due_date)}</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-1">
          {/* Quick status transition */}
          <div className="flex items-center gap-1">
            {task.status !== "Done" && (
              <button
                onClick={() => onQuickStatusChange(task, "Done")}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                title="Tandai Selesai"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesai</span>
              </button>
            )}
            {task.status === "To Do" && (
              <button
                onClick={() => onQuickStatusChange(task, "In Progress")}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                title="Mulai Kerjakan"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Mulai</span>
              </button>
            )}
            {task.status === "Done" && (
              <button
                onClick={() => onQuickStatusChange(task, "In Progress")}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Buka Kembali"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </button>
            )}
          </div>

          {/* Standard buttons: View, Edit, Delete */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onView(task)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Lihat detail tugas"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              aria-label="Edit tugas"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              aria-label="Hapus tugas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
