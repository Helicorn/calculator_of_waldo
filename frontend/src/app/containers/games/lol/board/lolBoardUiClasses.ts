/**
 * LoL 자유게시판 화면 공통 Tailwind 클래스.
 * 목록·상세(댓글)·글쓰기 등에서 재사용합니다.
 */

// --- 목록 (LolFreeBoardPage) ---

/** 표 헤더·행 링크 공통 그리드 */
export const lolBoardListRowGridClass =
  "grid grid-cols-[2.5rem_minmax(0,1fr)_6.5rem_3.25rem_3.25rem] items-center gap-2 px-4 sm:grid-cols-[3rem_minmax(0,1fr)_8.5rem_4rem_4rem] sm:gap-3";

export const lolBoardListTableShellClass =
  "overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700";

export const lolBoardListHeaderRowClass =
  "border-b border-neutral-200 bg-neutral-100 py-2.5 text-center text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400";

export const lolBoardListDividerUlClass =
  "divide-y divide-neutral-200 dark:divide-neutral-700";

export const lolBoardListLiRowClass = "bg-white dark:bg-neutral-900/40";

/** authority 0 관리자 목록: 번호 왼쪽 선택 열 */
export const lolBoardListAdminSelectColumnClass =
  "flex w-9 shrink-0 items-center justify-center self-stretch border-r border-neutral-200 dark:border-neutral-700";

export const lolBoardListAdminSelectHeaderClass =
  "flex w-9 shrink-0 items-center justify-center self-stretch border-r border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/80";

export const lolBoardListRowWithSelectClass = "flex items-stretch";

export const lolBoardListRowLinkFlexClass = "min-w-0 flex-1";

export const lolBoardListCheckboxInputClass =
  "h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:ring-neutral-600";

export const lolBoardListRowLinkClass =
  "py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50";

export const lolBoardListBoardIdCellClass =
  "text-center text-xs tabular-nums text-neutral-500 dark:text-neutral-400";

export const lolBoardListTitleRowClass = "flex min-w-0 items-center gap-1.5";

export const lolBoardListHeadBadgeClass =
  "shrink-0 rounded border border-neutral-400 px-1 py-px text-[10px] font-medium text-neutral-600 dark:border-neutral-500 dark:text-neutral-300";

export const lolBoardListNoticeBadgeClass =
  "shrink-0 rounded border border-amber-700 px-1 py-px text-[10px] font-semibold text-amber-800 dark:border-amber-500 dark:text-amber-300";

export const lolBoardListTitleTextClass =
  "truncate text-xs font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100";

export const lolBoardListMetaCellRightClass =
  "text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-400";

export const lolBoardListMetaCellCenterClass =
  "text-center text-xs tabular-nums text-neutral-500 dark:text-neutral-400";

export const lolBoardListFooterBarClass =
  "flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-800/40";

export const lolBoardListFooterPaginationWrapClass =
  "flex min-w-0 flex-1 justify-center";

export const lolBoardListPaginationNavClass =
  "flex flex-wrap items-center justify-center gap-1";

export const lolBoardListPaginationItemClass =
  "inline-flex min-h-8 min-w-8 items-center justify-center rounded border px-2 text-xs tabular-nums transition-colors";

export const lolBoardListPaginationActiveClass =
  "border-neutral-800 bg-neutral-800 font-semibold text-white dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900";

export const lolBoardListPaginationIdleClass =
  "border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800/50";

export const lolBoardListPaginationDisabledClass =
  "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-700 dark:text-neutral-600";

export const lolBoardListPaginationPageGroupClass = "flex items-center gap-1";

export const lolBoardListPaginationEllipsisClass =
  "px-1 text-xs text-neutral-400 dark:text-neutral-500";

export const lolBoardListWriteButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded border border-neutral-800 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-900 dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white";

export const lolBoardListDeleteButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded border border-red-700 bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500";

export const lolBoardListFooterActionsClass = "flex shrink-0 items-center gap-2";

export const lolBoardListModalCancelButtonClass =
  "inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800/50";

export const lolBoardListModalConfirmButtonClass =
  "inline-flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-900 dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white";

export const lolBoardListModalDangerButtonClass =
  "inline-flex items-center justify-center rounded-md border border-red-700 bg-red-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500";

export const lolBoardListSummaryTextClass =
  "text-sm text-neutral-600 dark:text-neutral-400";

export const lolBoardListSummaryFixtureHighlightClass =
  "ml-2 text-amber-700 dark:text-amber-400";

export const lolBoardListLoadingTextClass =
  "text-sm text-neutral-500 dark:text-neutral-400";

export const lolBoardListErrorTextClass =
  "text-sm text-red-600 dark:text-red-400";

// --- 상세: 댓글 작성 (LolFreeBoardDetailPage) ---

/** 댓글 입력칸·등록 버튼 공통 높이 */
export const lolBoardCommentComposerHeightClass =
  "h-[5.5rem] min-h-[5.5rem] max-h-[5.5rem]";

export const lolBoardCommentComposerTextareaClass =
  `${lolBoardCommentComposerHeightClass} flex-1 resize-none overflow-y-auto rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm leading-snug text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500`;

export const lolBoardCommentSubmitButtonClass =
  `${lolBoardCommentComposerHeightClass} inline-flex shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-800 px-4 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white`;

// --- 글쓰기 (LolFreeBoardWritePage) ---

export const lolBoardWriteHeadSelectClass =
  "w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500";

export const lolBoardWriteTitleInputClass =
  "w-full bg-transparent text-base font-semibold leading-snug text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500";

export const lolBoardWriteBodyTextareaClass =
  "min-h-[12rem] w-full flex-1 resize-y whitespace-pre-wrap bg-transparent px-0 py-0 text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200 dark:placeholder:text-neutral-500";

export const lolBoardWriteNoticeCheckboxClass =
  "h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:ring-neutral-600";

export const lolBoardWriteCancelLinkClass =
  "inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800/50";

export const lolBoardWriteSubmitButtonClass =
  "inline-flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white";
