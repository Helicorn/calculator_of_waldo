import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import type {
  ChampionDataJsonResponse,
  ChampionSpell,
  ChampionType,
} from "@/app/types/games/lol";
import {
  ddragonChampionImageUrl,
  ddragonPassiveImageUrl,
  ddragonSpellImageUrl,
  fetchLatestDdragonVersion,
  lolDdragonSingleChampionUrl,
} from "@/lib/lolDdragon";
import { resolveSpellTooltip } from "@/lib/lolSpellTooltip";

import { GAME_TITLE_BY_SLUG } from "@/app/containers/games/gameCategories";
import { GamePageLayout } from "../../GamePageLayout";
import {
  CHAMPION_DETAIL_TABS,
  type ChampionDetailTabId,
} from "./lolChampionDetailTabs";
import { LolChampionRoleStars } from "./LolChampionRoleStars";
import { LolChampionSkinsGallery } from "./LolChampionSkinsGallery";
import { LolChampionStatsAtLevel } from "./LolChampionStatsAtLevel";

const INFO_LABELS: Record<
  keyof ChampionType["info"],
  string
> = {
  attack: "공격",
  defense: "방어",
  magic: "마법",
  difficulty: "난이도",
};

const STAT_LABELS: Record<keyof ChampionType["stats"], string> = {
  hp: "체력",
  hpperlevel: "체력 (레벨당)",
  mp: "마나",
  mpperlevel: "마나 (레벨당)",
  movespeed: "이동 속도",
  armor: "방어력",
  armorperlevel: "방어력 (레벨당)",
  spellblock: "마법 저항력",
  spellblockperlevel: "마법 저항 (레벨당)",
  attackrange: "사거리",
  hpregen: "체력 재생",
  hpregenperlevel: "체력 재생 (레벨당)",
  mpregen: "마나 재생",
  mpregenperlevel: "마나 재생 (레벨당)",
  crit: "치명타 확률",
  critperlevel: "치명타 (레벨당)",
  attackdamage: "공격력",
  attackdamageperlevel: "공격력 (레벨당)",
  attackspeed: "공격 속도",
  attackspeedperlevel: "공격 속도 (레벨당)",
};

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

/** 스킨 `name`에 괄호류가 있으면 크로마로 보고 목록에서 제외 */
function isChromaSkinName(name: string): boolean {
  return /[([（【]/.test(name);
}

function championDetailHref(
  championId: string,
  tab: ChampionDetailTabId,
): string {
  const base = `/games/lol/champion/${encodeURIComponent(championId)}`;
  return tab === "overview" ? base : `${base}?tab=${tab}`;
}

function tabNavClass(active: boolean) {
  const base =
    "rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium transition-colors -mb-px";
  if (active) {
    return `${base} border-black/[.12] bg-[var(--background)] text-neutral-900 dark:border-white/[.18] dark:text-neutral-100`;
  }
  return `${base} border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200`;
}

type LolChampionDetailViewProps = {
  championId: string;
  activeTab: ChampionDetailTabId;
};

export async function LolChampionDetailView({
  championId,
  activeTab,
}: LolChampionDetailViewProps) {
  if (!championId.trim()) notFound();

  let version: string;
  try {
    version = await fetchLatestDdragonVersion();
  } catch {
    return (
      <div className="p-4 text-sm text-red-600 dark:text-red-400" role="alert">
        Data Dragon 버전 정보를 불러오지 못했습니다.
      </div>
    );
  }

  const url = lolDdragonSingleChampionUrl(version, championId);
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) notFound();

  const json = (await res.json()) as ChampionDataJsonResponse;
  const champion = Object.values(json.data)[0];
  if (!champion) notFound();

  const skins = champion.skins ?? [];
  const skinsWithoutChromas = skins.filter((s) => !isChromaSkinName(s.name));

  return (
    <GamePageLayout
      title={GAME_TITLE_BY_SLUG.lol}
      gameSlug="lol"
      activeDetailId="champions"
      activeDetailSuffix={champion.name}
    >
      <div className="flex flex-col gap-5">
        <Link
          href="/games/lol"
          className="w-fit text-sm font-medium text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
        >
          ← 챔피언 목록
        </Link>

        <div
          role="tablist"
          aria-label="챔피언 상세"
          className="flex flex-wrap gap-0.5 border-b border-black/[.12] dark:border-white/[.18]"
        >
          {CHAMPION_DETAIL_TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                id={`champion-tab-${tab.id}`}
                href={championDetailHref(champion.id, tab.id)}
                role="tab"
                aria-selected={selected}
                className={tabNavClass(selected)}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`champion-panel-${activeTab}`}
          aria-labelledby={`champion-tab-${activeTab}`}
          className="min-h-[12rem]"
        >
          {activeTab === "overview" ? (
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
          ) : null}

          {activeTab === "skins" ? (
            <LolChampionSkinsGallery
              championId={champion.id}
              championName={champion.name}
              skins={skinsWithoutChromas}
            />
          ) : null}

          {activeTab === "stats" ? (
            <div className="flex flex-col gap-6">
              <section>
                <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  역할 지표
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                  {(Object.keys(champion.info) as (keyof ChampionType["info"])[]).map(
                    (key) => (
                      <div key={key}>
                        <dt className="text-neutral-500 dark:text-neutral-400">
                          {INFO_LABELS[key]}
                        </dt>
                        <dd className="mt-1">
                          <LolChampionRoleStars
                            value={champion.info[key]}
                            label={INFO_LABELS[key]}
                          />
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
              </section>
              <section>
                <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  레벨 1 기준 수치
                </h2>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {(Object.keys(champion.stats) as (keyof ChampionType["stats"])[]).map(
                    (key) => (
                      <div
                        key={key}
                        className="flex justify-between gap-4 border-b border-black/[.06] py-1 dark:border-white/[.08]"
                      >
                        <dt className="text-neutral-600 dark:text-neutral-400">
                          {STAT_LABELS[key]}
                        </dt>
                        <dd className="shrink-0 font-mono text-neutral-900 dark:text-neutral-100">
                          {champion.stats[key]}
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
                <LolChampionStatsAtLevel stats={champion.stats} />
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </GamePageLayout>
  );
}
