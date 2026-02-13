from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from ..database import get_db
from ..models import Player, TierTrial
from ..schemas import (
    TierTrialConfig,
    TierTrialSubmit,
    TierTrialResult,
    TierTrialResponse,
    PlayerResponse,
)
from ..tier_trials import get_trial_config, validate_trial, TIER_NAMES

router = APIRouter(prefix="/api/trials", tags=["trials"])


@router.get("/config/{tier}", response_model=TierTrialConfig)
def get_trial(tier: int):
    config = get_trial_config(tier)
    if config is None:
        raise HTTPException(status_code=404, detail="No trial for this tier")
    return TierTrialConfig(**config)


@router.post("", response_model=TierTrialResult)
def submit_trial(data: TierTrialSubmit, db: DbSession = Depends(get_db)):
    player = db.query(Player).filter(Player.id == data.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Must be attempting the next tier
    expected_tier = player.current_tier + 1
    if data.tier != expected_tier:
        raise HTTPException(
            status_code=400,
            detail=f"Player should attempt tier {expected_tier}, not {data.tier}",
        )

    # Check if player has enough clock power
    required_power = data.tier * 100
    if player.clock_power < required_power:
        raise HTTPException(
            status_code=400,
            detail=f"Need {required_power} Clock Power (have {player.clock_power})",
        )

    # Validate trial
    passed = validate_trial(data.tier, data.correct, data.hints_used, data.time_ms)

    # Record trial
    trial = TierTrial(
        player_id=player.id,
        tier=data.tier,
        passed=passed,
        questions=data.questions,
        correct=data.correct,
        hints_used=data.hints_used,
        time_ms=data.time_ms,
    )
    db.add(trial)

    # If passed, unlock tier
    if passed:
        player.current_tier = data.tier
        message = f"You unlocked {TIER_NAMES.get(data.tier, 'Unknown')}!"
    else:
        config = get_trial_config(data.tier)
        message = f"Not quite! You needed {config['min_correct']}/{config['questions']} correct. Keep practising!"

    db.commit()
    db.refresh(trial)
    db.refresh(player)

    return TierTrialResult(
        trial=TierTrialResponse.model_validate(trial),
        passed=passed,
        player=PlayerResponse.model_validate(player),
        tier_name=TIER_NAMES.get(data.tier, "Unknown"),
        message=message,
    )
