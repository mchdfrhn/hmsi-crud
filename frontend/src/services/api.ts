// ==============================================================================
// LAPISAN SERVICE KLIEN HTTP API (services/api.ts)
// ==============================================================================
// Mengapa memisahkan pemanggilan fetch() ke dalam satu modul terpusat?
// 1. Centralized Configuration: Alamat backend (API_BASE_URL) hanya didefinisikan di satu tempat.
// 2. Uniform Error Handling: Mengubah error HTTP (4xx, 5xx) dan network failure menjadi custom class ApiError.
// 3. Type Safety: Fungsi memanfaatkan TypeScript Generic `request<T>()` sehingga tipe kembalian
//    terjamin sesuai dengan interface model.
// 4. Clean Code: Komponen UI dan hooks tidak perlu tahu seluk-beluk header HTTP atau JSON.stringify().
// ==============================================================================

import {
  Task,
  TaskAuditLog,
  TaskCreate,
  TaskListResponse,
  TaskQueryParams,
  TaskSummaryResponse,
  TaskUpdate,
  ApiValidationErrorDetail,
} from "@/types/task";

// Mengambil URL dasar API dari environment variable Next.js (.env.local),
// dengan fallback ke localhost:8000/api jika tidak disetel.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

/**
 * Custom Error Class untuk menangani kegagalan HTTP request secara terstruktur.
 * Menyimpan status code HTTP dan rincian field error validasi dari FastAPI.
 */
export class ApiError extends Error {
  status: number;
  errors?: ApiValidationErrorDetail[];

  constructor(message: string, status: number, errors?: ApiValidationErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Fungsi pembungkus (wrapper) generic di atas Fetch API native browser.
 * Menangani header JSON, parsing respons, dan interceptor error otomatis.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Periksa apakah server mengembalikan content-type JSON
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    // Jika HTTP status bukan 2xx (misal: 400, 404, 422, 500)
    if (!response.ok) {
      let errorMessage = "Terjadi kesalahan pada server.";
      let errors: ApiValidationErrorDetail[] | undefined;

      if (data) {
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Fallback format pesan error validasi bawaan FastAPI jika bukan custom handler
          errorMessage = data.detail.map((d: { msg?: string }) => d.msg || "Invalid input").join(", ");
        }
        if (Array.isArray(data.errors)) {
          errors = data.errors;
        }
      }

      throw new ApiError(errorMessage, response.status, errors);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Tangani error jaringan / server offline / CORS blocked
    throw new ApiError(
      "Gagal terhubung ke server backend (Pastikan FastAPI aktif di port 8000).",
      0
    );
  }
}

/**
 * Objek taskApi mengumpulkan seluruh method pemanggilan REST API untuk modul Tasks.
 */
export const taskApi = {
  /**
   * Mengambil daftar tugas dengan dukungan filter, pagination, dan sorting:
   * Menggunakan URLSearchParams untuk menyusun query string (?page=1&limit=10&status=To%20Do...)
   */
  async getTasks(params?: TaskQueryParams): Promise<TaskListResponse> {
    const query = new URLSearchParams();

    if (params) {
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.status && params.status !== "All") query.append("status", params.status);
      if (params.priority && params.priority !== "All") query.append("priority", params.priority);
      if (params.assignee?.trim()) query.append("assignee", params.assignee.trim());
      if (params.search?.trim()) query.append("search", params.search.trim());
      if (params.is_overdue !== undefined) query.append("is_overdue", params.is_overdue.toString());
      if (params.sort_by) query.append("sort_by", params.sort_by);
      if (params.sort_order) query.append("sort_order", params.sort_order);
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : "/tasks";
    return request<TaskListResponse>(endpoint, { method: "GET" });
  },

  /**
   * Mengambil ringkasan agregat tugas (Total, To Do, In Progress, Done, Overdue)
   */
  async getSummary(): Promise<TaskSummaryResponse> {
    return request<TaskSummaryResponse>("/tasks/summary", { method: "GET" });
  },

  /**
   * Mengambil detail tugas spesifik berdasarkan ID
   */
  async getTaskById(id: number): Promise<Task> {
    return request<Task>(`/tasks/${id}`, { method: "GET" });
  },

  /**
   * Membuat tugas baru (POST /api/tasks)
   */
  async createTask(data: TaskCreate): Promise<Task> {
    return request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Memperbarui data tugas yang sudah ada (PUT /api/tasks/{id})
   */
  async updateTask(id: number, data: TaskUpdate): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Menghapus tugas dari sistem (DELETE /api/tasks/{id})
   */
  async deleteTask(id: number): Promise<{ detail: string; id: number }> {
    return request<{ detail: string; id: number }>(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Mengambil riwayat audit log perubahan status suatu tugas (GET /api/tasks/{id}/audit-logs)
   */
  async getTaskAuditLogs(taskId: number): Promise<TaskAuditLog[]> {
    return request<TaskAuditLog[]>(`/tasks/${taskId}/audit-logs`, {
      method: "GET",
    });
  },
};


