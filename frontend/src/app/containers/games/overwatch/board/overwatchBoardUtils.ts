export {
  formatBoardDateTime,
  isAuthorityZero,
} from "@/app/containers/games/lol/board/lolBoardUtils";

export function overwatchFreeBoardListHref(): string {
  return "/games/overwatch?detail=free-board";
}

export function overwatchBoardDetailHref(boardId: number): string {
  return `/games/overwatch/board/${boardId}`;
}

export function overwatchBoardWriteHref(): string {
  return "/games/overwatch/board/write";
}
