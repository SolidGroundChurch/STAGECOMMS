"""Database connection and session management."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
from app.backend.config import settings

# Ensure the database directory exists before SQLAlchemy creates the engine
settings.DATABASE_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = settings.DATABASE_URL

# Use StaticPool for SQLite to avoid threading issues
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency injection for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database with tables."""
    Base.metadata.create_all(bind=engine)
