from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from ..database import get_db
from ..models import Player, QuestRun, PlayerTipSeen
from ..schemas import QuestRunCreate, QuestRunResponse, QuestStartTipRequest, CharacterTipResponse
from ..tiers import get_tier

import random

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


@router.post("/quest-run", response_model=QuestRunResponse)
def record_quest_run(data: QuestRunCreate, db: DbSession = Depends(get_db)):
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    if data.ended_at < data.started_at:
        raise HTTPException(status_code=400, detail="ended_at must be >= started_at")

    run = QuestRun(
        player_id=data.player_id,
        started_at=data.started_at,
        ended_at=data.ended_at,
        duration_seconds=data.duration_seconds,
        completed=data.completed,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.post("/quest-start-tip", response_model=CharacterTipResponse | None)
def get_quest_start_tip(data: QuestStartTipRequest, db: DbSession = Depends(get_db)):
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    tier = get_tier(data.tier_index)
    tips = tier.character_tips or []
    if not tips:
        return None

    if random.random() > tier.quest_tip_frequency:
        return None

    seen = db.query(PlayerTipSeen).filter(
        PlayerTipSeen.player_id == data.player_id,
        PlayerTipSeen.tier_index == data.tier_index,
    ).all()
    seen_ids = {s.tip_id for s in seen}

    unseen = [t for t in tips if t.get("id") not in seen_ids]
    if not unseen:
        db.query(PlayerTipSeen).filter(
            PlayerTipSeen.player_id == data.player_id,
            PlayerTipSeen.tier_index == data.tier_index,
        ).delete()
        db.commit()
        unseen = tips

    chosen = random.choice(unseen)
    db.add(PlayerTipSeen(
        player_id=data.player_id,
        tier_index=data.tier_index,
        tip_id=chosen.get("id", f"tip_{random.randint(1,999999)}"),
    ))
    db.commit()

    return CharacterTipResponse(
        character=chosen.get("character", "tick"),
        message=chosen.get("message", "Keep going!"),
        tip_id=chosen.get("id", "tip"),
    )
