"""Tier trial definitions and validation logic.

Each tier has a fixed trial that must be passed to unlock it.
"""

TIER_NAMES = {
    0: "Wood",
    1: "Stone",
    2: "Coal",
    3: "Iron",
    4: "Gold",
    5: "Redstone",
    6: "Lapis",
    7: "Diamond",
    8: "Netherite",
    9: "Beacon",
    10: "Clock Master",
}

TIER_COLORS = {
    0: "#8B6914",   # Wood - brown
    1: "#808080",   # Stone - gray
    2: "#333333",   # Coal - dark gray
    3: "#C0C0C0",   # Iron - silver
    4: "#FFD700",   # Gold
    5: "#FF0000",   # Redstone - red
    6: "#1E40AF",   # Lapis - blue
    7: "#00CED1",   # Diamond - cyan
    8: "#4A0E4E",   # Netherite - dark purple
    9: "#FFEA00",   # Beacon - bright yellow
    10: "#FF69B4",  # Clock Master - pink
}

# Trial definitions: tier -> config
# Each trial must be passed to unlock that tier
TRIAL_DEFINITIONS = {
    1: {  # Stone
        "difficulty": "hour",
        "questions": 10,
        "min_correct": 9,
        "max_hints": 3,
        "speed_gate": False,
    },
    2: {  # Coal
        "difficulty": "half",
        "questions": 10,
        "min_correct": 9,
        "max_hints": 3,
        "speed_gate": False,
    },
    3: {  # Iron
        "difficulty": "quarter",
        "questions": 12,
        "min_correct": 10,
        "max_hints": 2,
        "speed_gate": False,
    },
    4: {  # Gold
        "difficulty": "five_min",
        "questions": 12,
        "min_correct": 10,
        "max_hints": 2,
        "speed_gate": False,
    },
    5: {  # Redstone
        "difficulty": "five_min",
        "questions": 15,
        "min_correct": 13,
        "max_hints": 1,
        "speed_gate": True,
    },
    6: {  # Lapis
        "difficulty": "one_min",
        "questions": 15,
        "min_correct": 13,
        "max_hints": 1,
        "speed_gate": True,
    },
    7: {  # Diamond
        "difficulty": "mixed",
        "questions": 18,
        "min_correct": 16,
        "max_hints": 1,
        "speed_gate": True,
    },
    8: {  # Netherite
        "difficulty": "interval",
        "questions": 15,
        "min_correct": 13,
        "max_hints": 0,
        "speed_gate": True,
    },
    9: {  # Beacon
        "difficulty": "mixed",
        "questions": 20,
        "min_correct": 18,
        "max_hints": 0,
        "speed_gate": True,
    },
    10: {  # Clock Master
        "difficulty": "mixed",
        "questions": 25,
        "min_correct": 23,
        "max_hints": 0,
        "speed_gate": True,
    },
}


def get_trial_config(tier: int) -> dict | None:
    """Get the trial configuration for a given tier."""
    if tier not in TRIAL_DEFINITIONS:
        return None
    config = TRIAL_DEFINITIONS[tier].copy()
    config["tier"] = tier
    config["tier_name"] = TIER_NAMES.get(tier, "Unknown")
    return config


def validate_trial(tier: int, correct: int, hints_used: int, time_ms: int | None) -> bool:
    """Check if a trial submission passes."""
    config = TRIAL_DEFINITIONS.get(tier)
    if config is None:
        return False

    if correct < config["min_correct"]:
        return False

    if hints_used > config["max_hints"]:
        return False

    # Speed gate: for now, just check that time was provided if required
    # Actual speed thresholds can be tuned per age in frontend
    # Backend stores raw time; pass/fail on speed is lenient in v1
    if config["speed_gate"] and time_ms is not None:
        # Allow up to 60 seconds per question as a generous server-side gate
        max_time = config["questions"] * 60_000
        if time_ms > max_time:
            return False

    return True


def get_mastered_skills(current_tier: int) -> list[str]:
    """Return human-readable list of skills the player has mastered based on tier."""
    skills = []
    if current_tier >= 1:
        skills.append("Reads hours on the clock")
    if current_tier >= 2:
        skills.append("Reads half past / half to")
    if current_tier >= 3:
        skills.append("Reads quarter past / quarter to")
    if current_tier >= 4:
        skills.append("Reads 5-minute intervals")
    if current_tier >= 5:
        skills.append("Reads 5-minute intervals quickly")
    if current_tier >= 6:
        skills.append("Reads any minute precisely")
    if current_tier >= 7:
        skills.append("Masters mixed clock reading")
    if current_tier >= 8:
        skills.append("Calculates time intervals")
    if current_tier >= 9:
        skills.append("Advanced time reasoning")
    if current_tier >= 10:
        skills.append("Clock Master — full mastery!")
    return skills
