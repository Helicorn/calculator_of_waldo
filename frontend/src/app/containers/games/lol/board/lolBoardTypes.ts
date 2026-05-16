export type BoardHeadRow = {
  headId: number;
  label: string;
  sortOrder: number;
};

export type BoardSummary = {
  boardId: number;
  userNo: number;
  title: string;
  viewCnt: number;
  commentCnt: number;
  noticeYn: boolean;
  headId: number | null;
  headLabel: string | null;
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
  pinnedNotices: BoardSummary[];
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
