import React from "react";
import { Task, TaskStatus } from "@/types/task";
import { PriorityBadge, OverdueBadge } from "@/components/ui/Badge";
import { formatDateTime, isOverdue } from "@/lib/dateUtils";
import { Eye, Edit2, Trash2, User, Calendar, ChevronDown, Check } from "lucide-react";

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
  const [openStatusMenuId, setOpenStatusMenuId] = React.useState<number | null>(null);

  // Close status dropdown when clicking outside
  React.useEffect(() => {
    const handleDocumentClick = () => setOpenStatusMenuId(null);
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const statusOptions: TaskStatus[] = ["To Do", "In Progress", "Done"];

  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case "Done":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100";
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <th className="py-3.5 px-4">Tugas</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Prioritas</th>
            <th className="py-3.5 px-4">Assignee</th>
            <th className="py-3.5 px-4">Tenggat Waktu</th>
            <th className="py-3.5 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date, task.status);
            const isMenuOpen = openStatusMenuId === task.id;

            return (
              <tr
                key={task.id}
                onClick={() => onView(task)}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                title="Klik baris untuk melihat rincian tugas"
              >
                {/* Title & Description */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono font-medium text-slate-400 mt-0.5">
                      #{task.id}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 line-clamp-1 transition-colors">
                        {task.title}
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Interactive Status Selector Dropdown */}
                <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStatusMenuId(isMenuOpen ? null : task.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${getStatusBadgeStyle(
                        task.status
                      )}`}
                      title="Klik untuk mengubah status"
                    >
                      <span>{task.status}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="absolute left-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Ubah Status
                        </div>
                        {statusOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              onQuickStatusChange(task, opt);
                              setOpenStatusMenuId(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left hover:bg-slate-50 transition-colors ${
                              task.status === opt
                                ? "text-indigo-600 font-bold bg-indigo-50/50"
                                : "text-slate-700"
                            }`}
                          >
                            <span>{opt}</span>
                            {task.status === opt && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={task.priority} size="sm" />
                </td>

                {/* Assignee */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                      <User className="w-3 h-3" />
                    </div>
                    <span>{task.assignee || "Unassigned"}</span>
                  </div>
                </td>

                {/* Due Date & Overdue */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div
                      className={`flex items-center gap-1 ${
                        overdue
                          ? "text-rose-600 font-semibold"
                          : "text-slate-600 font-medium"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(task.due_date)}</span>
                    </div>
                    {overdue && <OverdueBadge />}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(task);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Lihat Detail"
                      aria-label="View task details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Tugas"
                      aria-label="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Tugas"
                      aria-label="Delete task"
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
