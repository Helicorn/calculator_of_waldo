export function formatBoardDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function lolFreeBoardListHref(): string {
  return "/games/lol?detail=free-board";
}

export function lolBoardDetailHref(boardId: number): string {
  return `/games/lol/board/${boardId}`;
}

export function lolBoardWriteHref(): string {
  return "/games/lol/board/write";
}
