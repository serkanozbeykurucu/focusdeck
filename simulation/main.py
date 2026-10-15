"""
FocusDeck RQ2 simulation entry point.

Runs SM-2 vs random baseline for N learners over D days.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import yaml

from learner import make_learners
from random_baseline import select_reviews
from sm2 import Sm2CardState, calculate_sm2


@dataclass
class SchedulerCard:
    card_id: int
    ease_factor: float = 2.5
    interval: int = 1
    repetitions: int = 0
    next_review_day: int = 0


@dataclass
class LearnerRunState:
    known: list[int] = field(default_factory=list)
    next_new_id: int = 0
    cards: dict[int, SchedulerCard] = field(default_factory=dict)


def load_config(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def run_algorithm(algo: str, cfg: dict) -> pd.DataFrame:
    seed = int(cfg["seed"])
    n_learners = int(cfg["n_learners"])
    n_days = int(cfg["n_days"])
    n_cards = int(cfg["n_cards"])
    new_per_day = int(cfg["new_cards_per_day"])

    learners = make_learners(
        n_learners,
        seed,
        cfg["stability_start_mean"],
        cfg["stability_start_std"],
        cfg["growth_rate_mean"],
        cfg["growth_rate_std"],
    )

    rows: list[dict] = []
    base_rng = np.random.default_rng(seed + (0 if algo == "sm2" else 999))

    for learner in learners:
        state = LearnerRunState()
        sched_rng = np.random.default_rng(int(base_rng.integers(0, 2**31 - 1)))

        for day in range(n_days):
            # Introduce new cards
            while state.next_new_id < n_cards and len(state.known) < (day + 1) * new_per_day:
                if state.next_new_id >= n_cards:
                    break
                cid = state.next_new_id
                state.next_new_id += 1
                state.known.append(cid)
                state.cards[cid] = SchedulerCard(card_id=cid, next_review_day=day)
                learner.introduce(cid, day)

            # Build review list
            if algo == "sm2":
                due = [
                    cid
                    for cid, c in state.cards.items()
                    if c.next_review_day <= day
                ]
                due.sort(key=lambda cid: state.cards[cid].next_review_day)
                review_list = due[:20]
            else:
                review_list = select_reviews(state.known, due_limit=20, rng=sched_rng)

            for cid in review_list:
                card = state.cards[cid]
                success, quality = learner.test(cid, day, ease_factor=card.ease_factor)

                if algo == "sm2":
                    result = calculate_sm2(
                        Sm2CardState(
                            ease_factor=card.ease_factor,
                            interval=card.interval,
                            repetitions=card.repetitions,
                        ),
                        quality,
                        now=datetime(2020, 1, 1, tzinfo=timezone.utc) + timedelta(days=day),
                    )
                    card.ease_factor = result.ease_factor
                    card.interval = result.interval
                    card.repetitions = result.repetitions
                    card.next_review_day = day + result.interval
                else:
                    # Random baseline: schedule next review randomly in 1–10 days
                    card.next_review_day = day + int(sched_rng.integers(1, 11))

                rows.append(
                    {
                        "algorithm": algo,
                        "learner_id": learner.learner_id,
                        "day": day,
                        "card_id": cid,
                        "success": int(success),
                        "quality": quality,
                        "stability": learner.memories[cid].stability,
                        "interval": card.interval,
                        "ease_factor": card.ease_factor,
                    }
                )

            # End-of-day retention snapshot over all known cards
            if state.known:
                probs = [learner.recall_probability(cid, day) for cid in state.known]
                mean_p = float(np.mean(probs))
            else:
                mean_p = 0.0

            rows.append(
                {
                    "algorithm": algo,
                    "learner_id": learner.learner_id,
                    "day": day,
                    "card_id": -1,
                    "success": -1,
                    "quality": -1,
                    "stability": mean_p,
                    "interval": -1,
                    "ease_factor": mean_p,
                }
            )

    return pd.DataFrame(rows)


def main() -> None:
    root = Path(__file__).resolve().parent
    cfg = load_config(root / "config.yaml")
    out_dir = root / cfg.get("results_dir", "results")
    out_dir.mkdir(parents=True, exist_ok=True)

    frames = []
    for algo in cfg["algorithms"]:
        print(f"Running {algo}…")
        df = run_algorithm(algo, cfg)
        path = out_dir / f"{algo}_raw.csv"
        df.to_csv(path, index=False)
        print(f"  wrote {path}")
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)
    combined.to_csv(out_dir / "all_raw.csv", index=False)
    print("Done. Run analyze.py for charts and summary stats.")


if __name__ == "__main__":
    main()
