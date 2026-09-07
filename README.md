# Task Management System - Technical Test HMSI

Sistem manajemen tugas (*Task Management System*) berbasis REST API yang dibangun menggunakan **FastAPI**, **SQLAlchemy ORM**, dan basis data **PostgreSQL**.

---

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) ASGI
- **ORM & Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [PostgreSQL](https://www.postgresql.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/) & [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- **Testing**: [Pytest](https://docs.pytest.org/) & HTTPX (menggunakan in-memory SQLite fixtures)

---

## 📋 Prasyarat

Pastikan perangkat Anda telah terpasang:
- **Python** (versi 3.10 atau lebih baru)
- **PostgreSQL Server** (versi 14 atau lebih baru) yang sedang berjalan
- **Git**

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Buat & Aktifkan Virtual Environment

Buka terminal di direktori root project (`hmsi/`):

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

*Jika muncul error execution policy di PowerShell, jalankan sekali: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`*

**Windows (Command Prompt):**
```cmd
python -m venv .venv
.\.venv\Scripts\activate.bat
```

**Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### 2. Pasang Dependensi

Pastikan virtual environment telah aktif, lalu pasang paket dependensi:
```bash
pip install -r backend/requirements.txt
```

---

### 3. Konfigurasi Environment Variables (`.env`)

Salin template file `.env.example` yang ada di direktori `backend/` menjadi `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item backend\.env.example backend\.env
```

**Linux / macOS:**
```bash
cp backend/.env.example backend/.env
```

Buka file `backend/.env` dan sesuaikan kredensial PostgreSQL Anda:
```env
PROJECT_NAME="Task Management API"
API_V1_STR="/api"

# Format: postgresql://<username>:<password>@<host>:<port>/<nama_database>
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_management"

CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

> **Catatan Penting Database:**
> Buat database baru bernama `task_management` di PostgreSQL (misal via pgAdmin, DBeaver, atau psql: `CREATE DATABASE task_management;`).
> Skema tabel dan tipe enumerasi akan otomatis dibuatkan oleh SQLAlchemy saat aplikasi FastAPI pertama kali dijalankan (`Base.metadata.create_all`).

---

### 4. Menjalankan Server Backend

Jalankan server pengembangan dengan perintah berikut dari direktori root:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Server akan aktif di:
- **Base URL / Health Check**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Docs (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Menjalankan Automated Tests

Test suite dijalankan secara terisolasi menggunakan SQLite in-memory, sehingga Anda dapat menjalankannya kapan saja tanpa mempengaruhi database PostgreSQL asli:

```bash
pytest backend/tests -v
```

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
| `PUT` | `/api/tasks/{id}` | Memperbarui seluruh data tugas | Path `id`, JSON Body lengkap |
| `PATCH` | `/api/tasks/{id}` | Memperbarui sebagian field tugas | Path `id`, JSON Body parsial |
| `DELETE` | `/api/tasks/{id}` | Menghapus tugas | Path parameter `id` |

---

## 📁 Struktur Direktori

```text
hmsi/
├── backend/
│   ├── app/
│   │   ├── api/          # Route definitions & dependency injection
│   │   ├── core/         # Konfigurasi app & koneksi database
│   │   ├── models/       # Model SQLAlchemy ORM
│   │   ├── schemas/      # Schema validasi Pydantic v2
│   │   ├── service/      # Layer query data access (CRUD)
│   │   └── main.py       # Entry point FastAPI & Middleware
│   ├── tests/            # Test suite Pytest & Fixtures
│   ├── .env.example      # Template konfigurasi
│   ├── .env              # Konfigurasi aktif (diabaikan git)
│   └── requirements.txt  # Daftar dependensi backend
├── .gitignore            # Filter file yang diabaikan Git
├── pyrightconfig.json    # Konfigurasi Python Language Server
└── README.md             # Panduan dokumentasi proyek
```

---

## 🔧 Troubleshooting Umum

1. **Error `Cannot find module sqlalchemy` di VS Code:**
   - Tekan `Ctrl + Shift + P` -> pilih **Python: Select Interpreter** -> pilih `.venv` (`.\.venv\Scripts\python.exe`).
2. **Error `FATAL: password authentication failed for user "postgres"`:**
   - Periksa kembali file `backend/.env`. Sesuaikan `<username>` dan `<password>` dengan user PostgreSQL yang ada di komputer Anda.
3. **Error `database "task_management" does not exist`:**
   - Buat database `task_management` terlebih dahulu di PostgreSQL sebelum menjalankan server.
