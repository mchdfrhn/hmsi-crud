import os
import sys
from datetime import datetime, timezone, timedelta

# Tambahkan direktori root proyek ke sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models.task import Task, TaskStatus, TaskPriority

DUMMY_TASKS = [
    {
        "title": "Implementasi Sistem Autentikasi JWT",
        "description": "Membangun alur login dan register menggunakan hashing bcrypt dan token JWT untuk otentikasi user.",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.HIGH,
        "assignee": "Ahmad Fauzi",
        "due_offset_days": 3,
        "created_offset_days": -1,
    },
    {
        "title": "Optimalisasi Query PostgreSQL & Indeks",
        "description": "Menambahkan composite index pada tabel tasks untuk mempercepat query filtering status dan assignee.",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.HIGH,
        "assignee": "Siti Rahma",
        "due_offset_days": 2,
        "created_offset_days": -2,
    },
    {
        "title": "Setup Repositori & Boilerplate FastAPI",
        "description": "Inisialisasi arsitektur proyek, Pydantic schemas, routing v1, dan konfigurasi environment variables.",
        "status": TaskStatus.DONE,
        "priority": TaskPriority.MEDIUM,
        "assignee": "Budi Santoso",
        "due_offset_days": -1,
        "created_offset_days": -5,
    },
    {
        "title": "Integrasi Payment Gateway Xendit",
        "description": "Menghubungkan webhook checkout dan virtual account pembayaran tagihan pengguna.",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.MEDIUM,
        "assignee": "Dewi Lestari",
        "due_offset_days": 5,
        "created_offset_days": 0,
    },
    {
        "title": "Desain Antarmuka Dasbor Responsif",
        "description": "Memperbarui styling frontend dengan tema modern, dual table/grid view, dan kartu ringkasan status.",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.MEDIUM,
        "assignee": "Rizky Pratama",
        "due_offset_days": 1,
        "created_offset_days": -1,
    },
    {
        "title": "Konfigurasi Database Migration Alembic",
        "description": "Membuat initial migration script untuk membuat tabel tasks dan enum task_status serta task_priority.",
        "status": TaskStatus.DONE,
        "priority": TaskPriority.HIGH,
        "assignee": "Budi Santoso",
        "due_offset_days": -2,
        "created_offset_days": -4,
    },
    {
        "title": "Dokumentasi API Swagger & Panduan Pengguna",
        "description": "Melengkapi docstring seluruh endpoint API dan memperbarui instruksi operasional di file README.md.",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.LOW,
        "assignee": "Dewi Lestari",
        "due_offset_days": 7,
        "created_offset_days": 0,
    },
    {
        "title": "Penyusunan Unit Tests Form Validation",
        "description": "Menambahkan test coverage frontend menggunakan Vitest untuk memvalidasi input judul dan tanggal lampau.",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.LOW,
        "assignee": "Siti Rahma",
        "due_offset_days": 4,
        "created_offset_days": -2,
    },
    {
        "title": "Audit Keamanan & Penanganan Input SQL Injection",
        "description": "Memeriksa seluruh sanitasi query input dan memastikan prepared statements berjalan sempurna.",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.HIGH,
        "assignee": "Ahmad Fauzi",
        "due_offset_days": -2,  # Overdue
        "created_offset_days": -6,
    },
    {
        "title": "Refactoring State Management Frontend",
        "description": "Migrasi hook fetch manual menjadi custom state management yang terisolasi dan bebas memory leak.",
        "status": TaskStatus.IN_PROGRESS,
        "priority": TaskPriority.HIGH,
        "assignee": "Rizky Pratama",
        "due_offset_days": -1,  # Overdue
        "created_offset_days": -4,
    },
    {
        "title": "Pembersihan Aset Gambar & Font Unused",
        "description": "Menghapus bundle font dan file icon SVG yang tidak terpakai untuk memperkecil ukuran bundle produksi.",
        "status": TaskStatus.DONE,
        "priority": TaskPriority.LOW,
        "assignee": "Dewi Lestari",
        "due_offset_days": -3,
        "created_offset_days": -7,
    },
    {
        "title": "Konfigurasi Docker & Docker Compose",
        "description": "Membuat Dockerfile multi-stage untuk FastAPI dan NextJS serta file docker-compose.yml lokal.",
        "status": TaskStatus.TODO,
        "priority": TaskPriority.MEDIUM,
        "assignee": "Budi Santoso",
        "due_offset_days": 6,
        "created_offset_days": -1,
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        inserted_count = 0
        for item in DUMMY_TASKS:
            due = now + timedelta(days=item["due_offset_days"])
            created = now + timedelta(days=item["created_offset_days"])

            task = Task(
                title=item["title"],
                description=item["description"],
                status=item["status"],
                priority=item["priority"],
                assignee=item["assignee"],
                due_date=due,
                created_at=created,
                updated_at=created,
            )
            db.add(task)
            inserted_count += 1

        db.commit()
        total = db.query(Task).count()
        print(f"Berhasil menambahkan {inserted_count} dummy tasks!")
        print(f"Total tugas saat ini di database: {total}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
