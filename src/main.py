from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from src.api.auth import router as auth_router
from src.api.categories import router as categories_router
from src.api.subscriptions import router as subscriptions_router
from src.core.config import settings
from src.core.database import Base, engine
import src.models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend service for tracking recurring subscriptions and expenses.",
)

# Маршруты API
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(subscriptions_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)

# Раздача фронтенд-файлов из папки src/static
app.mount("/", StaticFiles(directory="src/static", html=True), name="static")