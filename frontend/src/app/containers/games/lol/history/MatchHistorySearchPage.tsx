import { LolMatchHistorySearchForm } from "./LolMatchHistorySearchForm";

/** LoL 게임 페이지(`GamePageLayout`) 본문용 — SiteHeader·전체 레이아웃 없음 */
export function MatchHistorySearchPage() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 text-left">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          전적 검색
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Riot ID(게임이름#태그)와 개발용 API Key로 PUUID를 조회합니다. 이후 전적
          API에 연결할 수 있습니다.
        </p>
      </header>

      <LolMatchHistorySearchForm />
    </div>
  );
}
