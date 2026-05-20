"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { GAME_TITLE_BY_SLUG } from "@/app/containers/games/gameCategories";
import { GamePageLayout } from "@/app/containers/games/GamePageLayout";
import {
  resolveOverwatchFixtureBoardDetail,
  resolveOverwatchFixtureBoardNavigation,
} from "@/app/containers/games/overwatch/board/overwatchBoardFixture";
import { BoardArticleFrame } from "@/app/containers/games/lol/board/BoardArticleFrame";
import type {
  BoardComment,
  BoardDetail,
  BoardNavigation,
} from "@/app/containers/games/lol/board/lolBoardTypes";
import {
  formatBoardDateTime,
  overwatchBoardDetailHref,
  overwatchFreeBoardListHref,
} from "@/app/containers/games/overwatch/board/overwatchBoardUtils";
import {
  overwatchBoardCommentsApi,
  overwatchBoardDetailApi,
  overwatchBoardNavigationApi,
} from "@/app/containers/games/overwatch/board/overwatchBoardApi";
import {
  lolBoardCommentComposerTextareaClass,
  lolBoardCommentSubmitButtonClass,
} from "@/app/containers/games/lol/board/lolBoardUiClasses";
import type { LoginResponse } from "@/app/types/login";
import { apiGetJsonIfOk } from "@/lib/apiFetch";
type OverwatchFreeBoardDetailPageProps = {
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

/** Overwatch 자유게시판 글 상세 (`/games/overwatch/board/[boardId]`) */
export function OverwatchFreeBoardDetailPage({
  boardId,
}: OverwatchFreeBoardDetailPageProps) {
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [usingFixture, setUsingFixture] = useState(false);
  const [navigation, setNavigation] = useState<BoardNavigation>({
    previousBoardId: null,
    nextBoardId: null,
  });
  const [me, setMe] = useState<LoginResponse | null>(null);
  const [meChecked, setMeChecked] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentPending, setCommentPending] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    void apiGetJsonIfOk<LoginResponse>("/api/me").then((user) => {
      setMe(user);
      setMeChecked(true);
    });
  }, []);

  const applyFixture = useCallback(() => {
    const fixture = resolveOverwatchFixtureBoardDetail(boardId);
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
    setNavigation(resolveOverwatchFixtureBoardNavigation(boardId));
    setNotFound(false);
    setUsingFixture(true);
  }, [boardId]);

  const loadDetail = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      setNotFound(false);
      try {
        const boardUrl = overwatchBoardDetailApi(boardId);
        const commentsUrl = overwatchBoardCommentsApi(boardId);
        const navigationUrl = overwatchBoardNavigationApi(boardId);

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
        let nav: BoardNavigation = resolveOverwatchFixtureBoardNavigation(boardId);
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

  async function handleCommentSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCommentError(null);
    const text = commentDraft.trim();
    if (!text) {
      setCommentError("댓글 내용을 입력해 주세요.");
      return;
    }
    if (usingFixture) {
      setCommentError("테스트 데이터에서는 댓글을 등록할 수 없습니다.");
      return;
    }
    const url = overwatchBoardCommentsApi(boardId);
    setCommentPending(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text, parentCommentId: null }),
      });
      if (res.status === 401) {
        setCommentError("로그인이 필요합니다.");
        setCommentPending(false);
        return;
      }
      if (!res.ok) {
        setCommentError(res.status === 400 ? "내용을 확인해 주세요." : `등록 실패 (HTTP ${res.status})`);
        setCommentPending(false);
        return;
      }
      const row = (await res.json()) as BoardComment;
      setComments((prev) => [...prev, row]);
      setBoard((prev) =>
        prev ? { ...prev, commentCnt: prev.commentCnt + 1 } : prev,
      );
      setCommentDraft("");
    } catch {
      setCommentError("네트워크 오류가 발생했습니다.");
    } finally {
      setCommentPending(false);
    }
  }

  const commentFormDisabled = commentPending || !me || usingFixture || isLoading || !board;

  return (
    <GamePageLayout
      title={GAME_TITLE_BY_SLUG.overwatch}
      gameSlug="overwatch"
      activeDetailId="free-board"
    >
      <div className="flex w-full max-w-3xl flex-col gap-6 text-left">
        <Link
          href={overwatchFreeBoardListHref()}
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
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {board.headLabel ? (
                    <span className="shrink-0 rounded border border-neutral-500 px-1.5 py-0.5 text-[11px] font-medium text-neutral-700 dark:border-neutral-400 dark:text-neutral-300">
                      {board.headLabel}
                    </span>
                  ) : null}
                  {board.noticeYn ? (
                    <span className="shrink-0 rounded border border-amber-700 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-500 dark:text-amber-300">
                      공지
                    </span>
                  ) : null}
                  <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                    {board.title}
                  </h2>
                </div>
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
                    ? overwatchBoardDetailHref(navigation.previousBoardId)
                    : null
                }
              />
              <BoardNavButton
                label="다음글"
                href={
                  navigation.nextBoardId != null
                    ? overwatchBoardDetailHref(navigation.nextBoardId)
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

              {!meChecked ? (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">로그인 확인 중…</p>
              ) : null}

              {meChecked && !me ? (
                <p className="text-sm text-amber-800 dark:text-amber-300" role="status">
                  댓글을 남기려면{" "}
                  <Link href="/login" className="font-medium underline underline-offset-2">
                    로그인
                  </Link>
                  이 필요합니다.
                </p>
              ) : null}

              <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
                <div className="flex flex-row items-stretch gap-2">
                  <label htmlFor="ow-board-detail-comment" className="sr-only">
                    댓글 입력
                  </label>
                  <textarea
                    id="ow-board-detail-comment"
                    value={commentDraft}
                    onChange={(ev) => setCommentDraft(ev.target.value)}
                    placeholder="댓글을 입력하세요."
                    disabled={commentFormDisabled}
                    className={lolBoardCommentComposerTextareaClass}
                  />
                  <button type="submit" disabled={commentFormDisabled} className={lolBoardCommentSubmitButtonClass}>
                    {commentPending ? "등록 중…" : "댓글등록"}
                  </button>
                </div>
                {commentError ? (
                  <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {commentError}
                  </p>
                ) : null}
              </form>
            </section>
          </>
        ) : null}
      </div>
    </GamePageLayout>
  );
}
