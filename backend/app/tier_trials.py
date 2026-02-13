"""Tier trial definitions and validation logic.

This module re-exports from tiers.py for backward compatibility.
All tier data is defined in tiers.py (single source of truth).
"""

from .tiers import (
    TIERS,
    get_tier_name,
    get_tier_color,
    get_trial_config,
    get_trial_definitions,
    get_mastered_skills,
    validate_trial,
)

# Legacy dict-style lookups for existing code that uses TIER_NAMES[i] / TIER_COLORS[i]
TIER_NAMES: dict[int, str] = {t.index: t.name for t in TIERS}
TIER_COLORS: dict[int, str] = {t.index: t.color for t in TIERS}
TRIAL_DEFINITIONS: dict[int, dict] = get_trial_definitions()
