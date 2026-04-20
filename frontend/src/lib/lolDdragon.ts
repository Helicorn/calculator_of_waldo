/** Riot Data Dragon API (버전·CDN 경로) */

export const DDRAGON_VERSIONS_URL =
  "https://ddragon.leagueoflegends.com/api/versions.json";

export const DDRAGON_CDN_BASE = "https://ddragon.leagueoflegends.com/cdn";

/** versions.json 배열의 index 0 = 최신 패치 버전 */
export async function fetchLatestDdragonVersion(): Promise<string> {
  const res = await fetch(DDRAGON_VERSIONS_URL, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`versions.json 요청 실패 (${res.status})`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data) || typeof data[0] !== "string" || !data[0]) {
    throw new Error("versions.json 형식이 올바르지 않습니다.");
  }
  return data[0];
}

/** 예: `.../cdn/16.7.1/img/champion/Ahri.png` */
export function ddragonChampionImageUrl(
  version: string,
  championFileName: string,
): string {
  return `${DDRAGON_CDN_BASE}/${version}/img/champion/${championFileName}.png`;
}

/** `image.full` 예: `Ahri_Passive.png` */
export function ddragonPassiveImageUrl(
  version: string,
  imageFull: string,
): string {
  return `${DDRAGON_CDN_BASE}/${version}/img/passive/${imageFull}`;
}

/** `image.full` 예: `AhriQ.png` */
export function ddragonSpellImageUrl(version: string, imageFull: string): string {
  return `${DDRAGON_CDN_BASE}/${version}/img/spell/${imageFull}`;
}

/** 소환사 프로필 아이콘 */
export function ddragonProfileIconUrl(version: string, profileIconId: number): string {
  return `${DDRAGON_CDN_BASE}/${version}/img/profileicon/${profileIconId}.png`;
}

/** 스킨 스플래시 (버전 없음, `championId`는 API id 대소문자 일치) */
export function ddragonChampionSplashUrl(
  championId: string,
  skinNum: number,
): string {
  return `${DDRAGON_CDN_BASE}/img/champion/splash/${championId}_${skinNum}.jpg`;
}

export function lolDbChampionDataUrl(
  version: string,
): string {
  return `${DDRAGON_CDN_BASE}/${version}/data/ko_KR/champion.json`;
}

/** 단일 챔피언 JSON (파일명은 API `id`와 동일 대소문자, 예: `Ahri.json`) */
export function lolDdragonSingleChampionUrl(
  version: string,
  championId: string,
): string {
  return `${DDRAGON_CDN_BASE}/${version}/data/ko_KR/champion/${championId}.json`;
}

export function lolDdragonSummonerSpellDataUrl(version: string): string {
  return `${DDRAGON_CDN_BASE}/${version}/data/ko_KR/summoner.json`;
}

/**
 * Match-V5 `participant.championId`(숫자 문자열) → Data Dragon 이미지 파일명(`id`, 예: `Ahri`).
 */
export async function fetchChampionNumericIdToDdragonId(
  version: string,
): Promise<Map<string, string>> {
  const url = lolDbChampionDataUrl(version);
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`champion.json 요청 실패 (${res.status})`);
  }
  const data: unknown = await res.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("data" in data) ||
    typeof (data as { data?: unknown }).data !== "object" ||
    (data as { data?: unknown }).data === null
  ) {
    throw new Error("champion.json 형식이 올바르지 않습니다.");
  }
  const record = (data as { data: Record<string, { key?: string }> }).data;
  const map = new Map<string, string>();
  for (const [id, entry] of Object.entries(record)) {
    if (entry && typeof entry.key === "string") {
      map.set(entry.key, id);
    }
  }
  return map;
}

/** Match-V5 `summoner1Id/2Id`(숫자) -> summoner spell `image.full` */
export async function fetchSummonerSpellIdToImageFull(
  version: string,
): Promise<Map<string, string>> {
  const url = lolDdragonSummonerSpellDataUrl(version);
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`summoner.json 요청 실패 (${res.status})`);
  }
  const data: unknown = await res.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("data" in data) ||
    typeof (data as { data?: unknown }).data !== "object" ||
    (data as { data?: unknown }).data === null
  ) {
    throw new Error("summoner.json 형식이 올바르지 않습니다.");
  }
  const record = (
    data as { data: Record<string, { key?: string; image?: { full?: string } }> }
  ).data;
  const map = new Map<string, string>();
  for (const entry of Object.values(record)) {
    if (
      entry &&
      typeof entry.key === "string" &&
      typeof entry.image?.full === "string"
    ) {
      map.set(entry.key, entry.image.full);
    }
  }
  return map;
}
