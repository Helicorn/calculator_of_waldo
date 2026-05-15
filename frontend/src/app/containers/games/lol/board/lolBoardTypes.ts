export type BoardSummary = {
  boardId: number;
  userNo: number;
  title: string;
  viewCnt: number;
  commentCnt: number;
  createdAt: string;
  updatedAt: string | null;
};

export type BoardDetail = BoardSummary & {
  content: string;
  authorAccount: string;
};

export type BoardComment = {
  commentId: number;
  boardId: number;
  userNo: number;
  authorAccount: string;
  parentCommentId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
};

export type BoardPageResponse = {
  content: BoardSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export const BOARD_LIST_PAGE_SIZE = 10;

export type BoardNavigation = {
  previousBoardId: number | null;
  nextBoardId: number | null;
};
