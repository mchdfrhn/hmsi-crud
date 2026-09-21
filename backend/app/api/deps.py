# ==============================================================================
# INJEKSI DEPENDENSI FASTAPI (api/deps.py)
# ==============================================================================
# Modul ini menyediakan fungsi ketergantungan (dependencies) yang diinjeksikan
# ke endpoint API menggunakan sistem `Depends()` bawaan FastAPI.
# Konsep Generator & Yield di sini sangat krusial:
# 1. Saat request HTTP masuk, sesi database baru (db) dibuka dari SessionLocal().
# 2. `yield db` menyerahkan sesi tersebut ke controller/endpoint untuk dipakai query.
# 3. Blok `finally: db.close()` DIJAMIN selalu dieksekusi setelah response dikirim ke client,
#    bahkan jika terjadi error/exception tak terduga di tengah proses.
#    Ini mencegah kebocoran koneksi (connection leak) ke PostgreSQL.
# ==============================================================================

from typing import Generator
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    Menghasilkan sesi database scoped per-request.
    Sesi otomatis ditutup setelah HTTP request selesai diproses.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

