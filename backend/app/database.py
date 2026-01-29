"""
Database configuration and session management
"""
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import create_engine, text
from app.config import settings


# Create async engine for app usage
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def run_migrations():
    """Run Alembic migrations using sync engine"""
    from alembic.config import Config
    from alembic import command
    
    # Get the directory where alembic.ini is located
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_ini = os.path.join(backend_dir, 'alembic.ini')
    
    if os.path.exists(alembic_ini):
        # Convert async URL to sync for Alembic
        sync_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
        
        alembic_cfg = Config(alembic_ini)
        alembic_cfg.set_main_option('script_location', os.path.join(backend_dir, 'alembic'))
        alembic_cfg.set_main_option('sqlalchemy.url', sync_url)
        
        try:
            command.upgrade(alembic_cfg, 'head')
            print("✅ Database migrations completed")
        except Exception as e:
            print(f"⚠️ Migration error: {e}")
    else:
        print("⚠️ alembic.ini not found, skipping migrations")


async def init_db():
    """Initialize database tables"""
    # Run migrations first (handles schema changes properly)
    try:
        run_migrations()
    except Exception as e:
        print(f"⚠️ Migration failed, falling back to create_all: {e}")
        # Fallback to create_all if migrations fail (e.g., fresh install without migration history)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
