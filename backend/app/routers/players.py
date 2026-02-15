from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Player, World
from ..schemas import PlayerCreate, PlayerResponse, PlayerBriefing, ChallengeResponse
from ..tiers import get_tier_name, get_tier_color, get_mastered_skills, get_tier
from ..quests import generate_quests

router = APIRouter(prefix="/api/players", tags=["players"])


@router.post("", response_model=PlayerResponse)
def create_player(data: PlayerCreate, db: Session = Depends(get_db)):
    world = db.query(World).filter(World.id == data.world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="World not found")

    player = Player(nickname=data.nickname, world_id=data.world_id)
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/world/{world_id}", response_model=list[PlayerResponse])
def get_players_in_world(world_id: int, db: Session = Depends(get_db)):
    players = db.query(Player).filter(Player.world_id == world_id).all()
    return players


@router.get("/{player_id}/briefing", response_model=PlayerBriefing)
def get_briefing(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    current_tier = player.current_tier
    current_def = get_tier(current_tier)
    next_tier = current_tier + 1 if current_tier < 10 else None

    # Tier progress within current band
    tier_floor = current_def.min_power
    tier_ceiling = current_def.max_power + 1 if current_tier < 10 else 1000
    progress_in_tier = player.clock_power - tier_floor
    tier_range = tier_ceiling - tier_floor
    tier_progress_pct = (progress_in_tier / tier_range * 100) if tier_range > 0 else 100.0

    # Generate/get challenges
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

    return PlayerBriefing(
        player=PlayerResponse.model_validate(player),
        tier_name=get_tier_name(current_tier),
        tier_color=get_tier_color(current_tier),
        next_tier_name=get_tier_name(next_tier) if next_tier is not None else None,
        next_tier_threshold=get_tier(next_tier).min_power if next_tier is not None else None,
        tier_progress_pct=round(tier_progress_pct, 1),
        mastered_skills=get_mastered_skills(current_tier),
        challenges=challenge_responses,
    )


@router.delete("/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    db.commit()
    return {"ok": True}
