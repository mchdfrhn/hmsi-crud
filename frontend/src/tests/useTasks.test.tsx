import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTasks } from "@/hooks/useTasks";
import { taskApi } from "@/services/api";
import { Task, TaskListResponse } from "@/types/task";
import { deferred, makeSummary, makeTask } from "./helpers";

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ showToast }),
}));

vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  taskApi: {
    getTasks: vi.fn(),
    getSummary: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

const api = vi.mocked(taskApi);

const DEFAULT_PARAMS = {
  page: 1,
  limit: 10,
  status: undefined,
  priority: undefined,
  assignee: undefined,
  search: undefined,
  is_overdue: undefined,
  sort_by: "created_at",
  sort_order: "desc",
};

function listResponse(items: Task[] = [], overrides: Partial<TaskListResponse> = {}): TaskListResponse {
  return { items, total: items.length, page: 1, limit: 10, total_pages: 1, ...overrides };
}

/** Memajukan fake timer sambil menyelesaikan promise & update state React. */
async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** Merender hook lalu menunggu fetch awal dan debounce awal (300ms) selesai. */
async function setup() {
  const view = renderHook(() => useTasks());
  await flush(300);
  api.getTasks.mockClear();
  api.getSummary.mockClear();
  return view;
}

const lastParams = () => api.getTasks.mock.calls[api.getTasks.mock.calls.length - 1][0]!;

beforeEach(() => {
  vi.useFakeTimers();
  showToast.mockReset();
  for (const fn of Object.values(api)) fn.mockReset();
  api.getTasks.mockResolvedValue(listResponse());
  api.getSummary.mockResolvedValue(makeSummary());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useTasks", () => {
  describe("pemuatan awal", () => {
    it("state awal sebelum data tiba", () => {
      api.getTasks.mockReturnValue(new Promise(() => {}));
      api.getSummary.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useTasks());

      expect(result.current).toMatchObject({
        tasks: [],
        summary: null,
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 10,
        status: "All",
        priority: "All",
        assignee: "",
        search: "",
        isOverdueFilter: false,
        sortBy: "created_at",
        sortOrder: "desc",
        isLoading: true,
        isSummaryLoading: true,
        error: null,
      });
    });

    it("memuat daftar tugas dan ringkasan sekali dengan parameter default", async () => {
      const tasks = [makeTask({ id: 1 }), makeTask({ id: 2 })];
      const summary = makeSummary({ total: 2 });
      api.getTasks.mockResolvedValue(listResponse(tasks, { total: 25, total_pages: 3 }));
      api.getSummary.mockResolvedValue(summary);

      const { result } = renderHook(() => useTasks());
      await flush(300);

      expect(api.getTasks).toHaveBeenCalledExactlyOnceWith(DEFAULT_PARAMS);
      expect(api.getSummary).toHaveBeenCalledTimes(1);
      expect(result.current.tasks).toEqual(tasks);
      expect(result.current.total).toBe(25);
      expect(result.current.totalPages).toBe(3);
      expect(result.current.summary).toEqual(summary);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSummaryLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("totalPages minimal 1 walau server mengirim 0", async () => {
      api.getTasks.mockResolvedValue(listResponse([], { total_pages: 0 }));
      const { result } = renderHook(() => useTasks());
      await flush();
      expect(result.current.totalPages).toBe(1);
    });

    it("gagal memuat daftar: menyimpan pesan error", async () => {
      api.getTasks.mockRejectedValue(new Error("Gagal terhubung ke server backend."));
      const { result } = renderHook(() => useTasks());
      await flush();

      expect(result.current.error).toBe("Gagal terhubung ke server backend.");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.tasks).toEqual([]);
    });

    it("gagal memuat daftar dengan nilai non-Error: memakai pesan default", async () => {
      api.getTasks.mockRejectedValue("rusak");
      const { result } = renderHook(() => useTasks());
      await flush();
      expect(result.current.error).toBe("Gagal memuat daftar tugas.");
    });

    it("error dibersihkan saat pemuatan berikutnya berhasil", async () => {
      api.getTasks.mockRejectedValueOnce(new Error("sementara"));
      const { result } = renderHook(() => useTasks());
      await flush();
      expect(result.current.error).toBe("sementara");

      await act(async () => {
        await result.current.refreshTasks();
      });
      expect(result.current.error).toBeNull();
    });

    it("gagal memuat ringkasan: dicatat ke console tanpa mengganggu daftar", async () => {
      const failure = new Error("ringkasan gagal");
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      api.getSummary.mockRejectedValue(failure);

      const { result } = renderHook(() => useTasks());
      await flush();

      expect(consoleError).toHaveBeenCalledWith("Error fetching summary:", failure);
      expect(result.current.summary).toBeNull();
      expect(result.current.isSummaryLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("isLoading aktif kembali selama memuat ulang", async () => {
      const { result } = await setup();
      const pending = deferred<TaskListResponse>();
      api.getTasks.mockReturnValue(pending.promise);

      act(() => {
        void result.current.refreshTasks();
      });
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        pending.resolve(listResponse());
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("debounce pencarian", () => {
    it("menunda request hingga 300ms setelah ketikan terakhir", async () => {
      const { result } = await setup();

      act(() => result.current.setSearch("a"));
      expect(result.current.search).toBe("a");
      await flush(299);
      expect(api.getTasks).not.toHaveBeenCalled();

      await flush(1);
      expect(api.getTasks).toHaveBeenCalledExactlyOnceWith({ ...DEFAULT_PARAMS, search: "a" });
    });

    it("ketikan beruntun hanya menghasilkan satu request dengan nilai terakhir", async () => {
      const { result } = await setup();

      act(() => result.current.setSearch("a"));
      await flush(200);
      act(() => result.current.setSearch("ap"));
      await flush(200);
      act(() => result.current.setSearch("api"));
      await flush(299);
      expect(api.getTasks).not.toHaveBeenCalled();

      await flush(1);
      expect(api.getTasks).toHaveBeenCalledTimes(1);
      expect(lastParams()).toMatchObject({ search: "api" });
    });

    it("memangkas spasi dan mengabaikan pencarian yang hanya spasi", async () => {
      const { result } = await setup();

      act(() => result.current.setSearch("  api  "));
      await flush(300);
      expect(lastParams()).toMatchObject({ search: "api" });

      act(() => result.current.setSearch("   "));
      await flush(300);
      expect(lastParams().search).toBeUndefined();
    });

    it("mengembalikan ke halaman 1 saat kata kunci berubah", async () => {
      const { result } = await setup();
      act(() => result.current.setPage(3));
      await flush();
      expect(result.current.page).toBe(3);

      act(() => result.current.setSearch("api"));
      await flush(300);

      expect(result.current.page).toBe(1);
      expect(lastParams()).toMatchObject({ page: 1, search: "api" });
    });

    it("timer dibatalkan saat unmount", async () => {
      const { result, unmount } = await setup();
      act(() => result.current.setSearch("api"));
      unmount();
      await flush(300);
      expect(api.getTasks).not.toHaveBeenCalled();
    });
  });

  describe("debounce assignee", () => {
    it("menunda request 300ms dan mengembalikan ke halaman 1", async () => {
      const { result } = await setup();
      act(() => result.current.setPage(2));
      await flush();
      api.getTasks.mockClear();

      act(() => result.current.setAssignee("  Budi "));
      expect(result.current.assignee).toBe("  Budi ");
      await flush(299);
      expect(api.getTasks).not.toHaveBeenCalled();

      await flush(1);
      expect(result.current.page).toBe(1);
      expect(lastParams()).toMatchObject({ page: 1, assignee: "Budi" });
    });
  });

  describe("filter, urutan, dan paginasi", () => {
    it("setStatus memfilter, mematikan overdue, dan kembali ke halaman 1", async () => {
      const { result } = await setup();
      act(() => result.current.toggleOverdueFilter());
      act(() => result.current.setPage(4));
      await flush();

      act(() => result.current.setStatus("Done"));
      await flush();

      expect(result.current.status).toBe("Done");
      expect(result.current.isOverdueFilter).toBe(false);
      expect(result.current.page).toBe(1);
      expect(lastParams()).toMatchObject({ status: "Done", is_overdue: undefined, page: 1 });
    });

    it("setPriority memfilter dan kembali ke halaman 1", async () => {
      const { result } = await setup();
      act(() => result.current.setPage(2));
      await flush();

      act(() => result.current.setPriority("High"));
      await flush();

      expect(result.current.priority).toBe("High");
      expect(lastParams()).toMatchObject({ priority: "High", page: 1 });
    });

    it("status dan priority 'All' tidak dikirim ke API", async () => {
      const { result } = await setup();
      act(() => result.current.setStatus("Done"));
      act(() => result.current.setPriority("Low"));
      await flush();

      act(() => result.current.setStatus("All"));
      act(() => result.current.setPriority("All"));
      await flush();

      expect(lastParams().status).toBeUndefined();
      expect(lastParams().priority).toBeUndefined();
    });

    it("setSortBy dan setSortOrder mengurutkan ulang dari halaman 1", async () => {
      const { result } = await setup();
      act(() => result.current.setPage(2));
      await flush();

      act(() => result.current.setSortBy("due_date"));
      await flush();
      expect(lastParams()).toMatchObject({ sort_by: "due_date", sort_order: "desc", page: 1 });

      act(() => result.current.setPage(2));
      await flush();
      act(() => result.current.setSortOrder("asc"));
      await flush();
      expect(result.current.sortOrder).toBe("asc");
      expect(lastParams()).toMatchObject({ sort_by: "due_date", sort_order: "asc", page: 1 });
    });

    it("setPage dan setLimit memuat ulang dengan nilai baru", async () => {
      const { result } = await setup();

      act(() => result.current.setPage(3));
      await flush();
      expect(lastParams()).toMatchObject({ page: 3, limit: 10 });

      act(() => result.current.setLimit(50));
      await flush();
      expect(result.current.limit).toBe(50);
      expect(lastParams()).toMatchObject({ page: 3, limit: 50 });
    });

    it("perubahan filter tidak memuat ulang ringkasan", async () => {
      const { result } = await setup();
      act(() => result.current.setStatus("Done"));
      await flush();
      expect(api.getSummary).not.toHaveBeenCalled();
    });
  });

  describe("toggleStatusFilter", () => {
    it("mengaktifkan filter status dan mematikan overdue", async () => {
      const { result } = await setup();
      act(() => result.current.toggleOverdueFilter());
      act(() => result.current.setPage(2));
      await flush();

      act(() => result.current.toggleStatusFilter("To Do"));
      await flush();

      expect(result.current.status).toBe("To Do");
      expect(result.current.isOverdueFilter).toBe(false);
      expect(result.current.page).toBe(1);
      expect(lastParams()).toMatchObject({ status: "To Do", is_overdue: undefined });
    });

    it("status yang sama diklik lagi kembali ke All", async () => {
      const { result } = await setup();
      act(() => result.current.toggleStatusFilter("Done"));
      await flush();
      act(() => result.current.toggleStatusFilter("Done"));
      await flush();
      expect(result.current.status).toBe("All");
    });

    it("berpindah langsung antar status", async () => {
      const { result } = await setup();
      act(() => result.current.toggleStatusFilter("Done"));
      act(() => result.current.toggleStatusFilter("In Progress"));
      await flush();
      expect(result.current.status).toBe("In Progress");
    });

    it("'All' mereset status tanpa mengubah filter overdue", async () => {
      const { result } = await setup();
      act(() => result.current.toggleStatusFilter("Done"));
      act(() => result.current.toggleOverdueFilter());
      await flush();

      act(() => result.current.toggleStatusFilter("All"));
      await flush();

      expect(result.current.status).toBe("All");
      expect(result.current.isOverdueFilter).toBe(true);
    });
  });

  describe("toggleOverdueFilter", () => {
    it("mengaktifkan overdue, mereset status, dan kembali ke halaman 1", async () => {
      const { result } = await setup();
      act(() => result.current.setStatus("Done"));
      act(() => result.current.setPage(3));
      await flush();

      act(() => result.current.toggleOverdueFilter());
      await flush();

      expect(result.current.isOverdueFilter).toBe(true);
      expect(result.current.status).toBe("All");
      expect(result.current.page).toBe(1);
      expect(lastParams()).toMatchObject({ is_overdue: true, status: undefined, page: 1 });
    });

    it("mematikan overdue saat dipanggil lagi", async () => {
      const { result } = await setup();
      act(() => result.current.toggleOverdueFilter());
      await flush();
      act(() => result.current.toggleOverdueFilter());
      await flush();

      expect(result.current.isOverdueFilter).toBe(false);
      expect(lastParams().is_overdue).toBeUndefined();
    });
  });

  describe("resetFilters", () => {
    it("mengembalikan semua filter ke default tanpa menunggu debounce", async () => {
      const { result } = await setup();
      act(() => result.current.setSearch("api"));
      act(() => result.current.setAssignee("Budi"));
      await flush(300);
      act(() => result.current.setPriority("High"));
      act(() => result.current.setSortBy("title"));
      act(() => result.current.setSortOrder("asc"));
      act(() => result.current.setStatus("Done"));
      act(() => result.current.toggleOverdueFilter());
      act(() => result.current.setPage(2));
      await flush();
      api.getTasks.mockClear();

      act(() => result.current.resetFilters());
      await flush();

      expect(result.current).toMatchObject({
        search: "",
        assignee: "",
        status: "All",
        priority: "All",
        isOverdueFilter: false,
        sortBy: "created_at",
        sortOrder: "desc",
        page: 1,
      });
      expect(lastParams()).toEqual(DEFAULT_PARAMS);
    });

    it("tidak mengubah limit", async () => {
      const { result } = await setup();
      act(() => result.current.setLimit(20));
      await flush();

      act(() => result.current.resetFilters());
      await flush();
      expect(result.current.limit).toBe(20);
    });
  });

  describe("createTask", () => {
    it("membuat tugas, menampilkan toast, dan menyegarkan daftar + ringkasan", async () => {
      const created = makeTask({ id: 11, title: "Baru" });
      api.createTask.mockResolvedValue(created);
      const { result } = await setup();

      let returned: Task | undefined;
      await act(async () => {
        returned = await result.current.createTask({ title: "Baru" });
      });

      expect(api.createTask).toHaveBeenCalledExactlyOnceWith({ title: "Baru" });
      expect(returned).toBe(created);
      expect(showToast).toHaveBeenCalledExactlyOnceWith('Tugas "Baru" berhasil dibuat!', "success");
      expect(api.getTasks).toHaveBeenCalledTimes(1);
      expect(api.getSummary).toHaveBeenCalledTimes(1);
    });

    it("kegagalan diteruskan ke pemanggil tanpa toast atau penyegaran", async () => {
      const failure = new Error("422");
      api.createTask.mockRejectedValue(failure);
      const { result } = await setup();

      await expect(act(() => result.current.createTask({ title: "" }))).rejects.toBe(failure);

      expect(showToast).not.toHaveBeenCalled();
      expect(api.getTasks).not.toHaveBeenCalled();
      expect(api.getSummary).not.toHaveBeenCalled();
    });
  });

  describe("updateTask", () => {
    it("memperbarui tugas, menampilkan toast, dan menyegarkan data", async () => {
      const updated = makeTask({ id: 4, title: "Sudah diubah" });
      api.updateTask.mockResolvedValue(updated);
      const { result } = await setup();

      let returned: Task | undefined;
      await act(async () => {
        returned = await result.current.updateTask(4, { title: "Sudah diubah" });
      });

      expect(api.updateTask).toHaveBeenCalledExactlyOnceWith(4, { title: "Sudah diubah" });
      expect(returned).toBe(updated);
      expect(showToast).toHaveBeenCalledExactlyOnceWith(
        'Tugas "Sudah diubah" berhasil diperbarui!',
        "success"
      );
      expect(api.getTasks).toHaveBeenCalledTimes(1);
      expect(api.getSummary).toHaveBeenCalledTimes(1);
    });

    it("kegagalan diteruskan ke pemanggil tanpa toast", async () => {
      const failure = new Error("404");
      api.updateTask.mockRejectedValue(failure);
      const { result } = await setup();

      await expect(act(() => result.current.updateTask(4, {}))).rejects.toBe(failure);
      expect(showToast).not.toHaveBeenCalled();
      expect(api.getTasks).not.toHaveBeenCalled();
    });
  });

  describe("quickUpdateStatus", () => {
    it("hanya mengirim status, menampilkan toast, dan menyegarkan data", async () => {
      const task = makeTask({ id: 8, status: "To Do" });
      const updated = { ...task, status: "Done" as const };
      api.updateTask.mockResolvedValue(updated);
      const { result } = await setup();

      let returned: Task | undefined;
      await act(async () => {
        returned = await result.current.quickUpdateStatus(task, "Done");
      });

      expect(api.updateTask).toHaveBeenCalledExactlyOnceWith(8, { status: "Done" });
      expect(returned).toBe(updated);
      expect(showToast).toHaveBeenCalledExactlyOnceWith('Status tugas diubah menjadi "Done"', "success");
      expect(api.getTasks).toHaveBeenCalledTimes(1);
      expect(api.getSummary).toHaveBeenCalledTimes(1);
    });

    it("kegagalan: toast error dengan pesan server lalu melempar ulang", async () => {
      const failure = new Error("Tugas dengan ID 8 tidak ditemukan.");
      api.updateTask.mockRejectedValue(failure);
      const { result } = await setup();

      await expect(act(() => result.current.quickUpdateStatus(makeTask({ id: 8 }), "Done"))).rejects.toBe(
        failure
      );

      expect(showToast).toHaveBeenCalledExactlyOnceWith("Tugas dengan ID 8 tidak ditemukan.", "error");
      expect(api.getTasks).not.toHaveBeenCalled();
    });

    it("kegagalan non-Error memakai pesan default", async () => {
      api.updateTask.mockRejectedValue("rusak");
      const { result } = await setup();

      await expect(act(() => result.current.quickUpdateStatus(makeTask(), "Done"))).rejects.toBe("rusak");
      expect(showToast).toHaveBeenCalledExactlyOnceWith("Gagal mengubah status tugas.", "error");
    });
  });

  describe("deleteTask", () => {
    it("menghapus tugas, menampilkan toast info, dan menyegarkan data", async () => {
      const task = makeTask({ id: 3, title: "Usang" });
      api.getTasks.mockResolvedValue(listResponse([task, makeTask({ id: 4 })]));
      api.deleteTask.mockResolvedValue({ detail: "ok", id: 3 });
      const { result } = await setup();

      await act(async () => {
        await result.current.deleteTask(task);
      });

      expect(api.deleteTask).toHaveBeenCalledExactlyOnceWith(3);
      expect(showToast).toHaveBeenCalledExactlyOnceWith('Tugas "Usang" berhasil dihapus.', "info");
      expect(api.getTasks).toHaveBeenCalledTimes(1);
      expect(api.getSummary).toHaveBeenCalledTimes(1);
      expect(result.current.page).toBe(1);
    });

    it("menghapus item terakhir di halaman > 1 memundurkan halaman", async () => {
      const task = makeTask({ id: 21 });
      api.getTasks.mockResolvedValue(listResponse([task], { total: 21, total_pages: 3 }));
      api.deleteTask.mockResolvedValue({ detail: "ok", id: 21 });
      const { result } = await setup();
      act(() => result.current.setPage(3));
      await flush();
      api.getTasks.mockClear();

      await act(async () => {
        await result.current.deleteTask(task);
      });
      await flush();

      expect(result.current.page).toBe(2);
      // Satu kali muat ulang, dipicu oleh perubahan halaman (bukan fetch ganda)
      expect(api.getTasks).toHaveBeenCalledExactlyOnceWith({ ...DEFAULT_PARAMS, page: 2 });
      expect(api.getSummary).toHaveBeenCalledTimes(1);
    });

    it("menghapus item terakhir di halaman 1 tetap di halaman 1", async () => {
      const task = makeTask({ id: 1 });
      api.getTasks.mockResolvedValue(listResponse([task]));
      api.deleteTask.mockResolvedValue({ detail: "ok", id: 1 });
      const { result } = await setup();

      await act(async () => {
        await result.current.deleteTask(task);
      });

      expect(result.current.page).toBe(1);
      expect(api.getTasks).toHaveBeenCalledTimes(1);
    });

    it("menghapus dari halaman > 1 yang masih punya item lain tidak mengubah halaman", async () => {
      const task = makeTask({ id: 12 });
      api.getTasks.mockResolvedValue(listResponse([task, makeTask({ id: 13 })], { total_pages: 2 }));
      api.deleteTask.mockResolvedValue({ detail: "ok", id: 12 });
      const { result } = await setup();
      act(() => result.current.setPage(2));
      await flush();

      await act(async () => {
        await result.current.deleteTask(task);
      });

      expect(result.current.page).toBe(2);
    });

    it("kegagalan: toast error lalu melempar ulang tanpa menyegarkan data", async () => {
      const failure = new Error("Tugas dengan ID 3 tidak ditemukan.");
      api.deleteTask.mockRejectedValue(failure);
      const { result } = await setup();

      await expect(act(() => result.current.deleteTask(makeTask({ id: 3 })))).rejects.toBe(failure);

      expect(showToast).toHaveBeenCalledExactlyOnceWith("Tugas dengan ID 3 tidak ditemukan.", "error");
      expect(api.getTasks).not.toHaveBeenCalled();
      expect(api.getSummary).not.toHaveBeenCalled();
    });

    it("kegagalan non-Error memakai pesan default", async () => {
      api.deleteTask.mockRejectedValue(null);
      const { result } = await setup();

      await expect(act(() => result.current.deleteTask(makeTask()))).rejects.toBeNull();
      expect(showToast).toHaveBeenCalledExactlyOnceWith("Gagal menghapus tugas.", "error");
    });
  });

  describe("refresh manual", () => {
    it("refreshTasks dan refreshSummary memuat ulang masing-masing data", async () => {
      const { result } = await setup();

      await act(async () => {
        await result.current.refreshTasks();
      });
      expect(api.getTasks).toHaveBeenCalledExactlyOnceWith(DEFAULT_PARAMS);
      expect(api.getSummary).not.toHaveBeenCalled();

      const fresh = makeSummary({ total: 99 });
      api.getSummary.mockResolvedValue(fresh);
      await act(async () => {
        await result.current.refreshSummary();
      });
      expect(result.current.summary).toEqual(fresh);
    });
  });
});
