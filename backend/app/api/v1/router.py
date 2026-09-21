# ==============================================================================
# AGREGATOR ROUTER API v1 (api/v1/router.py)
# ==============================================================================
# Modul ini bertindak sebagai hub perakitan seluruh router endpoint versi 1.
# Jika di kemudian hari sistem berkembang dan memiliki fitur Users, Categories,
# atau Comments, masing-masing endpoint cukup didaftarkan di sini.
# ==============================================================================

from fastapi import APIRouter
from backend.app.api.v1.endpoints import tasks

# Buat master router untuk API v1
api_router = APIRouter()

# Hubungkan modul endpoints/tasks.py dengan prefix '/tasks' dan tag Swagger 'Tasks'
# Hasil URL lengkap: /api/tasks (karena di main.py diprefix dengan /api)
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])

