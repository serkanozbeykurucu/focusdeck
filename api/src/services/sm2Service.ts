export interface Sm2CardState {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2CardState {
  nextReviewAt: Date;
}

export function calculateSm2(
  state: Sm2CardState,
  quality: number,
  now: Date = new Date()
): Sm2Result {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be an integer between 0 and 5');
  }

  let { easeFactor, interval, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReviewAt = new Date(now);
  nextReviewAt.setUTCDate(nextReviewAt.getUTCDate() + interval);

  return {
    easeFactor: newEaseFactor,
    interval,
    repetitions,
    nextReviewAt,
  };
}
