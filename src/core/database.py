from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from src.core.config import settings

# Настройка движка. Для SQLite обязателен параметр connect_args={"check_same_thread": False}
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Функция-зависимость (Dependency) для получения сессии БД в FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()