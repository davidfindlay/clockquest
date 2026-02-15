from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from ..database import get_db
from ..models import Player, QuestRun
from ..schemas import QuestRunCreate, QuestRunResponse

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
