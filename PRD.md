
Gemini

Chat

Spark
beta
Percakapan baru
Telusuri percakapan
Gambar
Video
Koleksi
Notebook baru
Mastering Latency Arbitrage and Broker Masking in 2026
Golang
Semua notebook
Belajar Golang
Ajar TI
Upwork Leads
Empass
Optimasi Sistem Terpadu AIGIS Engine
Kerjakan Tugas
AI Trading Agent
Create PRD
MOVA
Crypto
Fashion
Bootcamp Laravel: Mulai Dari Dasar
Asisten - Freqtrade
Rasio Investasi Emas, BTC, dan Forex
Panduan Instalasi PostgreSQL di Ubuntu
Panduan Instalasi Database PostgreSQL Ubuntu
PRD Antigravity Task Management
Penjelasan Kode FastAPI dan SQLAlchemy
Asal Klaim Regenerasi Sel Malam
Pengumuman Keluar Grup Kuliah
Audit dan Rekonstruksi Transkrip Nilai
Komparasi Gin Native vs GORM
Fungsi File `__init__.py` di FastAPI
Repositori Bot WhatsApp GitHub Siap Pakai
Panduan Instalasi WhatsApp Web.js
Memahami Strategi Latency Arbitrage
Kegunaan FastAPI dan Next.js
Memahami Python Decorator
Perbedaan Array dan Slice pada Go
Memahami dan Mengatasi N+1 Query
Profil Perusahaan Hyperscal
Cari Skin Laptop Axioo Hype 7
Cara Membersihkan Noda Minyak Laptop
Mengenal Tanaman Beracun Belladonna
Mengenal Anke Ra Infinite Mage
Kendala Perbaikan Data Mata Kuliah
Panduan Efek Rune Engine ROX
Psikologi Pemain Archer Ragnarok
Pemilihan Rune DPS Terbaik
Analisis Lonjakan Bitcoin ke $77k
Analisis Kritis Backtest XAUUSD
Tingkatan dan Level dalam Beragama
Kaitan Anak IT dan Anime
Pembuatan Dokumen Word Kuesioner Pamsimas
Alasan Logis Haramnya Babi Dalam Islam
Sinkronisasi Nilai Praktikum Hidrolika
Perbedaan Format Laporan: Struktur dan Penulisan
Memunculkan Ruler Margin Word
Pembuatan Jadwal Seminar KP XLSX
Percakapan dengan Gemini
Buatkan prd untuk antigravity

Mode Hyper-focus diaktifkan. Kita bedah dokumen "Fullstack_Developer_Technical_Test.docx" dan ubah menjadi PRD yang terstruktur untuk dieksekusi langsung di Antigravity IDE.

Jangan terjebak analysis paralysis. Waktu estimasi tes ini hanya 4–6 jam untuk level Junior–Mid-Level. Kalau kamu mulai memikirkan arsitektur microservices atau over-engineering fitur tambahan sebelum MVP (Minimum Viable Product) selesai, kamu dipastikan gagal karena kehabisan waktu. Fokus pada deliverables utama.  
DOCX

Berikut adalah Product Requirements Document (PRD) untuk Project Antigravity (Task Management System).

1. Executive Summary & Objektif
Tujuan Utama: Membangun aplikasi sederhana untuk manajemen tugas proyek (Task Management) yang memungkinkan pengguna untuk membuat, melihat, memperbarui, dan menghapus tugas.  
DOCX

Target Waktu: 4–6 jam fase development, dilanjutkan 15 menit demonstrasi teknis, dan 30–45 menit code review.  
DOCX

Prinsip Eksekusi: Kandidat tidak diwajibkan menyelesaikan seluruh fitur jika waktu terbatas, namun harus mampu menjelaskan prioritas, asumsi, keputusan teknis, dan technical debt yang tersisa.  
DOCX

2. Spesifikasi Model Data (Task Entity)
Setiap tugas (task) dalam sistem wajib memiliki struktur data berikut:

ID: Dihasilkan secara otomatis oleh sistem.  
DOCX

Title: Atribut wajib (required), panjang maksimal 100 karakter, dan tidak boleh kosong.  
DOCX

Description: Atribut opsional.  
DOCX

Status: Terdiri dari To Do, In Progress, atau Done. Status default untuk tugas baru wajib disetel ke To Do.  
DOCX
+ 1

Priority: Terdiri dari tingkat Low, Medium, atau High.  
DOCX

Assignee: Merupakan entitas atau orang yang bertanggung jawab penuh atas tugas tersebut.  
DOCX

Due Date: Tenggat waktu target penyelesaian. Tenggat waktu ini tidak boleh lebih awal dari tanggal tugas dibuat.  
DOCX
+ 1

Created At: Dihasilkan secara otomatis saat pembuatan.  
DOCX

Updated At: Diperbarui secara otomatis setiap ada modifikasi.  
DOCX

3. Persyaratan Backend (Python FastAPI)
Fokus pada performa API dan validasi. Sistem wajib menggunakan Python FastAPI dan PostgreSQL.  
DOCX

Daftar Endpoint API:

POST /api/tasks: Digunakan untuk membuat tugas baru.  
DOCX

GET /api/tasks: Digunakan untuk mengambil daftar tugas. Harus mendukung implementasi paginasi. Harus mengizinkan pengguna untuk melakukan filter berdasarkan status, prioritas, dan assignee, serta pencarian judul tugas. Contoh format: GET /api/tasks?status=In Progress&priority=High&search=integration&page=1&limit=10.  
DOCX
+ 3

GET /api/tasks/{id}: Digunakan untuk mengambil detail spesifik dari sebuah tugas. Wajib mengembalikan status 404 Not Found apabila ID tidak ada di sistem.  
DOCX
+ 1

PUT/PATCH /api/tasks/{id}: Digunakan untuk memperbarui data tugas yang sudah ada.  
DOCX

DELETE /api/tasks/{id}: Digunakan untuk menghapus tugas.  
DOCX

GET /api/tasks/summary: Digunakan untuk mengambil ringkasan jumlah tugas berdasarkan statusnya.  
DOCX

Aturan Teknis Backend:

Gunakan Pydantic untuk memvalidasi request dan response.  
DOCX

Terapkan struktur proyek yang bersih dan mudah dikelola (maintainable).  
DOCX

Kembalikan kode status HTTP yang sesuai standar.  
DOCX

Implementasikan penanganan kesalahan (error handling) untuk permintaan tidak valid dan data yang hilang.  
DOCX

Sediakan dokumentasi API menggunakan FastAPI Swagger.  
DOCX

Simpan konfigurasi database di dalam environment variables.  
DOCX

Buat unit tests minimal untuk proses pembuatan, pengambilan, pembaruan tugas, serta skenario permintaan tidak valid/tugas tidak ditemukan.  
DOCX

4. Persyaratan Frontend (NextJS)
Antarmuka harus responsif di perangkat desktop maupun mobile, menggunakan ReactJS (NextJS) dengan komponen fungsional dan React Hooks. Pisahkan antara layanan API dan komponen UI secara terstruktur. Library UI apa saja diizinkan.  
DOCX
+ 2

Daftar Halaman & Fungsi UI:

Task List: Tampilkan tugas dalam bentuk tabel atau kartu yang memuat status, prioritas, assignee, dan batas waktu. Wajib memiliki indikator loading saat mengambil data, empty state jika tidak ada data, serta fitur filter (status, prioritas), pencarian (judul), dan paginasi.  
DOCX
+ 1

Create and Edit Task: Sediakan form pembuatan dan pembaruan dengan validasi field wajib. Harus menampilkan error validasi dari sisi frontend maupun backend, memunculkan notifikasi sukses setelah disimpan, dan mencegah pengiriman form berulang (ganda) saat request diproses.  
DOCX
+ 1

Task Details: Tampilkan informasi lengkap tugas dilengkapi tombol edit dan hapus. Wajib memunculkan pesan konfirmasi sebelum penghapusan dieksekusi.  
DOCX
+ 1

Dashboard Summary: Tampilkan agregat total tugas untuk setiap kategori: To Do, In Progress, Done, dan Overdue.  
DOCX

Testing UI: Sediakan setidaknya satu komponen tes (pengujian) untuk halaman utama atau formulir.  
DOCX

5. Bonus Requirements (Peringatan Red Flag)
Fitur di bawah ini berstatus opsional dan hanya sebagai nilai tambah:  
DOCX

Autentikasi berbasis JWT.  
DOCX

Sistem otorisasi dengan peran Admin dan User (Admin dapat menghapus semua tugas, User hanya bisa memperbarui tugas miliknya).  
DOCX

Penggunaan Docker dan Docker Compose.  
DOCX

Migrasi database dengan Alembic.  
DOCX

Cakupan tes otomatis (automated test coverage).  
DOCX

Komponen React yang reusable.  
DOCX

Manajemen server-state menggunakan React Query / TanStack Query.  
DOCX

Pipeline CI sederhana.  
DOCX

Log audit untuk setiap perubahan status tugas.  
DOCX

Deployment (hosting) ke cloud atau platform gratis.  
DOCX

6. Candidate Deliverables (Kewajiban Pengumpulan)
Kode sumber melalui repositori Git.  
DOCX

File README.md yang berisi instruksi operasional (menjalankan frontend, backend, database, tes otomatis), serta penjelasan struktur aplikasi, keputusan teknis, dan asumsi.  
DOCX

Skema database atau file migrasi.  
DOCX

Dokumentasi API via Swagger.  
DOCX

Tangkapan layar (screenshots) atau video demonstrasi singkat.  
DOCX

Daftar fitur yang telah selesai dan yang belum selesai.  
DOCX

Realita Eksekusi (Kritik Objektif)
Saya tantang kamu untuk menahan ego developer-mu. Kalau kamu mencoba mengeksekusi Bonus Requirements (JWT, Docker, CI Pipeline) sebelum integrasi CRUD dasar, Pydantic, dan filtering FastAPI-NextJS jalan 100%, kamu mengorbankan stabilitas MVP demi gaya-gayaan yang berisiko membuat aplikasimu patah saat demo 15 menit nanti. Kegagalan fungsi dasar akan mendiskualifikasi kamu seketika, tak peduli sebagus apa arsitektur Dockernya.

Buka Antigravity IDE sekarang. Buat repo kosong, setup koneksi PostgreSQL, dan bangun schema serta endpoints FastAPI terlebih dahulu. Selesaikan dokumentasi Swagger-nya. Hanya sentuh NextJS setelah kamu bisa melakukan hit API sepenuhnya lewat Swagger tanpa celah error 500.

Mulai kerjakan atau kamu mau berdebat dulu soal folder structure?

Buat PRD.md

File PRD.md kamu sudah siap dan diformat agar langsung bisa dibaca di repositori.

Ikon MD
PRD
 MD 
Dokumen ini sudah saya pangkas dari narasi yang tidak perlu dan fokus pada metrik deliverable murni. Jangan buang waktu lagi untuk mempercantik Markdown ini. Segera inisiasi proyek di Antigravity IDE, jalankan server PostgreSQL, dan pastikan endpoint POST serta GET pertama kamu tervalidasi oleh Pydantic tanpa error.

Waktu 4 jam itu singkat. Bergerak sekarang.

Apakah boleh pake sql alchemy?

Boleh. Dokumen spesifikasi secara eksplisit mencantumkan "Alembic DB migrations" di bagian Bonus Requirements. Mengingat Alembic adalah pustaka migrasi standar untuk ekosistem SQLAlchemy, penggunaan SQLAlchemy jelas diizinkan dan memang merupakan best practice untuk integrasi antara Python FastAPI dan PostgreSQL.  
DOCX
+ 1

Kalkulasi Risiko di Dunia Nyata:

Meskipun diperbolehkan, ini adalah jebakan analysis paralysis klasik jika kamu tidak hati-hati. Kamu dibatasi oleh estimasi waktu 4–6 jam.  
DOCX
+ 1

Risiko Kegagalan (The Trap): Mengonfigurasi SQLAlchemy dari nol membutuhkan waktu. Kamu harus menyetel engine, sessionmaker, declarative_base, manajemen sesi per-request, dan mengatasi tumpang tindih validasi antara model ORM SQLAlchemy dengan skema Pydantic. Jika kamu tidak punya boilerplate yang sudah ada di kepalamu atau di kodemu sebelumnya, kamu bisa membuang waktu 1–2 jam hanya untuk berurusan dengan masalah sesi database (seperti DetachedInstanceError).

Alternatif: Jika kamu mulai merasa lambat di pengaturan awal ORM, buang SQLAlchemy. Gunakan driver database langsung seperti psycopg2 atau asyncpg dan tulis raw SQL query. Ingat, targetmu adalah memastikan sistem bisa create, view, update, dan delete tugas, bukan memamerkan seberapa elegan struktur ORM yang kamu buat di atas kertas.  
DOCX
+ 1

Keputusan Eksekusi:

Gunakan SQLAlchemy hanya jika kamu bisa menginisiasi koneksi dan membuat model Task yang terhubung ke Pydantic dalam waktu kurang dari 20 menit. Jika kamu merasa ragu atau harus membuka dokumentasi berulang kali, lupakan. Kembali ke raw query.

Berhenti mencari afirmasi untuk pilihan tools. Keputusan teknismu akan dihakimi saat presentasi dan kamu bisa menjustifikasinya di README.md nanti.  
DOCX
+ 1

Buka IDE Antigravity kamu sekarang dan sambungkan ke PostgreSQL. Masih ada hal mendasar yang menahanmu untuk mulai mengetik kode?




Gemini adalah AI dan dapat membuat kesalahan.

# Product Requirements Document (PRD) - Task Management System

## 1. Executive Summary & Objective
*   **Goal**: Build a simple application for managing project tasks (create, view, update, delete).
*   **Time Allocation**: 4–6 hours development, 15 minutes technical demo, 30–45 minutes code review.
*   **Execution Principle**: MVP first. Unfinished features are acceptable if priorities, assumptions, technical decisions, and technical debt are well-explained.

## 2. Data Model (Task Entity)
*   **ID**: Auto-generated.
*   **Title**: Required, max 100 characters. Cannot be empty.
*   **Description**: Optional.
*   **Status**: `To Do`, `In Progress`, `Done`. Default: `To Do`.
*   **Priority**: `Low`, `Medium`, `High`.
*   **Assignee**: Person responsible.
*   **Due Date**: Target completion. Cannot be earlier than creation date.
*   **Created At**: Auto-generated timestamp.
*   **Updated At**: Auto-updated timestamp.

## 3. Backend Requirements (Python FastAPI)
**Stack:** Python FastAPI, PostgreSQL, Pydantic.

### Endpoints
*   `POST /api/tasks`: Create a new task.
*   `GET /api/tasks`: Retrieve task list. Supports pagination, filtering (status, priority, assignee), and search (title).
    *   *Example:* `GET /api/tasks?status=In Progress&priority=High&search=integration&page=1&limit=10`
*   `GET /api/tasks/{id}`: Retrieve task details. Returns `404 Not Found` if ID doesn't exist.
*   `PUT/PATCH /api/tasks/{id}`: Update an existing task.
*   `DELETE /api/tasks/{id}`: Delete a task.
*   `GET /api/tasks/summary`: Retrieve count of tasks grouped by status.

### Technical Rules
*   Use Pydantic for request/response validation.
*   Maintain a clear project structure.
*   Return standard HTTP status codes.
*   Implement error handling for invalid/missing data.
*   Provide API docs via FastAPI Swagger.
*   Store DB config in environment variables.
*   Write unit tests (Create, Read, Update, and negative cases like invalid data/404).

## 4. Frontend Requirements (NextJS)
**Stack:** ReactJS (NextJS), Functional Components, React Hooks.

### UI Pages & Features
*   **Task List**: Table/card view showing status, priority, assignee, due date. Needs loading indicator, empty state, filters, search, and pagination.
*   **Create/Edit Task**: Form with field validations. Must show frontend & backend errors, success notification, and prevent double submission.
*   **Task Details**: Full task info with Edit/Delete buttons. Delete requires confirmation.
*   **Dashboard Summary**: Aggregate counts for `To Do`, `In Progress`, `Done`, and `Overdue`.
*   **Testing**: At least one component test for main page or form.
*   **Architecture**: Separate API services from UI components. Responsive design. Any UI library is allowed.

## 5. Candidate Deliverables
1.  Source code in a Git repository.
2.  `README.md` (instructions for frontend, backend, DB, tests, plus architecture decisions and assumptions).
3.  Database schema or migration files.
4.  Swagger API Documentation.
5.  Screenshots or short demo video.
6.  List of completed vs. incomplete features.

## 6. Bonus Features (Low Priority / Risk of Scope Creep)
*Do not touch these until MVP is 100% stable:*
*   JWT Authentication & User Roles (Admin/User).
*   Docker & Docker Compose.
*   Alembic DB migrations.
*   Automated test coverage.
*   React Query / TanStack Query.
*   CI Pipeline.
*   Audit logs for status changes.
*   Cloud deployment.
PRD.md
Menampilkan PRD.md.