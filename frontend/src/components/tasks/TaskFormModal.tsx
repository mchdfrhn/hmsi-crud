"use client";

import React, { useState, useEffect } from "react";
import { Task, TaskCreate, TaskPriority, TaskStatus, TaskUpdate } from "@/types/task";
import { Modal } from "@/components/ui/Modal";
import { toDateTimeLocal } from "@/lib/dateUtils";
import { ApiError } from "@/services/api";
import { Loader2, AlertCircle } from "lucide-react";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  onSubmit: (data: TaskCreate | TaskUpdate) => Promise<void>;
}

export function TaskFormModal({
  isOpen,
  onClose,
  taskToEdit,
  onSubmit,
}: TaskFormModalProps) {
  const isEditing = Boolean(taskToEdit);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("To Do");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Validation & Submission states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when modal opens or taskToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title || "");
        setDescription(taskToEdit.description || "");
        setStatus(taskToEdit.status || "To Do");
        setPriority(taskToEdit.priority || "Medium");
        setAssignee(taskToEdit.assignee || "");
        setDueDate(toDateTimeLocal(taskToEdit.due_date));
      } else {
        setTitle("");
        setDescription("");
        setStatus("To Do");
        setPriority("Medium");
        setAssignee("");
        setDueDate("");
      }
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, taskToEdit]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = "Judul tugas wajib diisi.";
    } else if (trimmedTitle.length > 100) {
      newErrors.title = "Judul tugas tidak boleh melebihi 100 karakter.";
    }

    if (assignee && assignee.length > 100) {
      newErrors.assignee = "Nama assignee tidak boleh melebihi 100 karakter.";
    }

    // Validasi due_date tidak boleh lampau jika membuat tugas baru
    if (!isEditing && dueDate) {
      const selected = new Date(dueDate);
      const now = new Date();
      // Berikan toleransi 1 menit
      if (selected.getTime() < now.getTime() - 60000) {
        newErrors.due_date = "Tenggat waktu tidak boleh lebih awal dari waktu saat ini.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent double submission
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const formattedDueDate = dueDate ? new Date(dueDate).toISOString() : null;

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assignee: assignee.trim() || null,
        due_date: formattedDueDate,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        if (err.errors && Array.isArray(err.errors)) {
          const backendFieldErrors: Record<string, string> = {};
          err.errors.forEach((e) => {
            if (e.field) {
              backendFieldErrors[e.field] = e.message;
            }
          });
          setErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        }
      } else {
        setGeneralError("Terjadi kesalahan tidak terduga saat menyimpan tugas.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={isEditing ? `Edit Tugas: #${taskToEdit?.id}` : "Buat Tugas Baru"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* General Error Banner */}
        {generalError && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{generalError}</div>
          </div>
        )}

        {/* Title Field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="task-title"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Judul Tugas <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs ${
                title.length > 100
                  ? "text-rose-500 font-bold"
                  : "text-slate-400"
              }`}
            >
              {title.length}/100
            </span>
          </div>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
            placeholder="Contoh: Implementasi integrasi API FastAPI"
            maxLength={100}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
              errors.title
                ? "border-rose-500 focus:ring-rose-500/20"
                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.title}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label
            htmlFor="task-description"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Deskripsi (Opsional)
          </label>
          <textarea
            id="task-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan detail kebutuhan tugas ini..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        {/* Two Columns: Status and Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label
              htmlFor="task-status"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="task-priority"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Prioritas
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Two Columns: Assignee and Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Assignee */}
          <div>
            <label
              htmlFor="task-assignee"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Penanggung Jawab (Assignee)
            </label>
            <input
              id="task-assignee"
              type="text"
              value={assignee}
              onChange={(e) => {
                setAssignee(e.target.value);
                if (errors.assignee) setErrors((prev) => ({ ...prev, assignee: "" }));
              }}
              placeholder="Contoh: Budi Santoso"
              maxLength={100}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                errors.assignee
                  ? "border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
              }`}
            />
            {errors.assignee && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.assignee}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="task-due-date"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Tenggat Waktu (Due Date)
            </label>
            <input
              id="task-due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (errors.due_date) setErrors((prev) => ({ ...prev, due_date: "" }));
              }}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                errors.due_date
                  ? "border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
              }`}
            />
            {errors.due_date && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.due_date}</p>
            )}
          </div>
        </div>

        {/* Form Actions (Submit & Cancel) */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Buat Tugas"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
