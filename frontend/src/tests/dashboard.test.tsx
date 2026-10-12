import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { makeSummary } from "./helpers";

const card = (label: string) => screen.getByTitle(`Klik untuk memfilter: ${label}`);

describe("SummaryCards", () => {
  it("tidak merender apa pun tanpa summary", () => {
    const { container } = render(<SummaryCards summary={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("menampilkan lima kartu beserta jumlahnya", () => {
    render(
      <SummaryCards summary={makeSummary({ total: 15, todo: 7, in_progress: 5, done: 3, overdue: 2 })} />
    );

    expect(within(card("Total Tugas")).getByText("15")).toBeInTheDocument();
    expect(within(card("To Do")).getByText("7")).toBeInTheDocument();
    expect(within(card("In Progress")).getByText("5")).toBeInTheDocument();
    expect(within(card("Done")).getByText("3")).toBeInTheDocument();
    expect(within(card("Overdue")).getByText("2")).toBeInTheDocument();
  });

  it("secara default kartu Total yang aktif", () => {
    render(<SummaryCards summary={makeSummary()} />);
    expect(within(card("Total Tugas")).getByText("Aktif")).toBeInTheDocument();
    expect(screen.getAllByText("Aktif")).toHaveLength(1);
  });

  it.each(["To Do", "In Progress", "Done"])("menandai kartu %s saat filternya aktif", (status) => {
    render(<SummaryCards summary={makeSummary()} activeStatusFilter={status} />);
    expect(within(card(status)).getByText("Aktif")).toBeInTheDocument();
    expect(screen.getAllByText("Aktif")).toHaveLength(1);
    expect(card(status).className).toContain("ring-2");
  });

  it("saat filter overdue aktif hanya kartu Overdue yang ditandai", () => {
    render(<SummaryCards summary={makeSummary()} activeStatusFilter="Done" isOverdueActive />);
    expect(within(card("Overdue")).getByText("Aktif")).toBeInTheDocument();
    expect(screen.getAllByText("Aktif")).toHaveLength(1);
  });

  it.each([
    ["Total Tugas", "All"],
    ["To Do", "To Do"],
    ["In Progress", "In Progress"],
    ["Done", "Done"],
  ])("klik kartu %s memanggil onSelectStatusFilter('%s')", (label, filterKey) => {
    const onSelectStatusFilter = vi.fn();
    const onToggleOverdueFilter = vi.fn();
    render(
      <SummaryCards
        summary={makeSummary()}
        onSelectStatusFilter={onSelectStatusFilter}
        onToggleOverdueFilter={onToggleOverdueFilter}
      />
    );

    fireEvent.click(card(label));
    expect(onSelectStatusFilter).toHaveBeenCalledExactlyOnceWith(filterKey);
    expect(onToggleOverdueFilter).not.toHaveBeenCalled();
  });

  it("klik kartu Overdue memanggil onToggleOverdueFilter", () => {
    const onSelectStatusFilter = vi.fn();
    const onToggleOverdueFilter = vi.fn();
    render(
      <SummaryCards
        summary={makeSummary()}
        onSelectStatusFilter={onSelectStatusFilter}
        onToggleOverdueFilter={onToggleOverdueFilter}
      />
    );

    fireEvent.click(card("Overdue"));
    expect(onToggleOverdueFilter).toHaveBeenCalledTimes(1);
    expect(onSelectStatusFilter).not.toHaveBeenCalled();
  });

  it("klik tanpa handler tidak menimbulkan error", () => {
    render(<SummaryCards summary={makeSummary()} />);
    expect(() => {
      fireEvent.click(card("To Do"));
      fireEvent.click(card("Overdue"));
    }).not.toThrow();
  });
});

describe("ProgressBar", () => {
  const segmentWidth = (titlePrefix: string) =>
    (screen.getByTitle(new RegExp(`^${titlePrefix}`)) as HTMLElement).style.width;

  it("tidak merender apa pun tanpa summary atau saat total 0", () => {
    const { container, rerender } = render(<ProgressBar summary={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ProgressBar summary={makeSummary({ total: 0, todo: 0, in_progress: 0, done: 0 })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("menghitung persentase tiap segmen", () => {
    render(
      <ProgressBar summary={makeSummary({ total: 10, done: 3, in_progress: 2, todo: 5, overdue: 0 })} />
    );

    expect(screen.getByText("3 dari 10 tugas diselesaikan (30%)")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(segmentWidth("Selesai")).toBe("30%");
    expect(segmentWidth("In Progress")).toBe("20%");
    expect(segmentWidth("To Do")).toBe("50%");
  });

  it("menampilkan legenda jumlah per status", () => {
    render(
      <ProgressBar summary={makeSummary({ total: 10, done: 3, in_progress: 2, todo: 5, overdue: 0 })} />
    );
    expect(screen.getByText("Done (3)")).toBeInTheDocument();
    expect(screen.getByText("In Progress (2)")).toBeInTheDocument();
    expect(screen.getByText("To Do (5)")).toBeInTheDocument();
  });

  it("membulatkan persentase dan memberikan sisanya ke To Do", () => {
    render(<ProgressBar summary={makeSummary({ total: 3, done: 1, in_progress: 1, todo: 1 })} />);
    expect(segmentWidth("Selesai")).toBe("33%");
    expect(segmentWidth("In Progress")).toBe("33%");
    expect(segmentWidth("To Do")).toBe("34%");
  });

  it("segmen To Do tidak pernah negatif saat pembulatan melebihi 100%", () => {
    // Data tidak konsisten dari server (51% + 51%) tidak boleh menghasilkan lebar negatif
    render(<ProgressBar summary={makeSummary({ total: 200, done: 101, in_progress: 101, todo: 0 })} />);
    expect(segmentWidth("To Do")).toBe("0%");
  });

  it("menampilkan 100% saat semua tugas selesai", () => {
    render(<ProgressBar summary={makeSummary({ total: 4, done: 4, in_progress: 0, todo: 0 })} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(segmentWidth("To Do")).toBe("0%");
  });

  it("legenda Overdue hanya muncul jika ada tugas terlambat", () => {
    const { rerender } = render(<ProgressBar summary={makeSummary({ overdue: 0 })} />);
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();

    rerender(<ProgressBar summary={makeSummary({ overdue: 4 })} />);
    expect(screen.getByText("Overdue (4)")).toBeInTheDocument();
  });
});
