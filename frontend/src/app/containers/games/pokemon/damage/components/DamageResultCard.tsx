"use client";

type WeatherKind = "none" | "sunny" | "rain" | "sandstorm" | "snow";

type DamageSummary = {
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  stab: number;
  effectiveness: number;
  critical: number;
  weather: number;
  ruleNote?: string;
} | null;

export function DamageResultCard({
  cardClassName,
  fontClassName,
  forceStab,
  onChangeForceStab,
  isCritical,
  onChangeIsCritical,
  weather,
  onChangeWeather,
  attackerDamageSummary,
}: {
  cardClassName: string;
  fontClassName: string;
  forceStab: boolean;
  onChangeForceStab: (checked: boolean) => void;
  isCritical: boolean;
  onChangeIsCritical: (checked: boolean) => void;
  weather: WeatherKind;
  onChangeWeather: (next: WeatherKind) => void;
  attackerDamageSummary: DamageSummary;
}) {
  const weatherLabel = (value: WeatherKind): string => {
    switch (value) {
      case "sunny":
        return "쾌청";
      case "rain":
        return "비";
      case "sandstorm":
        return "모래바람";
      case "snow":
        return "눈";
      default:
        return "없음";
    }
  };

  return (
    <div className={cardClassName} aria-label="결과·요약 영역">
      <h3 className={`${fontClassName} text-base font-semibold text-neutral-900 dark:text-neutral-100`}>
        피해량 결과
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-black/[.08] bg-neutral-50/80 px-3 py-2 text-xs dark:border-white/[.14] dark:bg-neutral-900/60">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={forceStab}
            onChange={(e) => onChangeForceStab(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-black/[.2] dark:border-white/[.3]"
          />
          자속(강제)
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={isCritical}
            onChange={(e) => onChangeIsCritical(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-black/[.2] dark:border-white/[.3]"
          />
          급소
        </label>
        {(["sunny", "rain", "sandstorm", "snow"] as WeatherKind[]).map((w) => (
          <label
            key={w}
            className="inline-flex cursor-pointer items-center gap-1.5 text-neutral-700 dark:text-neutral-300"
          >
            <input
              type="checkbox"
              checked={weather === w}
              onChange={(e) => onChangeWeather(e.target.checked ? w : "none")}
              className="h-3.5 w-3.5 rounded border-black/[.2] dark:border-white/[.3]"
            />
            {weatherLabel(w)}
          </label>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3">
        <div className="rounded-md border border-black/[.08] bg-neutral-50/80 p-3 dark:border-white/[.14] dark:bg-neutral-900/60">
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            때리는 포켓몬 → 맞는 포켓몬
          </p>
          {attackerDamageSummary ? (
            <>
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                {attackerDamageSummary.minDamage} ~ {attackerDamageSummary.maxDamage} (
                {attackerDamageSummary.minPercent.toFixed(1)}% ~{" "}
                {attackerDamageSummary.maxPercent.toFixed(1)}%)
              </p>
              {attackerDamageSummary.ruleNote ? (
                <p className="mt-1 text-[11px] text-violet-700 dark:text-violet-300">
                  특수 룰: {attackerDamageSummary.ruleNote}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                자속 x{attackerDamageSummary.stab.toFixed(1)} · 급소 x
                {attackerDamageSummary.critical.toFixed(1)} · 날씨 x
                {attackerDamageSummary.weather.toFixed(1)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              양쪽 포켓몬과 기술(위력/공격형태 포함)을 선택하면 계산됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
