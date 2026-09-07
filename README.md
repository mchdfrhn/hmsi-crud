# Task Management System - Fullstack (Technical Test HMSI)

Aplikasi manajemen tugas (*Task Management System*) fullstack modern yang dibangun menggunakan **FastAPI (Python)** dan **PostgreSQL** di sisi backend, serta **Next.js 16 (React 19)** dan **Tailwind CSS** di sisi frontend.

---

## 🛠️ Fullstack Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) ASGI
- **ORM & Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [PostgreSQL](https://www.postgresql.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/) & [pydantic-settings](https://docs.pydantic.dev/)
- **Testing**: [Pytest](https://docs.pytest.org/) & HTTPX (SQLite in-memory)

### Frontend
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Bahasa**: [TypeScript 5](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/)

---

## 📋 Prasyarat Perangkat

- **Python** (versi 3.10+)
- **Node.js** (versi 18+ / 20+) & **npm**
- **PostgreSQL Server** (versi 14+) yang sedang aktif
- **Git**

---

## 🚀 Panduan Memulai Cepat (Quickstart)

### Bagian 1: Menjalankan Backend (FastAPI)

1. **Aktifkan Virtual Environment**:
   - Windows PowerShell:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - Linux / macOS:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

2. **Pasang Dependensi Backend**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Konfigurasi File Environment Backend (`backend/.env`)**:
   Salin `backend/.env.example` ke `backend/.env` dan sesuaikan kredensial PostgreSQL Anda:
   ```env
   PROJECT_NAME="Task Management API"
   API_V1_STR="/api"
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_management"
   CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
   ```
   > **Catatan**: Pastikan database `task_management` sudah dibuat di PostgreSQL Anda. Tabel dan tipe enum akan dibuat secara otomatis saat backend pertama kali dijalankan.

4. **Jalankan Server Backend**:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
   - Swagger Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health Check: [http://localhost:8000/](http://localhost:8000/)

---

### Bagian 2: Menjalankan Frontend (Next.js)

1. **Buka Terminal Baru**, lalu masuk ke direktori `frontend/`:
   ```bash
   cd frontend
   ```

2. **Pasang Dependensi Frontend**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable (`frontend/.env.local`)**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   ```

4. **Jalankan Development Server Frontend**:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses langsung melalui browser di:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Menjalankan Automated Tests

### 1. Test Backend (Pytest)
Dijalankan secara terisolasi menggunakan SQLite in-memory:
```bash
pytest backend/tests -v
```

### 2. Test Frontend (Vitest & Testing Library)
Menguji validasi form, penolakan tanggal lampau, dan penanganan pengiriman:
```bash
cd frontend
npm test
```

---

## 🗄️ Database Migration (Alembic)

Skema basis data dikelola, dimigrasikan, dan dilacak versinya secara terstruktur menggunakan **Alembic**.

```bash
# Menjalankan migrasi ke versi skema terbaru (head)
alembic upgrade head

# Melihat versi migrasi yang aktif saat ini
alembic current

# Melihat seluruh riwayat migrasi yang tersedia
alembic history -v

# Membatalkan migrasi mundur 1 langkah (rollback)
alembic downgrade -1

# Membuat revisi migrasi baru secara otomatis
alembic revision --autogenerate -m "nama_perubahan"
```

---

## 🌟 Fitur Unggulan Sistem

| Fitur | Deskripsi |
| :--- | :--- |
| **Dashboard Metrik** | Agregasi real-time untuk Total Tasks, To Do, In Progress, Done, dan Overdue |
| **Bilah Progres** | Visualisasi persentase penyelesaian tugas secara proporsional |
| **Dual View Mode** | Toggle fleksibel antara **Tampilan Tabel** dan **Tampilan Kartu/Grid** |
| **Pencarian & Filter** | Debounced search judul tugas, filter status, filter prioritas, dan filter penanggung jawab |
| **Paginasi Responsif** | Pengaturan nomor halaman, tombol next/prev, dan pemilih limit baris per halaman |
| **Form Validasi Lengkap** | Validasi sisi klien, mapping error backend (422), dan proteksi anti-double-submission |
| **Aksi Status Cepat** | Pembaruan status (misal: "Mulai Kerjakan", "Tandai Selesai") dengan 1-klik |
| **Modal Konfirmasi Hapus** | Dialog peringatan konfirmasi sebelum tugas dihapus secara permanen |
| **Sistem Toast** | Notifikasi pop-up feedback otomatis untuk setiap aksi Create, Update, dan Delete |

---

## 📚 Ringkasan REST API Endpoint

Prefix rute API: `/api/tasks`

| Method | Endpoint | Deskripsi | Parameter / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Health check status API | - |
| `GET` | `/api/tasks/summary` | Ringkasan agregasi jumlah tugas per status & overdue | - |
| `GET` | `/api/tasks` | Mengambil daftar tugas (dengan filter & pagination) | `page`, `limit`, `status`, `priority`, `assignee`, `search` |
| `POST` | `/api/tasks` | Membuat tugas baru | JSON Body (`title`, `description`, `status`, `priority`, `due_date`, `assignee`) |
| `GET` | `/api/tasks/{id}` | Mengambil detail spesifik satu tugas | Path parameter `id` |
| `PUT` | `/api/tasks/{id}` | Memperbarui data tugas | Path `id`, JSON Body |
| `DELETE` | `/api/tasks/{id}` | Menghapus tugas | Path parameter `id` |

---

## 📁 Struktur Direktori Repositori

```text
hmsi/
├── backend/
│   ├── alembic/          # Direktori migrasi database Alembic
│   │   ├── versions/     # File revisi migrasi skema (001_create_tasks_table)
│   │   └── env.py        # Konfigurasi koneksi SQLAlchemy & runtime Alembic
│   ├── app/
│   │   ├── api/          # Route definitions & endpoints
│   │   ├── core/         # Konfigurasi aplikasi & database connection
│   │   ├── models/       # Model SQLAlchemy ORM
│   │   ├── schemas/      # Schema validasi Pydantic v2
│   │   ├── service/      # Layer data access (CRUD operations)
│   │   └── main.py       # FastAPI application entry point & CORS
│   ├── tests/            # Test suite Pytest & Fixtures
│   ├── alembic.ini       # Konfigurasi lokal Alembic backend
│   ├── seed.py           # Script python dummy data seeding
│   ├── seed.sql          # Script SQL murni dummy data seeding
│   ├── .env.example      # Template konfigurasi backend
│   └── requirements.txt  # Daftar paket Python (+ Alembic)
├── frontend/
│   ├── src/
│   │   ├── app/          # App router layout & main page
│   │   ├── components/   # UI components (dashboard, tasks, modals, badges)
│   │   ├── hooks/        # Custom React hooks (useTasks)
│   │   ├── lib/          # Helper utilities (date formatting, overdue)
│   │   ├── services/     # Centralized HTTP API client
│   │   ├── tests/        # Vitest UI component tests
│   │   └── types/        # TypeScript type definitions
│   ├── next.config.ts    # Next.js config
│   ├── .env.local        # Konfigurasi environment Next.js
│   ├── package.json      # Dependensi dan script frontend
│   └── README.md         # Dokumentasi khusus frontend
├── alembic.ini           # Konfigurasi root Alembic
├── PRD.md                # Product Requirements Document
└── README.md             # Dokumentasi utama proyek
```
