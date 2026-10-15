"""
Classic SM-2 (Woźniak 1990 / Anki version).

Must produce identical outputs to api/src/services/sm2Service.ts for the same inputs.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class Sm2CardState:
    ease_factor: float
    interval: int
    repetitions: int


@dataclass
class Sm2Result:
    ease_factor: float
    interval: int
    repetitions: int
    next_review_at: datetime


def calculate_sm2(
    state: Sm2CardState,
    quality: int,
    now: datetime | None = None,
) -> Sm2Result:
    if quality < 0 or quality > 5:
        raise ValueError("Quality must be an integer between 0 and 5")

    if now is None:
        now = datetime.now(timezone.utc)

    ease_factor = state.ease_factor
    interval = state.interval
    repetitions = state.repetitions

    if quality < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
        repetitions += 1

    new_ease_factor = max(
        1.3,
        ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    )

    next_review_at = now + timedelta(days=interval)

    return Sm2Result(
        ease_factor=new_ease_factor,
        interval=interval,
        repetitions=repetitions,
        next_review_at=next_review_at,
    )
