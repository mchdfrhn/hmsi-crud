-- 1. Create Enums if not exist
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('To Do', 'In Progress', 'Done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create tasks table if not exists
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'To Do',
  priority task_priority NOT NULL DEFAULT 'Medium',
  assignee VARCHAR(100),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS ix_tasks_id ON tasks (id);
CREATE INDEX IF NOT EXISTS ix_tasks_title ON tasks (title);
CREATE INDEX IF NOT EXISTS ix_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS ix_tasks_priority ON tasks (priority);
CREATE INDEX IF NOT EXISTS ix_tasks_assignee ON tasks (assignee);

-- 4. Insert Dummy Data
INSERT INTO tasks (title, description, status, priority, assignee, due_date, created_at, updated_at)
VALUES
  -- 1. To Do - High Priority (Upcoming)
  (
    'Implementasi Sistem Autentikasi JWT',
    'Membangun alur login dan register menggunakan hashing bcrypt dan token JWT untuk otentikasi user.',
    'To Do',
    'High',
    'Ahmad Fauzi',
    NOW() + INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),

  -- 2. In Progress - High Priority
  (
    'Optimalisasi Query PostgreSQL & Indeks',
    'Menambahkan composite index pada tabel tasks untuk mempercepat query filtering status dan assignee.',
    'In Progress',
    'High',
    'Siti Rahma',
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '3 hours'
  ),

  -- 3. Done - Medium Priority
  (
    'Setup Repositori & Boilerplate FastAPI',
    'Inisialisasi arsitektur proyek, Pydantic schemas, routing v1, dan konfigurasi environment variables.',
    'Done',
    'Medium',
    'Budi Santoso',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
  ),

  -- 4. To Do - Medium Priority
  (
    'Integrasi Payment Gateway Xendit',
    'Menghubungkan webhook checkout dan virtual account pembayaran tagihan pengguna.',
    'To Do',
    'Medium',
    'Dewi Lestari',
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
  ),

  -- 5. In Progress - Medium Priority
  (
    'Desain Antarmuka Dasbor Responsif',
    'Memperbarui styling frontend dengan tema modern, dual table/grid view, dan kartu ringkasan status.',
    'In Progress',
    'Medium',
    'Rizky Pratama',
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 hour'
  ),

  -- 6. Done - High Priority
  (
    'Konfigurasi Database Migration Alembic',
    'Membuat initial migration script untuk membuat tabel tasks dan enum task_status serta task_priority.',
    'Done',
    'High',
    'Budi Santoso',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '2 days'
  ),

  -- 7. To Do - Low Priority
  (
    'Dokumentasi API Swagger & Panduan Pengguna',
    'Melengkapi docstring seluruh endpoint API dan memperbarui instruksi operasional di file README.md.',
    'To Do',
    'Low',
    'Dewi Lestari',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  ),

  -- 8. In Progress - Low Priority
  (
    'Penyusunan Unit Tests Form Validation',
    'Menambahkan test coverage frontend menggunakan Vitest untuk memvalidasi input judul dan tanggal lampau.',
    'In Progress',
    'Low',
    'Siti Rahma',
    NOW() + INTERVAL '4 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '5 hours'
  ),

  -- 9. To Do - High Priority (Overdue)
  (
    'Audit Keamanan & Penanganan Input SQL Injection',
    'Memeriksa seluruh sanitasi query input dan memastikan prepared statements berjalan sempurna.',
    'To Do',
    'High',
    'Ahmad Fauzi',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),

  -- 10. In Progress - High Priority (Overdue)
  (
    'Refactoring State Management Frontend',
    'Migrasi hook fetch manual menjadi custom state management yang terisolasi dan bebas memory leak.',
    'In Progress',
    'High',
    'Rizky Pratama',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '8 hours'
  ),

  -- 11. Done - Low Priority
  (
    'Pembersihan Aset Gambar & Font Unused',
    'Menghapus bundle font dan file icon SVG yang tidak terpakai untuk memperkecil ukuran bundle produksi.',
    'Done',
    'Low',
    'Dewi Lestari',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '3 days'
  ),

  -- 12. To Do - Medium Priority
  (
    'Konfigurasi Docker & Docker Compose',
    'Membuat Dockerfile multi-stage untuk FastAPI dan NextJS serta file docker-compose.yml lokal.',
    'To Do',
    'Medium',
    'Budi Santoso',
    NOW() + INTERVAL '6 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  );
