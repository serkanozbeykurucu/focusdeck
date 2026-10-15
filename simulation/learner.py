"""
Simulated learner memory model (thesis):

  P(recall) = exp(-t / s)

Stability starts near 1 day, grows on success (s_new = s * ease_factor * growth_rate),
shrinks on failure (s_new = s * 0.3).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np


@dataclass
class CardMemory:
    stability: float = 1.0
    last_review_day: int | None = None
    introduced_day: int | None = None


@dataclass
class SimulatedLearner:
    learner_id: int
    stability_start: float
    growth_rate: float
    rng: np.random.Generator
    memories: dict[int, CardMemory] = field(default_factory=dict)

    def introduce(self, card_id: int, day: int) -> None:
        if card_id not in self.memories:
            self.memories[card_id] = CardMemory(
                stability=self.stability_start,
                introduced_day=day,
                last_review_day=None,
            )

    def recall_probability(self, card_id: int, day: int) -> float:
        mem = self.memories[card_id]
        if mem.last_review_day is None:
            # First review shortly after introduction — modest baseline chance
            t = max(0, day - (mem.introduced_day or day))
        else:
            t = max(0, day - mem.last_review_day)
        s = max(mem.stability, 1e-6)
        return float(math.exp(-t / s))

    def test(self, card_id: int, day: int, ease_factor: float = 2.5) -> tuple[bool, int]:
        """
        Returns (success, quality 0-5).
        Maps recall success to SM-2 qualities similar to UI: Good/Easy vs Again/Hard.
        On success: s_new = s * ease_factor * growth_rate
        On failure: s_new = s * 0.3
        """
        p = self.recall_probability(card_id, day)
        success = bool(self.rng.random() < p)
        mem = self.memories[card_id]

        if success:
            quality = 5 if p > 0.75 else 4
            mem.stability = mem.stability * ease_factor * self.growth_rate
        else:
            quality = 1 if p < 0.35 else 3
            mem.stability = mem.stability * 0.3

        mem.last_review_day = day
        return success, quality


def make_learners(
    n: int,
    seed: int,
    stability_mean: float,
    stability_std: float,
    growth_mean: float,
    growth_std: float,
) -> list[SimulatedLearner]:
    rng = np.random.default_rng(seed)
    learners: list[SimulatedLearner] = []
    for i in range(n):
        learner_rng = np.random.default_rng(int(rng.integers(0, 2**31 - 1)))
        learners.append(
            SimulatedLearner(
                learner_id=i,
                stability_start=max(0.2, float(rng.normal(stability_mean, stability_std))),
                growth_rate=max(0.5, float(rng.normal(growth_mean, growth_std))),
                rng=learner_rng,
            )
        )
    return learners
