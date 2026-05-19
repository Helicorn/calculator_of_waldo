import { OverwatchCareerSearchForm } from "./OverwatchCareerSearchForm";

/** 오버워치 게임 페이지 `?detail=history` 본문 */
export function OverwatchCareerSearchPage() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 text-left">
      <header>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          배틀넷 배틀태그(닉네임#숫자)로 Blizzard career 전적을 조회합니다. 서버가
          페이지를 읽어 Top Heroes(빠른 대전·플레이 시간)를 표시합니다.
        </p>
      </header>
      <OverwatchCareerSearchForm />
    </div>
  );
}
