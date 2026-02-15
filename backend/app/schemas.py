from datetime import datetime
from pydantic import BaseModel, Field


# --- World ---

class WorldCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    pin: str | None = None


class WorldResponse(BaseModel):
    id: int
    name: str
    join_code: str
    created_at: datetime
    player_count: int = 0

    class Config:
        from_attributes = True


# --- Player ---

class PlayerCreate(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)
    world_id: int


class PlayerResponse(BaseModel):
    id: int
    nickname: str
    world_id: int
    clock_power: float
    current_tier: int
    created_at: datetime

    class Config:
        from_attributes = True


class PlayerBriefing(BaseModel):
    player: PlayerResponse
    tier_name: str
    tier_color: str
    next_tier_name: str | None
    next_tier_threshold: int | None
    tier_progress_pct: float
    mastered_skills: list[str]
    challenges: list["ChallengeResponse"]


# --- Session ---

class SessionCreate(BaseModel):
    player_id: int
    mode: str = Field(..., pattern="^(read|set|speedrun|quest)$")
    difficulty: str = Field(..., pattern="^(hour|half|quarter|five_min|one_min|interval)$")
    questions: int = Field(..., ge=1)
    correct: int = Field(..., ge=0)
    hints_used: int = Field(default=0, ge=0)
    max_streak: int = Field(default=0, ge=0)
    avg_response_ms: int | None = None
    speedrun_score: int | None = None


class SessionResponse(BaseModel):
    id: int
    player_id: int
    mode: str
    difficulty: str
    questions: int
    correct: int
    hints_used: int
    max_streak: int
    avg_response_ms: int | None
    speedrun_score: int | None
    points_earned: float
    created_at: datetime

    class Config:
        from_attributes = True


class SessionResult(BaseModel):
    session: SessionResponse
    player: PlayerResponse
    points_earned: float
    new_clock_power: float
    new_tier: int
    tier_up: bool
    challenge_updates: list["ChallengeResponse"]


# --- Tier Trial ---

class TierTrialConfig(BaseModel):
    tier: int
    tier_name: str
    difficulty: str
    questions: int
    min_correct: int
    max_hints: int
    speed_gate: bool


class TierTrialSubmit(BaseModel):
    player_id: int
    tier: int
    questions: int
    correct: int
    hints_used: int = 0
    time_ms: int | None = None


class TierTrialResponse(BaseModel):
    id: int
    player_id: int
    tier: int
    passed: bool
    questions: int
    correct: int
    hints_used: int
    time_ms: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class TierTrialResult(BaseModel):
    trial: TierTrialResponse
    passed: bool
    player: PlayerResponse
    tier_name: str
    message: str


# --- Quest ---

class ChallengeResponse(BaseModel):
    id: int
    player_id: int
    challenge_type: str
    description: str
    target: float
    progress: float
    completed: bool
    mode: str | None
    difficulty: str | None

    class Config:
        from_attributes = True


# --- Quest Run Tracking ---

class QuestRunCreate(BaseModel):
    player_id: int
    started_at: datetime
    ended_at: datetime
    duration_seconds: int = Field(..., ge=0)
    completed: bool = False


class QuestRunResponse(BaseModel):
    id: int
    player_id: int
    started_at: datetime
    ended_at: datetime
    duration_seconds: int
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Leaderboard ---

class LeaderboardEntry(BaseModel):
    rank: int
    player_id: int
    nickname: str
    clock_power: float
    current_tier: int
    tier_name: str
    weekly_gain: float = 0.0


class LeaderboardResponse(BaseModel):
    scope: str
    entries: list[LeaderboardEntry]
