import Link from "next/link";
import { notFound } from "next/navigation";

import type {
  ChampionDataJsonResponse,
} from "@/app/types/games/lol";
import {
  fetchLatestDdragonVersion,
  lolDdragonSingleChampionUrl,
} from "@/lib/lolDdragon";

import { GAME_TITLE_BY_SLUG } from "@/app/containers/games/gameCategories";
import { GamePageLayout } from "../../GamePageLayout";
import {
  CHAMPION_DETAIL_TABS,
  type ChampionDetailTabId,
} from "./tabs/shared/lolChampionDetailTabs";
import { LolChampionSkinsGallery } from "./tabs/skins/LolChampionSkinsGallery";
import { LolChampionRecordsTab } from "./tabs/records/LolChampionRecordsTab";
import { LolChampionStatsTabContent } from "./tabs/stats/LolChampionStatsAtLevel";
import { LolChampionOverviewTab } from "./tabs/overview/LolChampionOverviewTab";

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
            <LolChampionOverviewTab champion={champion} version={version} />
          ) : null}

          {activeTab === "skins" ? (
            <LolChampionSkinsGallery
              championId={champion.id}
              championName={champion.name}
              skins={skinsWithoutChromas}
            />
          ) : null}

          {activeTab === "stats" ? (
            <LolChampionStatsTabContent champion={champion} />
          ) : null}

          {activeTab === "records" ? (
            <LolChampionRecordsTab championId={champion.key} />
          ) : null}
        </div>
      </div>
    </GamePageLayout>
  );
}
