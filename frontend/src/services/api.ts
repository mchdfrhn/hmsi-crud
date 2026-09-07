import {
  Task,
  TaskCreate,
  TaskListResponse,
  TaskQueryParams,
  TaskSummaryResponse,
  TaskUpdate,
  ApiValidationErrorDetail,
} from "@/types/task";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

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

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      let errorMessage = "Terjadi kesalahan pada server.";
      let errors: ApiValidationErrorDetail[] | undefined;

      if (data) {
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // FastAPI default validation error format fallback
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
    // Network / connection error
    throw new ApiError(
      "Gagal terhubung ke server backend (Pastikan FastAPI aktif di port 8000).",
      0
    );
  }
}

export const taskApi = {
  /**
   * Mengambil daftar tugas dengan filter dan paginasi
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
   * Mengambil detail tugas berdasarkan ID
   */
  async getTaskById(id: number): Promise<Task> {
    return request<Task>(`/tasks/${id}`, { method: "GET" });
  },

  /**
   * Membuat tugas baru
   */
  async createTask(data: TaskCreate): Promise<Task> {
    return request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Memperbarui tugas yang sudah ada
   */
  async updateTask(id: number, data: TaskUpdate): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Menghapus tugas berdasarkan ID
   */
  async deleteTask(id: number): Promise<{ detail: string; id: number }> {
    return request<{ detail: string; id: number }>(`/tasks/${id}`, {
      method: "DELETE",
    });
  },
};
