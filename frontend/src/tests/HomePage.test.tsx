import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import HomePage from "@/app/page";
import { useTasks } from "@/hooks/useTasks";
import { taskApi } from "@/services/api";
import { Task } from "@/types/task";
import { makeSummary, makeTask } from "./helpers";

vi.mock("@/hooks/useTasks", () => ({ useTasks: vi.fn() }));

vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  taskApi: { getTaskAuditLogs: vi.fn() },
}));

type HookState = ReturnType<typeof useTasks>;

const tasks: Task[] = [
  makeTask({ id: 1, title: "Tugas Satu", status: "To Do" }),
  makeTask({ id: 2, title: "Tugas Dua", status: "In Progress" }),
];

function hookState(overrides: Partial<HookState> = {}): HookState {
  return {
    tasks,
    summary: makeSummary(),
    total: tasks.length,
    totalPages: 3,
    page: 1,
    limit: 10,
    status: "All",
    priority: "All",
    assignee: "",
    search: "",
    isOverdueFilter: false,
    sortBy: "created_at",
    sortOrder: "desc",
    isLoading: false,
    isSummaryLoading: false,
    error: null,
    setPage: vi.fn(),
    setLimit: vi.fn(),
    setStatus: vi.fn(),
    setPriority: vi.fn(),
    setAssignee: vi.fn(),
    setSearch: vi.fn(),
    setSortBy: vi.fn(),
    setSortOrder: vi.fn(),
    toggleStatusFilter: vi.fn(),
    toggleOverdueFilter: vi.fn(),
    resetFilters: vi.fn(),
    refreshTasks: vi.fn().mockResolvedValue(undefined),
    refreshSummary: vi.fn().mockResolvedValue(undefined),
    createTask: vi.fn().mockResolvedValue(makeTask()),
    updateTask: vi.fn().mockResolvedValue(makeTask()),
    quickUpdateStatus: vi.fn().mockResolvedValue(makeTask()),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderPage(overrides: Partial<HookState> = {}) {
  const state = hookState(overrides);
  vi.mocked(useTasks).mockReturnValue(state);
  const utils = render(<HomePage />);
  return { state, ...utils };
}

const dialog = (name: string | RegExp) => screen.getByRole("dialog", { name });
const queryDialog = () => screen.queryByRole("dialog");
const row = (title: string) => screen.getByText(title).closest("tr")!;

/** Membuka modal detail dan menunggu audit log selesai dimuat. */
async function openDetail(title: string) {
  fireEvent.click(row(title));
  await screen.findByText("Belum ada riwayat perubahan status tercatat.");
}

beforeEach(() => {
  vi.mocked(taskApi.getTaskAuditLogs).mockReset().mockResolvedValue([]);
});

describe("HomePage", () => {
  describe("kerangka halaman", () => {
    it("menampilkan header, judul bagian, dan footer", () => {
      renderPage();
      expect(screen.getByText("iTasks")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Ringkasan Dasbor" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Daftar Tugas" })).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${new Date().getFullYear()} iTasks`))).toBeInTheDocument();
    });

    it("tautan API Docs terbuka di tab baru", () => {
      renderPage();
      const link = screen.getByRole("link", { name: /API Docs/ });
      expect(link).toHaveAttribute("href", "http://localhost:8000/docs");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    });

    it("tombol sinkron menyegarkan daftar dan ringkasan", () => {
      const { state } = renderPage();
      expect(screen.getByText("Synced")).toBeInTheDocument();

      fireEvent.click(screen.getByTitle("Klik untuk menyinkronkan data"));

      expect(state.refreshTasks).toHaveBeenCalledTimes(1);
      expect(state.refreshSummary).toHaveBeenCalledTimes(1);
    });

    it("indikator sinkron berubah saat memuat", () => {
      renderPage({ isLoading: true });
      expect(screen.getByText("Syncing...")).toBeInTheDocument();
      expect(screen.queryByText("Synced")).not.toBeInTheDocument();
    });
  });

  describe("ringkasan dasbor", () => {
    it("menampilkan skeleton saat ringkasan pertama kali dimuat", () => {
      renderPage({ isSummaryLoading: true, summary: null });
      expect(screen.queryByTitle("Klik untuk memfilter: Total Tugas")).not.toBeInTheDocument();
      expect(screen.queryByText("Progres Penyelesaian Keseluruhan")).not.toBeInTheDocument();
    });

    it("tetap menampilkan ringkasan lama saat menyegarkan", () => {
      renderPage({ isSummaryLoading: true, summary: makeSummary() });
      expect(screen.getByTitle("Klik untuk memfilter: Total Tugas")).toBeInTheDocument();
    });

    it("menampilkan kartu ringkasan dan progress bar", () => {
      renderPage({ summary: makeSummary({ total: 10, done: 3 }) });
      expect(screen.getByTitle("Klik untuk memfilter: Total Tugas")).toBeInTheDocument();
      expect(screen.getByText("3 dari 10 tugas diselesaikan (30%)")).toBeInTheDocument();
    });

    it("klik kartu meneruskan ke toggle filter", () => {
      const { state } = renderPage();

      fireEvent.click(screen.getByTitle("Klik untuk memfilter: Done"));
      expect(state.toggleStatusFilter).toHaveBeenCalledExactlyOnceWith("Done");

      fireEvent.click(screen.getByTitle("Klik untuk memfilter: Overdue"));
      expect(state.toggleOverdueFilter).toHaveBeenCalledTimes(1);
    });

    it("menandai kartu sesuai filter yang aktif", () => {
      renderPage({ status: "Done" });
      expect(
        within(screen.getByTitle("Klik untuk memfilter: Done")).getByText("Aktif")
      ).toBeInTheDocument();
    });
  });

  describe("filter bar", () => {
    it("meneruskan interaksi filter ke hook", () => {
      const { state } = renderPage();
      const [statusSelect, prioritySelect, sortSelect] = screen.getAllByRole("combobox");

      fireEvent.change(screen.getByPlaceholderText("Cari judul tugas..."), { target: { value: "api" } });
      expect(state.setSearch).toHaveBeenCalledWith("api");

      fireEvent.change(statusSelect, { target: { value: "Done" } });
      expect(state.setStatus).toHaveBeenCalledWith("Done");

      fireEvent.change(prioritySelect, { target: { value: "High" } });
      expect(state.setPriority).toHaveBeenCalledWith("High");

      fireEvent.change(screen.getByPlaceholderText("Cari nama..."), { target: { value: "Budi" } });
      expect(state.setAssignee).toHaveBeenCalledWith("Budi");

      fireEvent.change(sortSelect, { target: { value: "title" } });
      expect(state.setSortBy).toHaveBeenCalledWith("title");
    });

    it("menampilkan nilai filter dari hook", () => {
      renderPage({ search: "api", status: "Done", priority: "High", assignee: "Budi", sortBy: "title" });
      const [statusSelect, prioritySelect, sortSelect] = screen.getAllByRole("combobox");

      expect(screen.getByPlaceholderText("Cari judul tugas...")).toHaveValue("api");
      expect(statusSelect).toHaveValue("Done");
      expect(prioritySelect).toHaveValue("High");
      expect(sortSelect).toHaveValue("title");
      expect(screen.getByPlaceholderText("Cari nama...")).toHaveValue("Budi");
    });

    it("Reset Semua memanggil resetFilters", () => {
      const { state } = renderPage({ status: "Done" });
      fireEvent.click(screen.getByRole("button", { name: "Reset Semua" }));
      expect(state.resetFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe("status tampilan daftar", () => {
    it("menampilkan banner error dan tombol coba lagi", () => {
      const { state } = renderPage({ error: "Gagal terhubung ke server backend." });

      expect(screen.getByText("Gagal terhubung ke server backend.")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Coba Lagi" }));
      expect(state.refreshTasks).toHaveBeenCalledTimes(1);
    });

    it("tanpa error tidak ada banner", () => {
      renderPage();
      expect(screen.queryByRole("button", { name: "Coba Lagi" })).not.toBeInTheDocument();
    });

    it.each([
      [10, 5],
      [5, 5],
      [3, 3],
    ])("saat memuat (tabel, limit %i) menampilkan %i baris skeleton", (limit, expectedRows) => {
      renderPage({ isLoading: true, limit });
      expect(screen.getAllByRole("row")).toHaveLength(expectedRows);
      expect(screen.queryByText("Tugas Satu")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Next page")).not.toBeInTheDocument();
    });

    it.each([
      [10, 6],
      [5, 5],
    ])("saat memuat (grid, limit %i) menampilkan %i kartu skeleton", (limit, expectedCards) => {
      const { container } = renderPage({ isLoading: true, limit });
      fireEvent.click(screen.getByTitle("Tampilan Kartu / Grid"));

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const grid = container.querySelector("main .grid.md\\:grid-cols-2")!;
      expect(grid.children).toHaveLength(expectedCards);
    });

    it("daftar kosong tanpa filter mengajak membuat tugas", () => {
      renderPage({ tasks: [], total: 0 });
      expect(screen.getByText("Belum Ada Tugas")).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Next page")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Buat Tugas Baru" }));
      expect(dialog("Buat Tugas Baru")).toBeInTheDocument();
    });

    it.each<[string, Partial<HookState>]>([
      ["search", { search: "api" }],
      ["status", { status: "Done" }],
      ["priority", { priority: "High" }],
      ["assignee", { assignee: "Budi" }],
      ["overdue", { isOverdueFilter: true }],
    ])("daftar kosong dengan filter %s menawarkan reset", (_name, filter) => {
      const { state } = renderPage({ tasks: [], total: 0, ...filter });

      expect(screen.getByText("Tidak Ada Tugas yang Cocok")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Reset Semua Filter" }));
      expect(state.resetFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe("tampilan data", () => {
    it("default menampilkan tabel berisi tugas", () => {
      renderPage();
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("Tugas Satu")).toBeInTheDocument();
      expect(screen.getByText("Tugas Dua")).toBeInTheDocument();
    });

    it("dapat beralih ke tampilan kartu dan kembali ke tabel", () => {
      renderPage();

      fireEvent.click(screen.getByTitle("Tampilan Kartu / Grid"));
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getAllByTitle("Klik untuk melihat rincian tugas")).toHaveLength(2);

      fireEvent.click(screen.getByTitle("Tampilan Tabel"));
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("pagination terhubung ke setPage dan setLimit", () => {
      const { state } = renderPage({ page: 2, total: 25, totalPages: 3 });

      fireEvent.click(screen.getByLabelText("Next page"));
      expect(state.setPage).toHaveBeenCalledWith(3);

      const limitSelect = screen.getAllByRole("combobox")[3];
      fireEvent.change(limitSelect, { target: { value: "20" } });
      expect(state.setLimit).toHaveBeenCalledWith(20);
    });

    it("ubah status cepat dari tabel memanggil quickUpdateStatus", () => {
      const { state } = renderPage();
      fireEvent.click(within(row("Tugas Satu")).getByTitle("Klik untuk mengubah status"));
      fireEvent.click(within(row("Tugas Satu")).getByRole("button", { name: "Done" }));
      expect(state.quickUpdateStatus).toHaveBeenCalledExactlyOnceWith(tasks[0], "Done");
    });

    it("ubah status cepat dari kartu memanggil quickUpdateStatus", () => {
      const { state } = renderPage();
      fireEvent.click(screen.getByTitle("Tampilan Kartu / Grid"));
      fireEvent.click(screen.getByTitle("Mulai Kerjakan"));
      expect(state.quickUpdateStatus).toHaveBeenCalledExactlyOnceWith(tasks[0], "In Progress");
    });
  });

  describe("modal form", () => {
    it("Tambah Tugas membuka form kosong dan submit memanggil createTask", async () => {
      const { state } = renderPage();
      expect(queryDialog()).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Tambah Tugas" }));
      expect(dialog("Buat Tugas Baru")).toBeInTheDocument();
      expect(screen.getByLabelText(/Judul Tugas/i)).toHaveValue("");

      fireEvent.change(screen.getByLabelText(/Judul Tugas/i), { target: { value: "Tugas Baru" } });
      fireEvent.click(screen.getByRole("button", { name: "Buat Tugas" }));

      await waitFor(() => expect(state.createTask).toHaveBeenCalledTimes(1));
      expect(state.createTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Tugas Baru" }));
      expect(state.updateTask).not.toHaveBeenCalled();
      await waitFor(() => expect(queryDialog()).not.toBeInTheDocument());
    });

    it("Edit dari tabel membuka form terisi dan submit memanggil updateTask", async () => {
      const { state } = renderPage();

      fireEvent.click(within(row("Tugas Dua")).getByLabelText("Edit task"));
      expect(dialog("Edit Tugas: #2")).toBeInTheDocument();
      expect(screen.getByLabelText(/Judul Tugas/i)).toHaveValue("Tugas Dua");

      fireEvent.change(screen.getByLabelText(/Judul Tugas/i), { target: { value: "Tugas Dua Revisi" } });
      fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

      await waitFor(() => expect(state.updateTask).toHaveBeenCalledTimes(1));
      expect(state.updateTask).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ title: "Tugas Dua Revisi", status: "In Progress" })
      );
      expect(state.createTask).not.toHaveBeenCalled();
      await waitFor(() => expect(queryDialog()).not.toBeInTheDocument());
    });

    it("membatalkan edit lalu Tambah Tugas membuka form kosong", () => {
      renderPage();
      fireEvent.click(within(row("Tugas Dua")).getByLabelText("Edit task"));
      fireEvent.click(screen.getByRole("button", { name: "Batal" }));
      expect(queryDialog()).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Tambah Tugas" }));
      expect(dialog("Buat Tugas Baru")).toBeInTheDocument();
      expect(screen.getByLabelText(/Judul Tugas/i)).toHaveValue("");
    });

    it("kegagalan simpan menampilkan error dan form tetap terbuka", async () => {
      renderPage({ createTask: vi.fn().mockRejectedValue(new Error("gagal")) });
      fireEvent.click(screen.getByRole("button", { name: "Tambah Tugas" }));
      fireEvent.change(screen.getByLabelText(/Judul Tugas/i), { target: { value: "Tugas Baru" } });
      fireEvent.click(screen.getByRole("button", { name: "Buat Tugas" }));

      expect(
        await screen.findByText("Terjadi kesalahan tidak terduga saat menyimpan tugas.")
      ).toBeInTheDocument();
      expect(dialog("Buat Tugas Baru")).toBeInTheDocument();
    });
  });

  describe("modal detail", () => {
    it("klik baris membuka detail dan memuat audit log", async () => {
      renderPage();
      await openDetail("Tugas Dua");

      expect(dialog("Detail Tugas #2")).toBeInTheDocument();
      expect(taskApi.getTaskAuditLogs).toHaveBeenCalledExactlyOnceWith(2);
    });

    it("Tutup menutup detail", async () => {
      renderPage();
      await openDetail("Tugas Satu");
      fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
      expect(queryDialog()).not.toBeInTheDocument();
    });

    it("Edit Tugas dari detail beralih ke form edit", async () => {
      renderPage();
      await openDetail("Tugas Satu");

      fireEvent.click(screen.getByRole("button", { name: "Edit Tugas" }));

      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(dialog("Edit Tugas: #1")).toBeInTheDocument();
    });

    it("Hapus Tugas dari detail beralih ke konfirmasi hapus", async () => {
      renderPage();
      await openDetail("Tugas Satu");

      fireEvent.click(screen.getByRole("button", { name: "Hapus Tugas" }));

      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(dialog("Konfirmasi Hapus Tugas")).toBeInTheDocument();
      expect(screen.getByText("Hapus Tugas #1?")).toBeInTheDocument();
    });

    it("ubah status dari detail memperbarui tampilan detail dengan hasil server", async () => {
      const updated = { ...tasks[0], status: "Done" as const, title: "Tugas Satu (selesai)" };
      const { state } = renderPage({ quickUpdateStatus: vi.fn().mockResolvedValue(updated) });
      await openDetail("Tugas Satu");

      fireEvent.click(screen.getByTitle("Ubah status ke Done"));

      expect(await screen.findByRole("heading", { name: "Tugas Satu (selesai)" })).toBeInTheDocument();
      expect(state.quickUpdateStatus).toHaveBeenCalledExactlyOnceWith(tasks[0], "Done");
      expect(screen.getByTitle("Ubah status ke Done")).toHaveClass("text-white");
      // Status berubah -> audit log dimuat ulang
      await waitFor(() => expect(taskApi.getTaskAuditLogs).toHaveBeenCalledTimes(2));
    });
  });

  describe("modal hapus", () => {
    it("Hapus dari tabel membuka konfirmasi, lalu konfirmasi memanggil deleteTask", async () => {
      const { state } = renderPage();

      fireEvent.click(within(row("Tugas Dua")).getByLabelText("Delete task"));
      expect(dialog("Konfirmasi Hapus Tugas")).toBeInTheDocument();
      expect(screen.getByText("Hapus Tugas #2?")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Ya, Hapus" }));

      await waitFor(() => expect(state.deleteTask).toHaveBeenCalledExactlyOnceWith(tasks[1]));
      await waitFor(() => expect(queryDialog()).not.toBeInTheDocument());
    });

    it("Batal menutup konfirmasi tanpa menghapus", () => {
      const { state } = renderPage();
      fireEvent.click(within(row("Tugas Satu")).getByLabelText("Delete task"));
      fireEvent.click(screen.getByRole("button", { name: "Batal" }));

      expect(queryDialog()).not.toBeInTheDocument();
      expect(state.deleteTask).not.toHaveBeenCalled();
    });
  });
});
