import type {
  OverwatchHeroDetailResponse,
  OverwatchHeroListResponse,
} from "@/app/containers/games/overwatch/catalogs/overwatchHeroTypes";
import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";

const HEROES_API = `${BACKEND_BASE_URL}/api/waldo/games/overwatch/heroes`;

export async function fetchOverwatchHeroList(): Promise<OverwatchHeroListResponse> {
  const res = await fetch(HEROES_API, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`영웅 목록 조회 실패 (HTTP ${res.status})`);
  }
  return res.json() as Promise<OverwatchHeroListResponse>;
}

export async function fetchOverwatchHeroDetail(
  heroId: string,
): Promise<OverwatchHeroDetailResponse> {
  const res = await fetch(`${HEROES_API}/${encodeURIComponent(heroId)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`영웅 상세 조회 실패 (HTTP ${res.status})`);
  }
  return res.json() as Promise<OverwatchHeroDetailResponse>;
}
