from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import func

from ..database import get_db
from ..models import Player, Session as SessionModel
from ..schemas import LeaderboardEntry, LeaderboardResponse
from ..tiers import get_tier_name

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardResponse)
def get_leaderboard(
    scope: str = Query("global", pattern="^(global|world)$"),
    world_id: int | None = None,
    db: DbSession = Depends(get_db),
):
    query = db.query(Player)

    if scope == "world" and world_id is not None:
        query = query.filter(Player.world_id == world_id)

    players = query.order_by(Player.clock_power.desc()).limit(100).all()

    # Calculate weekly gains
    week_ago = datetime.utcnow() - timedelta(days=7)
    entries = []

    for rank, player in enumerate(players, 1):
        weekly_points = (
            db.query(func.coalesce(func.sum(SessionModel.points_earned), 0))
            .filter(
                SessionModel.player_id == player.id,
                SessionModel.created_at >= week_ago,
            )
            .scalar()
        )

        entries.append(
            LeaderboardEntry(
                rank=rank,
                player_id=player.id,
                nickname=player.nickname,
                clock_power=player.clock_power,
                current_tier=player.current_tier,
                tier_name=get_tier_name(player.current_tier),
                weekly_gain=round(float(weekly_points), 1),
            )
        )

    return LeaderboardResponse(scope=scope, entries=entries)
