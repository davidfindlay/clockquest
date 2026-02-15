"""Clock Power scoring algorithm.

Simple point system:
  - 5 base points for playing
  - 1 point per correct answer
  - +5 bonus for getting 5+ in a row (streak bonus)
  - +5 bonus for a perfect run (all correct, no hints)
  - Tier ceiling still enforced
"""

from .tiers import get_tier_ceiling


def calculate_session_points(
    questions: int,
    correct: int,
    hints_used: int,
    max_streak: int,
    player_clock_power: float,
    player_current_tier: int,
) -> float:
    """Calculate Clock Power points earned from a session.

    Returns the points to add to the player's clock_power (0 or positive).
    """
    if questions == 0:
        return 0.0

    # 5 base points + 1 per correct answer
    raw = 5.0 + float(correct)

    # +5 bonus for a streak of 5+ in a row
    if max_streak >= 5:
        raw += 5.0

    # +5 bonus for perfect run (all correct, no hints)
    if correct == questions and hints_used == 0:
        raw += 5.0

    # Tier ceiling: cannot exceed the tier's max power threshold
    max_power = get_tier_ceiling(player_current_tier)
    new_power = min(player_clock_power + raw, max_power)
    points = max(0.0, new_power - player_clock_power)

    return round(points, 1)
