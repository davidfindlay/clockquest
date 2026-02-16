"""Authoritative tier data for ClockQuest.

Single source of truth for tier names, colors, power thresholds,
skills, and trial definitions. Add future game settings per tier here.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class TierDefinition:
    """Complete definition of a single tier.

    quest_run_mix maps difficulty names to minimum proportions (should sum to 1.0).
    This controls what difficulty questions appear during quest runs at this tier.
    Add future per-tier game settings as new fields here.
    """
    index: int
    name: str
    color: str
    min_power: int
    max_power: int
    skill: str | None = None  # skill unlocked at this tier
    trial: dict | None = field(default=None, repr=False)  # trial to unlock this tier
    quest_run_mix: dict[str, float] = field(default_factory=dict, repr=False)
    time_format_mix: dict[str, float] = field(default_factory=dict, repr=False)
    # Percent progress through this tier (0-100) at which Set The Clock switches
    # to advanced hint mode. Example: 70 means advanced mode starts once the
    # player reaches >=70% progress within their current tier.
    set_clock_advanced_hint_progress_threshold: int = 50
    # Score penalty applied each time hint is used while in advanced hint mode.
    set_clock_advanced_hint_penalty: int = 2
    # Chance (0.0-1.0) to show a quest-start character tip for this tier.
    quest_tip_frequency: float = 0.5
    # Tip pool for quest start callouts. {id, character, message}
    character_tips: list[dict] = field(default_factory=list, repr=False)


TIERS: list[TierDefinition] = [
    TierDefinition(
        index=0,
        name="Wood",
        color="#8B6914",
        min_power=0,
        max_power=99,
        skill=None,  # starting tier, no skill yet
        trial=None,   # no trial needed for starting tier
        quest_run_mix={"hour": 1.0},
        time_format_mix={"digital": 0.7, "digital_ampm": 0.3},
        set_clock_advanced_hint_progress_threshold=100,
        set_clock_advanced_hint_penalty=0,
        quest_tip_frequency=0.8,
        character_tips=[
            {"id": "wood_focus", "character": "tick", "message": "Let's start easy. Watch the short hand first!"},
            {"id": "wood_hint", "character": "tick", "message": "Need help? Tap Hint any time."},
        ],
    ),
    TierDefinition(
        index=1,
        name="Stone",
        color="#808080",
        min_power=100,
        max_power=199,
        skill="Reads hours on the clock",
        trial={
            "difficulty": "hour",
            "questions": 10,
            "min_correct": 9,
            "max_hints": 3,
            "speed_gate": False,
        },
        quest_run_mix={"hour": 0.3, "half": 0.7},
        time_format_mix={"digital": 0.4, "digital_ampm": 0.3, "words_past_to": 0.3},
        set_clock_advanced_hint_progress_threshold=50,
        set_clock_advanced_hint_penalty=1,
        quest_tip_frequency=0.6,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "Steady hands. Accuracy first, speed second."},
            {"id": "tier_tip_b", "character": "tick", "message": "Use the target text, then set minute hand carefully."},
        ],
    ),
    TierDefinition(
        index=2,
        name="Coal",
        color="#333333",
        min_power=200,
        max_power=299,
        skill="Reads half past / half to",
        trial={
            "difficulty": "half",
            "questions": 10,
            "min_correct": 9,
            "max_hints": 3,
            "speed_gate": False,
        },
        quest_run_mix={"half": 0.2, "quarter": 0.8},
        time_format_mix={"digital": 0.3, "digital_ampm": 0.2, "words_past_to": 0.5},
        set_clock_advanced_hint_progress_threshold=50,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
    TierDefinition(
        index=3,
        name="Iron",
        color="#C0C0C0",
        min_power=300,
        max_power=399,
        skill="Reads quarter past / quarter to",
        trial={
            "difficulty": "quarter",
            "questions": 12,
            "min_correct": 10,
            "max_hints": 2,
            "speed_gate": False,
        },
        quest_run_mix={"quarter": 0.5, "five_min": 0.5},
        time_format_mix={"digital": 0.1, "digital_ampm": 0.2, "words_past_to": 0.7},
        set_clock_advanced_hint_progress_threshold=50,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
    TierDefinition(
        index=4,
        name="Gold",
        color="#FFD700",
        min_power=400,
        max_power=499,
        skill="Reads 5-minute intervals",
        trial={
            "difficulty": "five_min",
            "questions": 12,
            "min_correct": 10,
            "max_hints": 2,
            "speed_gate": False,
        },
        quest_run_mix={"quarter": 0.2, "five_min": 0.8},
        time_format_mix={"digital": 0.2, "digital_ampm": 0.2, "words_past_to": 0.6},
        set_clock_advanced_hint_progress_threshold=50,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
    TierDefinition(
        index=5,
        name="Redstone",
        color="#FF0000",
        min_power=500,
        max_power=599,
        skill="Reads 5-minute intervals quickly",
        trial={
            "difficulty": "five_min",
            "questions": 15,
            "min_correct": 13,
            "max_hints": 1,
            "speed_gate": True,
        },
        quest_run_mix={"five_min": 0.5, "one_min": 0.5},
        time_format_mix={"digital": 0.2, "words_past_to": 0.5, "full_words": 0.3},
        set_clock_advanced_hint_progress_threshold=0,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
    TierDefinition(
        index=6,
        name="Lapis",
        color="#1E40AF",
        min_power=600,
        max_power=699,
        skill="Reads any minute precisely",
        trial={
            "difficulty": "one_min",
            "questions": 15,
            "min_correct": 13,
            "max_hints": 1,
            "speed_gate": True,
        },
        quest_run_mix={"five_min": 0.2, "one_min": 0.8},
        time_format_mix={"digital": 0.1, "words_past_to": 0.4, "full_words": 0.5},
        set_clock_advanced_hint_progress_threshold=50,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
    TierDefinition(
        index=7,
        name="Diamond",
        color="#00CED1",
        min_power=700,
        max_power=799,
        skill="Masters mixed clock reading",
        trial={
            "difficulty": "mixed",
            "questions": 18,
            "min_correct": 16,
            "max_hints": 1,
            "speed_gate": True,
        },
        quest_run_mix={"five_min": 0.1, "one_min": 0.9},
        time_format_mix={"words_past_to": 0.3, "full_words": 0.7},
        set_clock_advanced_hint_progress_threshold=0,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
    TierDefinition(
        index=8,
        name="Netherite",
        color="#4A0E4E",
        min_power=800,
        max_power=899,
        skill="Calculates time intervals",
        trial={
            "difficulty": "interval",
            "questions": 15,
            "min_correct": 13,
            "max_hints": 0,
            "speed_gate": True,
        },
        quest_run_mix={"one_min": 0.7, "interval": 0.3},
        time_format_mix={"words_past_to": 0.2, "full_words": 0.8},
        set_clock_advanced_hint_progress_threshold=50,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
    TierDefinition(
        index=9,
        name="Beacon",
        color="#FFEA00",
        min_power=900,
        max_power=999,
        skill="Advanced time reasoning",
        trial={
            "difficulty": "mixed",
            "questions": 20,
            "min_correct": 18,
            "max_hints": 0,
            "speed_gate": True,
        },
        quest_run_mix={"one_min": 0.5, "interval": 0.5},
        time_format_mix={"digital_ampm": 0.1, "full_words": 0.9},
        set_clock_advanced_hint_progress_threshold=50,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
    TierDefinition(
        index=10,
        name="Clock Master",
        color="#FF69B4",
        min_power=1000,
        max_power=1000,
        skill="Clock Master \u2014 full mastery!",
        trial={
            "difficulty": "mixed",
            "questions": 25,
            "min_correct": 23,
            "max_hints": 0,
            "speed_gate": True,
        },
        quest_run_mix={"one_min": 0.3, "interval": 0.7},
        time_format_mix={"full_words": 1.0},
        set_clock_advanced_hint_progress_threshold=50,
        set_clock_advanced_hint_penalty=2,
        quest_tip_frequency=0.5,
        character_tips=[
            {"id": "tier_tip_a", "character": "tick", "message": "You're in tougher territory — stay focused."},
            {"id": "tier_tip_b", "character": "tick", "message": "Great rhythm beats rushing. You've got this."},
        ],
    ),
]

MAX_TIER = len(TIERS) - 1


# --- Helper lookups (derived from TIERS, not duplicated) ---

def get_tier(index: int) -> TierDefinition:
    """Get tier by index, clamped to valid range."""
    return TIERS[max(0, min(index, MAX_TIER))]


def get_tier_name(index: int) -> str:
    return get_tier(index).name


def get_tier_color(index: int) -> str:
    return get_tier(index).color


def get_tier_ceiling(tier_index: int) -> int:
    """Max clock power achievable at this tier (need trial to go beyond)."""
    return min(get_tier(tier_index).max_power + 1, 1000)


def get_power_thresholds(tier_index: int) -> tuple[int, int]:
    """Return (floor, ceiling) power values for a tier."""
    tier = get_tier(tier_index)
    return tier.min_power, tier.max_power


def get_mastered_skills(current_tier: int) -> list[str]:
    """Return skills the player has mastered based on their tier."""
    return [
        t.skill for t in TIERS
        if t.skill is not None and t.index <= current_tier
    ]


def get_trial_config(tier_index: int) -> dict | None:
    """Get the trial configuration for unlocking a tier."""
    tier = get_tier(tier_index)
    if tier.trial is None:
        return None
    config = tier.trial.copy()
    config["tier"] = tier.index
    config["tier_name"] = tier.name
    return config


def get_trial_definitions() -> dict[int, dict]:
    """Get all trial definitions as {tier_index: config} dict."""
    return {
        t.index: t.trial
        for t in TIERS
        if t.trial is not None
    }


def validate_trial(tier_index: int, correct: int, hints_used: int, time_ms: int | None) -> bool:
    """Check if a trial submission passes."""
    tier = get_tier(tier_index)
    if tier.trial is None:
        return False

    config = tier.trial
    if correct < config["min_correct"]:
        return False
    if hints_used > config["max_hints"]:
        return False

    if config["speed_gate"] and time_ms is not None:
        max_time = config["questions"] * 60_000
        if time_ms > max_time:
            return False

    return True


def tier_list_for_api() -> list[dict]:
    """Return all tiers as a list of dicts suitable for JSON API response.

    set_clock_advanced_hint_progress_threshold is a per-tier percentage (0-100)
    of progress within that tier where Set The Clock enters advanced hint mode.
    """
    return [
        {
            "index": t.index,
            "name": t.name,
            "color": t.color,
            "min_power": t.min_power,
            "max_power": t.max_power,
            "skill": t.skill,
            "quest_run_mix": t.quest_run_mix,
            "time_format_mix": t.time_format_mix,
            "set_clock_advanced_hint_progress_threshold": t.set_clock_advanced_hint_progress_threshold,
            "set_clock_advanced_hint_penalty": t.set_clock_advanced_hint_penalty,
            "quest_tip_frequency": t.quest_tip_frequency,
            "character_tips": t.character_tips,
        }
        for t in TIERS
    ]

