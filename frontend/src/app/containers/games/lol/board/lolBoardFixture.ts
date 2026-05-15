import boardDetailFixture from "@/fixtures/lol-board-detail.json";
import boardListFixture from "@/fixtures/lol-board-list.json";

import type { BoardComment, BoardDetail, BoardNavigation } from "./lolBoardTypes";

export function resolveFixtureBoardDetail(boardId: number): {
  board: BoardDetail;
  comments: BoardComment[];
} | null {
  const summary = boardListFixture.content.find((b) => b.boardId === boardId);
  if (!summary) {
    return null;
  }

  const template = boardDetailFixture.board;
  const board: BoardDetail = {
    boardId: summary.boardId,
    userNo: summary.userNo,
    authorAccount: template.authorAccount ?? `회원${summary.userNo}`,
    title: summary.title,
    content: template.content,
    viewCnt: summary.viewCnt,
    commentCnt: summary.commentCnt,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
  };

  const comments: BoardComment[] = boardDetailFixture.comments
    .slice(0, summary.commentCnt)
    .map((c, index) => ({
      ...c,
      commentId: boardId * 10 + index + 1,
      boardId,
      authorAccount: c.authorAccount ?? template.authorAccount ?? `회원${summary.userNo}`,
    }));

  return { board, comments };
}

/** fixture 목록(최신순) 기준 이전글·다음글 */
export function resolveFixtureBoardNavigation(boardId: number): BoardNavigation {
  const sorted = [...boardListFixture.content].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const index = sorted.findIndex((item) => item.boardId === boardId);
  if (index < 0) {
    return { previousBoardId: null, nextBoardId: null };
  }
  return {
    previousBoardId:
      index < sorted.length - 1 ? sorted[index + 1]!.boardId : null,
    nextBoardId: index > 0 ? sorted[index - 1]!.boardId : null,
  };
}
