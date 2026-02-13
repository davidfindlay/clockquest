"""Quest generation and progress tracking.

Generates up to 3 active quests for a player based on their current tier
and what they need to do to advance.
"""

from sqlalchemy.orm import Session as DbSession

from .models import Player, Quest, Session
from .tiers import get_trial_definitions, get_tier_name, get_tier

# Difficulty progression per tier
TIER_DIFFICULTY = {
    0: "hour",
    1: "half",
    2: "quarter",
    3: "five_min",
    4: "five_min",
    5: "one_min",
    6: "one_min",
    7: "one_min",
    8: "interval",
    9: "one_min",
    10: "one_min",
}


def generate_quests(db: DbSession, player: Player) -> list[Quest]:
    """Generate up to 3 quests for the player if they have fewer than 3 active."""
    active_quests = (
        db.query(Quest)
        .filter(Quest.player_id == player.id, Quest.completed == False)
        .all()
    )

    if len(active_quests) >= 3:
        return active_quests

    next_tier = player.current_tier + 1
    if next_tier > 10:
        return active_quests

    trial_config = get_trial_definitions().get(next_tier)
    if trial_config is None:
        return active_quests

    target_difficulty = TIER_DIFFICULTY.get(player.current_tier, "hour")
    existing_types = {q.quest_type for q in active_quests}
    new_quests = []

    # Quest 1: Accuracy quest
    if "accuracy" not in existing_types and len(active_quests) + len(new_quests) < 3:
        q = Quest(
            player_id=player.id,
            quest_type="accuracy",
            description=f"Get {trial_config['min_correct']}/{trial_config['questions']} correct on {target_difficulty.replace('_', '-')} difficulty",
            target=trial_config["min_correct"],
            progress=0,
            mode="read",
            difficulty=target_difficulty,
        )
        new_quests.append(q)

    # Quest 2: Hint-free quest
    if "hint_free" not in existing_types and len(active_quests) + len(new_quests) < 3:
        q = Quest(
            player_id=player.id,
            quest_type="hint_free",
            description=f"Complete 5 questions without using any hints",
            target=5,
            progress=0,
            mode="read",
            difficulty=target_difficulty,
        )
        new_quests.append(q)

    # Quest 3: Trial-ready or streak quest
    if "trial_ready" not in existing_types and "streak" not in existing_types:
        if len(active_quests) + len(new_quests) < 3:
            # Check if player might be ready for trial
            next_tier_def = get_tier(next_tier)
            power_needed = next_tier_def.min_power
            if player.clock_power >= power_needed * 0.8:
                q = Quest(
                    player_id=player.id,
                    quest_type="trial_ready",
                    description=f"Reach {power_needed} Clock Power to attempt the {get_tier_name(next_tier)} Trial",
                    target=power_needed,
                    progress=player.clock_power,
                )
            else:
                q = Quest(
                    player_id=player.id,
                    quest_type="streak",
                    description=f"Get 3 correct answers in a row",
                    target=3,
                    progress=0,
                    mode="read",
                    difficulty=target_difficulty,
                )
            new_quests.append(q)

    for q in new_quests:
        db.add(q)
    if new_quests:
        db.commit()
        for q in new_quests:
            db.refresh(q)

    return active_quests + new_quests


def update_quest_progress(db: DbSession, player: Player, session: Session) -> list[Quest]:
    """Update quest progress after a session is completed. Returns updated quests."""
    active_quests = (
        db.query(Quest)
        .filter(Quest.player_id == player.id, Quest.completed == False)
        .all()
    )

    updated = []
    for quest in active_quests:
        changed = False

        if quest.quest_type == "accuracy":
            if (
                quest.difficulty == session.difficulty
                and session.questions > 0
            ):
                quest.progress = max(quest.progress, session.correct)
                if quest.progress >= quest.target:
                    quest.completed = True
                changed = True

        elif quest.quest_type == "hint_free":
            if session.hints_used == 0 and session.correct > 0:
                quest.progress = min(quest.progress + session.correct, quest.target)
                if quest.progress >= quest.target:
                    quest.completed = True
                changed = True

        elif quest.quest_type == "streak":
            # Streak: if accuracy is 100%, add correct count toward streak
            if session.questions > 0 and session.correct == session.questions:
                quest.progress = min(quest.progress + session.correct, quest.target)
            else:
                quest.progress = 0  # Reset on imperfect session
            if quest.progress >= quest.target:
                quest.completed = True
            changed = True

        elif quest.quest_type == "trial_ready":
            quest.progress = player.clock_power
            if quest.progress >= quest.target:
                quest.completed = True
            changed = True

        elif quest.quest_type == "speed":
            if session.avg_response_ms and session.avg_response_ms < quest.target:
                quest.completed = True
                quest.progress = quest.target
                changed = True

        if changed:
            updated.append(quest)

    if updated:
        db.commit()
        for q in updated:
            db.refresh(q)

    return active_quests
