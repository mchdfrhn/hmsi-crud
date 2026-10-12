import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Pagination } from "@/components/tasks/Pagination";

function renderPagination(props: Partial<React.ComponentProps<typeof Pagination>> = {}) {
  const onPageChange = vi.fn();
  const onLimitChange = vi.fn();
  const utils = render(
    <Pagination
      page={1}
      limit={10}
      total={45}
      totalPages={5}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      {...props}
    />
  );
  return { onPageChange, onLimitChange, ...utils };
}

/** Label tombol halaman dan elipsis sesuai urutan tampil. */
function pageSequence(container: HTMLElement): string[] {
  const pageButtons = container.querySelector(".px-1")!;
  return Array.from(pageButtons.children).map((el) => el.textContent ?? "");
}

const summaryText = (container: HTMLElement) =>
  container.querySelector("span")!.textContent!.replace(/\s+/g, " ").trim();

describe("Pagination", () => {
  it("tidak merender apa pun saat total 0", () => {
    const { container } = renderPagination({ total: 0, totalPages: 1 });
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    [1, 10, 45, "Menampilkan 1-10 dari 45 tugas"],
    [2, 10, 45, "Menampilkan 11-20 dari 45 tugas"],
    [5, 10, 45, "Menampilkan 41-45 dari 45 tugas"],
    [1, 20, 7, "Menampilkan 1-7 dari 7 tugas"],
    [3, 5, 11, "Menampilkan 11-11 dari 11 tugas"],
  ])("halaman %i limit %i total %i -> '%s'", (page, limit, total, expected) => {
    const { container } = renderPagination({ page, limit, total, totalPages: Math.ceil(total / limit) });
    expect(summaryText(container)).toBe(expected);
  });

  it("menonaktifkan tombol sebelumnya di halaman pertama", () => {
    renderPagination({ page: 1 });
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeEnabled();
  });

  it("menonaktifkan tombol selanjutnya di halaman terakhir", () => {
    renderPagination({ page: 5 });
    expect(screen.getByLabelText("Previous page")).toBeEnabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("menonaktifkan kedua tombol jika hanya ada satu halaman", () => {
    renderPagination({ total: 3, totalPages: 1 });
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("tombol sebelumnya/selanjutnya berpindah satu halaman", () => {
    const { onPageChange } = renderPagination({ page: 3 });

    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it("klik nomor halaman memanggil onPageChange dengan nomor itu", () => {
    const { onPageChange } = renderPagination({ page: 1 });
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(4);
  });

  it("menandai halaman aktif", () => {
    renderPagination({ page: 2 });
    expect(screen.getByRole("button", { name: "2" })).toHaveClass("bg-indigo-600");
    expect(screen.getByRole("button", { name: "3" })).not.toHaveClass("bg-indigo-600");
  });

  it("menampilkan semua nomor jika total halaman <= 5", () => {
    const { container } = renderPagination({ page: 3, totalPages: 5 });
    expect(pageSequence(container)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it.each([
    [1, ["1", "2", "...", "10"]],
    [2, ["1", "2", "3", "...", "10"]],
    [3, ["1", "2", "3", "4", "...", "10"]],
    [5, ["1", "...", "4", "5", "6", "...", "10"]],
    [9, ["1", "...", "8", "9", "10"]],
    [10, ["1", "...", "9", "10"]],
  ])("meringkas dengan elipsis: halaman %i dari 10", (page, expected) => {
    const { container } = renderPagination({ page, total: 100, totalPages: 10 });
    expect(pageSequence(container)).toEqual(expected);
  });

  it("menampilkan pilihan limit dan nilai aktifnya", () => {
    renderPagination({ limit: 20 });
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("20");
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["5", "10", "20", "50"]);
  });

  it("mengubah limit memanggil onLimitChange dengan angka", () => {
    const { onLimitChange } = renderPagination();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "50" } });
    expect(onLimitChange).toHaveBeenCalledExactlyOnceWith(50);
  });
});
