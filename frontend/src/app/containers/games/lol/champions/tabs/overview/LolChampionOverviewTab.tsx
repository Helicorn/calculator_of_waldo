import Image from "next/image";

import type { ChampionSpell, ChampionType } from "@/app/types/games/lol";
import {
  ddragonChampionImageUrl,
  ddragonPassiveImageUrl,
  ddragonSpellImageUrl,
} from "@/lib/lolDdragon";
import { resolveSpellTooltip } from "@/lib/lolSpellTooltip";

const SPELL_SLOT_LABELS = ["Q", "W", "E", "R"] as const;

/** Data Dragon 설명 문자열(HTML) */
function SkillDescriptionHtml({ html }: { html: string }) {
  return (
    <div
      className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 [&_br]:block [&_li]:list-inside [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** description 아래 상세 툴팁(HTML) — JSON에 있는 수치는 숫자로, 없으면 `?` */
function SkillTooltipHtml({
  html,
  spell,
  resourcePartype,
}: {
  html: string;
  spell: ChampionSpell;
  resourcePartype: string;
}) {
  const safe = resolveSpellTooltip(html, spell, resourcePartype);
  return (
    <div
      className="mt-2 border-l-2 border-neutral-200 pl-3 text-sm leading-relaxed text-neutral-600 dark:border-neutral-600 dark:text-neutral-400 [&_br]:block [&_li]:list-inside [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

type LolChampionOverviewTabProps = {
  champion: ChampionType;
  version: string;
};

export function LolChampionOverviewTab({
  champion,
  version,
}: LolChampionOverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <Image
          src={ddragonChampionImageUrl(version, champion.id)}
          alt={champion.name}
          width={120}
          height={120}
          className="shrink-0 rounded-lg border border-black/[.08] bg-black/[.03] dark:border-white/[.12] dark:bg-white/[.04]"
        />
        <div className="min-w-0 flex flex-col gap-2">
          <p className="text-sm italic text-neutral-500 dark:text-neutral-400">
            {champion.title}
          </p>
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {champion.blurb}
          </p>
          {champion.tags?.length ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              태그: {champion.tags.join(" · ")}
            </p>
          ) : null}
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            id: <span className="font-mono">{champion.id}</span> · 버전{" "}
            <span className="font-mono">{version}</span>
          </p>
        </div>
      </div>

      <section className="border-t border-black/[.08] pt-6 dark:border-white/[.12]">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          스킬
        </h2>
        <ul className="flex flex-col gap-5">
          <li className="flex gap-3 sm:gap-4">
            <Image
              src={ddragonPassiveImageUrl(
                version,
                champion.passive.image.full,
              )}
              alt={champion.passive.name}
              width={48}
              height={48}
              className="mt-0.5 h-12 w-12 shrink-0 rounded border border-black/[.08] bg-black/[.03] dark:border-white/[.12] dark:bg-white/[.04]"
            />
            <div className="min-w-0 flex flex-col gap-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                패시브 — {champion.passive.name}
              </p>
              <SkillDescriptionHtml html={champion.passive.description} />
            </div>
          </li>
          {champion.spells.map((spell, index) => (
            <li
              key={spell.id}
              className="flex gap-3 sm:gap-4"
            >
              <Image
                src={ddragonSpellImageUrl(version, spell.image.full)}
                alt={spell.name}
                width={48}
                height={48}
                className="mt-0.5 h-12 w-12 shrink-0 rounded border border-black/[.08] bg-black/[.03] dark:border-white/[.12] dark:bg-white/[.04]"
              />
              <div className="min-w-0 flex flex-col gap-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {SPELL_SLOT_LABELS[index]} — {spell.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  재사용 대기시간 {spell.cooldownBurn}
                  {spell.costBurn ? ` · 비용 ${spell.costBurn}` : null}
                </p>
                <SkillDescriptionHtml html={spell.description} />
                {spell.tooltip?.trim() ? (
                  <SkillTooltipHtml
                    html={spell.tooltip}
                    spell={spell}
                    resourcePartype={champion.partype}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
