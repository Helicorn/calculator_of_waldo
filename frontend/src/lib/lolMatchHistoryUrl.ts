export const LOL_MATCH_HISTORY_BASE_URL = "https://asia.api.riotgames.com";
/** `/{gameName}/{tagLine}` — 아시아 라우팅(한국 등) 계정 조회 */
export const LOL_MATCH_HISTORY_ACCOUNT_V1_URL =
  "/riot/account/v1/accounts/by-riot-id/";
/** `/by-puuid/{puuid}/ids` */
export const LOL_MATCH_V5_IDS_BY_PUUID_URL =
  "/lol/match/v5/matches/by-puuid/";
/** `/{matchId}` */
export const LOL_MATCH_V5_MATCH_BY_ID_URL = "/lol/match/v5/matches/";

const RIOT_TOKEN_HEADER = "X-Riot-Token";

/**
 * Match-V5 `GET /lol/match/v5/matches/{matchId}` 의 `info` 일부.
 * 전체 스키마는 매우 크므로, 화면·로직에서 쓰는 키만 여기 두고 나머지는 인덱스로 둡니다.
 * @see https://developer.riotgames.com/apis#match-v5/GET_getMatch
 */
export type RiotMatchV5Info = {
  gameCreation?: number;
  gameDuration?: number;
  gameMode?: string;
  gameType?: string;
  queueId?: number;
  mapId?: number;
  /** 1인당 필드가 매우 많음 — 필요한 필드만 별도 타입으로 좁혀 사용 */
  participants?: Record<string, unknown>[];
  teams?: unknown[];
} & Record<string, unknown>;

/**
 * Match-V5 매치 객체. 최상위는 대개 `metadata` + `info` 뿐이나, 확장에 대비해 여분 키 허용.
 */
export type RiotMatchV5 = {
  metadata?: {
    matchId?: string;
    dataVersion?: string;
    participants?: string[];
  };
  info?: RiotMatchV5Info;
} & Record<string, unknown>;

function riotErrorMessage(
  response: Response,
  raw: string,
  data: unknown,
): string {
  const statusMsg =
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    typeof (data as { status?: { message?: string } }).status?.message ===
      "string"
      ? (data as { status?: { message?: string } }).status?.message
      : undefined;
  return (
    statusMsg ||
    (raw.length > 0 && raw.length < 300 ? raw : `HTTP ${response.status}`) ||
    `Riot API 오류 (${response.status})`
  );
}

/**
 * Riot Account-V1: Riot ID(게임이름 + 태그)로 `puuid` 조회.
 * @see https://developer.riotgames.com/apis#account-v1/GET_getByRiotId
 */
export async function fetchPuuidByRiotId(
  gameName: string,
  tagLine: string,
  apiKey: string,
): Promise<string> {
  const name = gameName.trim();
  const tag = tagLine.trim();
  const key = apiKey.trim();
  if (!name || !tag || !key) {
    throw new Error("게임 이름, 태그, API Key가 모두 필요합니다.");
  }

  const path = `${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  const url = `${LOL_MATCH_HISTORY_BASE_URL}${LOL_MATCH_HISTORY_ACCOUNT_V1_URL}${path}`;

  const response = await fetch(url, {
    headers: { [RIOT_TOKEN_HEADER]: key },
    cache: "no-store",
  });

  const raw = await response.text();
  let data: { puuid?: string } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(riotErrorMessage(response, raw, data));
  }

  const puuid = data.puuid;
  if (typeof puuid !== "string" || !puuid) {
    throw new Error("응답에 puuid가 없습니다.");
  }
  return puuid;
}

/**
 * Riot Match-V5: `puuid`로 최근 매치 ID 목록 조회.
 * @see https://developer.riotgames.com/apis#match-v5/GET_getMatchIdsByPUUID
 */
export async function fetchMatchHistoryByPuuid(
  puuid: string,
  apiKey: string,
  options?: {
    start?: number;
    count?: number;
    startTime?: number;
    endTime?: number;
    /** 특정 큐만 (예: 420 솔로 랭크, 440 자유 랭크). 미설정 시 전체 큐 */
    queue?: number;
  },
): Promise<string[]> {
  const id = puuid.trim();
  const key = apiKey.trim();
  if (!id || !key) {
    throw new Error("puuid와 API Key가 모두 필요합니다.");
  }

  const params = new URLSearchParams();
  if (typeof options?.start === "number") {
    params.set("start", String(options.start));
  }
  if (typeof options?.count === "number") {
    params.set("count", String(options.count));
  }
  if (typeof options?.startTime === "number") {
    params.set("startTime", String(options.startTime));
  }
  if (typeof options?.endTime === "number") {
    params.set("endTime", String(options.endTime));
  }
  if (typeof options?.queue === "number") {
    params.set("queue", String(options.queue));
  }

  const qs = params.toString();
  const url = `${LOL_MATCH_HISTORY_BASE_URL}${LOL_MATCH_V5_IDS_BY_PUUID_URL}${encodeURIComponent(id)}/ids${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: { [RIOT_TOKEN_HEADER]: key },
    cache: "no-store",
  });

  const raw = await response.text();
  let data: unknown = [];
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(riotErrorMessage(response, raw, data));
  }

  if (!Array.isArray(data) || !data.every((v) => typeof v === "string")) {
    throw new Error("응답에 match id 목록이 없습니다.");
  }
  return data;
}

/**
 * Riot Match-V5: 매치 ID로 단일 매치 상세 조회.
 * @see https://developer.riotgames.com/apis#match-v5/GET_getMatch
 */
export async function fetchMatchById(
  matchId: string,
  apiKey: string,
): Promise<RiotMatchV5> {
  const id = matchId.trim();
  const key = apiKey.trim();
  if (!id || !key) {
    throw new Error("matchId와 API Key가 모두 필요합니다.");
  }

  const url = `${LOL_MATCH_HISTORY_BASE_URL}${LOL_MATCH_V5_MATCH_BY_ID_URL}${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    headers: { [RIOT_TOKEN_HEADER]: key },
    cache: "no-store",
  });

  const raw = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(riotErrorMessage(response, raw, data));
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("매치 응답이 올바르지 않습니다.");
  }
  return data as RiotMatchV5;
}
