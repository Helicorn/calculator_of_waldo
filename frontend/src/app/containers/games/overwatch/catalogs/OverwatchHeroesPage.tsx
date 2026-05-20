import { fetchOverwatchHeroList } from "@/app/containers/games/overwatch/catalogs/overwatchHeroActions";
import { OverwatchHeroesTabClient } from "@/app/containers/games/overwatch/catalogs/OverwatchHeroesTabClient";

/** 오버워치 게임 페이지 `?detail=heroes` 본문 */
export async function OverwatchHeroesPage() {
  try {
    const data = await fetchOverwatchHeroList();
    return <OverwatchHeroesTabClient heroes={data.heroes} />;
  } catch (e) {
    const message = e instanceof Error ? e.message : "영웅 목록을 불러오지 못했습니다.";
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        {message} 백엔드가 실행 중인지 확인해 주세요.
      </p>
    );
  }
}
