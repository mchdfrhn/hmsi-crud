import { Task, TaskAuditLog, TaskSummaryResponse } from "@/types/task";

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO string relatif terhadap saat ini, mis. isoInDays(-1) = kemarin. */
export function isoInDays(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: "Tugas Contoh",
    description: "Deskripsi contoh",
    status: "To Do",
    priority: "Medium",
    assignee: "Budi",
    due_date: isoInDays(3),
    created_at: "2026-01-01T08:00:00Z",
    updated_at: "2026-01-02T09:30:00Z",
    ...overrides,
  };
}

export function makeSummary(overrides: Partial<TaskSummaryResponse> = {}): TaskSummaryResponse {
  return {
    total: 10,
    todo: 4,
    in_progress: 3,
    done: 3,
    overdue: 2,
    by_status: { "To Do": 4, "In Progress": 3, Done: 3 },
    ...overrides,
  };
}

export function makeLog(overrides: Partial<TaskAuditLog> = {}): TaskAuditLog {
  return {
    id: 1,
    task_id: 1,
    old_status: null,
    new_status: "To Do",
    changed_at: "2026-01-01T08:00:00Z",
    ...overrides,
  };
}

/** Promise yang diselesaikan manual, untuk menguji state "sedang memproses". */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
