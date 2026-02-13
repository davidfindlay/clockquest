from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base
from .routers import worlds, players, sessions, trials, leaderboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
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


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ClockQuest"}
