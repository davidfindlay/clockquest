from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from ..database import get_db
from ..models import Player, Session
from ..schemas import SessionCreate, SessionResponse, SessionResult, PlayerResponse, ChallengeResponse
from ..scoring import calculate_session_points
from ..quests import update_quest_progress, generate_quests

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResult)
def submit_session(data: SessionCreate, db: DbSession = Depends(get_db)):
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    if data.correct > data.questions:
        raise HTTPException(status_code=400, detail="correct cannot exceed questions")

    # Calculate points
    points = calculate_session_points(
        questions=data.questions,
        correct=data.correct,
        hints_used=data.hints_used,
        max_streak=data.max_streak,
        player_clock_power=player.clock_power,
        player_current_tier=player.current_tier,
    )

    # Create session record
    session = Session(
        player_id=player.id,
        mode=data.mode,
        difficulty=data.difficulty,
        questions=data.questions,
        correct=data.correct,
        hints_used=data.hints_used,
        max_streak=data.max_streak,
        avg_response_ms=data.avg_response_ms,
        speedrun_score=data.speedrun_score,
        points_earned=points,
    )
    db.add(session)

    # Update player clock power
    old_tier = player.current_tier
    player.clock_power = round(player.clock_power + points, 1)
    db.commit()
    db.refresh(session)
    db.refresh(player)

    # Update challenge progress
    challenges = update_quest_progress(db, player, session)
    # Regenerate if any completed
    challenges = generate_quests(db, player)

    challenge_responses = [
        ChallengeResponse(
            id=q.id,
            player_id=q.player_id,
            challenge_type=q.quest_type,
            description=q.description,
            target=q.target,
            progress=q.progress,
            completed=q.completed,
            mode=q.mode,
            difficulty=q.difficulty,
        )
        for q in challenges
    ]

    return SessionResult(
        session=SessionResponse.model_validate(session),
        player=PlayerResponse.model_validate(player),
        points_earned=points,
        new_clock_power=player.clock_power,
        new_tier=player.current_tier,
        tier_up=player.current_tier > old_tier,
        challenge_updates=challenge_responses,
    )
