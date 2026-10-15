import type { Flashcard } from '../../types';

interface Props {
  card: Flashcard;
  revealed: boolean;
  onReveal: () => void;
}

export function FlashcardViewer({ card, revealed, onReveal }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <button
        type="button"
        onClick={revealed ? undefined : onReveal}
        className="w-full rounded-xl border border-surface-border bg-white p-8 text-left shadow-sm transition hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Question
          {card.bloomLevel && (
            <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-accent-dark normal-case tracking-normal">
              {card.bloomLevel.toLowerCase()}
            </span>
          )}
        </p>
        <p className="font-display text-xl leading-relaxed text-ink md:text-2xl">{card.question}</p>

        <div className="my-6 border-t border-dashed border-surface-border" />

        {revealed ? (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Answer</p>
            <p className="text-lg leading-relaxed text-ink">{card.answer}</p>
          </>
        ) : (
          <p className="text-center text-sm text-ink-muted">Click to reveal answer</p>
        )}
      </button>
    </div>
  );
}
