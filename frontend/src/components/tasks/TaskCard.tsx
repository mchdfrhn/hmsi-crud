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
      onClick={() => onView(task)}
      className={`group relative flex flex-col justify-between p-5 rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer ${
        overdue
          ? "border-rose-200 bg-rose-50/20 hover:border-rose-300"
          : "border-slate-200 hover:border-slate-300"
      }`}
      title="Klik untuk melihat rincian tugas"
    >
      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={task.status} size="sm" />
            <PriorityBadge priority={task.priority} size="sm" />
            {overdue && <OverdueBadge />}
          </div>
          <span className="text-xs font-mono font-medium text-slate-400">#{task.id}</span>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5">
          {task.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 min-h-8 mb-4">
          {task.description || "Tidak ada deskripsi tambahan."}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          {/* Assignee */}
          <div className="flex items-center gap-1.5 truncate max-w-[50%]">
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <User className="w-3 h-3" />
            </div>
            <span className="truncate text-slate-700">{task.assignee || "Unassigned"}</span>
          </div>

          {/* Due Date */}
          <div
            className={`flex items-center gap-1 shrink-0 ${
              overdue ? "text-rose-600 font-bold" : "text-slate-500"
            }`}
            title={`Tenggat: ${formatDateTime(task.due_date)}`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDateTime(task.due_date)}</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div
          className="flex items-center justify-between gap-1 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick status transition */}
          <div className="flex items-center gap-1">
            {task.status !== "Done" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickStatusChange(task, "Done");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                title="Tandai Selesai"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesai</span>
              </button>
            )}
            {task.status === "To Do" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickStatusChange(task, "In Progress");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
                title="Mulai Kerjakan"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Mulai</span>
              </button>
            )}
            {task.status === "Done" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickStatusChange(task, "In Progress");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onView(task);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Lihat detail tugas"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              aria-label="Edit tugas"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
