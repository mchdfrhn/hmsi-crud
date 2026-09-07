# 📋 Status Implementasi Fitur (Feature Checklist)

Dokumen ini memetakan seluruh spesifikasi teknis dari dokumen persyaratan (*Practical Test: Task Management Application*) terhadap status implementasi di dalam repositori ini.

---

## 📊 Ringkasan Eksekutif

| Kategori Kebutuhan | Total Butir | Selesai (Complete) | Belum (Incomplete) | Persentase |
| :--- | :---: | :---: | :---: | :---: |
| **1. Entitas & Atribut Tugas** | 9 | 9 | 0 | **100%** |
| **2. Backend REST API (FastAPI)** | 16 | 16 | 0 | **100%** |
| **3. Frontend Web App (Next.js)** | 19 | 19 | 0 | **100%** |
| **4. Bonus / Nilai Tambah (Optional)** | 12 | 4 | 8 | **33.3%** |
| **TOTAL KESELURUHAN** | **56** | **48** | **8** | **85.7%** |

> [!NOTE]
> Seluruh kebutuhan **Wajib (Mandatory)** pada Bagian 1, 2, dan 3 telah **100% Selesai dan Lulus Uji Validasi (Pytest & Vitest)**. Fitur yang berstatus *Incomplete* seluruhnya berada pada kategori *Bonus Requirements (Optional)*.

---

## 1. Entitas Data & Atribut Tugas (Task Fields)

Semua atribut tugas telah didefinisikan secara presisi pada model database dan skema validasi data:

| Field | Kebutuhan Spesifikasi | Status | Bukti / Lokasi Implementasi |
| :--- | :--- | :---: | :--- |
| **ID** | Otomatis dibuat (Auto-generated) | ✅ **Complete** | [`backend/app/models/task.py`](file:///d:/technical_test/hmsi/backend/app/models/task.py) (`id = Column(Integer, primary_key=True, autoincrement=True)`) |
| **Title** | Wajib, maksimal 100 karakter | ✅ **Complete** | [`backend/app/schemas/task.py`](file:///d:/technical_test/hmsi/backend/app/schemas/task.py) & model `String(100)` |
| **Description** | Opsional | ✅ **Complete** | [`backend/app/models/task.py`](file:///d:/technical_test/hmsi/backend/app/models/task.py) (`nullable=True`) |
| **Status** | `To Do`, `In Progress`, atau `Done` | ✅ **Complete** | PostgreSQL ENUM `task_status` & Enum Python `TaskStatus` |
| **Priority** | `Low`, `Medium`, atau `High` | ✅ **Complete** | PostgreSQL ENUM `task_priority` & Enum Python `TaskPriority` |
| **Assignee** | Nama penanggung jawab tugas | ✅ **Complete** | `String(100)`, opsional dengan pembersihan spasi |
| **Due Date** | Target tenggat penyelesaian | ✅ **Complete** | `DateTime(timezone=True)`, opsional |
| **Created At** | Otomatis dibuat saat insert | ✅ **Complete** | `server_default=func.now()` |
| **Updated At** | Otomatis diperbarui saat update | ✅ **Complete** | `server_default=func.now(), onupdate=func.now()` |

---

## 2. Backend REST API (Python FastAPI)

### 2.1 Endpoint RESTful
- [x] **`POST /api/tasks`**: Membuat tugas baru dengan validasi field wajib dan nilai default.
- [x] **`GET /api/tasks`**: Mengambil daftar tugas dengan dukungan filter, search, sorting, dan paginasi.
- [x] **`GET /api/tasks/{id}`**: Mengambil data detail satu tugas berdasarkan ID spesifik (404 jika tidak ada).
- [x] **`PUT /api/tasks/{id}`**: Memperbarui data tugas (validasi tanggal, update status, judul, dll.).
- [x] **`DELETE /api/tasks/{id}`**: Menghapus tugas secara permanen dari database (404 jika tidak ada).
- [x] **`GET /api/tasks/summary`**: Mengambil ringkasan agregat jumlah tugas (*To Do, In Progress, Done, Overdue*).

### 2.2 Aturan Bisnis (Business Rules)
- [x] **Judul tugas tidak boleh kosong**: Divalidasi di Pydantic (`strip()` non-empty) dan sisi klien form.
- [x] **Tenggat waktu tidak boleh sebelum tanggal pembuatan**: Divalidasi di Pydantic `@model_validator` dan service layer.
- [x] **Status default tugas baru adalah `To Do`**: Diatur di model DB default dan skema Pydantic.
- [x] **Mengembalikan status `404 Not Found`**: Ditangani saat ID tidak ditemukan pada GET, PUT, DELETE.
- [x] **Filter tugas berdasarkan status, prioritas, dan assignee**: Parameter query `status`, `priority`, `assignee`.
- [x] **Pencarian judul tugas (search)**: Parameter query `search` berbasis case-insensitive SQL `ilike`.
- [x] **Paginasi**: Parameter `page` dan `limit`, mengembalikan metadata `total`, `page`, `limit`, `total_pages`.

### 2.3 Standar & Kualitas Backend
- [x] Menggunakan **Python FastAPI**.
- [x] Menggunakan **Pydantic v2** untuk request & response validation.
- [x] Menggunakan database **PostgreSQL** dengan ORM **SQLAlchemy 2.0**.
- [x] Struktur proyek rapi dan terisolasi (`api`, `core`, `models`, `schemas`, `service`).
- [x] Menghasilkan status code HTTP yang sesuai (`200 OK`, `201 Created`, `404 Not Found`, `422 Unprocessable Content`).
- [x] Penanganan error yang informatif untuk data yang tidak valid.
- [x] Dokumentasi interaktif via **FastAPI Swagger UI** (`/docs`) dan **ReDoc** (`/redoc`).
- [x] Konfigurasi koneksi database melalui environment variables (`.env` dan `pydantic-settings`).
- [x] **Unit Testing (Pytest)**: 10 skenario pengujian otomatis dengan database SQLite in-memory (100% Lulus).

---

## 3. Frontend Web Application (Next.js 16 / React 19)

### 3.1 Task List
- [x] **Dual View Mode**: Menampilkan tugas dalam format **Tabel** dan format **Kartu / Grid**.
- [x] **Menampilkan seluruh atribut penting**: Status, prioritas, penanggung jawab, tenggat waktu, dan badge overdue.
- [x] **Loading Indicator**: Animasi *skeleton loading* saat data sedang diambil dari backend.
- [x] **Empty State**: Tampilan informatif khusus ketika data kosong atau hasil pencarian nihil.
- [x] **Filter Interaktif**: Dropdown filter berdasarkan status dan prioritas.
- [x] **Pencarian Judul**: Input pencarian dengan mekanisme debounce instan.
- [x] **Paginasi**: Navigasi nomor halaman, tombol next/prev, dan pemilih ukuran halaman (10, 20, 50).

### 3.2 Create & Edit Task
- [x] **Form Pembuatan & Pembaruan Tugas**: Modal form terpadu untuk create dan edit.
- [x] **Validasi Field Wajib**: Validasi judul tugas wajib diisi dan tenggat waktu tidak boleh lampau.
- [x] **Menampilkan Pesan Validasi Error**: Error divalidasi di sisi frontend dan menangkap pesan error dari backend (422).
- [x] **Notifikasi Sukses (Toast Feedback)**: Toast notifikasi modern yang muncul otomatis setelah tugas berhasil disimpan/diupdate/dihapus.
- [x] **Anti-Multiple Submissions**: Tombol *submit* otomatis dinonaktifkan (*disabled*) dan menampilkan spinner selama proses HTTP request berlangsung.

### 3.3 Task Details
- [x] **Informasi Tugas Lengkap**: Modal detail menampilkan judul, deskripsi lengkap, penanggung jawab, tanggal pembuatan, tanggal pembaruan, dan tenggat waktu.
- [x] **Aksi Edit & Hapus**: Tombol pintas untuk mengedit dan menghapus tugas langsung dari modal detail.
- [x] **Modal Konfirmasi Hapus**: Dialog konfirmasi peringatan sebelum tugas dihapus permanen.

### 3.4 Dashboard Summary
- [x] **Kartu Ringkasan Metrik**: Menampilkan total tugas, *To Do*, *In Progress*, *Done*, dan *Overdue*.
- [x] **Filter Cepat via Kartu**: Mengklik kartu metrik otomatis menyaring tabel sesuai kategori.
- [x] **Bilah Progres Visual (Progress Bar)**: Indikator persentase penyelesaian proyek multi-warna yang proporsional.

### 3.5 Standar & Kualitas Frontend
- [x] Menggunakan **React 19 & Next.js 16 (App Router)**.
- [x] Komponen fungsional dengan **React Hooks** (`useState`, `useEffect`, `useCallback`, `useMemo`).
- [x] Pemisahan layer API terpusat (`src/services/api.ts`) terpisah dari UI komponen.
- [x] Desain sepenuhnya **responsif** di perangkat mobile, tablet, dan desktop.
- [x] Tampilan modern, bersih, profesional berbasis **Tailwind CSS v4** & **Lucide React Icons**.
- [x] **Component Testing**: Pengujian form modal menggunakan **Vitest** dan **React Testing Library** (4/4 Lulus).

---

## 4. Bonus Requirements (Nilai Tambah / Opsional)

| Fitur Bonus | Status | Keterangan & Rincian |
| :--- | :---: | :--- |
| **Database migration using Alembic** | ✅ **Complete** | Dikonfigurasi penuh dengan 2 file revisi migrasi: `f20bfc105665` (tasks table) dan `cde52ce8b5e2` (audit logs table). Sudah teruji di PostgreSQL lokal. |
| **Automated test coverage** | ✅ **Complete** | 10 unit test backend (Pytest) + 4 unit test frontend (Vitest) dengan cakupan alur CRUD, validasi, dan audit log. |
| **Reusable React components** | ✅ **Complete** | Komponen UI modular: `Modal`, `Button`, `Input`, `Select`, `Textarea`, `StatusBadge`, `PriorityBadge`, `OverdueBadge`, `Toast`, `Pagination`, dll. |
| **An audit log for task status changes** | ✅ **Complete** | Model `TaskAuditLog`, migrasi database, pencatatan otomatis saat inisialisasi dan transisi status, endpoint `GET /api/tasks/{id}/audit-logs`, dan timeline visual aktivitas di UI modal. |
| **JWT-based authentication** | ⏳ *Incomplete* | Belum diimplementasikan. Arsitektur saat ini bersifat open workspace tanpa login. |
| **Admin and User roles** | ⏳ *Incomplete* | Belum diimplementasikan (bergantung pada modul autentikasi). |
| **An Admin can delete any task** | ⏳ *Incomplete* | Belum diimplementasikan (bergantung pada peran Admin). |
| **A User can only update tasks assigned to them** | ⏳ *Incomplete* | Belum diimplementasikan (bergantung pada peran User dan autentikasi pengguna). |
| **Docker and Docker Compose** | ⏳ *Incomplete* | Belum diimplementasikan. Aplikasi dijalankan secara native di lingkungan host lokal. |
| **React Query / TanStack Query** | ⏳ *Incomplete* | State server saat ini dikelola menggunakan custom React hook (`useTasks`) dan asynchronous service layer yang modular. |
| **A simple CI pipeline** | ⏳ *Incomplete* | Skrip pengujian otomatis lokal telah tersedia (`pytest` dan `vitest`), namun file workflow GitHub Actions (`.github/workflows/ci.yml`) belum dibuat. |
| **Deployment to cloud / free hosting** | ⏳ *Incomplete* | Aplikasi saat ini disiapkan dan diuji untuk lingkungan lokal (FastAPI port 8000 + Next.js port 3000 + PostgreSQL lokal port 5432). |

---

## 🎯 Panduan Verifikasi Pengujian

Untuk memverifikasi seluruh fitur yang telah selesai di repositori ini:

1. **Jalankan Pengujian Backend**:
   ```bash
   pytest backend/tests -v
   # Hasil: 10 passed
   ```

2. **Jalankan Pengujian Frontend**:
   ```bash
   cd frontend
   npm test
   # Hasil: 4 passed
   ```

3. **Periksa Status Migrasi Database**:
   ```bash
   alembic current
   # Hasil: cde52ce8b5e2 (head)
   ```

4. **Jalankan Build Produksi Frontend**:
   ```bash
   cd frontend
   npm run build
   # Hasil: Compiled successfully & TypeScript validation passed
   ```
