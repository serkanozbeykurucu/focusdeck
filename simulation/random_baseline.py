"""Random baseline scheduler — reviews a random subset of known cards each day."""

from __future__ import annotations

import numpy as np


def select_reviews(
    known_card_ids: list[int],
    due_limit: int,
    rng: np.random.Generator,
) -> list[int]:
    if not known_card_ids:
        return []
    k = min(due_limit, len(known_card_ids))
    chosen = rng.choice(known_card_ids, size=k, replace=False)
    return [int(c) for c in chosen]
