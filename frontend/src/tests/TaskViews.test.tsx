import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskGrid } from "@/components/tasks/TaskGrid";
import { TaskTable } from "@/components/tasks/TaskTable";
import { formatDateTime } from "@/lib/dateUtils";
import { Task } from "@/types/task";
import { isoInDays, makeTask } from "./helpers";

function handlers() {
  return {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onQuickStatusChange: vi.fn(),
  };
}

// ------------------------------------------------------------------------------
// TaskCard
// ------------------------------------------------------------------------------
describe("TaskCard", () => {
  function renderCard(overrides: Partial<Task> = {}) {
    const task = makeTask(overrides);
    const h = handlers();
    const utils = render(<TaskCard task={task} {...h} />);
    const card = screen.getByTitle("Klik untuk melihat rincian tugas");
    return { task, card, ...h, ...utils };
  }

  it("menampilkan informasi tugas", () => {
    const { task, card } = renderCard({
      id: 42,
      title: "Integrasi API",
      description: "Hubungkan frontend",
      status: "In Progress",
      priority: "High",
      assignee: "Siti",
    });

    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText("Integrasi API")).toBeInTheDocument();
    expect(screen.getByText("Hubungkan frontend")).toBeInTheDocument();
    expect(within(card).getByText("In Progress")).toBeInTheDocument();
    expect(within(card).getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Siti")).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(task.due_date))).toBeInTheDocument();
  });

  it("menampilkan teks pengganti saat deskripsi, assignee, dan tenggat kosong", () => {
    renderCard({ description: null, assignee: null, due_date: null });

    expect(screen.getByText("Tidak ada deskripsi tambahan.")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByTitle("Tenggat: -")).toHaveTextContent("-");
  });

  it("menandai tugas yang terlambat", () => {
    const { card } = renderCard({ due_date: isoInDays(-1), status: "To Do" });
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(card).toHaveClass("border-rose-200");
  });

  it("tidak menandai overdue jika sudah Done atau belum jatuh tempo", () => {
    const { unmount } = renderCard({ due_date: isoInDays(-1), status: "Done" });
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    unmount();

    const { card } = renderCard({ due_date: isoInDays(1), status: "To Do" });
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    expect(card).toHaveClass("border-slate-200");
  });

  it("status To Do: tersedia aksi Selesai dan Mulai", () => {
    renderCard({ status: "To Do" });
    expect(screen.getByTitle("Tandai Selesai")).toBeInTheDocument();
    expect(screen.getByTitle("Mulai Kerjakan")).toBeInTheDocument();
    expect(screen.queryByTitle("Buka Kembali")).not.toBeInTheDocument();
  });

  it("status In Progress: hanya tersedia aksi Selesai", () => {
    renderCard({ status: "In Progress" });
    expect(screen.getByTitle("Tandai Selesai")).toBeInTheDocument();
    expect(screen.queryByTitle("Mulai Kerjakan")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Buka Kembali")).not.toBeInTheDocument();
  });

  it("status Done: hanya tersedia aksi Reopen", () => {
    renderCard({ status: "Done" });
    expect(screen.queryByTitle("Tandai Selesai")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Mulai Kerjakan")).not.toBeInTheDocument();
    expect(screen.getByTitle("Buka Kembali")).toBeInTheDocument();
  });

  it.each([
    ["To Do", "Tandai Selesai", "Done"],
    ["To Do", "Mulai Kerjakan", "In Progress"],
    ["In Progress", "Tandai Selesai", "Done"],
    ["Done", "Buka Kembali", "In Progress"],
  ] as const)("dari %s, tombol '%s' mengubah status ke %s", (status, buttonTitle, expected) => {
    const { task, onQuickStatusChange, onView } = renderCard({ status });

    fireEvent.click(screen.getByTitle(buttonTitle));

    expect(onQuickStatusChange).toHaveBeenCalledExactlyOnceWith(task, expected);
    // Klik tombol aksi tidak boleh ikut membuka detail
    expect(onView).not.toHaveBeenCalled();
  });

  it("klik kartu membuka detail", () => {
    const { task, card, onView } = renderCard();
    fireEvent.click(card);
    expect(onView).toHaveBeenCalledExactlyOnceWith(task);
  });

  it("tombol lihat, edit, dan hapus memanggil handler masing-masing tepat sekali", () => {
    const { task, onView, onEdit, onDelete } = renderCard();

    fireEvent.click(screen.getByLabelText("Lihat detail tugas"));
    expect(onView).toHaveBeenCalledExactlyOnceWith(task);

    fireEvent.click(screen.getByLabelText("Edit tugas"));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith(task);

    fireEvent.click(screen.getByLabelText("Hapus tugas"));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(task);

    expect(onView).toHaveBeenCalledTimes(1);
  });
});

// ------------------------------------------------------------------------------
// TaskGrid
// ------------------------------------------------------------------------------
describe("TaskGrid", () => {
  it("merender satu kartu per tugas", () => {
    const tasks = [makeTask({ id: 1, title: "A" }), makeTask({ id: 2, title: "B" }), makeTask({ id: 3, title: "C" })];
    render(<TaskGrid tasks={tasks} {...handlers()} />);

    expect(screen.getAllByTitle("Klik untuk melihat rincian tugas")).toHaveLength(3);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("merender grid kosong tanpa tugas", () => {
    const { container } = render(<TaskGrid tasks={[]} {...handlers()} />);
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it("meneruskan handler ke kartu yang tepat", () => {
    const tasks = [makeTask({ id: 1, title: "A" }), makeTask({ id: 2, title: "B", status: "Done" })];
    const h = handlers();
    render(<TaskGrid tasks={tasks} {...h} />);

    fireEvent.click(screen.getAllByLabelText("Edit tugas")[1]);
    expect(h.onEdit).toHaveBeenCalledExactlyOnceWith(tasks[1]);

    fireEvent.click(screen.getAllByLabelText("Hapus tugas")[0]);
    expect(h.onDelete).toHaveBeenCalledExactlyOnceWith(tasks[0]);

    fireEvent.click(screen.getByTitle("Buka Kembali"));
    expect(h.onQuickStatusChange).toHaveBeenCalledExactlyOnceWith(tasks[1], "In Progress");
  });
});

// ------------------------------------------------------------------------------
// TaskTable
// ------------------------------------------------------------------------------
describe("TaskTable", () => {
  function renderTable(tasks: Task[] = [makeTask()]) {
    const h = handlers();
    const utils = render(<TaskTable tasks={tasks} {...h} />);
    return { tasks, ...h, ...utils };
  }

  const dataRows = () => screen.getAllByRole("row").slice(1);
  const statusButton = (index = 0) => screen.getAllByTitle("Klik untuk mengubah status")[index];

  it("merender header kolom", () => {
    renderTable();
    expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual([
      "Tugas",
      "Status",
      "Prioritas",
      "Assignee",
      "Tenggat Waktu",
      "Aksi",
    ]);
  });

  it("merender satu baris per tugas beserta datanya", () => {
    const { tasks } = renderTable([
      makeTask({ id: 7, title: "Pertama", description: "Desk", priority: "High", assignee: "Budi" }),
      makeTask({ id: 8, title: "Kedua", status: "Done" }),
    ]);

    expect(dataRows()).toHaveLength(2);
    const first = within(dataRows()[0]);
    expect(first.getByText("#7")).toBeInTheDocument();
    expect(first.getByText("Pertama")).toBeInTheDocument();
    expect(first.getByText("Desk")).toBeInTheDocument();
    expect(first.getByText("High")).toBeInTheDocument();
    expect(first.getByText("Budi")).toBeInTheDocument();
    expect(first.getByText(formatDateTime(tasks[0].due_date))).toBeInTheDocument();
    expect(within(dataRows()[1]).getByText("Done")).toBeInTheDocument();
  });

  it("merender tabel tanpa baris data jika tugas kosong", () => {
    renderTable([]);
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("menyembunyikan deskripsi kosong dan menampilkan pengganti assignee/tenggat", () => {
    renderTable([makeTask({ description: null, assignee: null, due_date: null })]);
    const row = within(dataRows()[0]);

    expect(row.queryByText("Deskripsi contoh")).not.toBeInTheDocument();
    expect(row.getByText("Unassigned")).toBeInTheDocument();
    expect(row.getByText("-")).toBeInTheDocument();
  });

  it("menandai baris yang terlambat", () => {
    renderTable([
      makeTask({ id: 1, due_date: isoInDays(-1), status: "In Progress" }),
      makeTask({ id: 2, due_date: isoInDays(-1), status: "Done" }),
      makeTask({ id: 3, due_date: isoInDays(1) }),
    ]);

    expect(within(dataRows()[0]).getByText("Overdue")).toBeInTheDocument();
    expect(within(dataRows()[1]).queryByText("Overdue")).not.toBeInTheDocument();
    expect(within(dataRows()[2]).queryByText("Overdue")).not.toBeInTheDocument();
  });

  it.each([
    ["To Do", "bg-blue-50"],
    ["In Progress", "bg-amber-50"],
    ["Done", "bg-emerald-50"],
  ] as const)("tombol status %s memakai warna yang sesuai", (status, colorClass) => {
    renderTable([makeTask({ status })]);
    expect(statusButton()).toHaveTextContent(status);
    expect(statusButton()).toHaveClass(colorClass);
  });

  it("klik baris membuka detail", () => {
    const { tasks, onView } = renderTable();
    fireEvent.click(dataRows()[0]);
    expect(onView).toHaveBeenCalledExactlyOnceWith(tasks[0]);
  });

  it("tombol aksi memanggil handler masing-masing tanpa memicu klik baris", () => {
    const { tasks, onView, onEdit, onDelete } = renderTable();

    fireEvent.click(screen.getByLabelText("Edit task"));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith(tasks[0]);

    fireEvent.click(screen.getByLabelText("Delete task"));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(tasks[0]);
    expect(onView).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("View task details"));
    expect(onView).toHaveBeenCalledExactlyOnceWith(tasks[0]);
  });

  describe("menu ubah status", () => {
    it("tertutup secara default dan terbuka saat tombol status diklik", () => {
      const { onView } = renderTable();
      expect(screen.queryByText("Ubah Status")).not.toBeInTheDocument();

      fireEvent.click(statusButton());

      expect(screen.getByText("Ubah Status")).toBeInTheDocument();
      expect(onView).not.toHaveBeenCalled();
    });

    it("menampilkan ketiga opsi dan menandai status saat ini", () => {
      renderTable([makeTask({ status: "In Progress" })]);
      fireEvent.click(statusButton());

      const menu = screen.getByText("Ubah Status").parentElement!;
      const options = within(menu).getAllByRole("button");
      expect(options.map((o) => o.textContent)).toEqual(["To Do", "In Progress", "Done"]);
      expect(options[1]).toHaveClass("text-indigo-600");
      expect(options[0]).not.toHaveClass("text-indigo-600");
    });

    it("memilih opsi memanggil onQuickStatusChange lalu menutup menu", () => {
      const { tasks, onQuickStatusChange, onView } = renderTable([makeTask({ status: "To Do" })]);
      fireEvent.click(statusButton());

      const menu = screen.getByText("Ubah Status").parentElement!;
      fireEvent.click(within(menu).getByRole("button", { name: "Done" }));

      expect(onQuickStatusChange).toHaveBeenCalledExactlyOnceWith(tasks[0], "Done");
      expect(screen.queryByText("Ubah Status")).not.toBeInTheDocument();
      expect(onView).not.toHaveBeenCalled();
    });

    it("klik tombol status lagi menutup menu", () => {
      renderTable();
      fireEvent.click(statusButton());
      fireEvent.click(statusButton());
      expect(screen.queryByText("Ubah Status")).not.toBeInTheDocument();
    });

    it("klik di luar menutup menu", () => {
      renderTable();
      fireEvent.click(statusButton());
      expect(screen.getByText("Ubah Status")).toBeInTheDocument();

      fireEvent.click(document.body);
      expect(screen.queryByText("Ubah Status")).not.toBeInTheDocument();
    });

    it("hanya satu menu yang terbuka pada satu waktu", () => {
      renderTable([makeTask({ id: 1 }), makeTask({ id: 2 })]);

      fireEvent.click(statusButton(0));
      expect(within(dataRows()[0]).getByText("Ubah Status")).toBeInTheDocument();

      fireEvent.click(statusButton(1));
      expect(screen.getAllByText("Ubah Status")).toHaveLength(1);
      expect(within(dataRows()[1]).getByText("Ubah Status")).toBeInTheDocument();
    });

    it("melepas listener dokumen saat unmount", () => {
      const removeSpy = vi.spyOn(document, "removeEventListener");
      const { unmount } = renderTable();
      unmount();
      expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});
