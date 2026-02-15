from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base
from .routers import worlds, players, sessions, trials, leaderboard, challenges
from .tiers import tier_list_for_api

logger = logging.getLogger(__name__)


def _run_alembic_migrations() -> None:
    """Try to run Alembic migrations. Falls back to create_all if Alembic is
    unavailable or the alembic.ini can't be found (e.g. during tests)."""
    try:
        import os
        from alembic.config import Config
        from alembic import command

        alembic_ini = os.path.join(os.path.dirname(__file__), '..', 'alembic.ini')
        if os.path.exists(alembic_ini):
            alembic_cfg = Config(alembic_ini)
            command.upgrade(alembic_cfg, "head")
            return
    except Exception as exc:
        logger.warning("Alembic migration skipped (%s); falling back to create_all", exc)

    # Fallback: create any missing tables (safe — never drops or alters)
    Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _run_alembic_migrations()
    yield


app = FastAPI(title="ClockQuest API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(worlds.router)
app.include_router(players.router)
app.include_router(sessions.router)
app.include_router(trials.router)
app.include_router(leaderboard.router)
app.include_router(challenges.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ClockQuest"}


@app.get("/api/tiers")
def get_tiers():
    """Return all tier definitions. Used by frontend to avoid hardcoded tier data."""
    return tier_list_for_api()

