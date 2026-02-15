"""Challenge generation and progress tracking.

Hub challenge tracks:
1) Daily play challenge: Play X minutes today (10 -> 20 -> 30)
2) Streak challenge: Play 10 minutes Y days in a row (3 -> 7 -> 14 -> 21 -> 30)
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session as DbSession

from .models import Player, Quest, Session, QuestRun

BRISBANE_TZ = ZoneInfo("Australia/Brisbane")
DAILY_MINUTES_GOALS = [10, 20, 30]
STREAK_DAY_GOALS = [3, 7, 14, 21, 30]
STREAK_REQUIRED_MINUTES_PER_DAY = 10


def _quest_run_minutes(run: QuestRun) -> float:
    return run.duration_seconds / 60.0


def _quest_run_local_date(run: QuestRun):
    created = run.started_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    return created.astimezone(BRISBANE_TZ).date()


def _minutes_by_day(db: DbSession, player_id: int) -> dict:
    quest_runs = db.query(QuestRun).filter(QuestRun.player_id == player_id).all()
    by_day = defaultdict(float)
    for run in quest_runs:
        by_day[_quest_run_local_date(run)] += _quest_run_minutes(run)
    return dict(by_day)


def _current_streak_days(minutes_by_day: dict) -> int:
    today = datetime.now(BRISBANE_TZ).date()
    streak = 0
    day = today
    while minutes_by_day.get(day, 0.0) >= STREAK_REQUIRED_MINUTES_PER_DAY:
        streak += 1
        day = day.fromordinal(day.toordinal() - 1)
    return streak


def _goal_from_completed(completed_count: int, goals: list[int]) -> int:
    return goals[min(completed_count, len(goals) - 1)]


def _ensure_track(
    db: DbSession,
    player: Player,
    *,
    quest_type: str,
    description_builder,
    goals: list[int],
    metric_value: float,
) -> None:
    """Ensure one active quest exists for a progression track.

    If metric already satisfies the current goal, mark that level complete and
    immediately advance to the next level (within same call).
    """
    active = (
        db.query(Quest)
        .filter(Quest.player_id == player.id, Quest.quest_type == quest_type, Quest.completed == False)
        .first()
    )
    if active:
        return

    completed_count = (
        db.query(Quest)
        .filter(Quest.player_id == player.id, Quest.quest_type == quest_type, Quest.completed == True)
        .count()
    )

    while True:
        target = _goal_from_completed(completed_count, goals)
        completed = metric_value >= target
        q = Quest(
            player_id=player.id,
            quest_type=quest_type,
            description=description_builder(target),
            target=target,
            progress=min(metric_value, target),
            completed=completed,
            mode="quest",
            difficulty=None,
        )
        db.add(q)
        db.commit()
        db.refresh(q)

        # stop when we produced an active card, or when max tier reached
        at_max_goal = completed_count >= len(goals) - 1
        if not completed or at_max_goal:
            break

        completed_count += 1


def generate_quests(db: DbSession, player: Player) -> list[Quest]:
    """Ensure exactly two active challenge cards (daily + streak)."""
    # Retire legacy active quest types from older versions.
    legacy_active = (
        db.query(Quest)
        .filter(
            Quest.player_id == player.id,
            Quest.completed == False,
            Quest.quest_type.notin_(["daily_play", "daily_streak"]),
        )
        .all()
    )
    if legacy_active:
        for q in legacy_active:
            q.completed = True
        db.commit()

    minutes_by_day = _minutes_by_day(db, player.id)
    today = datetime.now(BRISBANE_TZ).date()
    today_minutes = minutes_by_day.get(today, 0.0)
    streak_days = _current_streak_days(minutes_by_day)

    _ensure_track(
        db,
        player,
        quest_type="daily_play",
        description_builder=lambda target: f"Play {target} minutes today",
        goals=DAILY_MINUTES_GOALS,
        metric_value=today_minutes,
    )
    _ensure_track(
        db,
        player,
        quest_type="daily_streak",
        description_builder=lambda target: f"Play 10 minutes {target} days in a row",
        goals=STREAK_DAY_GOALS,
        metric_value=streak_days,
    )

    return (
        db.query(Quest)
        .filter(Quest.player_id == player.id, Quest.completed == False)
        .order_by(Quest.id.asc())
        .all()
    )


def update_quest_progress(db: DbSession, player: Player, session: Session) -> list[Quest]:
    """Update active daily/streak cards after a session is completed."""
    active_quests = (
        db.query(Quest)
        .filter(Quest.player_id == player.id, Quest.completed == False)
        .all()
    )

    minutes_by_day = _minutes_by_day(db, player.id)
    today = datetime.now(BRISBANE_TZ).date()
    today_minutes = minutes_by_day.get(today, 0.0)
    streak_days = _current_streak_days(minutes_by_day)

    updated = []
    for quest in active_quests:
        if quest.quest_type == "daily_play":
            quest.progress = min(today_minutes, quest.target)
            quest.completed = today_minutes >= quest.target
            updated.append(quest)
        elif quest.quest_type == "daily_streak":
            quest.progress = min(streak_days, quest.target)
            quest.completed = streak_days >= quest.target
            updated.append(quest)

    if updated:
        db.commit()
        for q in updated:
            db.refresh(q)

    return active_quests
