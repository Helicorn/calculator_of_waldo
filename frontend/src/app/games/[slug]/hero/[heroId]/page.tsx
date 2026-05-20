import { notFound } from "next/navigation";

import { OverwatchHeroDetailPage } from "@/app/containers/games/overwatch/catalogs/OverwatchHeroDetailPage";

type PageProps = {
  params: { slug: string; heroId: string };
};

export default async function OverwatchHeroDetailRoute({ params }: PageProps) {
  if (params.slug !== "overwatch") {
    notFound();
  }
  return <OverwatchHeroDetailPage heroId={params.heroId} />;
}
