import type { ReactNode } from "react";

/** 자유게시판 글 박스(상세·글쓰기) 테두리/배경 */
export const boardArticleShellClassName =
  "flex flex-col overflow-hidden border-x-0 border-y-2 border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900/40";

const hrClassName =
  "m-0 border-0 border-t border-neutral-200 dark:border-neutral-700";

const headerClassName =
  "flex min-h-[3.5rem] items-center bg-neutral-50 px-4 py-4 dark:bg-neutral-800/40";

type BoardArticleFrameProps = {
  /** 박스 위 우측 정렬 한 줄 (상세: 작성 시각 등) — 없으면 생략 */
  topMeta?: ReactNode;
  /** 제목 영역 */
  header: ReactNode;
  /** 작성자 / 조회수 등 중간 줄 — 보통 두 요소가 flex로 양쪽 정렬됨 */
  metaRow: ReactNode;
  /** 본문 영역 (`px`·`py` 바깥 래퍼는 공통 제공) */
  body: ReactNode;
};

/** LoL 게시판 상세·글쓰기에서 쓰는 동일 레이아웃 글 카드 프레임 */
export function BoardArticleFrame({
  topMeta,
  header,
  metaRow,
  body,
}: BoardArticleFrameProps) {
  return (
    <div className="flex flex-col gap-1">
      {topMeta != null ? (
        <p className="text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
          {topMeta}
        </p>
      ) : null}
      <article className={boardArticleShellClassName}>
        <header className={headerClassName}>{header}</header>
        <hr className={hrClassName} />
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
          {metaRow}
        </div>
        <hr className={hrClassName} />
        <div className="min-h-[12rem] flex-1 px-4 py-5">{body}</div>
      </article>
    </div>
  );
}
