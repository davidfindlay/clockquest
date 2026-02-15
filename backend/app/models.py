from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from .database import Base


class World(Base):
    __tablename__ = "worlds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    join_code = Column(String(20), unique=True, nullable=False, index=True)
    pin_hash = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    players = relationship("Player", back_populates="world", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), nullable=False)
    world_id = Column(Integer, ForeignKey("worlds.id"), nullable=False)
    clock_power = Column(Float, default=0.0)
    current_tier = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    world = relationship("World", back_populates="players")
    sessions = relationship("Session", back_populates="player", cascade="all, delete-orphan")
    tier_trials = relationship("TierTrial", back_populates="player", cascade="all, delete-orphan")
    quests = relationship("Quest", back_populates="player", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    mode = Column(String(20), nullable=False)  # read, set, speedrun
    difficulty = Column(String(20), nullable=False)  # hour, half, quarter, five_min, one_min, interval
    questions = Column(Integer, nullable=False)
    correct = Column(Integer, nullable=False)
    hints_used = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    avg_response_ms = Column(Integer, nullable=True)
    speedrun_score = Column(Integer, nullable=True)
    points_earned = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="sessions")


class TierTrial(Base):
    __tablename__ = "tier_trials"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    tier = Column(Integer, nullable=False)  # tier being unlocked (1-10)
    passed = Column(Boolean, nullable=False)
    questions = Column(Integer, nullable=False)
    correct = Column(Integer, nullable=False)
    hints_used = Column(Integer, default=0)
    time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="tier_trials")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    quest_type = Column(String(30), nullable=False)  # accuracy, streak, speed, hint_free, trial_ready
    description = Column(Text, nullable=False)
    target = Column(Float, nullable=False)
    progress = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    mode = Column(String(20), nullable=True)
    difficulty = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="quests")
