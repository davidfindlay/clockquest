import pytest
from app.scoring import calculate_session_points


def test_base_plus_correct():
    """5 base + 1 per correct."""
    points = calculate_session_points(
        questions=10, correct=7, hints_used=0, max_streak=3,
        player_clock_power=0, player_current_tier=0,
    )
    assert points == 12.0  # 5 base + 7 correct


def test_perfect_run_bonus():
    """5 base + 10 correct + 5 perfect bonus = 20."""
    points = calculate_session_points(
        questions=10, correct=10, hints_used=0, max_streak=3,
        player_clock_power=0, player_current_tier=0,
    )
    assert points == 20.0


def test_streak_bonus():
    """5 base + 7 correct + 5 streak bonus = 17."""
    points = calculate_session_points(
        questions=10, correct=7, hints_used=0, max_streak=5,
        player_clock_power=0, player_current_tier=0,
    )
    assert points == 17.0


def test_both_bonuses():
    """5 base + 10 correct + 5 streak + 5 perfect = 25."""
    points = calculate_session_points(
        questions=10, correct=10, hints_used=0, max_streak=10,
        player_clock_power=0, player_current_tier=0,
    )
    assert points == 25.0


def test_hints_block_perfect_bonus():
    """Hints used means no perfect bonus. 5 base + 10 correct = 15."""
    points = calculate_session_points(
        questions=10, correct=10, hints_used=1, max_streak=3,
        player_clock_power=0, player_current_tier=0,
    )
    assert points == 15.0


def test_zero_correct():
    """5 base + 0 correct = 5."""
    points = calculate_session_points(
        questions=10, correct=0, hints_used=0, max_streak=0,
        player_clock_power=0, player_current_tier=0,
    )
    assert points == 5.0


def test_zero_questions_gives_zero():
    points = calculate_session_points(
        questions=0, correct=0, hints_used=0, max_streak=0,
        player_clock_power=0, player_current_tier=0,
    )
    assert points == 0.0


def test_tier_ceiling_enforced():
    """Player at tier 0 (ceiling 100) can't exceed 100."""
    points = calculate_session_points(
        questions=10, correct=10, hints_used=0, max_streak=10,
        player_clock_power=95, player_current_tier=0,
    )
    # Would be 25 raw, but capped at 100 - 95 = 5
    assert points == 5.0
    assert 95 + points <= 100


def test_streak_of_4_no_bonus():
    """Streak of 4 doesn't trigger the bonus. 5 base + 7 correct = 12."""
    points = calculate_session_points(
        questions=10, correct=7, hints_used=0, max_streak=4,
        player_clock_power=0, player_current_tier=0,
    )
    assert points == 12.0
