"use server";

import {
  fetchChampionNumericIdToDdragonId,
  fetchLatestDdragonVersion,
  fetchSummonerSpellIdToImageFull,
} from "@/lib/lolDdragon";
import {
  fetchMatchById,
  fetchMatchHistoryByPuuid,
  fetchPuuidByRiotId,
  type RiotMatchV5,
} from "@/lib/lolMatchHistoryUrl";

/** 한 번에 상세 조회할 매치 수 (개발 키 레이트·응답 크기 고려) */
const MAX_MATCH_DETAILS = 10;
/** 큐 필터로 ID 수가 줄어들면 동시 상세 조회를 조금 늘려도 부담이 덜함 */
const YEAR_STATS_BATCH_SIZE = 6;
const YEAR_STATS_HISTORY_PAGE = 100;
const YEAR_STATS_RETRY_COUNT = 2;
const YEAR_STATS_RETRY_DELAY_MS = 300;

export type LolMatchSummary = {
  matchId: string;
  /** match-v5 `info.participants` 순서(0..9)대로 정렬된 참가자 라인 */
  participants: {
    riotId: string;
    kills?: number;
    deaths?: number;
    assists?: number;
    /** Data Dragon `img/champion/{id}.png` 파일명 */
    championDdragonId?: string;
  }[];
  /** 검색 Riot ID (`gameName#tagLine`) */
  searchedRiotId: string;
  /** 검색 Riot ID와 `riotIdGameName#riotIdTagline`이 같은 라인 */
  searchedChampionName?: string;
  /** Data Dragon `img/champion/{id}.png` 파일명 */
  searchedChampionDdragonId?: string;
  /** Data Dragon `img/spell/{image.full}` */
  searchedSummonerSpell1ImageFull?: string;
  searchedSummonerSpell2ImageFull?: string;
  searchedProfileIconId?: number;
};

function extractParticipantLines(
  m: RiotMatchV5,
  championNumericIdToDdragonId: Map<string, string>,
): LolMatchSummary["participants"] {
  const parts = m.info?.participants;
  if (!Array.isArray(parts)) return [];

  const lines: LolMatchSummary["participants"] = [];
  for (const raw of parts) {
    if (typeof raw !== "object" || raw === null) continue;
    const p = raw as Record<string, unknown>;
    const gameName = p.riotIdGameName;
    const tag = p.riotIdTagline;
    if (typeof gameName !== "string" || typeof tag !== "string") continue;
    const riotId = `${gameName.trim()}#${tag.trim()}`;
    if (!riotId) continue;

    const cid = p.championId;
    const championDdragonId =
      typeof cid === "number"
        ? championNumericIdToDdragonId.get(String(cid))
        : undefined;

    lines.push({
      riotId,
      kills: typeof p.kills === "number" ? p.kills : undefined,
      deaths: typeof p.deaths === "number" ? p.deaths : undefined,
      assists: typeof p.assists === "number" ? p.assists : undefined,
      championDdragonId,
    });
  }
  return lines;
}

function findSearchedSummonerChampion(
  m: RiotMatchV5,
  normalizedRiotId: string,
  championNumericIdToDdragonId: Map<string, string>,
  summonerSpellIdToImageFull: Map<string, string>,
): {
  championName: string;
  ddragonId: string;
  spell1ImageFull?: string;
  spell2ImageFull?: string;
  profileIconId?: number;
} | undefined {
  const parts = m.info?.participants;
  if (!Array.isArray(parts)) return undefined;
  for (const raw of parts) {
    if (typeof raw !== "object" || raw === null) continue;
    const p = raw as Record<string, unknown>;
    const gameName = p.riotIdGameName;
    const tag = p.riotIdTagline;
    if (typeof gameName !== "string" || typeof tag !== "string") continue;
    const combined = `${gameName.trim()}#${tag.trim()}`;
    if (combined !== normalizedRiotId) continue;

    const cname = p.championName;
    const championName =
      typeof cname === "string" && cname.length > 0 ? cname : "챔피언";

    const cid = p.championId;
    if (typeof cid === "number") {
      const ddragonId = championNumericIdToDdragonId.get(String(cid));
      if (ddragonId) {
        const s1 =
          typeof p.summoner1Id === "number"
            ? summonerSpellIdToImageFull.get(String(p.summoner1Id))
            : undefined;
        const s2 =
          typeof p.summoner2Id === "number"
            ? summonerSpellIdToImageFull.get(String(p.summoner2Id))
            : undefined;
        const profileIconId =
          typeof p.profileIcon === "number" ? p.profileIcon : undefined;
        return {
          championName,
          ddragonId,
          spell1ImageFull: s1,
          spell2ImageFull: s2,
          profileIconId,
        };
      }
    }

    const fallback =
      typeof cname === "string" ? cname.replace(/\s+/g, "") : undefined;
    if (fallback) {
      const s1 =
        typeof p.summoner1Id === "number"
          ? summonerSpellIdToImageFull.get(String(p.summoner1Id))
          : undefined;
      const s2 =
        typeof p.summoner2Id === "number"
          ? summonerSpellIdToImageFull.get(String(p.summoner2Id))
          : undefined;
      const profileIconId =
        typeof p.profileIcon === "number" ? p.profileIcon : undefined;
      return {
        championName,
        ddragonId: fallback,
        spell1ImageFull: s1,
        spell2ImageFull: s2,
        profileIconId,
      };
    }
    return undefined;
  }
  return undefined;
}

function toMatchSummary(
  m: RiotMatchV5,
  normalizedRiotId: string,
  championNumericIdToDdragonId: Map<string, string>,
  summonerSpellIdToImageFull: Map<string, string>,
): LolMatchSummary {
  const picked = findSearchedSummonerChampion(
    m,
    normalizedRiotId,
    championNumericIdToDdragonId,
    summonerSpellIdToImageFull,
  );
  return {
    matchId: m.metadata?.matchId ?? "",
    participants: extractParticipantLines(m, championNumericIdToDdragonId),
    searchedRiotId: normalizedRiotId,
    searchedChampionName: picked?.championName,
    searchedChampionDdragonId: picked?.ddragonId,
    searchedSummonerSpell1ImageFull: picked?.spell1ImageFull,
    searchedSummonerSpell2ImageFull: picked?.spell2ImageFull,
    searchedProfileIconId: picked?.profileIconId,
  };
}

function parseRiotId(riotId: string): { gameName: string; tagLine: string } | null {
  const trimmed = riotId.trim();
  const hash = trimmed.indexOf("#");
  if (hash <= 0 || hash === trimmed.length - 1) {
    return null;
  }
  const gameName = trimmed.slice(0, hash).trim();
  const tagLine = trimmed.slice(hash + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

export type LookupPuuidResult =
  | {
      success: true;
      puuid: string;
      /** `gameName#tagLine` (통계·매치 요약과 동일 정규화) */
      normalizedRiotId: string;
      matchIds: string[];
      matches: LolMatchSummary[];
      matchFetchErrors: { matchId: string; error: string }[];
      /** `matchIds[0]` 상세 조회 성공 시 원본 JSON (브라우저 콘솔 디버깅용) */
      latestMatchJson: RiotMatchV5 | null;
      ddragonVersion: string;
      searchedProfileIconId?: number;
    }
  | { success: false; error: string };

export type LookupYearStatsResult =
  | {
      success: true;
      year: number;
      searchedRiotId: string;
      totalMatches: number;
      analyzedMatches: number;
      soloRank: {
        queueId: 420;
        matches: number;
        wins: number;
        losses: number;
        winRate: number;
        kills: number;
        deaths: number;
        assists: number;
        avgKills: number;
        avgDeaths: number;
        avgAssists: number;
        laneCounts: {
          top: number;
          jungle: number;
          mid: number;
          adc: number;
          support: number;
        };
      };
      flexRank: {
        queueId: 440;
        matches: number;
        wins: number;
        losses: number;
        winRate: number;
        kills: number;
        deaths: number;
        assists: number;
        avgKills: number;
        avgDeaths: number;
        avgAssists: number;
        laneCounts: {
          top: number;
          jungle: number;
          mid: number;
          adc: number;
          support: number;
        };
      };
    }
  | { success: false; error: string };

function extractSearchedKda(
  m: RiotMatchV5,
  normalizedRiotId: string,
): {
  queueId?: number;
  kills: number;
  deaths: number;
  assists: number;
  win?: boolean;
  teamPosition?: string;
} | null {
  const parts = m.info?.participants;
  if (!Array.isArray(parts)) return null;
  for (const raw of parts) {
    if (typeof raw !== "object" || raw === null) continue;
    const p = raw as Record<string, unknown>;
    const gameName = p.riotIdGameName;
    const tag = p.riotIdTagline;
    if (typeof gameName !== "string" || typeof tag !== "string") continue;
    if (`${gameName.trim()}#${tag.trim()}` !== normalizedRiotId) continue;
    return {
      queueId: typeof m.info?.queueId === "number" ? m.info.queueId : undefined,
      kills: typeof p.kills === "number" ? p.kills : 0,
      deaths: typeof p.deaths === "number" ? p.deaths : 0,
      assists: typeof p.assists === "number" ? p.assists : 0,
      win: typeof p.win === "boolean" ? p.win : undefined,
      teamPosition:
        typeof p.teamPosition === "string" ? p.teamPosition : undefined,
    };
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMatchByIdWithRetry(
  matchId: string,
  apiKey: string,
): Promise<RiotMatchV5> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= YEAR_STATS_RETRY_COUNT; attempt += 1) {
    try {
      return await fetchMatchById(matchId, apiKey);
    } catch (e) {
      lastError = e;
      if (attempt < YEAR_STATS_RETRY_COUNT) {
        await sleep(YEAR_STATS_RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("매치 상세 조회 실패");
}

function addLaneToCounts(
  laneCounts: {
    top: number;
    jungle: number;
    mid: number;
    adc: number;
    support: number;
  },
  teamPosition?: string,
) {
  switch (teamPosition) {
    case "TOP":
      laneCounts.top += 1;
      break;
    case "JUNGLE":
      laneCounts.jungle += 1;
      break;
    case "MIDDLE":
      laneCounts.mid += 1;
      break;
    case "BOTTOM":
      laneCounts.adc += 1;
      break;
    case "UTILITY":
      laneCounts.support += 1;
      break;
    default:
      break;
  }
}

async function collectMatchIdsForYearQueue(
  puuid: string,
  apiKey: string,
  startSec: number,
  endSec: number,
  queue: number,
): Promise<string[]> {
  const allIds: string[] = [];
  for (let start = 0; ; start += YEAR_STATS_HISTORY_PAGE) {
    const page = await fetchMatchHistoryByPuuid(puuid, apiKey, {
      start,
      count: YEAR_STATS_HISTORY_PAGE,
      startTime: startSec,
      endTime: endSec,
      queue,
    });
    allIds.push(...page);
    if (page.length < YEAR_STATS_HISTORY_PAGE) break;
  }
  return allIds;
}

type MutableYearRankBucket = {
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  laneCounts: {
    top: number;
    jungle: number;
    mid: number;
    adc: number;
    support: number;
  };
};

async function aggregateYearQueueMatches(
  matchIds: string[],
  apiKey: string,
  normalizedRiotId: string,
  bucket: MutableYearRankBucket,
  expectedQueueId: 420 | 440,
): Promise<void> {
  for (let i = 0; i < matchIds.length; i += YEAR_STATS_BATCH_SIZE) {
    const batch = matchIds.slice(i, i + YEAR_STATS_BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map((id) => fetchMatchByIdWithRetry(id, apiKey)),
    );
    for (const r of settled) {
      if (r.status !== "fulfilled") continue;
      const kda = extractSearchedKda(r.value, normalizedRiotId);
      if (!kda || kda.queueId !== expectedQueueId) continue;
      bucket.matches += 1;
      if (kda.win === true) bucket.wins += 1;
      else if (kda.win === false) bucket.losses += 1;
      bucket.kills += kda.kills;
      bucket.deaths += kda.deaths;
      bucket.assists += kda.assists;
      addLaneToCounts(bucket.laneCounts, kda.teamPosition);
    }
  }
}

function finalizeYearRankBucket(bucket: MutableYearRankBucket): void {
  if (bucket.matches > 0) {
    bucket.winRate = Number(((bucket.wins / bucket.matches) * 100).toFixed(2));
    bucket.avgKills = Number((bucket.kills / bucket.matches).toFixed(2));
    bucket.avgDeaths = Number((bucket.deaths / bucket.matches).toFixed(2));
    bucket.avgAssists = Number((bucket.assists / bucket.matches).toFixed(2));
  }
}

/** 이미 알고 있는 `puuid`로 연간 솔랭·자랭 통계만 조회 (계정 API 1회 생략, 큐별 ID만 수집) */
export async function lookupYearStatsByPuuid(
  puuid: string,
  apiKey: string,
  normalizedRiotId: string,
): Promise<LookupYearStatsResult> {
  const p = puuid.trim();
  const key = apiKey.trim();
  const rid = normalizedRiotId.trim();
  if (!p || !key || !rid) {
    return { success: false, error: "Riot ID와 API Key를 입력하세요." };
  }

  try {
    const year = new Date().getFullYear();
    const startSec = Math.floor(new Date(year, 0, 1, 0, 0, 0).getTime() / 1000);
    const endSec = Math.floor(Date.now() / 1000);

    const [ids420, ids440] = await Promise.all([
      collectMatchIdsForYearQueue(p, key, startSec, endSec, 420),
      collectMatchIdsForYearQueue(p, key, startSec, endSec, 440),
    ]);

    const soloRank = {
      queueId: 420 as const,
      matches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      laneCounts: { top: 0, jungle: 0, mid: 0, adc: 0, support: 0 },
    };
    const flexRank = {
      queueId: 440 as const,
      matches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      laneCounts: { top: 0, jungle: 0, mid: 0, adc: 0, support: 0 },
    };

    await aggregateYearQueueMatches(ids420, key, rid, soloRank, 420);
    await aggregateYearQueueMatches(ids440, key, rid, flexRank, 440);

    finalizeYearRankBucket(soloRank);
    finalizeYearRankBucket(flexRank);

    const analyzedMatches = soloRank.matches + flexRank.matches;
    const totalMatches = ids420.length + ids440.length;

    return {
      success: true,
      year,
      searchedRiotId: rid,
      totalMatches,
      analyzedMatches,
      soloRank,
      flexRank,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "연간 통계 조회에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function lookupPuuidByRiotId(
  riotId: string,
  apiKey: string,
): Promise<LookupPuuidResult> {
  if (!riotId.trim() || !apiKey.trim()) {
    return { success: false, error: "Riot ID와 API Key를 입력하세요." };
  }

  const parsed = parseRiotId(riotId);
  if (!parsed) {
    return {
      success: false,
      error:
        "Riot ID는 `게임이름#태그` 형식이어야 합니다. (예: Hide on bush#KR1)",
    };
  }

  try {
    const puuid = await fetchPuuidByRiotId(
      parsed.gameName,
      parsed.tagLine,
      apiKey,
    );
    const matchIds = await fetchMatchHistoryByPuuid(puuid, apiKey);
    const idsToDetail = matchIds.slice(0, MAX_MATCH_DETAILS);
    const normalizedRiotId = `${parsed.gameName}#${parsed.tagLine}`;

    const ddragonVersion = await fetchLatestDdragonVersion();
    const [championNumericIdToDdragonId, summonerSpellIdToImageFull, settled] = await Promise.all([
      fetchChampionNumericIdToDdragonId(ddragonVersion),
      fetchSummonerSpellIdToImageFull(ddragonVersion),
      Promise.allSettled(idsToDetail.map((id) => fetchMatchById(id, apiKey))),
    ]);

    const matches: LolMatchSummary[] = [];
    const matchFetchErrors: { matchId: string; error: string }[] = [];
    idsToDetail.forEach((mid, i) => {
      const r = settled[i];
      if (r.status === "fulfilled") {
        matches.push(
          toMatchSummary(
            r.value,
            normalizedRiotId,
            championNumericIdToDdragonId,
            summonerSpellIdToImageFull,
          ),
        );
      } else {
        const msg =
          r.reason instanceof Error ? r.reason.message : "조회 실패";
        matchFetchErrors.push({ matchId: mid, error: msg });
      }
    });

    const firstFulfilled = settled.find(
      (r): r is PromiseFulfilledResult<RiotMatchV5> => r.status === "fulfilled",
    );
    const latestMatchJson = firstFulfilled?.value ?? null;

    return {
      success: true,
      puuid,
      normalizedRiotId,
      matchIds,
      matches,
      matchFetchErrors,
      latestMatchJson,
      ddragonVersion,
      searchedProfileIconId: matches[0]?.searchedProfileIconId,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "조회에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function lookupYearStatsByRiotId(
  riotId: string,
  apiKey: string,
): Promise<LookupYearStatsResult> {
  if (!riotId.trim() || !apiKey.trim()) {
    return { success: false, error: "Riot ID와 API Key를 입력하세요." };
  }

  const parsed = parseRiotId(riotId);
  if (!parsed) {
    return {
      success: false,
      error:
        "Riot ID는 `게임이름#태그` 형식이어야 합니다. (예: Hide on bush#KR1)",
    };
  }

  try {
    const puuid = await fetchPuuidByRiotId(parsed.gameName, parsed.tagLine, apiKey);
    const normalizedRiotId = `${parsed.gameName}#${parsed.tagLine}`;
    return await lookupYearStatsByPuuid(puuid, apiKey, normalizedRiotId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "연간 통계 조회에 실패했습니다.";
    return { success: false, error: message };
  }
}
