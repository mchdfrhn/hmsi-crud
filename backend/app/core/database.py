# ==============================================================================
# MODUL KONEKSI DATABASE (database.py)
# ==============================================================================
# Modul ini mengatur siklus hidup koneksi ke database menggunakan SQLAlchemy ORM:
# 1. Engine: Bertindak sebagai perantara utama antara aplikasi Python dan dialek SQL PostgreSQL.
# 2. Connection Pooling: Menjaga sejumlah koneksi terbuka agar tidak perlu membuat koneksi baru dari nol setiap kali ada HTTP request.
# 3. SessionLocal: Pabrik (factory) pembuat sesi transaksi database per request.
# 4. Base: Kelas induk declarative yang diwarisi oleh setiap ORM model (tabel).
# ==============================================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

# Ambil string koneksi database dari settings
db_url = settings.DATABASE_URL

# PostgreSQL URL Compatibility Fix:
# Driver lama atau penyedia cloud seperti Heroku terkadang memakai prefix 'postgres://'.
# SQLAlchemy versi 1.4+ mengharuskan dialek eksplisit 'postgresql://'.
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Argumen tambahan untuk engine database
connect_args = {}
# Khusus jika menggunakan SQLite untuk testing, nonaktifkan check_same_thread
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Buat objek Engine SQLAlchemy
# - pool_pre_ping=True: Memeriksa koneksi sebelum digunakan (menjalankan SELECT 1).
#   Ini mencegah error "database connection closed / dropped" jika database sempat idle atau terputus.
engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# SessionLocal adalah kelas sesi yang dapat dipanggil untuk menghasilkan session baru:
# - autocommit=False: Transaksi tidak langsung di-commit otomatis, memberi kendali penuh (commit/rollback).
# - autoflush=False: Mencegah flush perubahan ke memori database sebelum transaksi siap.
# - bind=engine: Menghubungkan sesi ini ke engine database di atas.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class untuk seluruh model ORM SQLAlchemy.
# Setiap model (seperti Task dan TaskAuditLog) akan mewarisi Base ini agar SQLAlchemy dapat melacak skemanya.
Base = declarative_base()

