// ==============================================================================
// UTILITAS TANGGAL (lib/dateUtils.ts)
// ==============================================================================
// Kumpulan fungsi murni untuk format tanggal dan kalkulasi overdue.
// Seluruhnya memakai API native (Date & Intl) tanpa library eksternal.
// ==============================================================================

import { TaskStatus } from "@/types/task";

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Tugas dianggap terlambat jika punya tenggat yang sudah lewat dan belum berstatus Done.
 */
export function isOverdue(dueDate?: string | null, status?: TaskStatus | string): boolean {
  if (status === "Done") return false;
  const due = parseDate(dueDate);
  if (!due) return false;
  return due.getTime() < Date.now();
}

/**
 * Memformat string ISO-8601 ke lokalisasi bahasa Indonesia (contoh: "25 Sep 2026, 17.00").
 * Mengembalikan "-" jika tanggal kosong atau tidak valid.
 */
export function formatDateTime(dateString?: string | null): string {
  const date = parseDate(dateString);
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Mengubah string ISO-8601 menjadi nilai <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
 * dalam zona waktu lokal browser. Mengembalikan "" jika kosong atau tidak valid.
 */
export function toDateTimeLocal(isoString?: string | null): string {
  const date = parseDate(isoString);
  if (!date) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
