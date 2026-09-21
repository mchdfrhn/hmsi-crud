# ==============================================================================
# MODUL KONFIGURASI APLIKASI (config.py)
# ==============================================================================
# Modul ini bertanggung jawab untuk memuat konfigurasi aplikasi dari environment
# variables (.env) menggunakan pustaka `pydantic-settings`.
# Keuntungan pendekatan ini:
# 1. Type safety: Setiap variabel memiliki tipe data yang divalidasi saat aplikasi start.
# 2. Nilai default (fallback): Jika .env tidak mendefinisikan suatu variabel, nilai default akan dipakai.
# 3. Validasi otomatis: Format nilai (seperti CORS origins) dapat diubah/divalidasi sebelum dipakai.
# ==============================================================================

from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Kelas Settings mewarisi BaseSettings dari pydantic-settings.
    Pydantic akan otomatis membaca variabel lingkungan dengan nama yang sama (case-insensitive default,
    namun diatur case_sensitive=True di model_config).
    """

    # Nama proyek/aplikasi yang akan tampil pada dokumentasi Swagger (/docs)
    PROJECT_NAME: str = "Task Management API"

    # Prefix global untuk seluruh rute endpoint API versi 1 (contoh: /api/tasks)
    API_V1_STR: str = "/api"

    # Koneksi string database SQLAlchemy untuk PostgreSQL.
    # Format: postgresql://<user>:<password>@<host>:<port>/<database_name>
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/task_management"

    # Daftar domain asal yang diizinkan melakukan Cross-Origin Resource Sharing (CORS).
    # Dapat berupa string yang dipisahkan koma (dari .env) atau list Python.
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """
        Validator ini dijalankan 'before' (sebelum) tipe data CORS_ORIGINS diproses.
        Jika pengguna mendefinisikan CORS_ORIGINS di file .env sebagai string koma:
        CORS_ORIGINS="http://localhost:3000,http://example.com"
        maka fungsi ini akan memecahnya (split) menjadi list Python: ['http://localhost:3000', 'http://example.com'].
        """
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Konfigurasi Pydantic Settings
    model_config = SettingsConfigDict(
        # Lokasi file .env yang akan dibaca. Pydantic memeriksa .env di root atau backend/.env
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        # Memastikan nama variabel di .env harus persis huruf besar/kecilnya jika diaktifkan
        case_sensitive=True,
        # Jika ada variabel asing di .env yang tidak didefinisikan di kelas ini, abaikan tanpa error
        extra="ignore",
    )


# Inisialisasi objek konfigurasi tunggal (singleton pattern) yang akan diimpor ke seluruh bagian aplikasi
settings = Settings()

