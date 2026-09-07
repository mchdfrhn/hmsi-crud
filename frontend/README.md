# Frontend - Antigravity Task Management System

Antarmuka pengguna (*Frontend*) modern dan responsif untuk **Task Management System**, dibangun menggunakan **Next.js 16 (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS**. Aplikasi ini terintegrasi penuh dengan backend FastAPI dan database PostgreSQL.

---

## 🛠️ Tech Stack Frontend

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/) (Functional Components & React Hooks)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) dengan design system modern & glassmorphism
- **Icons**: [Lucide React](https://lucide.dev/)
- **Bahasa**: [TypeScript 5](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/) dengan `@testing-library/jest-dom`

---

## 🚀 Panduan Menjalankan Frontend

### 1. Prasyarat
- **Node.js** (v18.x atau lebih baru, direkomendasikan v20+)
- **npm** (v9.x atau lebih baru)
- **Backend FastAPI** sudah berjalan di `http://localhost:8000`

---

### 2. Instalasi Dependensi

Masuk ke direktori `frontend/` dan jalankan perintah install:

```bash
cd frontend
npm install
```

---

### 3. Konfigurasi Environment Variables (`.env.local`)

Buat atau pastikan file `.env.local` di dalam folder `frontend/` memiliki konfigurasi URL backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

---

### 4. Menjalankan Development Server

Jalankan server pengembangan:

```bash
npm run dev
```

Aplikasi frontend akan tersedia di:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### 5. Menjalankan Automated UI Component Tests

Menjalankan pengujian komponen otomatis (unit testing untuk validasi form pembuatan/pembaruan tugas, penolakan tanggal lampau, dan handling submit):

```bash
npm test
```

Untuk mode watch interaktif:
```bash
npm run test:watch
```

---

### 6. Build Production Bundle

Untuk memvalidasi type check dan membuat bundle produksi:

```bash
npm run build
```

Untuk menjalankan bundle produksi:
```bash
npm run start
```

---

## 🌟 Fitur Utama Sesuai Spesifikasi PRD

1. **Dashboard Summary Cards**:
   - Agregasi data real-time: **Total Tasks**, **To Do**, **In Progress**, **Done**, dan **Overdue**.
   - Kartu metrik dapat diklik untuk memfilter daftar tugas secara cepat berdasarkan status yang dipilih.
   - Bilah persentase penyelesaian tugas (*Overall Completion Progress Bar*) dengan visualisasi proporsi status.

2. **Daftar Tugas Interaktif (Task List)**:
   - **Tampilan Fleksibel**: Tersedia tombol toggle antara **Tampilan Tabel** (desktop-friendly) dan **Tampilan Kartu/Grid** (responsif & Kanban-style).
   - **Pencarian Real-Time**: Pencarian judul tugas dengan *debounce* 300ms.
   - **Filter Multi-Kriteria**: Filter dropdown berdasarkan status (`All`, `To Do`, `In Progress`, `Done`), prioritas (`All`, `Low`, `Medium`, `High`), dan penanggung jawab (*assignee*).
   - **Paginasi Lengkap**: Navigasi nomor halaman, tombol next/prev, dan pemilih jumlah baris per halaman (5, 10, 20, 50).
   - **State Loading & Kosong**: Skeleton shimmer saat memuat data dan empty state informatif dengan tombol pembuat tugas.

3. **Buat & Edit Tugas (Create & Edit Task Modal)**:
   - Validasi input sisi frontend: Judul wajib diisi (max 100 karakter), batas waktu tidak boleh lampau untuk tugas baru.
   - Pemetaan error dari backend (HTTP 422 `RequestValidationError`) langsung ke field terkait atau alert banner.
   - Pencegahan pengiriman ganda (*double-submission prevention*): tombol submit dinonaktifkan dengan spinner saat request sedang berlangsung.
   - Notifikasi toast otomatis saat tugas berhasil disimpan.

4. **Rincian Tugas & Aksi Cepat (Task Details Modal)**:
   - Rincian komprehensif: Judul, deskripsi lengkap, status badge, priority badge, penanggung jawab, tenggat waktu, waktu dibuat, dan waktu diperbarui.
   - **Quick Action Transition**: Tombol aksi satu-klik untuk langsung memajukan status (misal: "Mulai Kerjakan", "Tandai Selesai", "Buka Kembali").
   - Tombol Edit untuk memperbarui data langsung dari modal rincian.

5. **Konfirmasi Penghapusan (Delete Confirmation Modal)**:
   - Dialog konfirmasi sebelum penghapusan dieksekusi untuk mencegah ketidaksengajaan.
   - Loading indicator saat proses delete berlangsung di backend.
   - Notifikasi toast saat tugas berhasil dihapus.

---

## 📁 Struktur Direktori Frontend

```text
frontend/
├── public/                 # Aset statis
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout, meta tags, ToastProvider
│   │   ├── page.tsx        # Halaman utama (Dashboard & Task Manager)
│   │   └── globals.css     # Design tokens, Tailwind imports
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── SummaryCards.tsx   # Kartu statistik metrik status tugas
│   │   │   └── ProgressBar.tsx    # Progress bar persentase penyelesaian
│   │   ├── tasks/
│   │   │   ├── TaskFilterBar.tsx  # Search bar, dropdown filter, toggle table/grid
│   │   │   ├── TaskTable.tsx      # Tampilan tabel tugas
│   │   │   ├── TaskGrid.tsx       # Tampilan grid kartu tugas
│   │   │   ├── TaskCard.tsx       # Item kartu tugas dengan rincian & aksi cepat
│   │   │   ├── TaskFormModal.tsx  # Modal buat & edit tugas (validasi lengkap)
│   │   │   ├── TaskDetailModal.tsx# Modal rincian lengkap tugas
│   │   │   ├── DeleteConfirmModal.tsx # Modal dialog konfirmasi hapus
│   │   │   └── Pagination.tsx     # Komponen navigasi halaman & limit
│   │   └── ui/
│   │       ├── Badge.tsx          # Badge status, prioritas, & overdue
│   │       ├── Modal.tsx          # Modal dialog reusable & accessible
│   │       ├── Toast.tsx          # Sistem notifikasi toast pop-up
│   │       ├── Skeleton.tsx       # Placeholder shimmer loading
│   │       └── EmptyState.tsx     # Tampilan kosong dengan tombol aksi
│   ├── hooks/
│   │   └── useTasks.ts            # Custom hook pengelola state dan mutasi data
│   ├── lib/
│   │   └── dateUtils.ts           # Utility format tanggal & kalkulasi overdue
│   ├── services/
│   │   └── api.ts                 # Layer HTTP client terpusat
│   ├── tests/
│   │   ├── setup.ts               # Setup jest-dom matchers
│   │   └── TaskForm.test.tsx      # Unit testing validasi & submission form
│   └── types/
│       └── task.ts                # TypeScript interfaces & types
├── .env.local              # Konfigurasi environment lokal
├── package.json
├── tsconfig.json
├── vitest.config.ts        # Konfigurasi runner test Vitest
└── README.md
```
