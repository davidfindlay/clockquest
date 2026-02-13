"""Clock Power scoring algorithm.

Calculates points earned from a game session based on accuracy,
difficulty, hints, and diminishing returns for repeated content.
"""

from .models import Session, Player
from .tiers import get_tier_ceiling

DIFFICULTY_MULTIPLIERS = {
    "hour": 0.5,
    "half": 0.7,
    "quarter": 1.0,
    "five_min": 1.2,
    "one_min": 1.5,
    "interval": 1.8,
}


def calculate_session_points(
    mode: str,
    difficulty: str,
    questions: int,
    correct: int,
    hints_used: int,
    player_clock_power: float,
    player_current_tier: int,
    recent_sessions: list[Session],
) -> float:
    """Calculate Clock Power points earned from a session.

    Returns the points to add to the player's clock_power (0 or positive).
    """
    if questions == 0:
        return 0.0

    # Base points: 5-15 based on how many correct
    base = min(5 + correct, 15)

    # Accuracy bonus: exponential scale rewards high accuracy
    accuracy = correct / questions
    accuracy_bonus = base * (accuracy ** 2)

    # Hint penalty: -2 per hint
    hint_penalty = hints_used * 2

    # Difficulty multiplier
    diff_mult = DIFFICULTY_MULTIPLIERS.get(difficulty, 1.0)

    raw = (base + accuracy_bonus - hint_penalty) * diff_mult

    # Diminishing returns: if player has done 3+ recent sessions with same
    # mode+difficulty at >=95% accuracy, reduce points
    similar_count = 0
    for s in recent_sessions:
        if (
            s.mode == mode
            and s.difficulty == difficulty
            and s.questions > 0
            and (s.correct / s.questions) >= 0.95
        ):
            similar_count += 1

    if similar_count >= 3:
        diminish = max(0.1, 1.0 - 0.2 * (similar_count - 2))
        raw *= diminish

    # Ensure non-negative
    raw = max(0.0, raw)

    # Tier ceiling: cannot exceed the tier's max power threshold
    max_power = get_tier_ceiling(player_current_tier)
    new_power = min(player_clock_power + raw, max_power)
    points = max(0.0, new_power - player_clock_power)

    return round(points, 1)
