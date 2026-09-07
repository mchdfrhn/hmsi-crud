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
      <div className="flex flex-col gap-5">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} size="md" />
            <PriorityBadge priority={task.priority} size="md" />
            {overdue && <OverdueBadge />}
          </div>
          <span className="text-xs text-slate-500 font-mono font-semibold">ID: {task.id}</span>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">
            {task.title}
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {task.description || (
              <span className="italic text-slate-400">
                Tidak ada deskripsi rinci untuk tugas ini.
              </span>
            )}
          </div>
        </div>

        {/* Meta Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Assignee */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Penanggung Jawab</span>
              <span className="font-bold text-slate-900 text-sm">
                {task.assignee || "Belum ditentukan"}
              </span>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className={`p-1.5 rounded-lg ${overdue ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Tenggat Waktu</span>
              <span
                className={`font-bold text-sm ${
                  overdue ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {formatDateTime(task.due_date)}
              </span>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Dibuat Pada</span>
              <span className="font-semibold text-slate-800">
                {formatDateTime(task.created_at)}
              </span>
            </div>
          </div>

          {/* Updated At */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Terakhir Diperbarui</span>
              <span className="font-semibold text-slate-800">
                {formatDateTime(task.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick status transition */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold text-slate-600 mr-1">
            Ubah Cepat:
          </span>
          {task.status !== "In Progress" && (
            <button
              onClick={() => onQuickStatusChange(task, "In Progress")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </button>
          )}
          {task.status !== "Done" && (
            <button
              onClick={() => onQuickStatusChange(task, "Done")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tandai Selesai</span>
            </button>
          )}
          {task.status !== "To Do" && (
            <button
              onClick={() => onQuickStatusChange(task, "To Do")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke To Do</span>
            </button>
          )}
        </div>

        {/* Bottom Actions: Close, Edit, Delete */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onDelete(task);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Tugas</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.98]"
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
