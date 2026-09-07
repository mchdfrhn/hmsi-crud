import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";

describe("TaskFormModal Component", () => {
  it("merender form pembuatan tugas baru dengan field lengkap", () => {
    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Buat Tugas Baru")).toBeInTheDocument();
    expect(screen.getByLabelText(/Judul Tugas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Deskripsi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prioritas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Penanggung Jawab/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tenggat Waktu/i)).toBeInTheDocument();
  });

  it("menampilkan error validasi jika judul kosong saat disubmit", async () => {
    const handleSubmit = vi.fn();
    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Buat Tugas/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Judul tugas wajib diisi.")).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("menolak tanggal tenggat waktu yang sudah lampau pada tugas baru", async () => {
    const handleSubmit = vi.fn();
    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    // Isi judul valid
    const titleInput = screen.getByLabelText(/Judul Tugas/i);
    fireEvent.change(titleInput, { target: { value: "Tugas Pengujian" } });

    // Masukkan tanggal lampau (misal: tahun 2020)
    const dueDateInput = screen.getByLabelText(/Tenggat Waktu/i);
    fireEvent.change(dueDateInput, { target: { value: "2020-01-01T10:00" } });

    const submitBtn = screen.getByRole("button", { name: /Buat Tugas/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Tenggat waktu tidak boleh lebih awal dari waktu saat ini.")
      ).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("memanggil onSubmit saat seluruh field valid", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Judul Tugas/i);
    fireEvent.change(titleInput, { target: { value: "Integrasi API Frontend" } });

    const submitBtn = screen.getByRole("button", { name: /Buat Tugas/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Integrasi API Frontend",
        status: "To Do",
        priority: "Medium",
      })
    );
  });
});
