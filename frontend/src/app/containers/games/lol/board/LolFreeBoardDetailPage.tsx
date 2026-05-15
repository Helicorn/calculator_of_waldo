"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { GAME_TITLE_BY_SLUG } from "@/app/containers/games/gameCategories";
import { GamePageLayout } from "@/app/containers/games/GamePageLayout";
import {
  resolveFixtureBoardDetail,
  resolveFixtureBoardNavigation,
} from "@/app/containers/games/lol/board/lolBoardFixture";
import { BoardArticleFrame } from "@/app/containers/games/lol/board/BoardArticleFrame";
import type {
  BoardComment,
  BoardDetail,
  BoardNavigation,
} from "@/app/containers/games/lol/board/lolBoardTypes";
import {
  formatBoardDateTime,
  lolBoardDetailHref,
  lolFreeBoardListHref,
} from "@/app/containers/games/lol/board/lolBoardUtils";
import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";

type LolFreeBoardDetailPageProps = {
  boardId: number;
};

type BoardNavButtonProps = {
  label: string;
  href: string | null;
};

function BoardNavButton({ label, href }: BoardNavButtonProps) {
  const className =
    "inline-flex min-w-[5rem] items-center justify-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium transition-colors dark:border-neutral-600";

  if (!href) {
    return (
      <span
        className={`${className} cursor-not-allowed text-neutral-400 dark:text-neutral-500`}
        aria-disabled
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${className} text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800/50`}
    >
      {label}
    </Link>
  );
}

/** LoL 자유게시판 글 상세 (`/games/lol/board/[boardId]`) */
export function LolFreeBoardDetailPage({ boardId }: LolFreeBoardDetailPageProps) {
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [usingFixture, setUsingFixture] = useState(false);
  const [navigation, setNavigation] = useState<BoardNavigation>({
    previousBoardId: null,
    nextBoardId: null,
  });

  const applyFixture = useCallback(() => {
    const fixture = resolveFixtureBoardDetail(boardId);
    if (!fixture) {
      setBoard(null);
      setComments([]);
      setNavigation({ previousBoardId: null, nextBoardId: null });
      setNotFound(true);
      setUsingFixture(false);
      return;
    }
    setBoard(fixture.board);
    setComments(fixture.comments);
    setNavigation(resolveFixtureBoardNavigation(boardId));
    setNotFound(false);
    setUsingFixture(true);
  }, [boardId]);

  const loadDetail = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      setNotFound(false);
      try {
        const boardUrl = `${BACKEND_BASE_URL}/api/waldo/games/lol/board/${boardId}`;
        const commentsUrl = `${boardUrl}/comments`;
        const navigationUrl = `${boardUrl}/navigation`;

        const [boardRes, commentsRes, navigationRes] = await Promise.all([
          fetch(boardUrl, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            signal,
            cache: "no-store",
          }),
          fetch(commentsUrl, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            signal,
            cache: "no-store",
          }),
          fetch(navigationUrl, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            signal,
            cache: "no-store",
          }),
        ]);

        if (boardRes.status === 404) {
          if (signal.aborted) return;
          applyFixture();
          setIsLoading(false);
          return;
        }
        if (!boardRes.ok) {
          throw new Error(`board HTTP ${boardRes.status}`);
        }

        const boardBody = (await boardRes.json()) as BoardDetail;
        let commentRows: BoardComment[] = [];
        if (commentsRes.ok) {
          commentRows = (await commentsRes.json()) as BoardComment[];
        }

        if (signal.aborted) return;
        let nav: BoardNavigation = resolveFixtureBoardNavigation(boardId);
        if (navigationRes.ok) {
          const body = (await navigationRes.json()) as BoardNavigation;
          nav = {
            previousBoardId: body.previousBoardId ?? null,
            nextBoardId: body.nextBoardId ?? null,
          };
        }
        setBoard(boardBody);
        setComments(commentRows);
        setNavigation(nav);
        setUsingFixture(false);
        setIsLoading(false);
      } catch {
        if (signal.aborted) return;
        applyFixture();
        setIsLoading(false);
      }
    },
    [boardId, applyFixture],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDetail(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadDetail]);

  return (
    <GamePageLayout
      title={GAME_TITLE_BY_SLUG.lol}
      gameSlug="lol"
      activeDetailId="free-board"
    >
      <div className="flex w-full max-w-3xl flex-col gap-6 text-left">
        <Link
          href={lolFreeBoardListHref()}
          className="w-fit text-sm font-medium text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
        >
          ← 목록으로
        </Link>

        {isLoading ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            게시글을 불러오는 중…
          </p>
        ) : null}

        {!isLoading && notFound ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            게시글을 찾을 수 없습니다.
          </p>
        ) : null}

        {!isLoading && board ? (
          <>
            {usingFixture ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                DB 비어 있음 · 테스트 JSON 표시
              </p>
            ) : null}

            <BoardArticleFrame
              topMeta={formatBoardDateTime(board.createdAt)}
              header={
                <h2 className="text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                  {board.title}
                </h2>
              }
              metaRow={
                <>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {board.authorAccount ?? `회원${board.userNo}`}
                  </span>
                  <span className="shrink-0 tabular-nums">조회 {board.viewCnt}</span>
                </>
              }
              body={
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {board.content}
                </div>
              }
            />

            <div className="flex items-center justify-between gap-3">
              <BoardNavButton
                label="이전글"
                href={
                  navigation.previousBoardId != null
                    ? lolBoardDetailHref(navigation.previousBoardId)
                    : null
                }
              />
              <BoardNavButton
                label="다음글"
                href={
                  navigation.nextBoardId != null
                    ? lolBoardDetailHref(navigation.nextBoardId)
                    : null
                }
              />
            </div>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                댓글 {comments.length}개
              </h3>
              {comments.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  댓글이 없습니다.
                </p>
              ) : (
                <div className="border-x-0 border-y-2 border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900/40">
                  {comments.map((comment, index) => (
                    <div
                      key={comment.commentId}
                      className={`px-4 py-3 ${
                        index > 0
                          ? "border-t border-neutral-200 dark:border-neutral-700"
                          : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                          {comment.authorAccount ?? `회원${comment.userNo}`}
                        </span>
                        <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
                          {formatBoardDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </GamePageLayout>
  );
}
