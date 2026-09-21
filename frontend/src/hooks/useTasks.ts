// ==============================================================================
// CUSTOM REACT HOOK: MANAJEMEN STATE TUGAS (hooks/useTasks.ts)
// ==============================================================================
// Mengapa menggunakan Custom Hook (`useTasks`)?
// 1. Separation of Concerns: Logika bisnis, state filter, debounce, fetching,
//    dan mutasi data dipisahkan dari representasi antarmuka (UI Component).
// 2. Reusability: Semua data dan fungsi aksi (create, update, delete, filter)
//    dapat diakses oleh komponen manapun cukup dengan memanggil `useTasks()`.
// 3. Debouncing: Mencegah spam request ke backend saat user mengetik di kotak pencarian.
// 4. Synchronization: Menjaga konsistensi antara data list tugas dan ringkasan dashboard KPI.
// ==============================================================================

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
  // Mengambil fungsi showToast dari ToastContext untuk notifikasi popup feedback
  const { showToast } = useToast();

  // ----------------------------------------------------------------------------
  // 1. State Data Utama & Ringkasan Dashboard
  // ----------------------------------------------------------------------------
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummaryResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ----------------------------------------------------------------------------
  // 2. State Kontrol Filter, Pencarian, & Paginasi
  // ----------------------------------------------------------------------------
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

  // ----------------------------------------------------------------------------
  // 3. State Status Loading & Error
  // ----------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------------------------
  // 4. Debounce Pencarian Judul (Search) - 300 milidetik
  // ----------------------------------------------------------------------------
  // Debouncing menunda pembaruan debouncedSearch hingga user berhenti mengetik selama 300ms.
  // Ini menghindari pengiriman request ke backend pada setiap ketukan tuts keyboard (keystroke).
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset kembali ke halaman 1 saat keyword pencarian berubah
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // ----------------------------------------------------------------------------
  // 5. Debounce Input Assignee - 300 milidetik
  // ----------------------------------------------------------------------------
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

  // ----------------------------------------------------------------------------
  // 6. Fetch Ringkasan Dashboard (Summary KPI)
  // ----------------------------------------------------------------------------
  // useCallback membungkus fungsi agar referensi fungsinya stabil dan tidak memicu
  // render ulang tak berujung (infinite loop) saat ditaruh di dependency array useEffect.
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

  // ----------------------------------------------------------------------------
  // 7. Fetch Daftar Tugas (Tasks List)
  // ----------------------------------------------------------------------------
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Siapkan payload parameter query yang akan dikirim ke API
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

  // Jalankan fetchTasks setiap kali ada perubahan parameter (filter, pagination, sort, debounce search)
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Jalankan fetchSummary pertama kali saat komponen dimount
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ----------------------------------------------------------------------------
  // 8. Operasi Mutasi Data (Create, Update, Quick Status, Delete)
  // ----------------------------------------------------------------------------

  /** Membuat tugas baru lalu menyegarkan data list & ringkasan secara bersamaan */
  const createTask = async (data: TaskCreate) => {
    const newTask = await taskApi.createTask(data);
    showToast(`Tugas "${newTask.title}" berhasil dibuat!`, "success");
    await Promise.all([fetchTasks(), fetchSummary()]);
    return newTask;
  };

  /** Memperbarui tugas lalu menyegarkan data */
  const updateTask = async (id: number, data: TaskUpdate) => {
    const updated = await taskApi.updateTask(id, data);
    showToast(`Tugas "${updated.title}" berhasil diperbarui!`, "success");
    await Promise.all([fetchTasks(), fetchSummary()]);
    return updated;
  };

  /** Memperbarui status tugas secara cepat dari badge/dropdown di tabel/grid */
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

  /** Menghapus tugas dari sistem dengan penanganan pagination edge case */
  const deleteTask = async (task: Task) => {
    try {
      await taskApi.deleteTask(task.id);
      showToast(`Tugas "${task.title}" berhasil dihapus.`, "info");
      // Jika menghapus item terakhir di halaman > 1, mundurkan halaman ke (page - 1)
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

  /** Toggle filter status cepat melalui klik pada kartu ringkasan KPI */
  const toggleStatusFilter = (newStatus: string) => {
    if (newStatus === "All" || status === newStatus) {
      setStatus("All");
    } else {
      setStatus(newStatus);
      setIsOverdueFilter(false);
    }
    setPage(1);
  };

  /** Toggle filter khusus tugas yang terlambat (Overdue) */
  const toggleOverdueFilter = () => {
    setIsOverdueFilter((prev) => {
      const next = !prev;
      if (next) setStatus("All");
      return next;
    });
    setPage(1);
  };

  /** Mengembalikan semua filter ke pengaturan default */
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

  // Kembalikan seluruh state dan method yang dibutuhkan oleh antarmuka
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

