import Link from "next/link";
import { notFound } from "next/navigation";

import { GAME_TITLE_BY_SLUG } from "@/app/containers/games/gameCategories";
import { GamePageLayout } from "@/app/containers/games/GamePageLayout";

import { OverwatchHeroDetailView } from "./OverwatchHeroDetailView";
import { fetchOverwatchHeroDetail } from "./overwatchHeroActions";

type OverwatchHeroDetailPageProps = {
  heroId: string;
};

export async function OverwatchHeroDetailPage({ heroId }: OverwatchHeroDetailPageProps) {
  const normalizedId = decodeURIComponent(heroId).trim();
  if (!normalizedId) {
    notFound();
  }

  let hero;
  try {
    hero = await fetchOverwatchHeroDetail(normalizedId);
  } catch {
    notFound();
  }

  return (
    <GamePageLayout
      title={GAME_TITLE_BY_SLUG.overwatch}
      gameSlug="overwatch"
      activeDetailId="heroes"
      activeDetailSuffix={hero.name}
    >
      <div className="flex flex-col gap-4">
        <Link
          href="/games/overwatch?detail=heroes"
          className="w-fit text-sm font-medium text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
        >
          ← 영웅 목록
        </Link>
        <OverwatchHeroDetailView hero={hero} />
      </div>
    </GamePageLayout>
  );
}
