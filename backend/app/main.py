# ==============================================================================
# TITIK MASUK UTAMA FASTAPI (main.py)
# ==============================================================================
# File ini merupakan gerbang utama (entry point) aplikasi FastAPI:
# 1. Lifespan Events: Mengatur tindakan saat server menyala (startup) dan mati (shutdown).
# 2. CORS Middleware: Mengizinkan komunikasi lintas domain (Next.js frontend -> FastAPI backend).
# 3. Exception Handling: Mengubah error validasi default Pydantic menjadi format JSON rapi.
# 4. Routing: Mendaftarkan master router API v1 dan endpoint health check.
# ==============================================================================

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.v1.router import api_router

# Inisialisasi logger standar uvicorn untuk mencatat info/warning ke konsol
logger = logging.getLogger("uvicorn.error")


# ------------------------------------------------------------------------------
# 1. Lifespan Event Manager (Pengganti on_event("startup") & on_event("shutdown"))
# ------------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Konteks asinkron yang dieksekusi sebelum aplikasi mulai menerima request:
    - Startup: Memastikan tabel-tabel database dibuat jika belum ada.
    - Yield: Aplikasi berjalan aktif melayani request.
    - Shutdown: Membersihkan resource jika aplikasi dihentikan.
    """
    try:
        # Membuat seluruh tabel yang terdaftar di Base.metadata (tasks & task_audit_logs)
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
    except Exception as exc:
        logger.warning(
            f"Could not initialize database on startup (Check your PostgreSQL connection in .env): {exc}"
        )
    yield
    # Kode setelah yield dieksekusi saat server dimatikan (graceful shutdown)
    pass


# ------------------------------------------------------------------------------
# 2. Inisialisasi Instance FastAPI
# ------------------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Task Management System API built with Python FastAPI and PostgreSQL.",
    version="1.0.0",
    docs_url="/docs",              # URL dokumentasi interaktif Swagger UI
    redoc_url="/redoc",            # URL dokumentasi alternatif Redoc
    openapi_url=f"{settings.API_V1_STR}/openapi.json", # URL skema OpenAPI raw JSON
    lifespan=lifespan,
)


# ------------------------------------------------------------------------------
# 3. Konfigurasi Cross-Origin Resource Sharing (CORS)
# ------------------------------------------------------------------------------
# Mengizinkan frontend (misal: http://localhost:3000) memanggil API ini tanpa diblokir browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True, # Mengizinkan cookie / authorization header
    allow_methods=["*"],     # Mengizinkan metode GET, POST, PUT, DELETE, OPTIONS, dll
    allow_headers=["*"],     # Mengizinkan seluruh header HTTP
)


# ------------------------------------------------------------------------------
# 4. Custom Exception Handler untuk Validasi Input (RequestValidationError)
# ------------------------------------------------------------------------------
# Mengubah pesan error bawaan Pydantic yang rumit menjadi struktur rapi agar mudah
# diparsing dan ditampilkan oleh form frontend.
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        # Menggabungkan path lokasi error (misal: 'body -> title')
        field = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        errors.append({
            "field": field,
            "message": err.get("msg", "Invalid input"),
            "type": err.get("type"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Data masukan tidak valid.",
            "errors": errors,
        },
    )


# ------------------------------------------------------------------------------
# 5. Mendaftarkan Router API v1
# ------------------------------------------------------------------------------
# Seluruh rute di v1.router akan diawali dengan /api (misal: /api/tasks)
app.include_router(api_router, prefix=settings.API_V1_STR)


# ------------------------------------------------------------------------------
# 6. Endpoint Root / Health Check
# ------------------------------------------------------------------------------
@app.get("/", tags=["Health Check"])
def root():
    """Endpoint pengecekan status server apakah aktif dan sehat."""
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "api": f"{settings.API_V1_STR}/tasks",
    }

