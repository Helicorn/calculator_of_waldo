"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useRef, useState } from "react";

import { ddragonProfileIconUrl } from "@/lib/lolDdragon";

import { MatchSummaryItem } from "./components/MatchSummaryItem";
import { StatsPanel } from "./components/StatsPanel";
import {
  lookupPuuidByRiotId,
  lookupYearStatsByPuuid,
  type LookupYearStatsResult,
  type LolMatchSummary,
} from "./lolMatchHistoryActions";

type ResultTab = "matches" | "stats";
type StatsQueueType = "solo" | "flex";

export function LolMatchHistorySearchForm() {
  const [riotId, setRiotId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [puuid, setPuuid] = useState<string | null>(null);
  const [matches, setMatches] = useState<LolMatchSummary[]>([]);
  const [matchFetchErrors, setMatchFetchErrors] = useState<
    { matchId: string; error: string }[]
  >([]);
  const [ddragonVersion, setDdragonVersion] = useState<string | null>(null);
  const [searchedProfileIconId, setSearchedProfileIconId] = useState<number | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<ResultTab>("matches");
  const [statsQueueType, setStatsQueueType] = useState<StatsQueueType>("solo");
  const [yearStatsLoading, setYearStatsLoading] = useState(false);
  const [yearStats, setYearStats] = useState<LookupYearStatsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lookupRequestIdRef = useRef(0);

  async function loadYearStats(
    puuid: string,
    normalizedRiotId: string,
    key: string,
    requestId: number,
  ) {
    setYearStatsLoading(true);
    try {
      const result = await lookupYearStatsByPuuid(puuid, key.trim(), normalizedRiotId);
      if (lookupRequestIdRef.current === requestId) {
        setYearStats(result);
      }
    } finally {
      if (lookupRequestIdRef.current === requestId) {
        setYearStatsLoading(false);
      }
    }
  }

  async function runLookup(nextRiotId: string) {
    const query = nextRiotId.trim();
    const key = apiKey.trim();
    const requestId = lookupRequestIdRef.current + 1;
    lookupRequestIdRef.current = requestId;
    if (!query || !key) {
      setError("Riot ID와 API Key를 입력하세요.");
      return;
    }

    setError(null);
    setPuuid(null);
    setMatches([]);
    setMatchFetchErrors([]);
    setDdragonVersion(null);
    setSearchedProfileIconId(null);
    setYearStats(null);
    setLoading(true);

    try {
      const result = await lookupPuuidByRiotId(query, key);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setActiveTab("matches");
      setStatsQueueType("solo");
      setPuuid(result.puuid);
      setMatches(result.matches);
      setMatchFetchErrors(result.matchFetchErrors);
      setDdragonVersion(result.ddragonVersion);
      setSearchedProfileIconId(result.searchedProfileIconId ?? null);

      if (result.latestMatchJson != null) {
        console.log(
          "[LoL 전적] 가장 최근 매치 JSON (matchIds[0])",
          result.latestMatchJson,
        );
      }

      void loadYearStats(result.puuid, result.normalizedRiotId, key, requestId);
    } catch {
      setError("요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await runLookup(riotId);
  }

  async function handleClickSummoner(clickedRiotId: string) {
    if (loading) return;
    setRiotId(clickedRiotId);
    await runLookup(clickedRiotId);
  }

  return (
    <>
      <form
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label
            htmlFor="summoner-query"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            소환사명 / Riot ID
          </label>
          <input
            id="summoner-query"
            name="q"
            type="text"
            autoComplete="off"
            placeholder="예: Hide on bush#KR1"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            className="w-full rounded-md border border-black/[.12] bg-[var(--background)] px-3 py-2 text-sm text-neutral-900 outline-none ring-offset-2 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/30 dark:border-white/[.18] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/30"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-xs">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <label
              htmlFor="riot-api-key"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              API Key
            </label>
            <a
              href="https://developer.riotgames.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
            >
              Key 발급받기
            </a>
          </div>
          <input
            id="riot-api-key"
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder="RGAPI-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-md border border-black/[.12] bg-[var(--background)] px-3 py-2 text-sm text-neutral-900 outline-none ring-offset-2 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/30 dark:border-white/[.18] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-md border border-black/[.12] bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 dark:border-white/[.18] dark:bg-neutral-100 dark:text-neutral-900"
        >
          {loading ? "조회 중…" : "검색"}
        </button>
      </form>

      <section
        aria-labelledby="history-results-heading"
        className="rounded-lg border border-black/[.08] bg-black/[.02] p-6 dark:border-white/[.12] dark:bg-white/[.04]"
      >
        <h3
          id="history-results-heading"
          className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
        >
          검색 결과
        </h3>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {puuid ? (
          <div className="flex flex-col gap-1">
            {matchFetchErrors.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  일부 매치 상세 조회 실패 ({matchFetchErrors.length}건)
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {matchFetchErrors.map(({ matchId, error: err }) => (
                    <li
                      key={matchId}
                      className="break-all font-mono text-xs text-amber-800 dark:text-amber-300"
                    >
                      {matchId}: {err}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {ddragonVersion && searchedProfileIconId != null ? (
              <div className="mt-3 flex items-center gap-3">
                <Image
                  src={ddragonProfileIconUrl(ddragonVersion, searchedProfileIconId)}
                  alt="소환사 프로필 아이콘"
                  width={40}
                  height={40}
                  className="rounded-md"
                />
                <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                  {riotId.trim()}
                </p>
              </div>
            ) : null}

            {matches.length > 0 ? (
              <div className="mt-4">
                <div className="flex items-center gap-2 border-b border-black/[.08] pb-2 dark:border-white/[.12]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("matches")}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      activeTab === "matches"
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-neutral-600 hover:bg-black/[.04] dark:text-neutral-400 dark:hover:bg-white/[.08]"
                    }`}
                  >
                    매치 상세
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("stats")}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      activeTab === "stats"
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-neutral-600 hover:bg-black/[.04] dark:text-neutral-400 dark:hover:bg-white/[.08]"
                    }`}
                  >
                    통계
                  </button>
                </div>

                {activeTab === "matches" ? (
                  <>
                    <p className="mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      매치 상세 요약 (목록 상위 {matches.length}건)
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {matches.map((m, idx) => (
                        <MatchSummaryItem
                          key={m.matchId || `match-${idx}`}
                          match={m}
                          ddragonVersion={ddragonVersion}
                          onClickSummoner={(id) => void handleClickSummoner(id)}
                        />
                      ))}
                    </ul>
                  </>
                ) : (
                  <StatsPanel
                    yearStatsLoading={yearStatsLoading}
                    yearStats={yearStats}
                    statsQueueType={statsQueueType}
                    onChangeQueueType={setStatsQueueType}
                  />
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {!error && !puuid ? (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Riot ID와 API Key를 입력한 뒤 검색하면 PUUID가 표시됩니다.
          </p>
        ) : null}
      </section>
    </>
  );
}
