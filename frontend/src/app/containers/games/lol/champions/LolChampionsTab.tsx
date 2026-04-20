import {
  fetchLatestDdragonVersion,
  lolDbChampionDataUrl,
} from "@/lib/lolDdragon";
import type { ChampionDataJsonResponse } from "@/app/types/games/lol";

import { LolChampionsTabClient } from "./LolChampionsTabClient";

export async function LolChampionsTab() {
  let version: string;
  try {
    version = await fetchLatestDdragonVersion();
  } catch {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        Data Dragon 버전 정보를 불러오지 못했습니다. 네트워크를 확인해 주세요.
      </p>
    );
  }

  const dataUrl = lolDbChampionDataUrl(version);
  const data = await fetch(dataUrl);
  if (!data.ok) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        챔피언 데이터를 불러오지 못했습니다. ({data.status})
      </p>
    );
  }
  const dataJson: ChampionDataJsonResponse = await data.json();
  const championsArray = Object.values(dataJson.data);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Data Dragon 최신 버전(versions.json index 0):{" "}
        <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
          {version}
        </span>
      </p>
      <LolChampionsTabClient version={version} champions={championsArray} />
    </div>
  );
}
