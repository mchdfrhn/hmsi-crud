"use client";

import React, { useState, useEffect } from "react";
import { Task, TaskStatus, TaskAuditLog } from "@/types/task";
import { taskApi } from "@/services/api";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/ui/Badge";
import { formatDateTime, isOverdue } from "@/lib/dateUtils";
import {
  Calendar,
  Clock,
  User,
  Edit2,
  Trash2,
  History,
  ArrowRight,
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
  const [logs, setLogs] = useState<TaskAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !task?.id) {
      setLogs([]);
      return;
    }

    let isMounted = true;
    setIsLoadingLogs(true);

    taskApi
      .getTaskAuditLogs(task.id)
      .then((data) => {
        if (isMounted) {
          setLogs(data);
          setIsLoadingLogs(false);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil riwayat audit log:", err);
        if (isMounted) {
          setIsLoadingLogs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, task?.id, task?.status]);

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

        {/* Status Segmented Control */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-slate-700">
            Perbarui Status:
          </span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-200/60 p-1 rounded-xl">
            {(["To Do", "In Progress", "Done"] as TaskStatus[]).map((s) => {
              const isCurrent = task.status === s;
              let activeStyle = "";
              if (s === "To Do") {
                activeStyle = "bg-blue-600 text-white shadow-xs font-bold";
              } else if (s === "In Progress") {
                activeStyle = "bg-amber-500 text-white shadow-xs font-bold";
              } else {
                activeStyle = "bg-emerald-600 text-white shadow-xs font-bold";
              }

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (!isCurrent) {
                      onQuickStatusChange(task, s);
                    }
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs transition-all ${
                    isCurrent
                      ? activeStyle
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium"
                  }`}
                  title={`Ubah status ke ${s}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audit Log / Activity Timeline Section */}
        <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-700">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Riwayat Perubahan Status (Audit Log)
              </h3>
            </div>
            {logs.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {logs.length} catatan
              </span>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 max-h-52 overflow-y-auto">
            {isLoadingLogs ? (
              <div className="flex flex-col gap-2.5 py-1">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/4 ml-auto" />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">
                Belum ada riwayat perubahan status tercatat.
              </p>
            ) : (
              <div className="relative pl-4 border-l-2 border-slate-200 flex flex-col gap-3 ml-2 my-0.5">
                {logs.map((log, index) => {
                  const isInitial = !log.old_status;
                  return (
                    <div
                      key={log.id}
                      className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2"
                    >
                      {/* Timeline Node Marker */}
                      <div
                        className={`absolute -left-[22px] top-1 sm:top-auto w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ${
                          index === 0
                            ? "bg-indigo-600 ring-indigo-300"
                            : "bg-slate-400 ring-slate-200"
                        }`}
                      />

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isInitial ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-700">
                              Status Awal:
                            </span>
                            <StatusBadge status={log.new_status} size="sm" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusBadge status={log.old_status!} size="sm" />
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <StatusBadge status={log.new_status} size="sm" />
                          </div>
                        )}
                      </div>

                      <span className="text-[11px] font-medium text-slate-500 font-mono shrink-0">
                        {formatDateTime(log.changed_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions: Close, Edit, Delete */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
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
