import { describe, it, expect, vi, afterEach } from "vitest";
import { formatDateTime, isOverdue, toDateTimeLocal } from "@/lib/dateUtils";
import { isoInDays } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
});

describe("isOverdue", () => {
  it("true jika tenggat sudah lewat dan tugas belum selesai", () => {
    expect(isOverdue(isoInDays(-1), "To Do")).toBe(true);
    expect(isOverdue(isoInDays(-1), "In Progress")).toBe(true);
  });

  it("false jika tugas sudah Done walaupun tenggat lewat", () => {
    expect(isOverdue(isoInDays(-1), "Done")).toBe(false);
  });

  it("false jika tenggat masih di masa depan", () => {
    expect(isOverdue(isoInDays(1), "To Do")).toBe(false);
  });

  it("false jika tidak ada tenggat", () => {
    expect(isOverdue(null, "To Do")).toBe(false);
    expect(isOverdue(undefined, "To Do")).toBe(false);
    expect(isOverdue("", "To Do")).toBe(false);
  });

  it("false jika tanggal tidak valid", () => {
    expect(isOverdue("bukan tanggal", "To Do")).toBe(false);
  });

  it("membandingkan terhadap waktu saat ini hingga milidetik", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00.000Z"));

    expect(isOverdue("2030-01-01T11:59:59.999Z", "To Do")).toBe(true);
    expect(isOverdue("2030-01-01T12:00:00.000Z", "To Do")).toBe(false);
    expect(isOverdue("2030-01-01T12:00:00.001Z", "To Do")).toBe(false);
  });

  it("menghormati offset zona waktu pada string ISO", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));

    // 18:59 WIB = 11:59 UTC (lewat), 19:01 WIB = 12:01 UTC (belum)
    expect(isOverdue("2030-01-01T18:59:00+07:00", "To Do")).toBe(true);
    expect(isOverdue("2030-01-01T19:01:00+07:00", "To Do")).toBe(false);
  });
});

describe("formatDateTime", () => {
  it("mengembalikan '-' untuk nilai kosong atau tidak valid", () => {
    expect(formatDateTime(null)).toBe("-");
    expect(formatDateTime(undefined)).toBe("-");
    expect(formatDateTime("")).toBe("-");
    expect(formatDateTime("bukan tanggal")).toBe("-");
  });

  it("memformat tanggal dengan lokal Indonesia", () => {
    // Dibangun dari komponen waktu lokal agar hasil tidak bergantung zona waktu mesin
    const local = new Date(2030, 7, 5, 9, 7);
    const formatted = formatDateTime(local.toISOString());

    expect(formatted).toContain("05");
    expect(formatted).toMatch(/Agu/);
    expect(formatted).toContain("2030");
    expect(formatted).toMatch(/09[.:]07/);
  });

  it("memformat jam dalam format 24 jam", () => {
    const local = new Date(2030, 0, 15, 23, 45);
    expect(formatDateTime(local.toISOString())).toMatch(/23[.:]45/);
  });
});

describe("toDateTimeLocal", () => {
  it("mengembalikan string kosong untuk nilai kosong atau tidak valid", () => {
    expect(toDateTimeLocal(null)).toBe("");
    expect(toDateTimeLocal(undefined)).toBe("");
    expect(toDateTimeLocal("")).toBe("");
    expect(toDateTimeLocal("bukan tanggal")).toBe("");
  });

  it("menghasilkan format YYYY-MM-DDTHH:mm dalam waktu lokal", () => {
    const local = new Date(2030, 0, 5, 9, 7, 59);
    expect(toDateTimeLocal(local.toISOString())).toBe("2030-01-05T09:07");
  });

  it("menambahkan nol di depan bulan, tanggal, jam, dan menit", () => {
    const local = new Date(2031, 8, 1, 0, 0);
    expect(toDateTimeLocal(local.toISOString())).toBe("2031-09-01T00:00");
  });

  it("round-trip dengan input datetime-local tidak mengubah nilai", () => {
    const inputValue = "2030-12-31T23:59";
    expect(toDateTimeLocal(new Date(inputValue).toISOString())).toBe(inputValue);
  });
});
