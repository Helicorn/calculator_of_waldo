/** Data Dragon info 값(0–10)을 별 5개(1점=반쪽 별)로 표시 */

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function starFillAt(value: number, starIndex: number): "full" | "half" | "empty" {
  const r = value - 2 * starIndex;
  if (r >= 2) return "full";
  if (r >= 1) return "half";
  return "empty";
}

function StarGlyph({ fill }: { fill: "full" | "half" | "empty" }) {
  const baseClass =
    "pointer-events-none h-[1.125rem] w-[1.125rem] shrink-0 sm:h-5 sm:w-5";

  if (fill === "empty") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${baseClass} text-neutral-300 dark:text-neutral-600`}
        aria-hidden
      >
        <path fill="currentColor" d={STAR_PATH} opacity={0.35} />
      </svg>
    );
  }

  return (
    <span className={`relative inline-flex ${baseClass}`}>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 text-neutral-300 dark:text-neutral-600"
        aria-hidden
      >
        <path fill="currentColor" d={STAR_PATH} opacity={0.35} />
      </svg>
      <span
        className="absolute left-0 top-0 h-full overflow-hidden text-amber-500 dark:text-amber-400"
        style={{ width: fill === "half" ? "50%" : "100%" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5"
        >
          <path fill="currentColor" d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}

type LolChampionRoleStarsProps = {
  /** 0–10 */
  value: number;
  /** 접근성·툴팁용 (예: 공격) */
  label: string;
};

export function LolChampionRoleStars({ value, label }: LolChampionRoleStarsProps) {
  const v = Math.max(0, Math.min(10, Math.round(Number(value))));
  const tooltip = `${v}/10`;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${label} ${tooltip}`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          title={tooltip}
          className="inline-flex cursor-default"
        >
          <StarGlyph fill={starFillAt(v, i)} />
        </span>
      ))}
    </div>
  );
}
