const RIOT_DEVELOPER_APIS_URL = "https://developer.riotgames.com/apis";

/** LoL 게임 페이지 `?detail=community` 본문 */
export function LolCommunityPage() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 text-left">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          커뮤니티
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Riot Games 공식 개발자 포털에서 League of Legends를 비롯한 게임 API
          목록과 문서를 확인할 수 있습니다.
        </p>
      </header>
      <a
        href={RIOT_DEVELOPER_APIS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center justify-center rounded-md border border-black/[.12] bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:border-white/[.18] dark:bg-neutral-100 dark:text-neutral-900"
      >
        Riot API 문서 열기
      </a>
    </div>
  );
}
