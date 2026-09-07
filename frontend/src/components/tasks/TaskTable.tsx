import React from "react";
import { Task, TaskStatus } from "@/types/task";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/ui/Badge";
import { formatDateTime, isOverdue } from "@/lib/dateUtils";
import { Eye, Edit2, Trash2, User, Calendar, CheckCircle2, PlayCircle, RotateCcw } from "lucide-react";

interface TaskTableProps {
  tasks: Task[];
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onQuickStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export function TaskTable({
  tasks,
  onView,
  onEdit,
  onDelete,
  onQuickStatusChange,
}: TaskTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <th className="py-3.5 px-4">Tugas</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Prioritas</th>
            <th className="py-3.5 px-4">Assignee</th>
            <th className="py-3.5 px-4">Tenggat Waktu</th>
            <th className="py-3.5 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date, task.status);

            return (
              <tr
                key={task.id}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
              >
                {/* Title & Description */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-slate-400 mt-0.5">
                      #{task.id}
                    </span>
                    <div>
                      <div
                        onClick={() => onView(task)}
                        className="font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-1 transition-colors"
                        title={task.title}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={task.status} size="sm" />
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={task.priority} size="sm" />
                </td>

                {/* Assignee */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{task.assignee || "Unassigned"}</span>
                  </div>
                </td>

                {/* Due Date & Overdue */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div
                      className={`flex items-center gap-1 ${
                        overdue
                          ? "text-rose-600 dark:text-rose-400 font-semibold"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDateTime(task.due_date)}</span>
                    </div>
                    {overdue && <OverdueBadge />}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Quick status transition button */}
                    {task.status !== "Done" && (
                      <button
                        onClick={() => onQuickStatusChange(task, "Done")}
                        className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                        title="Tandai Selesai"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {task.status === "To Do" && (
                      <button
                        onClick={() => onQuickStatusChange(task, "In Progress")}
                        className="p-1 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                        title="Mulai Kerjakan"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    )}
                    {task.status === "Done" && (
                      <button
                        onClick={() => onQuickStatusChange(task, "In Progress")}
                        className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Buka Kembali"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    <button
                      onClick={() => onView(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                      title="Edit Tugas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(task)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
