import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  Skeleton,
  SummaryCardSkeleton,
  TableRowSkeleton,
  GridCardSkeleton,
} from "@/components/ui/Skeleton";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { TaskPriority, TaskStatus } from "@/types/task";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ------------------------------------------------------------------------------
// Badge
// ------------------------------------------------------------------------------
describe("StatusBadge", () => {
  it.each<[TaskStatus, string]>([
    ["To Do", "bg-blue-50"],
    ["In Progress", "bg-amber-50"],
    ["Done", "bg-emerald-50"],
  ])("merender status %s dengan warnanya", (status, colorClass) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(status);
    expect(badge).toHaveClass(colorClass);
  });

  it("ukuran default md, dan sm lebih ringkas", () => {
    const { rerender } = render(<StatusBadge status="Done" />);
    expect(screen.getByText("Done")).toHaveClass("px-2.5", "font-semibold");

    rerender(<StatusBadge status="Done" size="sm" />);
    expect(screen.getByText("Done")).toHaveClass("px-2", "py-0.5");
    expect(screen.getByText("Done")).not.toHaveClass("font-semibold");
  });
});

describe("PriorityBadge", () => {
  it.each<[TaskPriority, string]>([
    ["Low", "bg-slate-100"],
    ["Medium", "bg-orange-50"],
    ["High", "bg-rose-50"],
  ])("merender prioritas %s dengan warnanya", (priority, colorClass) => {
    render(<PriorityBadge priority={priority} />);
    expect(screen.getByText(priority)).toHaveClass(colorClass);
  });

  it("mendukung ukuran sm", () => {
    render(<PriorityBadge priority="High" size="sm" />);
    expect(screen.getByText("High")).toHaveClass("px-2", "py-0.5");
  });
});

describe("OverdueBadge", () => {
  it("merender label Overdue", () => {
    render(<OverdueBadge />);
    expect(screen.getByText("Overdue")).toHaveClass("bg-rose-50", "font-bold");
  });
});

// ------------------------------------------------------------------------------
// EmptyState
// ------------------------------------------------------------------------------
describe("EmptyState", () => {
  it("tanpa filter: mengajak membuat tugas pertama", () => {
    const onAddNew = vi.fn();
    render(<EmptyState onAddNew={onAddNew} onResetFilters={vi.fn()} />);

    expect(screen.getByText("Belum Ada Tugas")).toBeInTheDocument();
    expect(screen.queryByText("Reset Semua Filter")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Buat Tugas Baru" }));
    expect(onAddNew).toHaveBeenCalledTimes(1);
  });

  it("tanpa filter dan tanpa onAddNew: tidak ada tombol", () => {
    render(<EmptyState />);
    expect(screen.getByText("Belum Ada Tugas")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("dengan filter: menawarkan reset filter", () => {
    const onResetFilters = vi.fn();
    render(<EmptyState isFiltered onResetFilters={onResetFilters} onAddNew={vi.fn()} />);

    expect(screen.getByText("Tidak Ada Tugas yang Cocok")).toBeInTheDocument();
    expect(screen.queryByText("Buat Tugas Baru")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset Semua Filter" }));
    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it("dengan filter tanpa onResetFilters: tidak ada tombol", () => {
    render(<EmptyState isFiltered />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

// ------------------------------------------------------------------------------
// Skeleton
// ------------------------------------------------------------------------------
describe("Skeleton", () => {
  it("menggabungkan className tambahan", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    expect(container.firstChild).toHaveClass("animate-pulse", "h-4", "w-20");
  });

  it("SummaryCardSkeleton merender 5 kartu", () => {
    const { container } = render(<SummaryCardSkeleton />);
    expect(container.firstElementChild?.children).toHaveLength(5);
  });

  it("TableRowSkeleton merender jumlah baris sesuai count (default 5)", () => {
    const renderRows = (count?: number) =>
      render(
        <table>
          <tbody>
            <TableRowSkeleton count={count} />
          </tbody>
        </table>
      );

    const { unmount } = renderRows();
    expect(screen.getAllByRole("row")).toHaveLength(5);
    unmount();

    renderRows(2);
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("GridCardSkeleton merender jumlah kartu sesuai count (default 6)", () => {
    const { container, rerender } = render(<GridCardSkeleton />);
    expect(container.firstElementChild?.children).toHaveLength(6);

    rerender(<GridCardSkeleton count={3} />);
    expect(container.firstElementChild?.children).toHaveLength(3);
  });
});

// ------------------------------------------------------------------------------
// Modal
// ------------------------------------------------------------------------------
describe("Modal", () => {
  const renderModal = (props: Partial<React.ComponentProps<typeof Modal>> = {}) => {
    const onClose = vi.fn();
    const utils = render(
      <Modal isOpen onClose={onClose} title="Judul Modal" {...props}>
        <p>Isi modal</p>
      </Modal>
    );
    return { onClose, ...utils };
  };

  it("tidak merender apa pun saat tertutup", () => {
    const { container } = renderModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("merender dialog aksesibel dengan judul dan isi", () => {
    renderModal();
    const dialog = screen.getByRole("dialog", { name: "Judul Modal" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Isi modal")).toBeInTheDocument();
  });

  it.each([
    ["sm", "max-w-sm"],
    ["md", "max-w-lg"],
    ["lg", "max-w-2xl"],
    ["xl", "max-w-4xl"],
  ] as const)("maxWidth %s memakai kelas %s", (maxWidth, expectedClass) => {
    renderModal({ maxWidth });
    expect(screen.getByRole("dialog")).toHaveClass(expectedClass);
  });

  it("maxWidth default adalah md", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toHaveClass("max-w-lg");
  });

  it("menutup lewat tombol X", () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("menutup saat backdrop diklik, tetapi tidak saat isi dialog diklik", () => {
    const { onClose, container } = renderModal();

    fireEvent.click(screen.getByText("Isi modal"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('[aria-hidden="true"]')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("menutup dengan tombol Escape saja", () => {
    const { onClose } = renderModal();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("tidak mendengarkan Escape saat tertutup", () => {
    const { onClose } = renderModal({ isOpen: false });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("mengunci scroll body saat terbuka dan melepasnya saat ditutup", () => {
    const { rerender, onClose } = renderModal();
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal isOpen={false} onClose={onClose} title="Judul Modal">
        <p>Isi modal</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("unset");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("melepas kunci scroll dan listener saat unmount", () => {
    const { unmount, onClose } = renderModal();
    unmount();

    expect(document.body.style.overflow).toBe("unset");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------------------
// Toast
// ------------------------------------------------------------------------------
describe("Toast", () => {
  function Trigger({ message = "Halo", type }: { message?: string; type?: "success" | "error" | "info" }) {
    const { showToast } = useToast();
    return <button onClick={() => showToast(message, type)}>tampilkan</button>;
  }

  const renderWithProvider = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

  it("useToast melempar error di luar ToastProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow("useToast must be used within a ToastProvider");
  });

  it("merender children tanpa toast di awal", () => {
    renderWithProvider(<Trigger />);
    expect(screen.getByText("tampilkan")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tutup notifikasi")).not.toBeInTheDocument();
  });

  it.each([
    ["success", "border-emerald-200"],
    ["error", "border-rose-200"],
    ["info", "border-slate-200"],
  ] as const)("menampilkan toast bertipe %s", (type, borderClass) => {
    renderWithProvider(<Trigger message={`Pesan ${type}`} type={type} />);
    fireEvent.click(screen.getByText("tampilkan"));

    const toast = screen.getByText(`Pesan ${type}`).parentElement!;
    expect(toast).toHaveClass(borderClass);
  });

  it("tipe default adalah info", () => {
    renderWithProvider(<Trigger message="Tanpa tipe" />);
    fireEvent.click(screen.getByText("tampilkan"));
    expect(screen.getByText("Tanpa tipe").parentElement).toHaveClass("border-slate-200");
  });

  it("dapat menumpuk beberapa toast sekaligus", () => {
    renderWithProvider(<Trigger />);
    fireEvent.click(screen.getByText("tampilkan"));
    fireEvent.click(screen.getByText("tampilkan"));
    fireEvent.click(screen.getByText("tampilkan"));
    expect(screen.getAllByText("Halo")).toHaveLength(3);
  });

  it("menutup hanya toast yang tombol tutupnya diklik", () => {
    renderWithProvider(<Trigger />);
    fireEvent.click(screen.getByText("tampilkan"));
    fireEvent.click(screen.getByText("tampilkan"));

    fireEvent.click(screen.getAllByLabelText("Tutup notifikasi")[0]);
    expect(screen.getAllByText("Halo")).toHaveLength(1);
  });

  it("hilang otomatis setelah 4 detik", () => {
    vi.useFakeTimers();
    renderWithProvider(<Trigger />);
    fireEvent.click(screen.getByText("tampilkan"));

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByText("Halo")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Halo")).not.toBeInTheDocument();
  });

  it("setiap toast punya timer sendiri", () => {
    vi.useFakeTimers();
    renderWithProvider(<Trigger />);

    fireEvent.click(screen.getByText("tampilkan"));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByText("tampilkan"));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getAllByText("Halo")).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("Halo")).not.toBeInTheDocument();
  });
});
