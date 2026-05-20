import { notFound } from "next/navigation";

import {
  GAME_SLUGS,
  GAME_TITLE_BY_SLUG,
  isGameSlug,
  resolveGameDetailId,
} from "@/app/containers/games/gameCategories";
import { GamePageLayout } from "@/app/containers/games/GamePageLayout";
import { LolChampionsTab } from "@/app/containers/games/lol/champions/LolChampionsTab";
import { LolFreeBoardPage } from "@/app/containers/games/lol/board";
import { LolCommunityPage } from "@/app/containers/games/lol/community";
import { MatchHistorySearchPage } from "@/app/containers/games/lol/history";
import {
  PokemonAbilityListPage,
  PokemonDamageCalcPage,
  PokemonPokedexPage,
} from "@/app/containers/games/pokemon";
import { OverwatchFreeBoardPage } from "@/app/containers/games/overwatch/board";
import { OverwatchHeroesTab } from "@/app/containers/games/overwatch/catalogs";
import { OverwatchCareerSearchPage } from "@/app/containers/games/overwatch/history";

export function generateStaticParams() {
  return GAME_SLUGS.map((slug) => ({ slug }));
}

function firstQuery(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

type PageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function GameCategoryPage({
  params,
  searchParams,
}: PageProps) {
  if (!isGameSlug(params.slug)) notFound();
  const activeDetailId = resolveGameDetailId(
    params.slug,
    firstQuery(searchParams.detail),
  );

  const detailContent =
    params.slug === "lol" && activeDetailId === "champions" ? (
      <LolChampionsTab />
    ) : params.slug === "lol" && activeDetailId === "free-board" ? (
      <LolFreeBoardPage />
    ) : params.slug === "lol" && activeDetailId === "community" ? (
      <LolCommunityPage />
    ) : params.slug === "lol" && activeDetailId === "history" ? (
      <MatchHistorySearchPage />
    ) : params.slug === "overwatch" && activeDetailId === "history" ? (
      <OverwatchCareerSearchPage />
    ) : params.slug === "overwatch" && activeDetailId === "heroes" ? (
      <OverwatchHeroesTab />
    ) : params.slug === "overwatch" && activeDetailId === "free-board" ? (
      <OverwatchFreeBoardPage />
    ) : params.slug === "pokemon" && activeDetailId === "pokedex" ? (
      <PokemonPokedexPage />
    ) : params.slug === "pokemon" && activeDetailId === "ability" ? (
      <PokemonAbilityListPage showSyncAndEdit={false} />
    ) : params.slug === "pokemon" && activeDetailId === "damage" ? (
      <PokemonDamageCalcPage />
    ) : null;

  return (
    <GamePageLayout
      title={GAME_TITLE_BY_SLUG[params.slug]}
      gameSlug={params.slug}
      activeDetailId={activeDetailId}
    >
      {detailContent}
    </GamePageLayout>
  );
}
