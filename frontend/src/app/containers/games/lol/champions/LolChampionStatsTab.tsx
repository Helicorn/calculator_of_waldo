"use client";

import { useEffect, useState } from "react";

import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";

type ChampionStatsRow = {
  patchVersion: string;
  queueId: number;
  championId: number;
  line: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
  pickRate: number | null;
};

type LolChampionStatsTabProps = {
  championId: string;
};

function displayRate(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)}%`;
}

export function LolChampionStatsTab({ championId }: LolChampionStatsTabProps) {
  const [rows, setRows] = useState<ChampionStatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const numericChampionId = Number.parseInt(championId, 10);
    if (Number.isNaN(numericChampionId)) {
      setRows([]);
      setLoading(false);
      setError("챔피언 통계는 숫자 챔피언 ID가 필요합니다.");
      return () => {
        controller.abort();
      };
    }

    setLoading(true);
    setError(null);
    const url = `${BACKEND_BASE_URL}/api/waldo/games/lol/champions/${numericChampionId}/stats?queueId=420`;
    void fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as ChampionStatsRow[];
      })
      .then((json) => {
        setRows(json);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRows([]);
        setLoading(false);
        setError("챔피언 통계를 불러오지 못했습니다.");
      });

    return () => {
      controller.abort();
    };
  }, [championId]);

  if (loading) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">통계 불러오는 중...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">표시할 통계가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-black/[.1] dark:border-white/[.16]">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-black/[.1] bg-neutral-50 dark:border-white/[.16] dark:bg-neutral-900/80">
            <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">패치</th>
            <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">라인</th>
            <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">게임 수</th>
            <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">승</th>
            <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">패</th>
            <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">승률</th>
            <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">픽률</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.patchVersion}-${row.line}-${row.championId}`}
              className="border-b border-black/[.06] last:border-b-0 dark:border-white/[.08]"
            >
              <td className="px-3 py-2 font-mono text-neutral-900 dark:text-neutral-100">{row.patchVersion}</td>
              <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{row.line || "UNKNOWN"}</td>
              <td className="px-3 py-2 tabular-nums text-neutral-700 dark:text-neutral-300">{row.games}</td>
              <td className="px-3 py-2 tabular-nums text-neutral-700 dark:text-neutral-300">{row.wins}</td>
              <td className="px-3 py-2 tabular-nums text-neutral-700 dark:text-neutral-300">{row.losses}</td>
              <td className="px-3 py-2 tabular-nums text-neutral-900 dark:text-neutral-100">
                {displayRate(row.winRate)}
              </td>
              <td className="px-3 py-2 tabular-nums text-neutral-900 dark:text-neutral-100">
                {displayRate(row.pickRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
