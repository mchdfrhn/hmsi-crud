import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { toDateTimeLocal } from "@/lib/dateUtils";
import { ApiError } from "@/services/api";
import { Task } from "@/types/task";
import { deferred, makeTask } from "./helpers";

// Kasus dasar (render, judul kosong, tenggat lampau, submit valid) ada di TaskForm.test.tsx

type Props = React.ComponentProps<typeof TaskFormModal>;

function setup(props: Partial<Props> = {}) {
  const onClose = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const utils = render(<TaskFormModal isOpen onClose={onClose} onSubmit={onSubmit} {...props} />);
  return { onClose, onSubmit: (props.onSubmit as typeof onSubmit) ?? onSubmit, ...utils };
}

const field = {
  title: () => screen.getByLabelText(/Judul Tugas/i) as HTMLInputElement,
  description: () => screen.getByLabelText(/Deskripsi/i) as HTMLTextAreaElement,
  status: () => screen.getByLabelText(/Status/i) as HTMLSelectElement,
  priority: () => screen.getByLabelText(/Prioritas/i) as HTMLSelectElement,
  assignee: () => screen.getByLabelText(/Penanggung Jawab/i) as HTMLInputElement,
  dueDate: () => screen.getByLabelText(/Tenggat Waktu/i) as HTMLInputElement,
};

const type = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } });
const submitButton = () => screen.getByRole("button", { name: /Buat Tugas|Simpan Perubahan|Menyimpan/ });
const submit = () => fireEvent.click(submitButton());
const form = () => document.querySelector("form")!;

async function submitAndWait(onSubmit: ReturnType<typeof vi.fn>) {
  submit();
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  return onSubmit.mock.calls[0][0];
}

describe("TaskFormModal", () => {
  it("tidak merender apa pun saat tertutup", () => {
    setup({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("mode buat", () => {
    it("menampilkan nilai default", () => {
      setup();
      expect(screen.getByRole("dialog", { name: "Buat Tugas Baru" })).toBeInTheDocument();
      expect(field.title()).toHaveValue("");
      expect(field.description()).toHaveValue("");
      expect(field.status()).toHaveValue("To Do");
      expect(field.priority()).toHaveValue("Medium");
      expect(field.assignee()).toHaveValue("");
      expect(field.dueDate()).toHaveValue("");
      expect(screen.getByText("0/100")).toBeInTheDocument();
    });

    it("membatasi tenggat minimum ke waktu sekarang", () => {
      setup();
      expect(field.dueDate().min).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it("memfokuskan input judul setelah modal terbuka", async () => {
      setup();
      await waitFor(() => expect(field.title()).toHaveFocus());
    });

    it("mengirim payload yang sudah dirapikan", async () => {
      const { onSubmit, onClose } = setup();
      type(field.title(), "  Tugas Lengkap  ");
      type(field.description(), "  Deskripsi  ");
      type(field.status(), "In Progress");
      type(field.priority(), "High");
      type(field.assignee(), "  Budi  ");
      type(field.dueDate(), "2099-01-01T10:00");

      const payload = await submitAndWait(onSubmit);

      expect(payload).toEqual({
        title: "Tugas Lengkap",
        description: "Deskripsi",
        status: "In Progress",
        priority: "High",
        assignee: "Budi",
        due_date: new Date("2099-01-01T10:00").toISOString(),
      });
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it("mengirim null untuk field opsional yang kosong atau hanya spasi", async () => {
      const { onSubmit } = setup();
      type(field.title(), "Minimal");
      type(field.description(), "   ");
      type(field.assignee(), "   ");

      const payload = await submitAndWait(onSubmit);

      expect(payload).toEqual({
        title: "Minimal",
        description: null,
        status: "To Do",
        priority: "Medium",
        assignee: null,
        due_date: null,
      });
    });
  });

  describe("mode edit", () => {
    const existing: Task = makeTask({
      id: 5,
      title: "Tugas Lama",
      description: "Deskripsi lama",
      status: "In Progress",
      priority: "High",
      assignee: "Siti",
      due_date: "2099-06-01T08:30:00Z",
    });

    it("mengisi form dari tugas yang diedit", () => {
      setup({ taskToEdit: existing });

      expect(screen.getByRole("dialog", { name: "Edit Tugas: #5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Simpan Perubahan" })).toBeInTheDocument();
      expect(field.title()).toHaveValue("Tugas Lama");
      expect(field.description()).toHaveValue("Deskripsi lama");
      expect(field.status()).toHaveValue("In Progress");
      expect(field.priority()).toHaveValue("High");
      expect(field.assignee()).toHaveValue("Siti");
      expect(field.dueDate()).toHaveValue(toDateTimeLocal(existing.due_date));
      expect(screen.getByText("10/100")).toBeInTheDocument();
    });

    it("mengisi string kosong untuk field null", () => {
      setup({ taskToEdit: makeTask({ description: null, assignee: null, due_date: null }) });
      expect(field.description()).toHaveValue("");
      expect(field.assignee()).toHaveValue("");
      expect(field.dueDate()).toHaveValue("");
    });

    it("tidak membatasi tenggat minimum", () => {
      setup({ taskToEdit: existing });
      expect(field.dueDate()).not.toHaveAttribute("min");
    });

    it("mengizinkan tenggat lampau saat mengedit", async () => {
      const { onSubmit } = setup({ taskToEdit: existing });
      type(field.dueDate(), "2020-01-01T10:00");

      const payload = await submitAndWait(onSubmit);
      expect(payload.due_date).toBe(new Date("2020-01-01T10:00").toISOString());
    });

    it("mengirim nilai yang diubah", async () => {
      const { onSubmit } = setup({ taskToEdit: existing });
      type(field.title(), "Tugas Baru");
      type(field.status(), "Done");

      const payload = await submitAndWait(onSubmit);
      expect(payload).toMatchObject({ title: "Tugas Baru", status: "Done", priority: "High", assignee: "Siti" });
    });

    it("berpindah ke tugas lain mengganti isi form", () => {
      const { rerender, onClose, onSubmit } = setup({ taskToEdit: existing });
      rerender(
        <TaskFormModal
          isOpen
          onClose={onClose}
          onSubmit={onSubmit}
          taskToEdit={makeTask({ id: 6, title: "Tugas Lain" })}
        />
      );
      expect(field.title()).toHaveValue("Tugas Lain");
      expect(screen.getByRole("dialog", { name: "Edit Tugas: #6" })).toBeInTheDocument();
    });
  });

  describe("validasi", () => {
    it("menolak judul yang hanya berisi spasi", async () => {
      const { onSubmit } = setup();
      type(field.title(), "     ");
      submit();

      expect(await screen.findByText("Judul tugas wajib diisi.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("menolak judul lebih dari 100 karakter", async () => {
      const { onSubmit } = setup();
      type(field.title(), "A".repeat(101));
      expect(screen.getByText("101/100")).toHaveClass("text-rose-600");
      submit();

      expect(await screen.findByText("Judul tugas tidak boleh melebihi 100 karakter.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("menerima judul tepat 100 karakter", async () => {
      const { onSubmit } = setup();
      type(field.title(), "A".repeat(100));
      const payload = await submitAndWait(onSubmit);
      expect(payload.title).toHaveLength(100);
    });

    it("penghitung karakter berubah warna mendekati batas", () => {
      setup();
      type(field.title(), "A".repeat(80));
      expect(screen.getByText("80/100")).toHaveClass("text-slate-400");

      type(field.title(), "A".repeat(81));
      expect(screen.getByText("81/100")).toHaveClass("text-amber-600");
    });

    it("menolak assignee lebih dari 100 karakter", async () => {
      const { onSubmit } = setup();
      type(field.title(), "Valid");
      type(field.assignee(), "B".repeat(101));
      submit();

      expect(await screen.findByText("Nama assignee tidak boleh melebihi 100 karakter.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("menampilkan beberapa error sekaligus", async () => {
      setup();
      type(field.assignee(), "B".repeat(101));
      type(field.dueDate(), "2020-01-01T10:00");
      submit();

      expect(await screen.findByText("Judul tugas wajib diisi.")).toBeInTheDocument();
      expect(screen.getByText("Nama assignee tidak boleh melebihi 100 karakter.")).toBeInTheDocument();
      expect(screen.getByText("Tenggat waktu tidak boleh lebih awal dari waktu saat ini.")).toBeInTheDocument();
    });

    it("mentoleransi tenggat hingga 60 detik yang lalu", async () => {
      const { onSubmit } = setup();
      type(field.title(), "Valid");
      // Input datetime-local berpresisi menit: menit saat ini selalu dalam toleransi
      type(field.dueDate(), toDateTimeLocal(new Date().toISOString()));

      await submitAndWait(onSubmit);
    });

    it("error hilang saat field diperbaiki", async () => {
      setup();
      type(field.assignee(), "B".repeat(101));
      type(field.dueDate(), "2020-01-01T10:00");
      submit();
      await screen.findByText("Judul tugas wajib diisi.");

      type(field.title(), "Sudah diisi");
      expect(screen.queryByText("Judul tugas wajib diisi.")).not.toBeInTheDocument();

      type(field.assignee(), "Budi");
      expect(screen.queryByText("Nama assignee tidak boleh melebihi 100 karakter.")).not.toBeInTheDocument();

      type(field.dueDate(), "2099-01-01T10:00");
      expect(
        screen.queryByText("Tenggat waktu tidak boleh lebih awal dari waktu saat ini.")
      ).not.toBeInTheDocument();
    });

    it("menandai input yang error dengan border merah", async () => {
      setup();
      submit();
      await screen.findByText("Judul tugas wajib diisi.");
      expect(field.title()).toHaveClass("border-rose-400");
      expect(field.assignee()).not.toHaveClass("border-rose-400");
    });
  });

  describe("tenggat waktu", () => {
    it.each([
      ["Besok", 1],
      ["+3 Hari", 3],
      ["+1 Minggu", 7],
    ])("preset '%s' mengisi tenggat %i hari ke depan pukul 18:00", (label, days) => {
      setup();
      const before = new Date();
      fireEvent.click(screen.getByRole("button", { name: label }));

      const expected = new Date(before);
      expected.setDate(expected.getDate() + days);
      expected.setHours(18, 0, 0, 0);
      expect(field.dueDate()).toHaveValue(toDateTimeLocal(expected.toISOString()));
    });

    it("preset menghapus error tenggat", async () => {
      setup();
      type(field.title(), "Valid");
      type(field.dueDate(), "2020-01-01T10:00");
      submit();
      await screen.findByText("Tenggat waktu tidak boleh lebih awal dari waktu saat ini.");

      fireEvent.click(screen.getByRole("button", { name: "Besok" }));
      expect(
        screen.queryByText("Tenggat waktu tidak boleh lebih awal dari waktu saat ini.")
      ).not.toBeInTheDocument();
    });

    it("tombol Hapus hanya muncul saat tenggat terisi dan mengosongkannya", () => {
      setup();
      expect(screen.queryByRole("button", { name: "Hapus" })).not.toBeInTheDocument();

      type(field.dueDate(), "2099-01-01T10:00");
      fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

      expect(field.dueDate()).toHaveValue("");
      expect(screen.queryByRole("button", { name: "Hapus" })).not.toBeInTheDocument();
    });
  });

  describe("pengiriman", () => {
    it("Ctrl+Enter dan Cmd+Enter mengirim form", async () => {
      const { onSubmit } = setup();
      type(field.title(), "Pintasan");

      fireEvent.keyDown(field.description(), { key: "Enter", ctrlKey: true });
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

      fireEvent.keyDown(field.title(), { key: "Enter", metaKey: true });
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    });

    it("Enter biasa atau Ctrl+tombol lain tidak mengirim form", () => {
      const { onSubmit } = setup();
      type(field.title(), "Pintasan");

      fireEvent.keyDown(field.description(), { key: "Enter" });
      fireEvent.keyDown(field.description(), { key: "s", ctrlKey: true });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("Ctrl+Enter tetap menjalankan validasi", async () => {
      const { onSubmit } = setup();
      fireEvent.keyDown(field.title(), { key: "Enter", ctrlKey: true });

      expect(await screen.findByText("Judul tugas wajib diisi.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("selama menyimpan: tombol nonaktif, tidak bisa ditutup, tidak bisa dobel submit", async () => {
      const pending = deferred<void>();
      const onSubmit = vi.fn().mockReturnValue(pending.promise);
      const { onClose } = setup({ onSubmit });
      type(field.title(), "Lambat");

      submit();
      expect(await screen.findByRole("button", { name: "Menyimpan..." })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Batal" })).toBeDisabled();

      fireEvent.submit(form());
      fireEvent.keyDown(window, { key: "Escape" });
      fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();

      await act(async () => {
        pending.resolve();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("Batal dan tombol X menutup modal tanpa mengirim", () => {
      const { onClose, onSubmit } = setup();

      fireEvent.click(screen.getByRole("button", { name: "Batal" }));
      fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));

      expect(onClose).toHaveBeenCalledTimes(2);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("error dari server", () => {
    it("ApiError: menampilkan pesan umum dan error per-field, modal tetap terbuka", async () => {
      const onSubmit = vi.fn().mockRejectedValue(
        new ApiError("Data masukan tidak valid.", 422, [
          { field: "title", message: "Judul sudah dipakai" },
          { field: "assignee", message: "Assignee tidak dikenal" },
          { field: "due_date", message: "Tenggat ditolak server" },
          { field: "", message: "Tanpa field, diabaikan" },
        ])
      );
      const { onClose } = setup({ onSubmit });
      type(field.title(), "Bentrok");
      submit();

      expect(await screen.findByText("Data masukan tidak valid.")).toBeInTheDocument();
      expect(screen.getByText("Judul sudah dipakai")).toBeInTheDocument();
      expect(screen.getByText("Assignee tidak dikenal")).toBeInTheDocument();
      expect(screen.getByText("Tenggat ditolak server")).toBeInTheDocument();
      expect(screen.queryByText("Tanpa field, diabaikan")).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Buat Tugas" })).toBeEnabled();
    });

    it("ApiError tanpa rincian field hanya menampilkan pesan umum", async () => {
      const onSubmit = vi.fn().mockRejectedValue(new ApiError("Gagal terhubung ke server backend.", 0));
      setup({ onSubmit });
      type(field.title(), "Offline");
      submit();

      expect(await screen.findByText("Gagal terhubung ke server backend.")).toBeInTheDocument();
      expect(field.title()).not.toHaveClass("border-rose-400");
    });

    it("error selain ApiError menampilkan pesan generik", async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error("rahasia internal"));
      const { onClose } = setup({ onSubmit });
      type(field.title(), "Meledak");
      submit();

      expect(
        await screen.findByText("Terjadi kesalahan tidak terduga saat menyimpan tugas.")
      ).toBeInTheDocument();
      expect(screen.queryByText("rahasia internal")).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("pesan umum hilang saat mencoba lagi dan berhasil", async () => {
      const onSubmit = vi
        .fn()
        .mockRejectedValueOnce(new ApiError("Server sibuk", 503))
        .mockResolvedValueOnce(undefined);
      const { onClose } = setup({ onSubmit });
      type(field.title(), "Coba lagi");

      submit();
      await screen.findByText("Server sibuk");

      submit();
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(screen.queryByText("Server sibuk")).not.toBeInTheDocument();
      expect(onSubmit).toHaveBeenCalledTimes(2);
    });
  });

  describe("reset saat dibuka ulang", () => {
    it("mengosongkan isian dan error dari sesi sebelumnya", async () => {
      const onSubmit = vi.fn().mockRejectedValue(new ApiError("Gagal menyimpan", 500));
      const { rerender, onClose } = setup({ onSubmit });
      type(field.title(), "Draf lama");
      type(field.priority(), "High");
      submit();
      await screen.findByText("Gagal menyimpan");

      rerender(<TaskFormModal isOpen={false} onClose={onClose} onSubmit={onSubmit} />);
      rerender(<TaskFormModal isOpen onClose={onClose} onSubmit={onSubmit} />);

      expect(field.title()).toHaveValue("");
      expect(field.priority()).toHaveValue("Medium");
      expect(screen.queryByText("Gagal menyimpan")).not.toBeInTheDocument();
    });
  });
});
