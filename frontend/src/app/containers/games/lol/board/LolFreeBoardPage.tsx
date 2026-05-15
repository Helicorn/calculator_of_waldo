"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BoardWriteLoginPromptModal } from "@/app/containers/games/lol/board/BoardWriteLoginPromptModal";
import boardListFixture from "@/fixtures/lol-board-list.json";
import {
  formatBoardDateTime,
  lolBoardDetailHref,
  lolBoardWriteHref,
} from "@/app/containers/games/lol/board/lolBoardUtils";
import type { BoardPageResponse, BoardSummary } from "@/app/containers/games/lol/board/lolBoardTypes";
import { BOARD_LIST_PAGE_SIZE } from "@/app/containers/games/lol/board/lolBoardTypes";
import type { LoginResponse } from "@/app/types/login";
import { apiGetJsonIfOk } from "@/lib/apiFetch";
import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";
import { LoginModal } from "@/components/LoginModal";

const WALDO_LOL_BOARD_URL = `${BACKEND_BASE_URL}/api/waldo/games/lol/board`;

const BOARD_LIST_ROW_GRID =
  "grid grid-cols-[2.5rem_minmax(0,1fr)_6.5rem_3.25rem_3.25rem] items-center gap-2 px-4 sm:grid-cols-[3rem_minmax(0,1fr)_8.5rem_4rem_4rem] sm:gap-3";

function normalizePageResponse(body: Partial<BoardPageResponse>): BoardPageResponse {
  const content = body.content ?? [];
  const totalElements = body.totalElements ?? content.length;
  const size = body.size ?? BOARD_LIST_PAGE_SIZE;
  const totalPages = Math.max(
    1,
    body.totalPages ?? (Math.ceil(totalElements / size) || 1),
  );
  const number = Math.min(Math.max(0, body.number ?? 0), totalPages - 1);
  return { content, totalElements, totalPages, number, size };
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
  const itemClass =
    "inline-flex min-h-8 min-w-8 items-center justify-center rounded border px-2 text-xs tabular-nums transition-colors";
  const activeClass =
    "border-neutral-800 bg-neutral-800 font-semibold text-white dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900";
  const idleClass =
    "border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800/50";
  const disabledClass =
    "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-700 dark:text-neutral-600";

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1"
      aria-label="\uAC8C\uC2DC\uD310 \uBAA9\uB85D \uD398\uC774\uC9C0"
    >
      <button
        type="button"
        className={`${itemClass} ${page <= 0 ? disabledClass : idleClass}`}
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
          <span key={pageIndex} className="flex items-center gap-1">
            {showEllipsis ? (
              <span className="px-1 text-xs text-neutral-400 dark:text-neutral-500">
                {"\u2026"}
              </span>
            ) : null}
            <button
              type="button"
              className={`${itemClass} ${pageIndex === page ? activeClass : idleClass}`}
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
        className={`${itemClass} ${page >= totalPages - 1 ? disabledClass : idleClass}`}
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="\uB2E4\uC74C \uD398\uC774\uC9C0"
      >
        {"\u203A"}
      </button>
    </nav>
  );
}

/** LoL \uC790\uC720\uAC8C\uC2DC\uD310 \u2014 GamePageLayout `?detail=free-board` \uBCF8\uBB38 */
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

  useEffect(() => {
    void apiGetJsonIfOk<LoginResponse>("/api/me").then(setSessionUser);
  }, []);

  const applyFixture = useCallback((pageIndex: number) => {
    const fixture = normalizePageResponse(boardListFixture as BoardPageResponse);
    const size = fixture.size;
    const all = fixture.content ?? [];
    const totalElements = fixture.totalElements ?? all.length;
    const totalPages = fixture.totalPages;
    const page = Math.min(Math.max(0, pageIndex), totalPages - 1);
    const start = page * size;
    setPosts(all.slice(start, start + size));
    setTotalCount(totalElements);
    setTotalPages(totalPages);
    setPage(page);
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
          (await response.json()) as BoardPageResponse,
        );
        if (signal.aborted) {
          return;
        }
        if (body.content.length === 0 && body.totalElements === 0) {
          applyFixture(pageIndex);
        } else {
          setPosts(body.content);
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
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {totalCount > 0
          ? `\uC804\uCCB4 ${totalCount}\uAC74`
          : emptyMessage}
        {usingFixture ? (
          <span className="ml-2 text-amber-700 dark:text-amber-400">
            {fixtureNotice}
          </span>
        ) : null}
      </p>

      {isLoading ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {loadingMessage}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && posts.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
          <div
            className={`${BOARD_LIST_ROW_GRID} border-b border-neutral-200 bg-neutral-100 py-2.5 text-center text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400`}
            aria-hidden
          >
            <span>{"\uBC88\uD638"}</span>
            <span>{"\uC81C\uBAA9"}</span>
            <span>{"\uC791\uC131\uC77C"}</span>
            <span>{"\uC870\uD68C\uC218"}</span>
            <span>{"\uB313\uAE00"}</span>
          </div>
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {posts.map((post) => (
              <li key={post.boardId} className="bg-white dark:bg-neutral-900/40">
                <Link
                  href={lolBoardDetailHref(post.boardId)}
                  className={`${BOARD_LIST_ROW_GRID} py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50`}
                >
                  <span className="text-center text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                    {post.boardId}
                  </span>
                  <span className="truncate text-xs font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100">
                    {post.title}
                  </span>
                  <span className="text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                    {formatBoardDateTime(post.createdAt)}
                  </span>
                  <span className="text-center text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                    {post.viewCnt}
                  </span>
                  <span className="text-center text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                    {post.commentCnt}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-800/40">
            <div className="flex min-w-0 flex-1 justify-center">
              <BoardListPagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
            <button
              type="button"
              onClick={handleWriteClick}
              className="inline-flex shrink-0 items-center justify-center rounded border border-neutral-800 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-900 dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white"
            >
              {"\uAE00\uC4F0\uAE30"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}