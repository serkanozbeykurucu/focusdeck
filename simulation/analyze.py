"""
Read simulation CSVs and produce summary stats + plots for RQ2.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import yaml


def main() -> None:
    root = Path(__file__).resolve().parent
    with (root / "config.yaml").open(encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    out_dir = root / cfg.get("results_dir", "results")
    raw_path = out_dir / "all_raw.csv"
    if not raw_path.exists():
        raise SystemExit("results/all_raw.csv not found — run main.py first")

    df = pd.read_csv(raw_path)
    reviews = df[df["card_id"] >= 0].copy()
    snapshots = df[df["card_id"] < 0].copy()

    n_days = int(cfg["n_days"])
    summary_rows = []

    for algo, group in reviews.groupby("algorithm"):
        day100 = snapshots[(snapshots["algorithm"] == algo) & (snapshots["day"] == n_days - 1)]
        retention = float(day100["stability"].mean()) if len(day100) else 0.0
        cards_reviewed = int(len(group))
        successes = int(group["success"].sum())
        efficiency = successes / cards_reviewed if cards_reviewed else 0.0

        summary_rows.append(
            {
                "algorithm": algo,
                "retention_day_100": round(retention, 4),
                "cards_reviewed": cards_reviewed,
                "successes": successes,
                "efficiency": round(efficiency, 4),
            }
        )

        # Retention curve (mean predicted P(recall) across learners)
        curve = (
            snapshots[snapshots["algorithm"] == algo]
            .groupby("day")["stability"]
            .mean()
            .reset_index()
        )
        plt.figure(figsize=(8, 4.5))
        plt.plot(curve["day"], curve["stability"], color="#0d9488", linewidth=2)
        plt.xlabel("Day")
        plt.ylabel("Mean P(recall) over known cards")
        plt.title(f"Retention trajectory — {algo}")
        plt.ylim(0, 1.05)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(out_dir / f"retention_{algo}.png", dpi=150)
        plt.close()

    summary = pd.DataFrame(summary_rows)
    summary.to_csv(out_dir / "summary.csv", index=False)
    print(summary.to_string(index=False))
    print(f"\nWrote charts and summary to {out_dir}")


if __name__ == "__main__":
    main()
