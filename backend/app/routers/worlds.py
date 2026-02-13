import hashlib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import World, Player
from ..schemas import WorldCreate, WorldResponse
from ..join_codes import generate_join_code, normalize_join_code

router = APIRouter(prefix="/api/worlds", tags=["worlds"])


@router.post("", response_model=WorldResponse)
def create_world(data: WorldCreate, db: Session = Depends(get_db)):
    join_code = generate_join_code()
    # Ensure uniqueness
    while db.query(World).filter(World.join_code == join_code).first():
        join_code = generate_join_code()

    pin_hash = None
    if data.pin:
        pin_hash = hashlib.sha256(data.pin.encode()).hexdigest()

    world = World(name=data.name, join_code=join_code, pin_hash=pin_hash)
    db.add(world)
    db.commit()
    db.refresh(world)

    return WorldResponse(
        id=world.id,
        name=world.name,
        join_code=world.join_code,
        created_at=world.created_at,
        player_count=0,
    )


@router.get("/join/{join_code}", response_model=WorldResponse)
def join_world(join_code: str, db: Session = Depends(get_db)):
    normalized = normalize_join_code(join_code)
    if not normalized:
        raise HTTPException(status_code=404, detail="World not found")

    world = db.query(World).filter(func.lower(World.join_code) == normalized.lower()).first()
    if not world:
        raise HTTPException(status_code=404, detail="World not found")

    player_count = db.query(Player).filter(Player.world_id == world.id).count()

    return WorldResponse(
        id=world.id,
        name=world.name,
        join_code=world.join_code,
        created_at=world.created_at,
        player_count=player_count,
    )


@router.get("/{world_id}", response_model=WorldResponse)
def get_world(world_id: int, db: Session = Depends(get_db)):
    world = db.query(World).filter(World.id == world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="World not found")

    player_count = db.query(Player).filter(Player.world_id == world.id).count()

    return WorldResponse(
        id=world.id,
        name=world.name,
        join_code=world.join_code,
        created_at=world.created_at,
        player_count=player_count,
    )


@router.delete("/{world_id}")
def delete_world(world_id: int, db: Session = Depends(get_db)):
    world = db.query(World).filter(World.id == world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    db.delete(world)
    db.commit()
    return {"ok": True}
