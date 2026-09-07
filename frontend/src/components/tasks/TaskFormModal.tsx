"use client";

import React, { useState, useEffect, useRef } from "react";
import { Task, TaskCreate, TaskPriority, TaskStatus, TaskUpdate } from "@/types/task";
import { Modal } from "@/components/ui/Modal";
import { toDateTimeLocal } from "@/lib/dateUtils";
import { ApiError } from "@/services/api";
import { Loader2, AlertCircle, Calendar, Sparkles } from "lucide-react";

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
  const titleInputRef = useRef<HTMLInputElement>(null);

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

      // Auto-focus title input after modal opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, taskToEdit]);

  // Quick preset helper for Due Date
  const applyDatePreset = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    target.setHours(18, 0, 0, 0); // Set to 18:00 end of workday
    setDueDate(toDateTimeLocal(target.toISOString()));
    if (errors.due_date) {
      setErrors((prev) => ({ ...prev, due_date: "" }));
    }
  };

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
      if (selected.getTime() < now.getTime() - 60000) {
        newErrors.due_date = "Tenggat waktu tidak boleh lebih awal dari waktu saat ini.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
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

  // Shortcut: Ctrl+Enter or Cmd+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
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
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate className="flex flex-col gap-4">
        {/* General Error Banner */}
        {generalError && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 font-semibold">{generalError}</div>
          </div>
        )}

        {/* Title Field with Auto-Focus */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="task-title"
              className="text-xs font-bold text-slate-800"
            >
              Judul Tugas <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs ${
                title.length > 100
                  ? "text-rose-600 font-bold"
                  : title.length > 80
                  ? "text-amber-600 font-medium"
                  : "text-slate-400"
              }`}
            >
              {title.length}/100
            </span>
          </div>
          <input
            ref={titleInputRef}
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
            placeholder="Contoh: Implementasi integrasi API FastAPI"
            maxLength={100}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all shadow-xs ${
              errors.title
                ? "border-rose-400 focus:ring-rose-500/20"
                : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.title}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label
            htmlFor="task-description"
            className="block text-xs font-bold text-slate-800 mb-1"
          >
            Deskripsi (Opsional)
          </label>
          <textarea
            id="task-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan rincian atau catatan tugas ini..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none shadow-xs"
          />
        </div>

        {/* Two Columns: Status and Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label
              htmlFor="task-status"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs font-medium"
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
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Prioritas
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs font-medium"
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
              className="block text-xs font-bold text-slate-800 mb-1"
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
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all shadow-xs ${
                errors.assignee
                  ? "border-rose-400 focus:ring-rose-500/20"
                  : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20"
              }`}
            />
            {errors.assignee && (
              <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.assignee}</p>
            )}
          </div>

          {/* Due Date with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="task-due-date"
                className="text-xs font-bold text-slate-800"
              >
                Tenggat Waktu
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>
            <input
              id="task-due-date"
              type="datetime-local"
              value={dueDate}
              min={!isEditing ? toDateTimeLocal(new Date().toISOString()) : undefined}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (errors.due_date) setErrors((prev) => ({ ...prev, due_date: "" }));
              }}
              className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all shadow-xs ${
                errors.due_date
                  ? "border-rose-400 focus:ring-rose-500/20"
                  : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20"
              }`}
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-medium">Preset:</span>
              <button
                type="button"
                onClick={() => applyDatePreset(1)}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Besok
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset(3)}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                +3 Hari
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset(7)}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                +1 Minggu
              </button>
            </div>
            {errors.due_date && (
              <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.due_date}</p>
            )}
          </div>
        </div>

        {/* Form Actions (Submit & Cancel) */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tips: Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Enter</kbd> untuk simpan cepat
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Buat Tugas"}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
