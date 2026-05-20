import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";

export const OVERWATCH_BOARD_API = `${BACKEND_BASE_URL}/api/waldo/games/overwatch/board`;

export const OVERWATCH_BOARD_HEADS_API = `${OVERWATCH_BOARD_API}/heads`;

export function overwatchBoardDetailApi(boardId: number): string {
  return `${OVERWATCH_BOARD_API}/${boardId}`;
}

export function overwatchBoardCommentsApi(boardId: number): string {
  return `${overwatchBoardDetailApi(boardId)}/comments`;
}

export function overwatchBoardNavigationApi(boardId: number): string {
  return `${overwatchBoardDetailApi(boardId)}/navigation`;
}
