/** {@code t_user.authority} 가 {@code "0"} 인 관리자 계정 */
export function isAuthorityZero(authority: string | undefined | null): boolean {
  return authority != null && authority.trim() === "0";
}

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
