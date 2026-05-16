"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BoardListDeleteModal,
  type BoardListDeleteModalVariant,
} from "@/app/containers/games/lol/board/BoardListDeleteModal";
import { BoardWriteLoginPromptModal } from "@/app/containers/games/lol/board/BoardWriteLoginPromptModal";
import boardListFixture from "@/fixtures/lol-board-list.json";
import {
  formatBoardDateTime,
  isAuthorityZero,
  lolBoardDetailHref,
  lolBoardWriteHref,
} from "@/app/containers/games/lol/board/lolBoardUtils";
import type { BoardPageResponse, BoardSummary } from "@/app/containers/games/lol/board/lolBoardTypes";
import { BOARD_LIST_PAGE_SIZE } from "@/app/containers/games/lol/board/lolBoardTypes";
import {
  lolBoardListAdminSelectColumnClass,
  lolBoardListAdminSelectHeaderClass,
  lolBoardListBoardIdCellClass,
  lolBoardListCheckboxInputClass,
  lolBoardListDeleteButtonClass,
  lolBoardListDividerUlClass,
  lolBoardListErrorTextClass,
  lolBoardListFooterActionsClass,
  lolBoardListFooterBarClass,
  lolBoardListFooterPaginationWrapClass,
  lolBoardListHeadBadgeClass,
  lolBoardListHeaderRowClass,
  lolBoardListLiRowClass,
  lolBoardListLoadingTextClass,
  lolBoardListMetaCellCenterClass,
  lolBoardListMetaCellRightClass,
  lolBoardListNoticeBadgeClass,
  lolBoardListPaginationActiveClass,
  lolBoardListPaginationDisabledClass,
  lolBoardListPaginationEllipsisClass,
  lolBoardListPaginationIdleClass,
  lolBoardListPaginationItemClass,
  lolBoardListPaginationNavClass,
  lolBoardListPaginationPageGroupClass,
  lolBoardListRowGridClass,
  lolBoardListRowLinkClass,
  lolBoardListRowLinkFlexClass,
  lolBoardListRowWithSelectClass,
  lolBoardListSummaryFixtureHighlightClass,
  lolBoardListSummaryTextClass,
  lolBoardListTableShellClass,
  lolBoardListTitleRowClass,
  lolBoardListTitleTextClass,
  lolBoardListWriteButtonClass,
} from "@/app/containers/games/lol/board/lolBoardUiClasses";
import type { LoginResponse } from "@/app/types/login";
import { apiGetJsonIfOk } from "@/lib/apiFetch";
import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";
import { LoginModal } from "@/components/LoginModal";

const WALDO_LOL_BOARD_URL = `${BACKEND_BASE_URL}/api/waldo/games/lol/board`;

function normalizeBoardSummary(row: Partial<BoardSummary>): BoardSummary {
  return {
    boardId: Number(row.boardId),
    userNo: Number(row.userNo ?? 0),
    title: String(row.title ?? ""),
    viewCnt: Number(row.viewCnt ?? 0),
    commentCnt: Number(row.commentCnt ?? 0),
    noticeYn: Boolean(row.noticeYn),
    headId: row.headId ?? null,
    headLabel: row.headLabel ?? null,
    createdAt: String(row.createdAt ?? ""),
    updatedAt: row.updatedAt ?? null,
  };
}

/** API 또는 레거시 fixture(`pinnedNotices` 없음) 응답을 목록 표시용 형태로 맞춤 */
function normalizePageResponse(body: Partial<BoardPageResponse>): BoardPageResponse {
  const hasPinnedField =
    Object.prototype.hasOwnProperty.call(body, "pinnedNotices") &&
    body.pinnedNotices !== undefined;

  let pinned: BoardSummary[] = hasPinnedField
    ? (body.pinnedNotices ?? []).map(normalizeBoardSummary)
    : [];

  let content: BoardSummary[] = (body.content ?? []).map(normalizeBoardSummary);

  if (!hasPinnedField) {
    pinned = content.filter((r) => r.noticeYn);
    content = content.filter((r) => !r.noticeYn);
  }

  const size = body.size ?? BOARD_LIST_PAGE_SIZE;

  const totalElements =
    body.totalElements !== undefined
      ? Number(body.totalElements)
      : pinned.length + content.length;

  const pinnedLen = pinned.length;
  const regularTotal =
    body.totalElements !== undefined
      ? Math.max(0, totalElements - pinnedLen)
      : content.length;

  const totalPages = Math.max(
    1,
    body.totalPages !== undefined
      ? Number(body.totalPages)
      : Math.ceil(regularTotal / size) || 1,
  );

  const number = Math.min(Math.max(0, body.number ?? 0), Math.max(0, totalPages - 1));

  return {
    pinnedNotices: pinned,
    content,
    totalElements,
    totalPages,
    number,
    size,
  };
}

/** 목록 표시: 모든 공지 + 해당 페이지 일반글 */
function mergePinnedAndPage(body: BoardPageResponse): BoardSummary[] {
  return [...body.pinnedNotices, ...body.content];
}

function buildPageIndexes(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }
  const pages = new Set<number>([0, totalPages - 1, currentPage]);
  if (currentPage > 0) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);
  return Array.from(pages).sort((a, b) => a - b);
}

type BoardListPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function BoardListPagination({
  page,
  totalPages,
  onPageChange,
}: BoardListPaginationProps) {
  const pageIndexes = buildPageIndexes(page, totalPages);

  return (
    <nav
      className={lolBoardListPaginationNavClass}
      aria-label="\uAC8C\uC2DC\uD310 \uBAA9\uB85D \uD398\uC774\uC9C0"
    >
      <button
        type="button"
        className={`${lolBoardListPaginationItemClass} ${page <= 0 ? lolBoardListPaginationDisabledClass : lolBoardListPaginationIdleClass}`}
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        aria-label="\uC774\uC804 \uD398\uC774\uC9C0"
      >
        {"\u2039"}
      </button>

      {pageIndexes.map((pageIndex, index) => {
        const prev = pageIndexes[index - 1];
        const showEllipsis = prev !== undefined && pageIndex - prev > 1;
        return (
          <span key={pageIndex} className={lolBoardListPaginationPageGroupClass}>
            {showEllipsis ? (
              <span className={lolBoardListPaginationEllipsisClass}>
                {"\u2026"}
              </span>
            ) : null}
            <button
              type="button"
              className={`${lolBoardListPaginationItemClass} ${pageIndex === page ? lolBoardListPaginationActiveClass : lolBoardListPaginationIdleClass}`}
              aria-current={pageIndex === page ? "page" : undefined}
              onClick={() => onPageChange(pageIndex)}
            >
              {pageIndex + 1}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        className={`${lolBoardListPaginationItemClass} ${page >= totalPages - 1 ? lolBoardListPaginationDisabledClass : lolBoardListPaginationIdleClass}`}
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="\uB2E4\uC74C \uD398\uC774\uC9C0"
      >
        {"\u203A"}
      </button>
    </nav>
  );
}

/** LoL 자유게시판 — GamePageLayout `?detail=free-board` 본문 */
export function LolFreeBoardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BoardSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFixture, setUsingFixture] = useState(false);
  const [sessionUser, setSessionUser] = useState<LoginResponse | null | undefined>(
    undefined,
  );
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<number>>(() => new Set());
  const [deleteModalVariant, setDeleteModalVariant] =
    useState<BoardListDeleteModalVariant | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const showAdminSelect =
    sessionUser != null && isAuthorityZero(sessionUser.authority);

  useEffect(() => {
    void apiGetJsonIfOk<LoginResponse>("/api/me").then(setSessionUser);
  }, []);

  const applyFixture = useCallback((pageIndex: number) => {
    const normalized = normalizePageResponse(boardListFixture as unknown as Partial<BoardPageResponse>);
    const size = normalized.size;
    const pinnedSorted = [...normalized.pinnedNotices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const regularSorted = [...normalized.content].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const totalElements = normalized.totalElements;
    const pinnedLen = pinnedSorted.length;
    const regularTotal = Math.max(0, totalElements - pinnedLen);
    const totalPages = Math.max(1, Math.ceil(regularTotal / size) || 1);
    const pageNum = Math.min(Math.max(0, pageIndex), totalPages - 1);
    const start = pageNum * size;
    const pageRegular = regularSorted.slice(start, start + size);
    setPosts([...pinnedSorted, ...pageRegular]);
    setTotalCount(totalElements);
    setTotalPages(totalPages);
    setPage(pageNum);
    setUsingFixture(true);
    setError(null);
  }, []);

  const loadPosts = useCallback(
    async (pageIndex: number, signal: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `${WALDO_LOL_BOARD_URL}?page=${pageIndex}&size=${BOARD_LIST_PAGE_SIZE}&sort=createdAt,desc`;
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const body = normalizePageResponse(
          (await response.json()) as Partial<BoardPageResponse>,
        );
        if (signal.aborted) {
          return;
        }
        if (body.totalElements === 0) {
          applyFixture(pageIndex);
        } else {
          setPosts(mergePinnedAndPage(body));
          setTotalCount(body.totalElements);
          setTotalPages(body.totalPages);
          setPage(body.number);
          setUsingFixture(false);
        }
        setIsLoading(false);
      } catch {
        if (signal.aborted) {
          return;
        }
        applyFixture(pageIndex);
        setIsLoading(false);
      }
    },
    [applyFixture],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadPosts(page, controller.signal);
    return () => {
      controller.abort();
    };
  }, [page, loadPosts]);

  const handleWriteClick = useCallback(() => {
    if (sessionUser === undefined) {
      void apiGetJsonIfOk<LoginResponse>("/api/me").then((me) => {
        setSessionUser(me);
        if (me === null) {
          setLoginPromptOpen(true);
        } else {
          router.push(lolBoardWriteHref());
        }
      });
      return;
    }
    if (sessionUser === null) {
      setLoginPromptOpen(true);
      return;
    }
    router.push(lolBoardWriteHref());
  }, [router, sessionUser]);

  const handleLoginModalSuccess = useCallback(async () => {
    setLoginModalOpen(false);
    const me = await apiGetJsonIfOk<LoginResponse>("/api/me");
    setSessionUser(me);
    router.push(lolBoardWriteHref());
  }, [router]);

  const toggleBoardSelection = useCallback((boardId: number, checked: boolean) => {
    setSelectedBoardIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(boardId);
      } else {
        next.delete(boardId);
      }
      return next;
    });
  }, []);

  const handleDeleteClick = useCallback(() => {
    if (selectedBoardIds.size === 0) {
      setDeleteModalVariant("no-selection");
    } else {
      setDeleteModalVariant("confirm");
    }
  }, [selectedBoardIds.size]);

  const handleConfirmDelete = useCallback(async () => {
    if (usingFixture) {
      setDeleteModalVariant(null);
      setError("테스트 데이터에서는 삭제할 수 없습니다.");
      return;
    }
    const ids = Array.from(selectedBoardIds);
    if (ids.length === 0) {
      setDeleteModalVariant(null);
      return;
    }
    setDeletePending(true);
    try {
      const results = await Promise.all(
        ids.map((boardId) =>
          fetch(`${WALDO_LOL_BOARD_URL}/${boardId}`, {
            method: "DELETE",
            credentials: "include",
          }),
        ),
      );
      const failed = results.filter((res) => !res.ok);
      if (failed.length > 0) {
        setError(`삭제에 실패한 글이 ${failed.length}건 있습니다.`);
      } else {
        setError(null);
      }
      setSelectedBoardIds(new Set());
      setDeleteModalVariant(null);
      const controller = new AbortController();
      void loadPosts(page, controller.signal);
    } catch {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletePending(false);
    }
  }, [usingFixture, selectedBoardIds, page, loadPosts]);

  const emptyMessage = "\uB4F1\uB85D\uB41C \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.";
  const fixtureNotice =
    "(DB\uC5D0 \uAE00\uC774 \uC5C6\uC5B4 \uC608\uC2DC JSON\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4)";
  const loadingMessage = "\uAC8C\uC2DC\uAE00 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\u2026";

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 text-left">
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoggedIn={handleLoginModalSuccess}
      />
      <BoardWriteLoginPromptModal
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        onConfirmLogin={() => setLoginModalOpen(true)}
      />
      <BoardListDeleteModal
        open={deleteModalVariant != null}
        variant={deleteModalVariant ?? "no-selection"}
        pending={deletePending}
        onClose={() => {
          if (!deletePending) {
            setDeleteModalVariant(null);
          }
        }}
        onConfirmDelete={() => void handleConfirmDelete()}
      />
      <p className={lolBoardListSummaryTextClass}>
        {totalCount > 0
          ? `\uC804\uCCB4 ${totalCount}\uAC74`
          : emptyMessage}
        {usingFixture ? (
          <span className={lolBoardListSummaryFixtureHighlightClass}>
            {fixtureNotice}
          </span>
        ) : null}
      </p>

      {isLoading ? (
        <p className={lolBoardListLoadingTextClass}>
          {loadingMessage}
        </p>
      ) : null}

      {error ? (
        <p className={lolBoardListErrorTextClass} role="alert">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && posts.length > 0 ? (
        <div className={lolBoardListTableShellClass}>
          {showAdminSelect ? (
            <div
              className={`${lolBoardListRowWithSelectClass} border-b border-neutral-200 bg-neutral-100 py-2.5 text-center text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400`}
              aria-hidden
            >
              <span className={lolBoardListAdminSelectHeaderClass} />
              <div className={`${lolBoardListRowGridClass} ${lolBoardListRowLinkFlexClass}`}>
                <span>번호</span>
                <span>제목</span>
                <span>작성일</span>
                <span>조회수</span>
                <span>댓글</span>
              </div>
            </div>
          ) : (
            <div
              className={`${lolBoardListRowGridClass} ${lolBoardListHeaderRowClass}`}
              aria-hidden
            >
              <span>번호</span>
              <span>제목</span>
              <span>작성일</span>
              <span>조회수</span>
              <span>댓글</span>
            </div>
          )}
          <ul className={lolBoardListDividerUlClass}>
            {posts.map((post) => (
              <li
                key={post.boardId}
                className={
                  showAdminSelect
                    ? `${lolBoardListRowWithSelectClass} ${lolBoardListLiRowClass}`
                    : lolBoardListLiRowClass
                }
              >
                {showAdminSelect ? (
                  <span className={lolBoardListAdminSelectColumnClass}>
                    <input
                      type="checkbox"
                      checked={selectedBoardIds.has(post.boardId)}
                      onChange={(ev) =>
                        toggleBoardSelection(post.boardId, ev.target.checked)
                      }
                      onClick={(ev) => ev.stopPropagation()}
                      aria-label={`${post.title} 선택`}
                      className={lolBoardListCheckboxInputClass}
                    />
                  </span>
                ) : null}
                <Link
                  href={lolBoardDetailHref(post.boardId)}
                  className={`${lolBoardListRowGridClass} ${lolBoardListRowLinkClass} ${
                    showAdminSelect ? lolBoardListRowLinkFlexClass : ""
                  }`}
                >
                  <span className={lolBoardListBoardIdCellClass}>
                    {post.boardId}
                  </span>
                  <span className={lolBoardListTitleRowClass}>
                    {post.headLabel ? (
                      <span className={lolBoardListHeadBadgeClass}>
                        {post.headLabel}
                      </span>
                    ) : null}
                    {post.noticeYn ? (
                      <span className={lolBoardListNoticeBadgeClass}>
                        {"\uACF5\uC9C0"}
                      </span>
                    ) : null}
                    <span className={lolBoardListTitleTextClass}>
                      {post.title}
                    </span>
                  </span>
                  <span className={lolBoardListMetaCellRightClass}>
                    {formatBoardDateTime(post.createdAt)}
                  </span>
                  <span className={lolBoardListMetaCellCenterClass}>
                    {post.viewCnt}
                  </span>
                  <span className={lolBoardListMetaCellCenterClass}>
                    {post.commentCnt}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={lolBoardListFooterBarClass}>
            <div className={lolBoardListFooterPaginationWrapClass}>
              <BoardListPagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
            <div className={lolBoardListFooterActionsClass}>
              {showAdminSelect ? (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deletePending}
                  className={lolBoardListDeleteButtonClass}
                >
                  삭제
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleWriteClick}
                className={lolBoardListWriteButtonClass}
              >
                글쓰기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}