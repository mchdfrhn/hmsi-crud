// ==============================================================================
// DEFINISI TIPE DATA TYPESCRIPT (types/task.ts)
// ==============================================================================
// Modul ini mendefinisikan seluruh kontrak tipe (type contracts) pada sisi frontend.
// Keuntungan TypeScript di sini:
// 1. Sinkronisasi dengan Backend: Struktur model disesuaikan persis dengan skema Pydantic.
// 2. Autocomplete & IntelliSense: IDE memberikan saran field otomatis saat menulis komponen.
// 3. Compile-time Error Detection: Menangkap typo nama field sebelum kode dijalankan di browser.
// ==============================================================================

/**
 * Union type string literal untuk status pengerjaan tugas.
 * Nilai ini harus sama persis dengan TaskStatus di backend Python.
 */
export type TaskStatus = "To Do" | "In Progress" | "Done";

/**
 * Union type string literal untuk tingkat urgensi / prioritas tugas.
 */
export type TaskPriority = "Low" | "Medium" | "High";

/**
 * Entitas utama Tugas (Task) seperti yang diterima dari REST API.
 */
export interface Task {
  id: number;                          // Primary key dari database
  title: string;                       // Judul tugas (wajib, max 100 karakter)
  description?: string | null;         // Deskripsi lengkap (opsional)
  status: TaskStatus;                  // Status tugas saat ini
  priority: TaskPriority;              // Prioritas tugas
  assignee?: string | null;            // Nama PIC yang ditugaskan (opsional)
  due_date?: string | null;            // Format ISO-8601 string (contoh: "2026-09-25T17:00:00Z")
  created_at: string;                  // Timestamp ISO-8601 saat record dibuat
  updated_at: string;                  // Timestamp ISO-8601 saat record terakhir diperbarui
}

/**
 * Entitas jejak riwayat audit (Audit Log) untuk mencatat perubahan status tugas.
 */
export interface TaskAuditLog {
  id: number;
  task_id: number;
  old_status: TaskStatus | null;       // Null jika ini adalah entri saat task pertama dibuat
  new_status: TaskStatus;              // Status baru setelah diubah
  changed_at: string;                  // Timestamp ISO-8601 terjadinya perubahan
}

/**
 * Payload data yang dikirim saat membuat tugas baru (POST /api/tasks).
 */
export interface TaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string | null;
  due_date?: string | null;
}

/**
 * Payload data yang dikirim saat memperbarui tugas (PUT /api/tasks/{id}).
 * Seluruh field bersifat opsional karena klien hanya mengirim data yang berubah.
 */
export interface TaskUpdate {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string | null;
  due_date?: string | null;
}

/**
 * Kontrak respons pagination dari endpoint GET /api/tasks.
 */
export interface TaskListResponse {
  items: Task[];                       // Daftar tugas di halaman aktif
  total: number;                       // Total semua record yang memenuhi filter
  page: number;                        // Halaman saat ini (1-based index)
  limit: number;                       // Batas maksimal item per halaman
  total_pages: number;                 // Total keseluruhan halaman yang tersedia
}

/**
 * Kontrak respons ringkasan KPI untuk dasbor atas (GET /api/tasks/summary).
 */
export interface TaskSummaryResponse {
  total: number;                       // Jumlah semua tugas
  todo: number;                        // Jumlah status To Do
  in_progress: number;                 // Jumlah status In Progress
  done: number;                        // Jumlah status Done
  overdue: number;                     // Jumlah tugas yang telat (lewat due_date)
  by_status: Record<string, number>;   // Pemetaan nama status ke jumlah numerik
}

/**
 * Rincian validasi field error yang dikirimkan oleh backend FastAPI (HTTP 422).
 */
export interface ApiValidationErrorDetail {
  field: string;                       // Lokasi field bermasalah (misal: 'title', 'due_date')
  message: string;                     // Pesan error ramah pengguna
  type?: string;                       // Tipe error dari Pydantic (opsional)
}

/**
 * Struktur standar JSON error dari backend FastAPI.
 */
export interface ApiErrorResponse {
  detail: string;
  errors?: ApiValidationErrorDetail[];
}

/**
 * Parameter query string yang dapat dikirimkan ke endpoint GET /api/tasks.
 */
export interface TaskQueryParams {
  page?: number;
  limit?: number;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  assignee?: string;
  search?: string;
  is_overdue?: boolean;
  sort_by?: string;
  sort_order?: string;
}


