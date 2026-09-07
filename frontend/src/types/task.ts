export type TaskStatus = "To Do" | "In Progress" | "Done";

export type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskAuditLog {
  id: number;
  task_id: number;
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  changed_at: string;
}


export interface TaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string | null;
  due_date?: string | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string | null;
  due_date?: string | null;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TaskSummaryResponse {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  by_status: Record<string, number>;
}

export interface ApiValidationErrorDetail {
  field: string;
  message: string;
  type?: string;
}

export interface ApiErrorResponse {
  detail: string;
  errors?: ApiValidationErrorDetail[];
}

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

