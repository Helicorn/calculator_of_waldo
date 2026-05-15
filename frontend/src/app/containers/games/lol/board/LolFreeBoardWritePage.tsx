"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BoardArticleFrame } from "@/app/containers/games/lol/board/BoardArticleFrame";
import { GAME_TITLE_BY_SLUG } from "@/app/containers/games/gameCategories";
import { GamePageLayout } from "@/app/containers/games/GamePageLayout";
import type { BoardDetail } from "@/app/containers/games/lol/board/lolBoardTypes";
import {
  lolBoardDetailHref,
  lolFreeBoardListHref,
} from "@/app/containers/games/lol/board/lolBoardUtils";
import type { LoginResponse } from "@/app/types/login";
import { apiGetJsonIfOk } from "@/lib/apiFetch";
import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";

const WALDO_LOL_BOARD_POST_URL = `${BACKEND_BASE_URL}/api/waldo/games/lol/board`;

const titleInputClass =
  "w-full bg-transparent text-base font-semibold leading-snug text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500";

const bodyTextareaClass =
  "min-h-[12rem] w-full flex-1 resize-y whitespace-pre-wrap bg-transparent px-0 py-0 text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200 dark:placeholder:text-neutral-500";

function resolveAuthorLabel(me: LoginResponse | null): string {
  if (!me) {
    return "로그인이 필요합니다";
  }
  const u = me.username?.trim();
  if (u) {
    return u;
  }
  const a = me.account?.trim();
  if (a) {
    return a;
  }
  return `회원${me.no}`;
}

/** LoL 자유게시판 글쓰기 (`/games/lol/board/write`) */
export function LolFreeBoardWritePage() {
  const router = useRouter();
  const [me, setMe] = useState<LoginResponse | null>(null);
  const [meChecked, setMeChecked] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void apiGetJsonIfOk<LoginResponse>("/api/me").then((user) => {
      setMe(user);
      setMeChecked(true);
    });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) {
      setError("제목과 본문을 입력해 주세요.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(WALDO_LOL_BOARD_POST_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: t, content: c }),
      });
      if (response.status === 401) {
        setError("로그인이 필요합니다.");
        setPending(false);
        return;
      }
      if (response.status === 400 || !response.ok) {
        setError(response.status === 400 ? "제목·본문을 확인해 주세요." : `저장 실패 (HTTP ${response.status})`);
        setPending(false);
        return;
      }
      const body = (await response.json()) as BoardDetail;
      const id = Number(body.boardId);
      if (!Number.isFinite(id) || id < 1) {
        setError("응답 형식을 확인할 수 없습니다.");
        setPending(false);
        return;
      }
      router.push(lolBoardDetailHref(id));
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  const authorLabel = resolveAuthorLabel(me);

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

        {!meChecked ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">불러오는 중…</p>
        ) : null}

        {meChecked && !me ? (
          <p className="text-sm text-amber-800 dark:text-amber-300" role="status">
            글을 등록하려면{" "}
            <Link href="/login" className="font-medium underline underline-offset-2">
              로그인
            </Link>
            이 필요합니다.
          </p>
        ) : null}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <BoardArticleFrame
            topMeta="새 글 작성"
            header={
              <>
                <label className="sr-only" htmlFor="lol-board-write-title">
                  제목
                </label>
                <input
                  id="lol-board-write-title"
                  name="title"
                  type="text"
                  value={title}
                  onChange={(ev) => setTitle(ev.target.value)}
                  className={titleInputClass}
                  placeholder="제목"
                  maxLength={500}
                  autoComplete="off"
                  disabled={pending || !me}
                />
              </>
            }
            metaRow={
              <>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{authorLabel}</span>
                <span className="shrink-0 tabular-nums">조회 0</span>
              </>
            }
            body={
              <>
                <label className="sr-only" htmlFor="lol-board-write-content">
                  본문
                </label>
                <textarea
                  id="lol-board-write-content"
                  name="content"
                  value={content}
                  onChange={(ev) => setContent(ev.target.value)}
                  className={bodyTextareaClass}
                  placeholder="내용을 입력하세요."
                  rows={12}
                  disabled={pending || !me}
                />
              </>
            }
          />

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href={lolFreeBoardListHref()}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800/50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={pending || !me}
              className="inline-flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white"
            >
              {pending ? "등록 중…" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </GamePageLayout>
  );
}
