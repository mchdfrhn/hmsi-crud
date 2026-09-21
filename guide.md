# 📘 Tutorial Penyusunan Task Management System dari Nol sampai Selesai
> **Panduan Praktis Arsitektur Kode Berstandar Industri: FastAPI + PostgreSQL + Next.js 15 (TypeScript)**
> *Ditulis dengan pendekatan "Developer Journey" ala programmer manusia: memahami masalah, menentukan arsitektur, menghadapi rintangan nyata, hingga merilis aplikasi yang kokoh dan rapi.*

---

## 📑 Daftar Isi
1. [Filosofi Desain & Mental Model Aplikasi](#1-filosofi-desain--mental-model-aplikasi)
2. [Spesifikasi Teknis & Pemilihan Tech Stack](#2-spesifikasi-teknis--pemilihan-tech-stack)
3. [Arsitektur Direktori Proyek](#3-arsitektur-direktori-proyek)
4. [Tahap 1: Inisialisasi Proyek & Database PostgreSQL](#tahap-1-inisialisasi-proyek--database-postgresql)
5. [Tahap 2: Lapisan Konfigurasi & Koneksi Database Backend](#tahap-2-lapisan-konfigurasi--koneksi-database-backend)
6. [Tahap 3: Perancangan Model Data ORM (SQLAlchemy)](#tahap-3-perancangan-model-data-orm-sqlalchemy)
7. [Tahap 4: Lapisan Validasi Kontrak Data (Pydantic Schemas)](#tahap-4-lapisan-validasi-kontrak-data-pydantic-schemas)
8. [Tahap 5: Lapisan Logika Bisnis & Query Dinamis (Service Layer)](#tahap-5-lapisan-logika-bisnis--query-dinamis-service-layer)
9. [Tahap 6: Lapisan HTTP Controller & REST Endpoints (FastAPI)](#tahap-6-lapisan-http-controller--rest-endpoints-fastapi)
10. [Tahap 7: Database Seeding & Migrasi Data](#tahap-7-database-seeding--migrasi-data)
11. [Tahap 8: Inisialisasi Frontend & Sistem Tipe (Next.js 15 + TypeScript)](#tahap-8-inisialisasi-frontend--sistem-tipe-nextjs-15--typescript)
12. [Tahap 9: Client API Terpusat & Utilitas Tanggal](#tahap-9-client-api-terpusat--utilitas-tanggal)
13. [Tahap 10: State Management Mandiri via Custom Hook (useTasks)](#tahap-10-state-management-mandiri-via-custom-hook-usetasks)
14. [Tahap 11: Pembangunan Komponen UI & Desain Antarmuka](#tahap-11-pembangunan-komponen-ui--desain-antarmuka)
15. [Tahap 12: Perakitan Akhir Dashboard (page.tsx) & Integrasi Sistem](#tahap-12-perakitan-akhir-dashboard-pagetsx--integrasi-sistem)
16. [Catatan Nyata Developer: Pitfalls, Masalah Nyata & Solusinya](#catatan-nyata-developer-pitfalls-masalah-nyata--solusinya)

---

## 1. Filosofi Desain & Mental Model Aplikasi

Ketika seorang programmer diminta membuat aplikasi **Task Management System**, kesalahan paling umum adalah langsung menulis kode CRUD (Create, Read, Update, Delete) sederhana tanpa memikirkan siklus hidup data (*data lifecycle*).

Dalam dunia nyata, aplikasi manajemen tugas memiliki kebutuhan bisnis yang spesifik:
1. **Integritas Status (State Machine)**: Tugas berpindah dari `To Do` ➔ `In Progress` ➔ `Done`. Siapa yang mengubahnya dan kapan perubahan itu terjadi? Tanpa jejak riwayat (*audit trail*), data rentan kehilangan akuntabilitas.
2. **Urgensi & Waktu**: Tugas memiliki tenggat waktu (*deadline*). Tugas yang belum selesai tetapi sudah melewati batas waktu harus otomatis dideteksi sebagai **Overdue** (Terlambat).
3. **Pencarian & Skalabilitas Data**: Saat tugas bertambah menjadi ribuan, client tidak boleh menarik semua data sekaligus. Dibutuhkan *pagination*, pencarian parsial judul (*case-insensitive search*), filter status/prioritas, dan pengurutan (*sorting*).
4. **Respon Pengguna yang Halus (User Experience)**: Input pencarian tidak boleh membombardir server pada setiap ketukan keyboard (wajib ada *debouncing*), feedback perubahan harus instan (notifikasi *toast*), dan ada visual indikator status (persentase *progress bar*).

---

## 2. Spesifikasi Teknis & Pemilihan Tech Stack

### Mengapa Kombinasi FastAPI + PostgreSQL + Next.js 15?

| Komponen | Pilihan Teknologi | Alasan Pemilihan Arsitektur |
| :--- | :--- | :--- |
| **Backend Framework** | **FastAPI (Python 3.10+)** | Sangat cepat (berbasis Starlette & Asgi), pengetikan statis via Pydantic, dokumentasi Swagger/OpenAPI otomatis di `/docs`. |
| **Database ORM** | **SQLAlchemy 2.x** | Standar industri Python untuk enterprise data-mapping, mendukung session management, connection pooling, dan query dinamis yang aman dari SQL Injection. |
| **Relational DB** | **PostgreSQL** | Mendukung tipe data `ENUM` native, constraint foreign key cascading yang ketat, dan indeks B-Tree yang andal. |
| **Frontend Framework** | **Next.js 15 (App Router)** | Framework React modern dengan performa tinggi, struktur routing modular, dan dukungan penuh TypeScript. |
| **Styling** | **Tailwind CSS** | Styling fleksibel berbasis utilitas, menghasilkan desain antarmuka bersih, konsisten, dan responsif tanpa file CSS terpisah yang menumpuk. |
| **Ikonografi** | **Lucide React** | Paket ikon SVG modern, ringan, dan tree-shakeable. |

---

## 3. Arsitektur Direktori Proyek

Struktur folder disusun mengikuti prinsip **Separation of Concerns (SoC)** dan **Clean Architecture**:

```text
hmsi-crud/
├── backend/                        # Backend API (Python / FastAPI)
│   ├── alembic/                    # Skrip migrasi database (Alembic)
│   ├── app/
│   │   ├── api/                    # Lapisan API & Rute HTTP
│   │   │   ├── deps.py             # Dependency Injection (Sesi DB)
│   │   │   └── v1/
│   │   │       ├── endpoints/      # Controller per domain
│   │   │       │   └── tasks.py    # Route RESTful /api/tasks
│   │   │       └── router.py       # Aggregator router v1
│   │   ├── core/                   # Konfigurasi Inti
│   │   │   ├── config.py           # Pydantic BaseSettings (.env reader)
│   │   │   └── database.py         # Engine & Session SQLAlchemy
│   │   ├── models/                 # ORM Database Models
│   │   │   ├── task.py             # Tabel 'tasks' & Enums
│   │   │   └── audit_log.py        # Tabel 'task_audit_logs'
│   │   ├── schemas/                # Kontrak Data Pydantic (DTO)
│   │   │   ├── task.py             # TaskCreate, TaskUpdate, TaskResponse
│   │   │   └── audit_log.py        # TaskAuditLogResponse
│   │   ├── service/                # Business Logic & Repository Layer
│   │   │   └── tasks.py            # Operasi CRUD, Filter, Audit Log
│   │   └── main.py                 # Titik Masuk FastAPI & Middleware
│   ├── requirements.txt            # Dependensi Python backend
│   ├── seed.py                     # Skrip pembuat data dummy realistis
│   └── .env                        # Variabel lingkungan backend
│
├── frontend/                       # Frontend SPA (Next.js / TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root Layout & ToastProvider
│   │   │   ├── page.tsx            # Dashboard View Orchestrator
│   │   │   └── globals.css         # Styling global Tailwind
│   │   ├── components/
│   │   │   ├── dashboard/          # Komponen KPI & Visualisasi
│   │   │   │   ├── SummaryCards.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   ├── tasks/              # Komponen Manajemen Data
│   │   │   │   ├── TaskTable.tsx
│   │   │   │   ├── TaskGrid.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   ├── TaskFilterBar.tsx
│   │   │   │   ├── TaskFormModal.tsx
│   │   │   │   ├── TaskDetailModal.tsx
│   │   │   │   ├── DeleteConfirmModal.tsx
│   │   │   │   └── Pagination.tsx
│   │   │   └── ui/                 # Komponen Primitif
│   │   │       ├── Badge.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Toast.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── hooks/                  # Custom React Hooks
│   │   │   └── useTasks.ts         # Hook stateful data & filter
│   │   ├── lib/                    # Helper & Utilitas
│   │   │   └── dateUtils.ts        # Format tanggal & cek overdue
│   │   ├── services/               # HTTP Client
│   │   │   └── api.ts              # Fetch wrapper & API endpoint
│   │   └── types/                  # Kontrak Tipe TypeScript
│   │       └── task.ts             # Interface Task, DTO, Params
│   └── package.json
└── README.md
```

---

## Tahap 1: Inisialisasi Proyek & Database PostgreSQL

Langkah pertama seorang pengembang adalah menyiapkan database dan repositori:

### 1. Buat Database PostgreSQL
Jalankan PostgreSQL (bisa via pgAdmin, CLI psql, atau Docker):
```sql
CREATE DATABASE task_management;
```

### 2. Konfigurasi Virtual Environment Python
Di direktori `backend/`:
```bash
python -m venv .venv
# Mengaktifkan di Windows PowerShell:
.venv\Scripts\Activate.ps1
# Atau di Linux/macOS:
source .venv/bin/activate
```

Instal paket dependensi inti:
```bash
pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary pydantic pydantic-settings alembic
```

---

## Tahap 2: Lapisan Konfigurasi & Koneksi Database Backend

### File: `backend/app/core/config.py`
Mengapa tidak menggunakan `os.getenv()` biasa?
`pydantic-settings` memberikan **type safety** dan **validasi otomatis** sejak aplikasi dinyalakan. Jika tipe data salah, aplikasi akan memberitahu letak kesalahannya sebelum error di runtime.

```python
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Task Management API"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/task_management"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        # Memecah string koma dari .env menjadi List Python
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

settings = Settings()
```

### File: `backend/app/core/database.py`
Di sini kita menginisialisasi SQLAlchemy Engine dan Session Factory:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

db_url = settings.DATABASE_URL
# Normalisasi prefix postgres:// lama ke postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# pool_pre_ping=True menguji koneksi (SELECT 1) sebelum dipakai,
# menghindari error 'connection dropped' saat server database sempat idle.
engine = create_engine(db_url, pool_pre_ping=True)

# Session maker untuk request lifecycle
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class untuk seluruh model ORM
Base = declarative_base()
```

---

## Tahap 3: Perancangan Model Data ORM (SQLAlchemy)

### 1. Entitas Tugas: `backend/app/models/task.py`
Tabel `tasks` menyimpan seluruh data tugas:
- Menggunakan Enum eksplisit (`TaskStatus`: "To Do", "In Progress", "Done"; `TaskPriority`: "Low", "Medium", "High").
- Kolom yang sering dijadikan filter atau disortir diberi `index=True` untuk menjaga kecepatan query.
- Timestamps `created_at` dan `updated_at` otomatis diisi waktu server basis data (`func.now()`).
- Relasi `audit_logs` didefinisikan dengan `cascade="all, delete-orphan"`: jika tugas dihapus, seluruh riwayat perubahannya ikut terhapus secara bersih.

```python
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TaskStatus, ...), nullable=False, default=TaskStatus.TODO, index=True)
    priority = Column(SQLEnum(TaskPriority, ...), nullable=False, default=TaskPriority.MEDIUM, index=True)
    assignee = Column(String(100), nullable=True, index=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    audit_logs = relationship(
        "TaskAuditLog",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="desc(TaskAuditLog.changed_at)",
    )
```

### 2. Entitas Jejak Audit: `backend/app/models/audit_log.py`
Tabel `task_audit_logs` mencatat setiap perubahan status tugas:
- `task_id`: Foreign Key ke `tasks.id` dengan aturan database `ondelete="CASCADE"`.
- `old_status`: Status sebelum perubahan (bernilai `NULL` saat tugas pertama kali dibuat).
- `new_status`: Status setelah perubahan.
- `changed_at`: Waktu pencatatan.

---

## Tahap 4: Lapisan Validasi Kontrak Data (Pydantic Schemas)

### File: `backend/app/schemas/task.py`
Data yang dikirimkan oleh user dari internet tidak boleh dipercaya mentah-mentah (*Never trust user input*). Kita menggunakan Pydantic v2 untuk memvalidasi:

1. **Pembersihan Whitespace**: Field `title` dan `assignee` otomatis di-strip spasi di awal/akhir menggunakan `@field_validator`. Jika judul hanya berisi spasi kosong, tolak dengan error ramah.
2. **Validasi Aturan Bisnis Tanggal**: Pada saat membuat tugas baru (`TaskCreate`), tanggal batas waktu (`due_date`) tidak boleh berada di masa lampau sebelum tanggal pembuatan. Kita gunakan `@model_validator(mode="after")`.
3. **Skema Update Parsial**: Pada `TaskUpdate`, semua field bersifat `Optional` sehingga klien dapat mengirim hanya atribut yang ingin diperbarui (misalnya hanya status).
4. **Skema Respons Terstruktur**: `TaskResponse` memuat field lengkap database dengan `from_attributes=True`, `TaskListResponse` menyertakan metadata paginasi (`total`, `page`, `limit`, `total_pages`), dan `TaskSummaryResponse` menyediakan metrik agregasi status.

---

## Tahap 5: Lapisan Logika Bisnis & Query Dinamis (Service Layer)

### File: `backend/app/service/tasks.py`
Prinsip arsitektur yang baik memisahkan controller HTTP dari query database. Kelas `CRUDTask` menjadi satu-satunya tempat yang mengelola query SQLAlchemy:

### 1. Query Dinamis & Paginasi (`get_multi`)
Query disusun secara bertahap sesuai filter yang dikirimkan klien:
```python
query = db.query(Task)
if status:
    query = query.filter(Task.status == status)
if priority:
    query = query.filter(Task.priority == priority)
if assignee:
    query = query.filter(Task.assignee.ilike(f"%{assignee}%"))
if search:
    query = query.filter(Task.title.ilike(f"%{search}%"))
if is_overdue is True:
    now_utc = datetime.now(timezone.utc)
    query = query.filter(
        Task.status != TaskStatus.DONE,
        Task.due_date.isnot(None),
        Task.due_date < now_utc,
    )
```
- Menghitung `total = query.count()` sebelum pagination diaplikasikan.
- Paginasi dieksekusi efisien di level database: `.offset((page - 1) * limit).limit(limit).all()`.
- Sorting: Mendukung `created_at`, `due_date`, atau `title` dengan pengurutan `asc`/`desc` serta penanganan `nulls_last()` pada tanggal kosong.

### 2. Otomasi Jejak Audit (`create` dan `update`)
- Saat `create()`: Setelah `Task` disimpan, otomatis dibuat `TaskAuditLog(task_id=db_obj.id, old_status=None, new_status=db_obj.status)`.
- Saat `update()`: Bandingkan `old_status` dengan `new_status`. Jika berbeda, buat baris baru di `TaskAuditLog`. Semua terjadi dalam satu transaksi atomik database.

### 3. Agregasi Dashboard (`get_summary`)
Menghitung jumlah `total`, `todo`, `in_progress`, `done`, dan `overdue` secara efisien melalui kueri agregasi server database tanpa memuat ribuan baris data ke memori Python.

---

## Tahap 6: Lapisan HTTP Controller & REST Endpoints (FastAPI)

### 1. Injeksi Dependensi: `backend/app/api/deps.py`
FastAPI memanfaatkan konsep Python Generator untuk siklus hidup koneksi:
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() # Dijamin selalu ditutup setelah response terkirim
```

### 2. Endpoint RESTful: `backend/app/api/v1/endpoints/tasks.py`
Endpoints dirancang mematuhi konvensi REST standar:
- `GET /api/tasks/summary`: Ringkasan status dan KPI dasbor (*ditaruh sebelum `/{id}` agar tidak terjadi konflik rute*).
- `POST /api/tasks`: Membuat tugas baru (mengembalikan `HTTP 201 Created`).
- `GET /api/tasks`: Mengambil koleksi tugas berpaginasi dengan validasi `Query(ge=1, le=100)`.
- `GET /api/tasks/{id}`: Mengambil detail satu tugas (mengembalikan `404 Not Found` jika tidak ada).
- `GET /api/tasks/{id}/audit-logs`: Mengambil riwayat perubahan status tugas.
- `PUT /api/tasks/{id}`: Memperbarui data tugas.
- `DELETE /api/tasks/{id}`: Menghapus tugas dari sistem.

### 3. Inisialisasi Server: `backend/app/main.py`
- Menggunakan `lifespan(app: FastAPI)` modern untuk inisialisasi skema tabel otomatis saat server startup.
- Mendaftarkan `CORSMiddleware` agar frontend Next.js di port 3000 dapat berinteraksi tanpa diblokir browser.
- Menambahkan kustom `validation_exception_handler` untuk `RequestValidationError`, mengubah format error Pydantic menjadi array JSON yang rapi dan mudah dibaca frontend.

---

## Tahap 7: Database Seeding & Migrasi Data

### File: `backend/seed.py`
Untuk menguji aplikasi dengan realistis, dibuat skrip seeder yang menyisipkan data dummy yang menyerupai tiket proyek perangkat lunak sungguhan (misal: "Implementasi Sistem Autentikasi JWT", "Setup CI/CD Pipeline", dsb.) dengan kombinasi tanggal deadline masa depan dan yang sudah terlewat (*overdue*).

Jalankan seeder:
```bash
python backend/seed.py
```

---

## Tahap 8: Inisialisasi Frontend & Sistem Tipe (Next.js 15 + TypeScript)

Di direktori `frontend/`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install lucide-react clsx tailwind-merge
```

### File: `frontend/src/types/task.ts`
Kita mendefinisikan interface TypeScript yang menjadi cerminan kontrak skema backend:
- `TaskStatus = "To Do" | "In Progress" | "Done"`
- `TaskPriority = "Low" | "Medium" | "High"`
- `interface Task { id: number; title: string; ... }`
- `interface TaskAuditLog { ... }`
- `interface TaskQueryParams { ... }`
- `interface TaskSummaryResponse { ... }`

---

## Tahap 9: Client API Terpusat & Utilitas Tanggal

### 1. HTTP Client: `frontend/src/services/api.ts`
- Kelas kustom `ApiError` menangkap pesan error detail dari backend FastAPI.
- Fungsi pembungkus generic `request<T>()` menyederhanakan pemanggilan fetch, penambahan header `Content-Type: application/json`, dan handling respons JSON.
- `URLSearchParams` digunakan untuk merakit query string URL secara dinamis dan aman dari karakter spesial.

### 2. Utilitas Tanggal: `frontend/src/lib/dateUtils.ts`
- `isOverdue(dueDateString, status)`: Mengecek apakah tanggal deadline lebih kecil dari `Date.now()` untuk tugas yang belum selesai.
- `formatDateTime(dateString)`: Memformat string ISO ke lokalisasi bahasa Indonesia menggunakan native `Intl.DateTimeFormat("id-ID", ...)` tanpa ketergantungan library eksternal.
- `toDateTimeLocal(isoString)`: Mengubah string ISO tanggal ke format nilai yang dapat diterima input HTML5 `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`).

---

## Tahap 10: State Management Mandiri via Custom Hook (useTasks)

### File: `frontend/src/hooks/useTasks.ts`
Alih-alih menambahkan pustaka state management yang rumit (seperti Redux Toolkit), kita merancang Custom React Hook `useTasks()` yang membungkus seluruh kebutuhan data halaman:

1. **State Penyimpanan Data**: `tasks`, `summary`, `total`, `totalPages`.
2. **State Filter & Pagination**: `page`, `limit`, `status`, `priority`, `assignee`, `search`, `isOverdueFilter`, `sortBy`, `sortOrder`.
3. **Penyelesaian Masalah Debounce**:
   Ketika user mengetik nama tugas di kotak pencarian, kita tidak boleh mengirim HTTP request di setiap ketukan tombol. Digunakan `useRef` dan `setTimeout` selama 300ms untuk menunda eksekusi fetch hingga user selesai mengetik.
4. **Optimistic & Synchronized Mutations**:
   Fungsi mutasi `createTask`, `updateTask`, `quickUpdateStatus`, dan `deleteTask` otomatis memanggil `Promise.all([fetchTasks(), fetchSummary()])` agar kartu ringkasan KPI dan tabel selalu sinkron secara real-time.
5. **Handling Pagination Edge Case**:
   Jika user menghapus satu-satunya tugas yang tersisa di halaman 2, hook secara otomatis memundurkan posisi halaman aktif ke halaman 1 (`setPage(prev => prev - 1)`).

---

## Tahap 11: Pembangunan Komponen UI & Desain Antarmuka

Antarmuka dirancang mengikuti prinsip modularitas:

### 1. Komponen Primitif UI (`components/ui/`)
- `Badge.tsx`: Menampilkan badge warna semantik untuk status (Abu-abu untuk To Do, Biru untuk In Progress, Emerald untuk Done) dan prioritas (Biru untuk Low, Amber untuk Medium, Merah Rose untuk High).
- `Modal.tsx`: Dialog modal dengan transisi backdrop halus, tombol escape keyboard, dan focus lock.
- `Toast.tsx`: Sistem notifikasi toast non-intrusif berbasis React Context (`useToast()`) di pojok kanan bawah.
- `Skeleton.tsx`: Efek shimmer loading untuk kartu dan baris tabel saat data sedang diambil dari server.
- `EmptyState.tsx`: Ilustrasi kosong yang bersahabat saat data filter tidak ditemukan atau belum ada data.

### 2. Komponen Dasbor Visual (`components/dashboard/`)
- `SummaryCards.tsx`: 5 kartu metrik interaktif (Total Tugas, To Do, In Progress, Selesai, dan Terlambat/Overdue). Mengklik kartu ini akan langsung mengaktifkan filter status terkait!
- `ProgressBar.tsx`: Bilah progres dinamis yang menghitung persentase tingkat penyelesaian tugas proyek secara real-time (`(done / total) * 100%`).

### 3. Komponen Manajemen Data (`components/tasks/`)
- `TaskFilterBar.tsx`: Bilah kontrol lengkap berisi kolom pencarian judul, input filter assignee, dropdown filter status dan prioritas, toggle tombol overdue, selector sorting kolom, tombol buat tugas baru, dan sakelar mode tampilan (**Table vs Grid**).
- `TaskTable.tsx`: Tampilan tabel data padat dengan quick status change dropdown, indikator badge overdue, dan tombol aksi (lihat detail, edit, hapus).
- `TaskGrid.tsx` & `TaskCard.tsx`: Tampilan kartu kanban visual modern dengan deskripsi ringkas dan avatar assignee.
- `TaskFormModal.tsx`: Formulir modal untuk Tambah dan Edit Tugas dengan validasi client-side (judul wajib, peringatan deadline masa lalu) dan error banner yang jelas.
- `TaskDetailModal.tsx`: Modal inspeksi lengkap yang menampilkan deskripsi tugas, metadata waktu, dan **timeline visual jejak riwayat audit log** yang menunjukkan kronologi perubahan status.
- `DeleteConfirmModal.tsx`: Dialog konfirmasi penghapusan dengan peringatan bahaya untuk mencegah ketidaksengajaan klik.
- `Pagination.tsx`: Kontrol navigasi halaman yang fleksibel dengan tombol previous, next, nomor halaman dinamis, serta pemilih batas item per halaman (10, 20, 50).

---

## Tahap 12: Perakitan Akhir Dashboard (page.tsx) & Integrasi Sistem

### File: `frontend/src/app/page.tsx`
Halaman utama bertindak sebagai **Container Orchestrator**. Perannya adalah mengaitkan data dari custom hook `useTasks()` ke masing-masing komponen presentasional dan mengelola state buka/tutup modal.

Di bagian header, terdapat tombol **Status Sinkronisasi** yang berputar saat data sedang diperbarui serta pintasan langsung ke dokumentasi Swagger backend (`http://localhost:8000/docs`).

---

## 16. Catatan Nyata Developer: Pitfalls, Masalah Nyata & Solusinya

Berikut adalah rangkuman masalah nyata yang sering dihadapi programmer saat menyusun aplikasi ini beserta cara mengatasinya:

### 1. Konflik Rute Statis vs Rute Dinamis di FastAPI
* **Masalah**: Endpoint `GET /api/tasks/summary` menghasilkan error `422 Unprocessable Entity` yang menyatakan `"value is not a valid integer"`.
* **Penyebab**: Rute `GET /api/tasks/{id}` didefinisikan sebelum `GET /api/tasks/summary`. FastAPI mengira string `"summary"` adalah parameter `{id}` integer.
* **Solusi**: Selalu daftarkan route statis (seperti `/summary`) sebelum route dengan parameter dinamis (seperti `/{id}`).

### 2. Timezone UTC vs Waktu Lokal Browser
* **Masalah**: Deadline tugas yang dibuat pukul 17:00 WIB tiba-tiba bergeser menjadi pukul 10:00 atau 00:00 saat dilihat di browser.
* **Penyebab**: Server menyimpan waktu UTC tanpa penanda timezone offset, dan JavaScript `new Date()` mengonversi waktu tanpa basis offset yang konsisten.
* **Solusi**: Gunakan kolom `DateTime(timezone=True)` di SQLAlchemy, pastikan Pydantic memproses datetime dengan zona waktu UTC eksplisit, dan gunakan `Intl.DateTimeFormat` di browser pengguna untuk konversi otomatis ke zona waktu lokal pengguna.

### 3. Masalah Kebocoran Koneksi Database (Connection Leak)
* **Masalah**: Setelah server berjalan beberapa hari, database melempar error `OperationalError: FATAL: too many connections for role "postgres"`.
* **Penyebab**: Kode membuka sesi `SessionLocal()` tetapi lupa menutupnya saat terjadi exception di endpoint.
* **Solusi**: Gunakan FastAPI dependency dengan blok `try ... yield db ... finally: db.close()`. Blok `finally` menjamin sesi selalu tertutup apa pun yang terjadi.

### 4. Spamming Request pada Kotak Pencarian
* **Masalah**: Setiap mengetik satu huruf di kolom pencarian, frontend langsung memanggil API. Mengetik kata "Implementasi" (12 huruf) mengirimkan 12 HTTP request ke server.
* **Solusi**: Terapkan teknik **Debouncing 300ms** pada custom hook menggunakan `useRef` dan `setTimeout`.

---

## 🚀 Panduan Menjalankan Proyek Secara Lengkap

### 1. Menjalankan Backend (FastAPI)
```bash
# Masuk ke direktori backend
cd backend

# Aktifkan virtual environment
.venv\Scripts\Activate.ps1    # Windows
# source .venv/bin/activate   # Linux/macOS

# Pastikan PostgreSQL aktif dan isi backend/.env
# Isi data awal (seed)
python seed.py

# Jalankan server Uvicorn
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Dokumentasi interaktif Swagger API aktif di: **`http://localhost:8000/docs`**

### 2. Menjalankan Frontend (Next.js)
Buka terminal baru:
```bash
# Masuk ke direktori frontend
cd frontend

# Jalankan development server Next.js
npm run dev
```
Aplikasi web siap digunakan di: **`http://localhost:3000`**

---
*Dokumen ini disusun sebagai panduan pembelajaran arsitektur kode komprehensif untuk pengembang web modern.*
