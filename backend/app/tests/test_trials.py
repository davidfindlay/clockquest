from app.tier_trials import validate_trial, get_trial_config, TIER_NAMES


def test_stone_trial_pass():
    assert validate_trial(tier=1, correct=9, hints_used=2, time_ms=None) is True


def test_stone_trial_fail_accuracy():
    assert validate_trial(tier=1, correct=8, hints_used=0, time_ms=None) is False


def test_stone_trial_fail_hints():
    assert validate_trial(tier=1, correct=10, hints_used=4, time_ms=None) is False


def test_gold_trial_pass():
    assert validate_trial(tier=4, correct=10, hints_used=2, time_ms=None) is True


def test_diamond_trial_needs_speed():
    # Diamond has speed gate; very slow should fail
    assert validate_trial(tier=7, correct=18, hints_used=0, time_ms=18 * 61_000) is False


def test_diamond_trial_pass():
    assert validate_trial(tier=7, correct=16, hints_used=1, time_ms=18 * 30_000) is True


def test_clock_master_trial():
    assert validate_trial(tier=10, correct=23, hints_used=0, time_ms=25 * 30_000) is True
    assert validate_trial(tier=10, correct=22, hints_used=0, time_ms=25 * 30_000) is False


def test_all_tiers_have_names():
    for i in range(11):
        assert i in TIER_NAMES


def test_get_trial_config_returns_all():
    for tier in range(1, 11):
        config = get_trial_config(tier)
        assert config is not None
        assert "questions" in config
        assert "min_correct" in config


def test_invalid_tier_returns_none():
    assert get_trial_config(0) is None
    assert get_trial_config(11) is None
