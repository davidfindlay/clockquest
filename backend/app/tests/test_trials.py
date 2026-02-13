from app.tiers import (
    TIERS,
    MAX_TIER,
    get_tier,
    get_tier_name,
    get_tier_color,
    get_tier_ceiling,
    get_mastered_skills,
    get_trial_config,
    validate_trial,
    tier_list_for_api,
)


def test_stone_trial_pass():
    assert validate_trial(tier_index=1, correct=9, hints_used=2, time_ms=None) is True


def test_stone_trial_fail_accuracy():
    assert validate_trial(tier_index=1, correct=8, hints_used=0, time_ms=None) is False


def test_stone_trial_fail_hints():
    assert validate_trial(tier_index=1, correct=10, hints_used=4, time_ms=None) is False


def test_gold_trial_pass():
    assert validate_trial(tier_index=4, correct=10, hints_used=2, time_ms=None) is True


def test_diamond_trial_needs_speed():
    # Diamond has speed gate; very slow should fail
    assert validate_trial(tier_index=7, correct=18, hints_used=0, time_ms=18 * 61_000) is False


def test_diamond_trial_pass():
    assert validate_trial(tier_index=7, correct=16, hints_used=1, time_ms=18 * 30_000) is True


def test_clock_master_trial():
    assert validate_trial(tier_index=10, correct=23, hints_used=0, time_ms=25 * 30_000) is True
    assert validate_trial(tier_index=10, correct=22, hints_used=0, time_ms=25 * 30_000) is False


def test_all_tiers_have_names():
    assert len(TIERS) == 11
    for i in range(11):
        assert get_tier_name(i) != ""


def test_get_trial_config_returns_all():
    for tier in range(1, 11):
        config = get_trial_config(tier)
        assert config is not None
        assert "questions" in config
        assert "min_correct" in config


def test_invalid_tier_returns_none():
    assert get_trial_config(0) is None


def test_tier_power_thresholds_are_contiguous():
    """Each tier's min_power should be the previous tier's max_power + 1."""
    for i in range(1, len(TIERS) - 1):
        assert TIERS[i].min_power == TIERS[i - 1].max_power + 1


def test_get_tier_ceiling():
    assert get_tier_ceiling(0) == 100
    assert get_tier_ceiling(4) == 500
    assert get_tier_ceiling(9) == 1000
    assert get_tier_ceiling(10) == 1000


def test_get_mastered_skills():
    assert len(get_mastered_skills(0)) == 0
    assert len(get_mastered_skills(1)) == 1
    assert len(get_mastered_skills(10)) == 10


def test_tier_list_for_api():
    data = tier_list_for_api()
    assert len(data) == 11
    assert data[0]["name"] == "Wood"
    assert data[10]["name"] == "Clock Master"
    for item in data:
        assert "index" in item
        assert "name" in item
        assert "color" in item
        assert "min_power" in item
        assert "max_power" in item
        assert "skill" in item
