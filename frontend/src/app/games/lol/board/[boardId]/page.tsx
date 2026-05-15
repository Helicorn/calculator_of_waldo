import { notFound } from "next/navigation";

import { LolFreeBoardDetailPage } from "@/app/containers/games/lol/board";

type PageProps = {
  params: { boardId: string };
};

export default function LolFreeBoardDetailRoute({ params }: PageProps) {
  const parsed = Number.parseInt(params.boardId, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    notFound();
  }
  return <LolFreeBoardDetailPage boardId={parsed} />;
}
