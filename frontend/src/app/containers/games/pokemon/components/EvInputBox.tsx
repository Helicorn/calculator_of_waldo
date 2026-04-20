"use client";

type EvInputBoxProps = {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  compact?: boolean;
  onChange: (next: number) => void;
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function EvInputBox({
  id,
  label,
  value,
  maxValue,
  compact = false,
  onChange,
}: EvInputBoxProps) {
  const shell = compact
    ? "flex min-h-[3.25rem] w-[7.5rem] shrink-0 flex-col justify-center gap-1 self-stretch rounded-lg border border-black/[.12] bg-white px-2 py-1.5 dark:border-white/[.16] dark:bg-neutral-900/90"
    : "flex min-h-[4.5rem] w-[8.75rem] shrink-0 flex-col justify-center gap-1.5 self-stretch rounded-xl border border-black/[.12] bg-white px-2.5 py-2.5 dark:border-white/[.16] dark:bg-neutral-900/90 sm:w-36";
  const fieldClass =
    `h-full w-full rounded-md border border-black/[.12] bg-neutral-50 px-2 ${
      compact ? "py-1 text-sm" : "py-1.5 text-base"
    } text-center font-semibold tabular-nums text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-white/[.14] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500`;
  const quickBtnClass =
    "h-full rounded-md border border-black/[.12] bg-neutral-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600 transition hover:bg-neutral-100 dark:border-white/[.14] dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800";

  return (
    <div className={shell}>
      <label
        htmlFor={id}
        className={`text-center ${compact ? "text-[10px]" : "text-xs"} font-medium leading-tight text-neutral-500 dark:text-neutral-400`}
      >
        노력치
      </label>
      <div className="flex items-stretch gap-1.5">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={maxValue}
          step={1}
          aria-label={`${label} 노력치 (0~${maxValue})`}
          className={fieldClass}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(clampInt(Number.isNaN(n) ? 0 : n, 0, maxValue));
          }}
        />
        <div className="grid grid-rows-2 gap-1">
          <button
            type="button"
            className={quickBtnClass}
            onClick={() => onChange(maxValue)}
          >
            max
          </button>
          <button
            type="button"
            className={quickBtnClass}
            onClick={() => onChange(0)}
          >
            min
          </button>
        </div>
      </div>
    </div>
  );
}
