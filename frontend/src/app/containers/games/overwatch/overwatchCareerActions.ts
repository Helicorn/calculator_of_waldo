import type { OverwatchCareerResponse } from "@/app/containers/games/overwatch/overwatchCareerTypes";
import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";

const CAREER_API = `${BACKEND_BASE_URL}/api/waldo/games/overwatch/career`;

function normalizeOverwatchCareerResponse(
  raw: OverwatchCareerResponse,
): OverwatchCareerResponse {
  return {
    ...raw,
    heroes: raw.heroes ?? [],
    statCategories: raw.statCategories ?? [],
    activeStatIndex: raw.activeStatIndex ?? 0,
  };
}

export type FetchOverwatchCareerResult =
  | { success: true; data: OverwatchCareerResponse }
  | { success: false; error: string };

export async function fetchOverwatchCareerByBattleTag(
  name: string,
  tag: string,
  options?: { debug?: boolean },
): Promise<FetchOverwatchCareerResult> {
  const battleTagName = name.trim();
  const battleTagCode = tag.trim().replace(/^#/, "");
  if (!battleTagName || !battleTagCode) {
    return { success: false, error: "닉네임과 배틀태그를 입력해 주세요." };
  }

  const params = new URLSearchParams({
    name: battleTagName,
    tag: battleTagCode,
  });
  if (options?.debug) {
    params.set("debug", "true");
  }
  const url = `${CAREER_API}?${params.toString()}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      let message = `조회 실패 (HTTP ${res.status})`;
      if (text.trim()) {
        try {
          const body = JSON.parse(text) as { message?: string };
          if (body.message) message = body.message;
        } catch {
          if (text.length < 300) message = text;
        }
      }
      return { success: false, error: message };
    }
    const data = normalizeOverwatchCareerResponse(
      JSON.parse(text) as OverwatchCareerResponse,
    );
    return { success: true, data };
  } catch {
    return { success: false, error: "네트워크 오류가 발생했습니다." };
  }
}
