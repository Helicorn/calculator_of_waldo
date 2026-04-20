import { notFound } from "next/navigation";

import { LolChampionDetailView } from "@/app/containers/games/lol/champions/LolChampionDetailPage";
import { resolveChampionDetailTab } from "@/app/containers/games/lol/champions/lolChampionDetailTabs";

function firstQuery(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

type PageProps = {
  params: { slug: string; championId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function LolChampionDetailRoute({
  params,
  searchParams,
}: PageProps) {
  if (params.slug !== "lol") notFound();
  const championId = decodeURIComponent(params.championId);
  const activeTab = resolveChampionDetailTab(firstQuery(searchParams.tab));
  return (
    <LolChampionDetailView
      championId={championId}
      activeTab={activeTab}
    />
  );
}
