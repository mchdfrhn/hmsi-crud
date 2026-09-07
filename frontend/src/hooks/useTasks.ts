"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Task,
  TaskCreate,
  TaskListResponse,
  TaskPriority,
  TaskQueryParams,
  TaskStatus,
  TaskSummaryResponse,
  TaskUpdate,
} from "@/types/task";
import { taskApi } from "@/services/api";
import { useToast } from "@/components/ui/Toast";

export function useTasks() {
  const { showToast } = useToast();

  // Tasks and summary state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummaryResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>("All");
  const [priority, setPriority] = useState<string>("All");
  const [assignee, setAssignee] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query by 300ms
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const data = await taskApi.getSummary();
      setSummary(data);
    } catch (err: unknown) {
      console.error("Error fetching summary:", err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: TaskQueryParams = {
        page,
        limit,
        status: status !== "All" ? status : undefined,
        priority: priority !== "All" ? priority : undefined,
        assignee: assignee.trim() || undefined,
        search: debouncedSearch.trim() || undefined,
      };

      const response: TaskListResponse = await taskApi.getTasks(params);
      setTasks(response.items);
      setTotal(response.total);
      setTotalPages(response.total_pages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat daftar tugas.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status, priority, assignee, debouncedSearch]);

  // Trigger fetch when parameters change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Initial fetch for summary
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Mutations
  const createTask = async (data: TaskCreate) => {
    const newTask = await taskApi.createTask(data);
    showToast(`Tugas "${newTask.title}" berhasil dibuat!`, "success");
    await Promise.all([fetchTasks(), fetchSummary()]);
    return newTask;
  };

  const updateTask = async (id: number, data: TaskUpdate) => {
    const updated = await taskApi.updateTask(id, data);
    showToast(`Tugas "${updated.title}" berhasil diperbarui!`, "success");
    await Promise.all([fetchTasks(), fetchSummary()]);
    return updated;
  };

  const quickUpdateStatus = async (task: Task, newStatus: TaskStatus) => {
    try {
      const updated = await taskApi.updateTask(task.id, { status: newStatus });
      showToast(`Status tugas diubah menjadi "${newStatus}"`, "success");
      await Promise.all([fetchTasks(), fetchSummary()]);
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status tugas.";
      showToast(msg, "error");
      throw err;
    }
  };

  const deleteTask = async (task: Task) => {
    try {
      await taskApi.deleteTask(task.id);
      showToast(`Tugas "${task.title}" berhasil dihapus.`, "info");
      // Adjust page if current page became empty
      if (tasks.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchTasks();
      }
      await fetchSummary();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus tugas.";
      showToast(msg, "error");
      throw err;
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("All");
    setPriority("All");
    setAssignee("");
    setPage(1);
  };

  return {
    tasks,
    summary,
    total,
    totalPages,
    page,
    limit,
    status,
    priority,
    assignee,
    search,
    isLoading,
    isSummaryLoading,
    error,
    setPage,
    setLimit,
    setStatus: (s: string) => {
      setStatus(s);
      setPage(1);
    },
    setPriority: (p: string) => {
      setPriority(p);
      setPage(1);
    },
    setAssignee: (a: string) => {
      setAssignee(a);
      setPage(1);
    },
    setSearch,
    resetFilters,
    refreshTasks: fetchTasks,
    refreshSummary: fetchSummary,
    createTask,
    updateTask,
    quickUpdateStatus,
    deleteTask,
  };
}
