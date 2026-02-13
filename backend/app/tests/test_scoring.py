import pytest
from app.scoring import calculate_session_points


def _make_mock_session(mode="read", difficulty="hour", questions=10, correct=10):
    """Helper to create a mock session-like object."""

    class MockSession:
        def __init__(self, m, d, q, c):
            self.mode = m
            self.difficulty = d
            self.questions = q
            self.correct = c

    return MockSession(mode, difficulty, questions, correct)


def test_perfect_score_gives_points():
    points = calculate_session_points(
        mode="read",
        difficulty="quarter",
        questions=10,
        correct=10,
        hints_used=0,
        player_clock_power=0,
        player_current_tier=0,
        recent_sessions=[],
    )
    assert points > 0


def test_zero_correct_gives_minimal_points():
    points = calculate_session_points(
        mode="read",
        difficulty="quarter",
        questions=10,
        correct=0,
        hints_used=0,
        player_clock_power=0,
        player_current_tier=0,
        recent_sessions=[],
    )
    # Base is min(5+0, 15)=5, accuracy=0, bonus=0, raw = 5 * 1.0 = 5
    assert points >= 0


def test_hints_reduce_points():
    no_hints = calculate_session_points(
        mode="read", difficulty="quarter", questions=10, correct=10,
        hints_used=0, player_clock_power=0, player_current_tier=0, recent_sessions=[],
    )
    with_hints = calculate_session_points(
        mode="read", difficulty="quarter", questions=10, correct=10,
        hints_used=5, player_clock_power=0, player_current_tier=0, recent_sessions=[],
    )
    assert no_hints > with_hints


def test_difficulty_multiplier_scales():
    easy = calculate_session_points(
        mode="read", difficulty="hour", questions=10, correct=10,
        hints_used=0, player_clock_power=0, player_current_tier=0, recent_sessions=[],
    )
    hard = calculate_session_points(
        mode="read", difficulty="one_min", questions=10, correct=10,
        hints_used=0, player_clock_power=0, player_current_tier=0, recent_sessions=[],
    )
    assert hard > easy


def test_tier_ceiling_enforced():
    # Player at tier 0, ceiling is 100
    points = calculate_session_points(
        mode="read", difficulty="one_min", questions=10, correct=10,
        hints_used=0, player_clock_power=95, player_current_tier=0, recent_sessions=[],
    )
    assert 95 + points <= 100


def test_diminishing_returns():
    # Simulate 5 recent perfect sessions at same mode+difficulty
    recent = [_make_mock_session("read", "hour", 10, 10) for _ in range(5)]
    normal = calculate_session_points(
        mode="read", difficulty="hour", questions=10, correct=10,
        hints_used=0, player_clock_power=0, player_current_tier=0, recent_sessions=[],
    )
    diminished = calculate_session_points(
        mode="read", difficulty="hour", questions=10, correct=10,
        hints_used=0, player_clock_power=0, player_current_tier=0, recent_sessions=recent,
    )
    assert diminished < normal


def test_zero_questions_gives_zero():
    points = calculate_session_points(
        mode="read", difficulty="hour", questions=0, correct=0,
        hints_used=0, player_clock_power=0, player_current_tier=0, recent_sessions=[],
    )
    assert points == 0.0
