import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";
import { TaskFilterBar } from "@/components/tasks/TaskFilterBar";

type Props = React.ComponentProps<typeof TaskFilterBar>;

function renderBar(props: Partial<Props> = {}) {
  const handlers = {
    onSearchChange: vi.fn(),
    onStatusChange: vi.fn(),
    onPriorityChange: vi.fn(),
    onAssigneeChange: vi.fn(),
    onResetFilters: vi.fn(),
    onViewModeChange: vi.fn(),
    onOpenCreateModal: vi.fn(),
    onToggleOverdueFilter: vi.fn(),
    onSortByChange: vi.fn(),
  };
  const utils = render(
    <TaskFilterBar
      search=""
      status="All"
      priority="All"
      assignee=""
      viewMode="table"
      totalTasks={12}
      {...handlers}
      {...props}
    />
  );
  return { ...handlers, ...utils };
}

const searchInput = () => screen.getByPlaceholderText("Cari judul tugas...");
const assigneeInput = () => screen.getByPlaceholderText("Cari nama...");
// Urutan dropdown: Status, Prioritas, Urutkan
const selects = () => screen.getAllByRole("combobox") as HTMLSelectElement[];
const chipButton = (chipText: string) => within(screen.getByText(chipText)).getByRole("button");

describe("TaskFilterBar", () => {
  describe("pencarian", () => {
    it("menampilkan nilai search dan meneruskan perubahan", () => {
      const { onSearchChange } = renderBar({ search: "api" });
      expect(searchInput()).toHaveValue("api");

      fireEvent.change(searchInput(), { target: { value: "api baru" } });
      expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("api baru");
    });

    it("tombol Escape mengosongkan pencarian, tombol lain tidak", () => {
      const { onSearchChange } = renderBar({ search: "api" });

      fireEvent.keyDown(searchInput(), { key: "Enter" });
      expect(onSearchChange).not.toHaveBeenCalled();

      fireEvent.keyDown(searchInput(), { key: "Escape" });
      expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("");
    });

    it("tombol bersihkan hanya muncul saat ada kata kunci", () => {
      const { rerender, onSearchChange } = renderBar();
      expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();

      rerender(
        <TaskFilterBar
          search="api"
          onSearchChange={onSearchChange}
          status="All"
          onStatusChange={vi.fn()}
          priority="All"
          onPriorityChange={vi.fn()}
          assignee=""
          onAssigneeChange={vi.fn()}
          onResetFilters={vi.fn()}
          viewMode="table"
          onViewModeChange={vi.fn()}
          onOpenCreateModal={vi.fn()}
          totalTasks={0}
        />
      );
      fireEvent.click(screen.getByLabelText("Clear search"));
      expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("");
    });
  });

  describe("dropdown filter", () => {
    it("menampilkan opsi status dan meneruskan pilihan", () => {
      const { onStatusChange } = renderBar({ status: "Done" });
      const [statusSelect] = selects();

      expect(statusSelect.value).toBe("Done");
      expect(Array.from(statusSelect.options).map((o) => o.value)).toEqual([
        "All",
        "To Do",
        "In Progress",
        "Done",
      ]);

      fireEvent.change(statusSelect, { target: { value: "In Progress" } });
      expect(onStatusChange).toHaveBeenCalledExactlyOnceWith("In Progress");
    });

    it("menampilkan opsi prioritas dan meneruskan pilihan", () => {
      const { onPriorityChange } = renderBar({ priority: "Low" });
      const prioritySelect = selects()[1];

      expect(prioritySelect.value).toBe("Low");
      expect(Array.from(prioritySelect.options).map((o) => o.value)).toEqual([
        "All",
        "Low",
        "Medium",
        "High",
      ]);

      fireEvent.change(prioritySelect, { target: { value: "High" } });
      expect(onPriorityChange).toHaveBeenCalledExactlyOnceWith("High");
    });

    it("meneruskan perubahan assignee dan menyediakan tombol bersihkan", () => {
      const { onAssigneeChange } = renderBar({ assignee: "Budi" });
      expect(assigneeInput()).toHaveValue("Budi");

      fireEvent.change(assigneeInput(), { target: { value: "Siti" } });
      expect(onAssigneeChange).toHaveBeenLastCalledWith("Siti");

      fireEvent.click(screen.getByLabelText("Clear assignee filter"));
      expect(onAssigneeChange).toHaveBeenLastCalledWith("");
    });

    it("tombol bersihkan assignee tidak muncul saat kosong", () => {
      renderBar();
      expect(screen.queryByLabelText("Clear assignee filter")).not.toBeInTheDocument();
    });

    it("dropdown urutan meneruskan pilihan (default created_at)", () => {
      const { onSortByChange } = renderBar();
      const sortSelect = selects()[2];

      expect(sortSelect.value).toBe("created_at");
      expect(Array.from(sortSelect.options).map((o) => o.value)).toEqual([
        "created_at",
        "due_date",
        "title",
      ]);

      fireEvent.change(sortSelect, { target: { value: "due_date" } });
      expect(onSortByChange).toHaveBeenCalledExactlyOnceWith("due_date");
    });

    it("dropdown urutan mengikuti prop sortBy", () => {
      renderBar({ sortBy: "title" });
      expect(selects()[2].value).toBe("title");
    });

    it("dropdown urutan disembunyikan tanpa onSortByChange", () => {
      renderBar({ onSortByChange: undefined });
      expect(selects()).toHaveLength(2);
      expect(screen.queryByText("Urutkan:")).not.toBeInTheDocument();
    });
  });

  describe("aksi", () => {
    it("tombol tampilan memanggil onViewModeChange", () => {
      const { onViewModeChange } = renderBar();

      fireEvent.click(screen.getByTitle("Tampilan Kartu / Grid"));
      expect(onViewModeChange).toHaveBeenLastCalledWith("grid");

      fireEvent.click(screen.getByTitle("Tampilan Tabel"));
      expect(onViewModeChange).toHaveBeenLastCalledWith("table");
    });

    it.each([
      ["table", "Tampilan Tabel", "Tampilan Kartu / Grid"],
      ["grid", "Tampilan Kartu / Grid", "Tampilan Tabel"],
    ] as const)("menandai mode %s yang aktif", (viewMode, activeTitle, inactiveTitle) => {
      renderBar({ viewMode });
      expect(screen.getByTitle(activeTitle)).toHaveClass("bg-white");
      expect(screen.getByTitle(inactiveTitle)).not.toHaveClass("bg-white");
    });

    it("tombol Tambah Tugas memanggil onOpenCreateModal", () => {
      const { onOpenCreateModal } = renderBar();
      fireEvent.click(screen.getByRole("button", { name: "Tambah Tugas" }));
      expect(onOpenCreateModal).toHaveBeenCalledTimes(1);
    });

    it("menampilkan jumlah tugas yang ditemukan", () => {
      renderBar({ totalTasks: 37 });
      expect(screen.getByText("37")).toBeInTheDocument();
    });
  });

  describe("chip filter aktif", () => {
    it("tidak tampil jika tidak ada filter aktif", () => {
      renderBar();
      expect(screen.queryByText("Filter Aktif:")).not.toBeInTheDocument();
      expect(screen.queryByText("Reset Semua")).not.toBeInTheDocument();
    });

    it.each<[string, Partial<Props>]>([
      ["search", { search: "api" }],
      ["status", { status: "Done" }],
      ["priority", { priority: "High" }],
      ["assignee", { assignee: "Budi" }],
      ["overdue", { isOverdueFilter: true }],
    ])("tampil saat filter %s aktif", (_name, props) => {
      renderBar(props);
      expect(screen.getByText("Filter Aktif:")).toBeInTheDocument();
      expect(screen.getByText("Reset Semua")).toBeInTheDocument();
    });

    it("chip judul menghapus pencarian", () => {
      const { onSearchChange } = renderBar({ search: "api" });
      fireEvent.click(chipButton('Judul: "api"'));
      expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("");
    });

    it("chip status mengembalikan status ke All", () => {
      const { onStatusChange } = renderBar({ status: "Done" });
      fireEvent.click(chipButton("Status: Done"));
      expect(onStatusChange).toHaveBeenCalledExactlyOnceWith("All");
    });

    it("chip prioritas mengembalikan prioritas ke All", () => {
      const { onPriorityChange } = renderBar({ priority: "High" });
      fireEvent.click(chipButton("Prioritas: High"));
      expect(onPriorityChange).toHaveBeenCalledExactlyOnceWith("All");
    });

    it("chip assignee mengosongkan assignee", () => {
      const { onAssigneeChange } = renderBar({ assignee: "Budi" });
      fireEvent.click(chipButton("Assignee: Budi"));
      expect(onAssigneeChange).toHaveBeenCalledExactlyOnceWith("");
    });

    it("chip overdue memanggil onToggleOverdueFilter", () => {
      const { onToggleOverdueFilter } = renderBar({ isOverdueFilter: true });
      fireEvent.click(chipButton("Overdue"));
      expect(onToggleOverdueFilter).toHaveBeenCalledTimes(1);
    });

    it("chip overdue tidak tampil tanpa onToggleOverdueFilter", () => {
      renderBar({ isOverdueFilter: true, onToggleOverdueFilter: undefined });
      expect(screen.getByText("Filter Aktif:")).toBeInTheDocument();
      expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    });

    it("hanya chip untuk filter yang aktif yang ditampilkan", () => {
      renderBar({ status: "To Do", assignee: "Budi" });
      expect(screen.getByText("Status: To Do")).toBeInTheDocument();
      expect(screen.getByText("Assignee: Budi")).toBeInTheDocument();
      expect(screen.queryByText(/^Judul:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Prioritas: /)).not.toBeInTheDocument();
    });

    it("Reset Semua memanggil onResetFilters", () => {
      const { onResetFilters } = renderBar({ search: "api", status: "Done" });
      fireEvent.click(screen.getByRole("button", { name: "Reset Semua" }));
      expect(onResetFilters).toHaveBeenCalledTimes(1);
    });
  });
});
