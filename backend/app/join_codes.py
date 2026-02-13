from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import re
import secrets
from typing import List

_WORD_LIST_PATH = Path(__file__).resolve().parent / "data" / "join_words.txt"


@lru_cache(maxsize=1)
def _load_words() -> List[str]:
    if not _WORD_LIST_PATH.exists():
        raise RuntimeError(f"Join word list not found at {_WORD_LIST_PATH}")

    words: List[str] = []
    with _WORD_LIST_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            word = line.strip()
            if not word or word.startswith("#"):
                continue
            words.append(word)

    if len(words) < 3:
        raise RuntimeError("Join word list must include at least three words.")

    return words


@lru_cache(maxsize=1)
def _word_map() -> dict[str, str]:
    return {word.lower(): word for word in _load_words()}


@lru_cache(maxsize=1)
def _word_lengths() -> List[int]:
    return sorted({len(word) for word in _load_words()})


@lru_cache(maxsize=1)
def _word_length_set() -> set[int]:
    return set(_word_lengths())


def generate_join_code() -> str:
    """Generate a join code made of three short words."""
    words = _load_words()
    return "".join(secrets.choice(words) for _ in range(3))


def normalize_join_code(raw: str) -> str:
    """Normalize a join code to Title Case with no separators."""
    tokens = re.findall(r"[A-Za-z]+", raw or "")
    if not tokens:
        return ""

    word_map = _word_map()

    if len(tokens) == 3:
        normalized = []
        for token in tokens:
            key = token.lower()
            if key not in word_map:
                return ""
            normalized.append(word_map[key])
        return "".join(normalized)

    if len(tokens) != 1:
        return ""

    letters = tokens[0].lower()
    lengths = _word_lengths()
    length_set = _word_length_set()

    for length_one in lengths:
        for length_two in lengths:
            length_three = len(letters) - length_one - length_two
            if length_three not in length_set:
                continue
            one = letters[:length_one]
            two = letters[length_one:length_one + length_two]
            three = letters[length_one + length_two:]
            if one in word_map and two in word_map and three in word_map:
                return f"{word_map[one]}{word_map[two]}{word_map[three]}"

    return ""

