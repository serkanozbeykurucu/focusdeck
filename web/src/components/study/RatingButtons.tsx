import { Button } from '../ui/Button';

const RATINGS = [
  { label: 'Again', quality: 1, className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { label: 'Hard', quality: 3, className: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
  { label: 'Good', quality: 4, className: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100' },
  { label: 'Easy', quality: 5, className: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
] as const;

interface Props {
  disabled?: boolean;
  onRate: (quality: number) => void;
}

export function RatingButtons({ disabled, onRate }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {RATINGS.map((r) => (
        <Button
          key={r.label}
          type="button"
          variant="secondary"
          disabled={disabled}
          className={`min-w-[5.5rem] border ${r.className}`}
          onClick={() => onRate(r.quality)}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
