"use client";

import React from "react";
import { Task, TaskStatus } from "@/types/task";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/ui/Badge";
import { formatDateTime, isOverdue } from "@/lib/dateUtils";
import {
  Calendar,
  Clock,
  User,
  Edit2,
  Trash2,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
} from "lucide-react";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onQuickStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onQuickStatusChange,
}: TaskDetailModalProps) {
  if (!task) return null;

  const overdue = isOverdue(task.due_date, task.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Tugas #${task.id}`}
      maxWidth="lg"
    >
      <div className="flex flex-col gap-6">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} size="md" />
            <PriorityBadge priority={task.priority} size="md" />
            {overdue && <OverdueBadge />}
          </div>
          <span className="text-xs text-slate-400 font-mono">ID: {task.id}</span>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            {task.title}
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {task.description || (
              <span className="italic text-slate-400">
                Tidak ada deskripsi rinci untuk tugas ini.
              </span>
            )}
          </div>
        </div>

        {/* Meta Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Assignee */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <User className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 block mb-0.5">Penanggung Jawab</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {task.assignee || "Belum ditentukan"}
              </span>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Calendar className={`w-4 h-4 mt-0.5 ${overdue ? "text-rose-500" : "text-slate-400"}`} />
            <div>
              <span className="text-slate-400 block mb-0.5">Tenggat Waktu</span>
              <span
                className={`font-semibold ${
                  overdue ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                }`}
              >
                {formatDateTime(task.due_date)}
              </span>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 block mb-0.5">Dibuat Pada</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatDateTime(task.created_at)}
              </span>
            </div>
          </div>

          {/* Updated At */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 block mb-0.5">Terakhir Diperbarui</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatDateTime(task.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick status transition */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            Ubah Cepat:
          </span>
          {task.status !== "In Progress" && (
            <button
              onClick={() => onQuickStatusChange(task, "In Progress")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 hover:bg-amber-200 transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </button>
          )}
          {task.status !== "Done" && (
            <button
              onClick={() => onQuickStatusChange(task, "Done")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tandai Selesai</span>
            </button>
          )}
          {task.status !== "To Do" && (
            <button
              onClick={() => onQuickStatusChange(task, "To Do")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/60 hover:bg-blue-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke To Do</span>
            </button>
          )}
        </div>

        {/* Bottom Actions: Close, Edit, Delete */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onClose();
              onDelete(task);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Tugas</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Tugas</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
