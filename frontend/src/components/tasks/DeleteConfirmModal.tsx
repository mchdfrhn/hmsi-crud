"use client";

import React, { useState } from "react";
import { Task } from "@/types/task";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (task: Task) => Promise<void>;
}

export function DeleteConfirmModal({
  task,
  isOpen,
  onClose,
  onConfirmDelete,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!task) return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirmDelete(task);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      title="Konfirmasi Hapus Tugas"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Hapus Tugas #{task.id}?
        </h4>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          Apakah Anda yakin ingin menghapus tugas:
        </p>

        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 w-full mb-4 break-words">
          &quot;{task.title}&quot;
        </p>

        <p className="text-xs text-rose-500 font-medium mb-6">
          Tindakan ini permanen dan tidak dapat dibatalkan.
        </p>

        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isDeleting ? "Menghapus..." : "Ya, Hapus"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
