import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import React from "react";
import { DeleteConfirmModal } from "@/components/tasks/DeleteConfirmModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { formatDateTime } from "@/lib/dateUtils";
import { taskApi } from "@/services/api";
import { Task, TaskAuditLog } from "@/types/task";
import { deferred, isoInDays, makeLog, makeTask } from "./helpers";

vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  taskApi: { getTaskAuditLogs: vi.fn() },
}));

const getTaskAuditLogs = vi.mocked(taskApi.getTaskAuditLogs);

beforeEach(() => {
  getTaskAuditLogs.mockReset();
  getTaskAuditLogs.mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ------------------------------------------------------------------------------
// DeleteConfirmModal
// ------------------------------------------------------------------------------
describe("DeleteConfirmModal", () => {
  function renderModal(props: Partial<React.ComponentProps<typeof DeleteConfirmModal>> = {}) {
    const task = makeTask({ id: 9, title: "Hapus saya" });
    const onClose = vi.fn();
    const onConfirmDelete = vi.fn().mockResolvedValue(undefined);
    const utils = render(
      <DeleteConfirmModal
        task={task}
        isOpen
        onClose={onClose}
        onConfirmDelete={onConfirmDelete}
        {...props}
      />
    );
    return { task, onClose, onConfirmDelete, ...utils };
  }

  it("tidak merender apa pun tanpa task", () => {
    const { container } = renderModal({ task: null });
    expect(container).toBeEmptyDOMElement();
  });

  it("tidak merender apa pun saat tertutup", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menampilkan identitas tugas dan peringatan", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "Konfirmasi Hapus Tugas" })).toBeInTheDocument();
    expect(screen.getByText("Hapus Tugas #9?")).toBeInTheDocument();
    expect(screen.getByText('"Hapus saya"')).toBeInTheDocument();
    expect(screen.getByText("Tindakan ini permanen dan tidak dapat dibatalkan.")).toBeInTheDocument();
  });

  it("Batal menutup modal tanpa menghapus", () => {
    const { onClose, onConfirmDelete } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirmDelete).not.toHaveBeenCalled();
  });

  it("konfirmasi menghapus tugas lalu menutup modal", async () => {
    const { task, onClose, onConfirmDelete } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Ya, Hapus" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirmDelete).toHaveBeenCalledExactlyOnceWith(task);
    expect(screen.getByRole("button", { name: "Ya, Hapus" })).toBeEnabled();
  });

  it("selama proses hapus: tombol nonaktif, tidak bisa ditutup, tidak bisa dobel submit", async () => {
    const pending = deferred<void>();
    const onConfirmDelete = vi.fn().mockReturnValue(pending.promise);
    const { onClose } = renderModal({ onConfirmDelete });

    fireEvent.click(screen.getByRole("button", { name: "Ya, Hapus" }));

    const confirmButton = await screen.findByRole("button", { name: "Menghapus..." });
    expect(confirmButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Batal" })).toBeDisabled();

    // Escape dan tombol X diabaikan selama proses berlangsung
    fireEvent.click(confirmButton);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ------------------------------------------------------------------------------
// TaskDetailModal
// ------------------------------------------------------------------------------
describe("TaskDetailModal", () => {
  type Props = React.ComponentProps<typeof TaskDetailModal>;

  function setup(taskOverrides: Partial<Task> = {}, props: Partial<Props> = {}) {
    const task = makeTask({ id: 5, ...taskOverrides });
    const handlers = {
      onClose: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onQuickStatusChange: vi.fn(),
    };
    const utils = render(<TaskDetailModal task={task} isOpen {...handlers} {...props} />);
    return { task, ...handlers, ...utils };
  }

  /** Menunggu fetch audit log selesai agar tidak ada update state di luar act. */
  async function setupLoaded(taskOverrides: Partial<Task> = {}, logs: TaskAuditLog[] = []) {
    getTaskAuditLogs.mockResolvedValue(logs);
    const utils = setup(taskOverrides);
    await waitFor(() => expect(document.querySelector(".animate-pulse.flex")).not.toBeInTheDocument());
    return utils;
  }

  it("tidak merender apa pun dan tidak memuat log tanpa task", () => {
    const { container } = setup({}, { task: null });
    expect(container).toBeEmptyDOMElement();
    expect(getTaskAuditLogs).not.toHaveBeenCalled();
  });

  it("tidak memuat log saat tertutup", () => {
    setup({}, { isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getTaskAuditLogs).not.toHaveBeenCalled();
  });

  it("menampilkan rincian tugas", async () => {
    const { task } = await setupLoaded({
      title: "Rilis v1",
      description: "Catatan rilis",
      status: "In Progress",
      priority: "High",
      assignee: "Siti",
    });

    expect(screen.getByRole("dialog", { name: "Detail Tugas #5" })).toBeInTheDocument();
    expect(screen.getByText("ID: 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rilis v1" })).toBeInTheDocument();
    expect(screen.getByText("Catatan rilis")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Siti")).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(task.due_date))).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(task.created_at))).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(task.updated_at))).toBeInTheDocument();
  });

  it("menampilkan teks pengganti untuk data kosong", async () => {
    await setupLoaded({ description: null, assignee: null, due_date: null });

    expect(screen.getByText("Tidak ada deskripsi rinci untuk tugas ini.")).toBeInTheDocument();
    expect(screen.getByText("Belum ditentukan")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("menandai overdue hanya jika terlambat dan belum selesai", async () => {
    const { unmount } = await setupLoaded({ due_date: isoInDays(-1), status: "To Do" });
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    unmount();

    await setupLoaded({ due_date: isoInDays(-1), status: "Done" });
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  describe("kontrol status", () => {
    it.each(["To Do", "In Progress", "Done"] as const)("menandai status aktif %s", async (status) => {
      await setupLoaded({ status });
      for (const each of ["To Do", "In Progress", "Done"]) {
        const button = screen.getByTitle(`Ubah status ke ${each}`);
        if (each === status) {
          expect(button).toHaveClass("text-white");
        } else {
          expect(button).not.toHaveClass("text-white");
        }
      }
    });

    it("memilih status lain memanggil onQuickStatusChange", async () => {
      const { task, onQuickStatusChange } = await setupLoaded({ status: "To Do" });

      fireEvent.click(screen.getByTitle("Ubah status ke Done"));
      expect(onQuickStatusChange).toHaveBeenLastCalledWith(task, "Done");

      fireEvent.click(screen.getByTitle("Ubah status ke In Progress"));
      expect(onQuickStatusChange).toHaveBeenLastCalledWith(task, "In Progress");
      expect(onQuickStatusChange).toHaveBeenCalledTimes(2);
    });

    it("klik status yang sedang aktif tidak melakukan apa-apa", async () => {
      const { onQuickStatusChange } = await setupLoaded({ status: "In Progress" });
      fireEvent.click(screen.getByTitle("Ubah status ke In Progress"));
      expect(onQuickStatusChange).not.toHaveBeenCalled();
    });
  });

  describe("tombol aksi", () => {
    it("Tutup hanya menutup modal", async () => {
      const { onClose, onEdit, onDelete } = await setupLoaded();
      fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onEdit).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it("Edit Tugas menutup modal lalu membuka edit", async () => {
      const { task, onClose, onEdit } = await setupLoaded();
      fireEvent.click(screen.getByRole("button", { name: "Edit Tugas" }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledExactlyOnceWith(task);
    });

    it("Hapus Tugas menutup modal lalu membuka konfirmasi hapus", async () => {
      const { task, onClose, onDelete } = await setupLoaded();
      fireEvent.click(screen.getByRole("button", { name: "Hapus Tugas" }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledExactlyOnceWith(task);
    });
  });

  describe("riwayat audit log", () => {
    it("memuat log untuk task yang dibuka", async () => {
      await setupLoaded();
      expect(getTaskAuditLogs).toHaveBeenCalledExactlyOnceWith(5);
    });

    it("menampilkan skeleton selama memuat", async () => {
      const pending = deferred<TaskAuditLog[]>();
      getTaskAuditLogs.mockReturnValue(pending.promise);
      setup();

      expect(document.querySelectorAll(".animate-pulse.flex")).toHaveLength(2);
      expect(screen.queryByText("Belum ada riwayat perubahan status tercatat.")).not.toBeInTheDocument();

      await act(async () => {
        pending.resolve([]);
      });
      expect(document.querySelector(".animate-pulse.flex")).not.toBeInTheDocument();
    });

    it("menampilkan pesan kosong jika belum ada log", async () => {
      await setupLoaded();
      expect(screen.getByText("Belum ada riwayat perubahan status tercatat.")).toBeInTheDocument();
      expect(screen.queryByText(/catatan$/)).not.toBeInTheDocument();
    });

    it("menampilkan entri awal dan transisi status beserta jumlahnya", async () => {
      await setupLoaded({ status: "Done" }, [
        makeLog({ id: 3, old_status: "In Progress", new_status: "Done", changed_at: "2026-03-03T10:00:00Z" }),
        makeLog({ id: 2, old_status: "To Do", new_status: "In Progress", changed_at: "2026-02-02T10:00:00Z" }),
        makeLog({ id: 1, old_status: null, new_status: "To Do", changed_at: "2026-01-01T10:00:00Z" }),
      ]);

      expect(screen.getByText("3 catatan")).toBeInTheDocument();

      const timeline = screen.getByText("Status Awal:").closest(".border-l-2") as HTMLElement;
      const entries = Array.from(timeline.children) as HTMLElement[];
      expect(entries).toHaveLength(3);

      // Terbaru di atas: In Progress -> Done
      expect(entries[0]).toHaveTextContent("In ProgressDone");
      expect(entries[0]).toHaveTextContent(formatDateTime("2026-03-03T10:00:00Z"));
      expect(entries[1]).toHaveTextContent("To DoIn Progress");
      expect(entries[2]).toHaveTextContent("Status Awal:To Do");
      expect(within(entries[0]).queryByText("Status Awal:")).not.toBeInTheDocument();
    });

    it("menyorot penanda entri terbaru", async () => {
      await setupLoaded({}, [
        makeLog({ id: 2, old_status: "To Do", new_status: "Done" }),
        makeLog({ id: 1 }),
      ]);

      const timeline = screen.getByText("Status Awal:").closest(".border-l-2") as HTMLElement;
      const markers = Array.from(timeline.children).map((entry) => entry.firstElementChild);
      expect(markers[0]).toHaveClass("bg-indigo-600");
      expect(markers[1]).toHaveClass("bg-slate-400");
    });

    it("gagal memuat log: dicatat ke console dan menampilkan pesan kosong", async () => {
      const failure = new Error("server mati");
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      getTaskAuditLogs.mockRejectedValue(failure);
      setup();

      expect(await screen.findByText("Belum ada riwayat perubahan status tercatat.")).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith("Gagal mengambil riwayat audit log:", failure);
    });

    it("memuat ulang log saat status tugas berubah", async () => {
      const { task, rerender, onClose, onEdit, onDelete, onQuickStatusChange } = await setupLoaded({
        status: "To Do",
      });
      expect(getTaskAuditLogs).toHaveBeenCalledTimes(1);

      getTaskAuditLogs.mockResolvedValue([makeLog({ id: 2, old_status: "To Do", new_status: "Done" })]);
      rerender(
        <TaskDetailModal
          task={{ ...task, status: "Done" }}
          isOpen
          onClose={onClose}
          onEdit={onEdit}
          onDelete={onDelete}
          onQuickStatusChange={onQuickStatusChange}
        />
      );

      expect(await screen.findByText("1 catatan")).toBeInTheDocument();
      expect(getTaskAuditLogs).toHaveBeenCalledTimes(2);
    });

    it("tidak memuat ulang log saat field lain berubah", async () => {
      const { task, rerender, onClose, onEdit, onDelete, onQuickStatusChange } = await setupLoaded();

      rerender(
        <TaskDetailModal
          task={{ ...task, title: "Judul lain" }}
          isOpen
          onClose={onClose}
          onEdit={onEdit}
          onDelete={onDelete}
          onQuickStatusChange={onQuickStatusChange}
        />
      );

      expect(screen.getByRole("heading", { name: "Judul lain" })).toBeInTheDocument();
      expect(getTaskAuditLogs).toHaveBeenCalledTimes(1);
    });

    it("mengosongkan log saat modal ditutup dan memuat lagi saat dibuka", async () => {
      const { task, rerender, onClose, onEdit, onDelete, onQuickStatusChange } = await setupLoaded({}, [
        makeLog(),
      ]);
      expect(screen.getByText("1 catatan")).toBeInTheDocument();

      const props = { task, onClose, onEdit, onDelete, onQuickStatusChange };
      rerender(<TaskDetailModal {...props} isOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      const pending = deferred<TaskAuditLog[]>();
      getTaskAuditLogs.mockReturnValue(pending.promise);
      rerender(<TaskDetailModal {...props} isOpen />);

      // Log lama tidak boleh tampil sebelum data baru tiba
      expect(screen.queryByText("1 catatan")).not.toBeInTheDocument();
      expect(getTaskAuditLogs).toHaveBeenCalledTimes(2);

      await act(async () => {
        pending.resolve([]);
      });
    });

    it("mengabaikan respons yang datang setelah unmount", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const pending = deferred<TaskAuditLog[]>();
      getTaskAuditLogs.mockReturnValue(pending.promise);
      const { unmount } = setup();

      unmount();
      await act(async () => {
        pending.resolve([makeLog()]);
      });

      expect(consoleError).not.toHaveBeenCalled();
    });
  });
});
