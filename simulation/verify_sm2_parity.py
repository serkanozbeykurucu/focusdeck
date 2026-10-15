"""
Quick check that Python SM-2 matches the TypeScript formula for a few cases.
Run: python verify_sm2_parity.py
"""

from sm2 import Sm2CardState, calculate_sm2
from datetime import datetime, timezone


def main() -> None:
    now = datetime(2024, 1, 1, tzinfo=timezone.utc)
    cases = [
        # (ease, interval, reps, quality) -> expected (ease rounded, interval, reps)
        ((2.5, 1, 0, 4), (2.5 + (0.1 - 1 * (0.08 + 1 * 0.02)), 1, 1)),
        ((2.5, 1, 0, 1), (max(1.3, 2.5 + (0.1 - 4 * (0.08 + 4 * 0.02))), 1, 0)),
        ((2.5, 1, 1, 4), (2.5 + (0.1 - 1 * (0.08 + 1 * 0.02)), 6, 2)),
    ]

    for (ef, iv, rp, q), (exp_ef, exp_iv, exp_rp) in cases:
        result = calculate_sm2(Sm2CardState(ef, iv, rp), q, now)
        assert result.interval == exp_iv, (result.interval, exp_iv)
        assert result.repetitions == exp_rp, (result.repetitions, exp_rp)
        assert abs(result.ease_factor - exp_ef) < 1e-9, (result.ease_factor, exp_ef)
        print(f"ok quality={q} -> EF={result.ease_factor:.4f} I={result.interval} R={result.repetitions}")

    print("SM-2 parity checks passed.")


if __name__ == "__main__":
    main()
