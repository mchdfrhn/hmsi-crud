import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError, taskApi } from "@/services/api";

const BASE = "http://localhost:8000/api";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json; charset=utf-8" },
    json: async () => body,
  };
}

function nonJsonResponse(status: number, contentType: string | null = "text/plain") {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => contentType },
    json: async () => {
      throw new Error("bukan JSON");
    },
  };
}

function lastCall(): { url: string; init: RequestInit & { headers: Record<string, string> } } {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url, init };
}

function lastQuery(): URLSearchParams {
  return new URL(lastCall().url).searchParams;
}

async function catchApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError);
    return err as ApiError;
  }
  throw new Error("Seharusnya melempar ApiError");
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(jsonResponse({}));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ApiError", () => {
  it("menyimpan pesan, status, dan rincian error field", () => {
    const details = [{ field: "title", message: "wajib" }];
    const error = new ApiError("Gagal", 422, details);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Gagal");
    expect(error.status).toBe(422);
    expect(error.errors).toBe(details);
  });

  it("errors opsional", () => {
    expect(new ApiError("Gagal", 500).errors).toBeUndefined();
  });
});

describe("request wrapper", () => {
  it("mengirim header Content-Type JSON", async () => {
    await taskApi.getSummary();
    expect(lastCall().init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("mengembalikan body JSON saat sukses", async () => {
    const body = { total: 1 };
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(taskApi.getSummary()).resolves.toBe(body);
  });

  it("mengembalikan null jika respons sukses bukan JSON", async () => {
    fetchMock.mockResolvedValue(nonJsonResponse(200));
    await expect(taskApi.getSummary()).resolves.toBeNull();
  });

  it("mengembalikan null jika header content-type tidak ada", async () => {
    fetchMock.mockResolvedValue(nonJsonResponse(204, null));
    await expect(taskApi.deleteTask(1)).resolves.toBeNull();
  });

  it("memakai detail string dari backend sebagai pesan error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Tugas dengan ID 9 tidak ditemukan." }, 404));

    const error = await catchApiError(taskApi.getTaskById(9));
    expect(error.message).toBe("Tugas dengan ID 9 tidak ditemukan.");
    expect(error.status).toBe(404);
    expect(error.errors).toBeUndefined();
  });

  it("menyertakan errors per-field dari custom handler 422", async () => {
    const errors = [{ field: "title", message: "Judul wajib", type: "missing" }];
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Data masukan tidak valid.", errors }, 422));

    const error = await catchApiError(taskApi.createTask({ title: "" }));
    expect(error.message).toBe("Data masukan tidak valid.");
    expect(error.status).toBe(422);
    expect(error.errors).toEqual(errors);
  });

  it("menggabungkan pesan dari format validasi bawaan FastAPI (detail berupa array)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: [{ msg: "Field required" }, {}, { msg: "Too long" }] }, 422)
    );

    const error = await catchApiError(taskApi.createTask({ title: "" }));
    expect(error.message).toBe("Field required, Invalid input, Too long");
    expect(error.errors).toBeUndefined();
  });

  it("memakai pesan default jika detail bukan string maupun array", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: { kode: 1 } }, 400));
    const error = await catchApiError(taskApi.getSummary());
    expect(error.message).toBe("Terjadi kesalahan pada server.");
    expect(error.status).toBe(400);
  });

  it("memakai pesan default jika respons error bukan JSON", async () => {
    fetchMock.mockResolvedValue(nonJsonResponse(500, "text/html"));
    const error = await catchApiError(taskApi.getSummary());
    expect(error.message).toBe("Terjadi kesalahan pada server.");
    expect(error.status).toBe(500);
  });

  it("mengabaikan errors yang bukan array", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Gagal", errors: "rusak" }, 422));
    const error = await catchApiError(taskApi.getSummary());
    expect(error.errors).toBeUndefined();
  });

  it("mengubah kegagalan jaringan menjadi ApiError berstatus 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await catchApiError(taskApi.getSummary());
    expect(error.status).toBe(0);
    expect(error.message).toContain("Gagal terhubung ke server backend");
  });

  it("mengubah kegagalan parsing JSON menjadi ApiError berstatus 0", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });

    const error = await catchApiError(taskApi.getSummary());
    expect(error.status).toBe(0);
  });
});

describe("taskApi.getTasks", () => {
  it("tanpa parameter memanggil /tasks tanpa query string", async () => {
    await taskApi.getTasks();
    expect(lastCall().url).toBe(`${BASE}/tasks`);
    expect(lastCall().init.method).toBe("GET");
  });

  it("objek parameter kosong tidak menghasilkan query string", async () => {
    await taskApi.getTasks({});
    expect(lastCall().url).toBe(`${BASE}/tasks`);
  });

  it("menyusun seluruh parameter menjadi query string", async () => {
    await taskApi.getTasks({
      page: 2,
      limit: 20,
      status: "In Progress",
      priority: "High",
      assignee: "Budi",
      search: "api",
      is_overdue: true,
      sort_by: "due_date",
      sort_order: "asc",
    });

    expect(Object.fromEntries(lastQuery())).toEqual({
      page: "2",
      limit: "20",
      status: "In Progress",
      priority: "High",
      assignee: "Budi",
      search: "api",
      is_overdue: "true",
      sort_by: "due_date",
      sort_order: "asc",
    });
  });

  it("meng-encode karakter spesial pada URL", async () => {
    await taskApi.getTasks({ status: "To Do", search: "a&b=c ?" });
    expect(lastCall().url).toContain("status=To+Do");
    expect(lastCall().url).toContain("search=a%26b%3Dc+%3F");
    expect(lastQuery().get("search")).toBe("a&b=c ?");
  });

  it("melewatkan status dan priority bernilai 'All'", async () => {
    await taskApi.getTasks({ status: "All", priority: "All" });
    expect(lastCall().url).toBe(`${BASE}/tasks`);
  });

  it("memangkas spasi pada assignee dan search", async () => {
    await taskApi.getTasks({ assignee: "  Budi  ", search: "  api " });
    expect(lastQuery().get("assignee")).toBe("Budi");
    expect(lastQuery().get("search")).toBe("api");
  });

  it("melewatkan assignee dan search yang hanya berisi spasi", async () => {
    await taskApi.getTasks({ assignee: "   ", search: "" });
    expect(lastCall().url).toBe(`${BASE}/tasks`);
  });

  it("tetap mengirim is_overdue=false jika diisi eksplisit", async () => {
    await taskApi.getTasks({ is_overdue: false });
    expect(lastQuery().get("is_overdue")).toBe("false");
  });

  it("melewatkan page dan limit bernilai 0", async () => {
    await taskApi.getTasks({ page: 0, limit: 0 });
    expect(lastCall().url).toBe(`${BASE}/tasks`);
  });

  it("mengembalikan respons daftar tugas", async () => {
    const body = { items: [], total: 0, page: 1, limit: 10, total_pages: 1 };
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(taskApi.getTasks({ page: 1 })).resolves.toEqual(body);
  });
});

describe("taskApi endpoint lainnya", () => {
  it("getSummary -> GET /tasks/summary", async () => {
    await taskApi.getSummary();
    expect(lastCall().url).toBe(`${BASE}/tasks/summary`);
    expect(lastCall().init.method).toBe("GET");
    expect(lastCall().init.body).toBeUndefined();
  });

  it("getTaskById -> GET /tasks/{id}", async () => {
    await taskApi.getTaskById(7);
    expect(lastCall().url).toBe(`${BASE}/tasks/7`);
    expect(lastCall().init.method).toBe("GET");
  });

  it("createTask -> POST /tasks dengan body JSON", async () => {
    const payload = { title: "Baru", priority: "High" as const, due_date: null };
    await taskApi.createTask(payload);

    expect(lastCall().url).toBe(`${BASE}/tasks`);
    expect(lastCall().init.method).toBe("POST");
    expect(JSON.parse(lastCall().init.body as string)).toEqual(payload);
  });

  it("updateTask -> PUT /tasks/{id} dengan body JSON", async () => {
    await taskApi.updateTask(3, { status: "Done" });

    expect(lastCall().url).toBe(`${BASE}/tasks/3`);
    expect(lastCall().init.method).toBe("PUT");
    expect(lastCall().init.body).toBe('{"status":"Done"}');
  });

  it("deleteTask -> DELETE /tasks/{id}", async () => {
    const body = { detail: "Tugas dengan ID 3 berhasil dihapus.", id: 3 };
    fetchMock.mockResolvedValue(jsonResponse(body));

    await expect(taskApi.deleteTask(3)).resolves.toEqual(body);
    expect(lastCall().url).toBe(`${BASE}/tasks/3`);
    expect(lastCall().init.method).toBe("DELETE");
  });

  it("getTaskAuditLogs -> GET /tasks/{id}/audit-logs", async () => {
    await taskApi.getTaskAuditLogs(5);
    expect(lastCall().url).toBe(`${BASE}/tasks/5/audit-logs`);
    expect(lastCall().init.method).toBe("GET");
  });
});

describe("API_BASE_URL", () => {
  it("dapat diganti lewat NEXT_PUBLIC_API_BASE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.contoh.test/v1");
    vi.resetModules();
    const { taskApi: freshApi } = await import("@/services/api");

    await freshApi.getSummary();
    expect(lastCall().url).toBe("https://api.contoh.test/v1/tasks/summary");
    vi.resetModules();
  });
});
