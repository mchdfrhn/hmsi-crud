# Task Management System - Backend (FastAPI)

Backend RESTful API untuk sistem manajemen tugas (Task Management System), dibangun dengan **Python FastAPI**, **SQLAlchemy**, dan didukung oleh basis data **PostgreSQL**.

---

## Fitur Utama

- **CRUD Tugas Lengkap**:
  - Buat tugas baru (`POST /api/tasks`) dengan validasi otomatis.
  - Ambil daftar tugas (`GET /api/tasks`) dengan paginasi, pencarian judul (`search`), dan pemfilteran (`status`, `priority`, `assignee`).
  - Ambil detail tugas (`GET /api/tasks/{id}`) dengan error handling `404 Not Found`.
  - Pembaruan tugas (`PUT /api/tasks/{id}` dan `PATCH /api/tasks/{id}`).
  - Penghapusan tugas (`DELETE /api/tasks/{id}`).
- **Ringkasan & Agregasi Status (`GET /api/tasks/summary`)**:
  - Menghitung total tugas, jumlah per status (`To Do`, `In Progress`, `Done`), serta deteksi otomatis tugas **Overdue** (melewati tenggat waktu dan belum selesai).
- **Validasi Data Ketat (Pydantic v2)**:
  - `title`: Wajib, tidak boleh kosong/hanya spasi, maksimal 100 karakter.
  - `due_date`: Tidak boleh lebih awal dari tanggal/waktu pembuatan tugas.
  - Status & Priority menggunakan enumerasi standar.
- **Error Handling Standar**:
  - Response error terstruktur dengan kode status HTTP semantik (200, 201, 404, 422).
- **CORS Middleware**:
  - Siap dihubungkan langsung dengan frontend Next.js di `http://localhost:3000`.
- **Dokumentasi Otomatis**:
  - Swagger UI interaktif di `/docs` dan ReDoc di `/redoc`.
- **Automated Tests**:
  - Test suite komprehensif menggunakan `pytest` dan in-memory SQLite fixtures terisolasi.

---

## Struktur Direktori

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py               # Dependency injection (get_db)
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   └── tasks.py      # Route handlers untuk Task API
│   │       └── router.py         # Aggregator router v1
│   ├── core/
│   │   ├── config.py             # App configuration & environment settings
│   │   └── database.py           # SQLAlchemy engine & sessionmaker
│   ├── models/
│   │   └── task.py               # SQLAlchemy ORM Task model
│   ├── schemas/
│   │   └── task.py               # Pydantic schemas (Request, Response, Summary)
│   ├── service/
│   │   └── tasks.py              # Service / Data access layer
│   └── main.py                   # Inisialisasi FastAPI & Middleware
├── tests/
│   ├── conftest.py               # Fixtures database in-memory & TestClient
│   └── test_tasks.py             # Unit & integration test cases
├── .env.example                  # Template variabel lingkungan
├── .env                          # Konfigurasi aktif lokal
├── requirements.txt              # Daftar dependensi Python
└── README.md                     # Panduan penggunaan backend
```

---

## Prasyarat & Instalasi

### 1. Aktifkan Lingkungan Virtual (Virtualenv)
Jika menggunakan virtualenv yang sudah ada:
```bash
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Atau Command Prompt:
.\.venv\Scripts\activate.bat
# Linux/macOS:
source .venv/bin/activate
```

### 2. Pasang Dependensi
```bash
pip install -r backend/requirements.txt
```

---

## Konfigurasi Database (PostgreSQL)

Salin atau sesuaikan file `.env` di dalam direktori `backend/` atau di root workspace:
```env
PROJECT_NAME="Task Management API"
API_V1_STR="/api"

# Sesuaikan dengan user, password, host, port, dan nama database PostgreSQL Anda
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_management"

# Konfigurasi URL frontend yang diizinkan (CORS)
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

> **Catatan**: Tabel `tasks` dan enumerasi tipe data akan dibuat secara otomatis oleh SQLAlchemy saat aplikasi FastAPI pertama kali dijalankan (`Base.metadata.create_all`). Pastikan database (misal: `task_management`) sudah dibuat di PostgreSQL Anda.

---

## Menjalankan Server Backend

Jalankan server pengembangan FastAPI menggunakan Uvicorn:
```bash
uvicorn backend.app.main:app --reload --port 8000
```
- API Endpoint: `http://localhost:8000/api/tasks`
- Swagger UI (Dokumentasi Interaktif): `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Menjalankan Pengujian Otomatis (Unit Testing)

Jalankan test suite menggunakan `pytest`:
```bash
pytest backend/tests -v
```

Semua pengujian unit berjalan di dalam database SQLite *in-memory* yang terisolasi sehingga dapat dijalankan kapan saja tanpa mengganggu data di PostgreSQL utama.
