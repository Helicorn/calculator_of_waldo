import { notFound } from "next/navigation";

import { OverwatchFreeBoardDetailPage } from "@/app/containers/games/overwatch/board";

type PageProps = {
  params: { boardId: string };
};

export default function OverwatchFreeBoardDetailRoute({ params }: PageProps) {
  const parsed = Number.parseInt(params.boardId, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    notFound();
  }
  return <OverwatchFreeBoardDetailPage boardId={parsed} />;
}
