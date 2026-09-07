"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Task,
  TaskCreate,
  TaskListResponse,
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
  const [debouncedAssignee, setDebouncedAssignee] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [isOverdueFilter, setIsOverdueFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");

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
      setPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Debounce assignee input by 300ms to prevent request spamming
  const assigneeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (assigneeTimeoutRef.current) {
      clearTimeout(assigneeTimeoutRef.current);
    }
    assigneeTimeoutRef.current = setTimeout(() => {
      setDebouncedAssignee(assignee);
      setPage(1);
    }, 300);

    return () => {
      if (assigneeTimeoutRef.current) {
        clearTimeout(assigneeTimeoutRef.current);
      }
    };
  }, [assignee]);

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
        assignee: debouncedAssignee.trim() || undefined,
        search: debouncedSearch.trim() || undefined,
        is_overdue: isOverdueFilter ? true : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
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
  }, [page, limit, status, priority, debouncedAssignee, debouncedSearch, isOverdueFilter, sortBy, sortOrder]);

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

  const toggleStatusFilter = (newStatus: string) => {
    if (newStatus === "All" || status === newStatus) {
      setStatus("All");
    } else {
      setStatus(newStatus);
      setIsOverdueFilter(false);
    }
    setPage(1);
  };

  const toggleOverdueFilter = () => {
    setIsOverdueFilter((prev) => {
      const next = !prev;
      if (next) setStatus("All");
      return next;
    });
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setAssignee("");
    setDebouncedAssignee("");
    setStatus("All");
    setPriority("All");
    setIsOverdueFilter(false);
    setSortBy("created_at");
    setSortOrder("desc");
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
    isOverdueFilter,
    sortBy,
    sortOrder,
    isLoading,
    isSummaryLoading,
    error,
    setPage,
    setLimit,
    setStatus: (s: string) => {
      setStatus(s);
      setIsOverdueFilter(false);
      setPage(1);
    },
    setPriority: (p: string) => {
      setPriority(p);
      setPage(1);
    },
    setAssignee: (a: string) => {
      setAssignee(a);
    },
    setSearch,
    setSortBy: (sb: string) => {
      setSortBy(sb);
      setPage(1);
    },
    setSortOrder: (so: string) => {
      setSortOrder(so);
      setPage(1);
    },
    toggleStatusFilter,
    toggleOverdueFilter,
    resetFilters,
    refreshTasks: fetchTasks,
    refreshSummary: fetchSummary,
    createTask,
    updateTask,
    quickUpdateStatus,
    deleteTask,
  };
}
