"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PokemonAbilityListPage } from "@/app/containers/games/pokemon/PokemonAbilityListPage";
import { apiFetch, apiJson } from "@/lib/apiFetch";

type PokemonMoveSyncResponse = {
  ok: boolean;
  total: number;
  inserted: number;
  updated: number;
  syncedAt?: string;
};

type MoveRow = {
  id: number;
  nameKo: string | null;
  nameEn: string | null;
  typeName: string | null;
  damageClass: string | null;
  power: number | null;
  pp: number | null;
  descKo: string | null;
};

function tabClass(active: boolean): string {
  const base =
    "rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium transition-colors -mb-px";
  if (active) {
    return `${base} border-black/[.12] bg-[var(--background)] text-neutral-900 dark:border-white/[.18] dark:text-neutral-100`;
  }
  return `${base} border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200`;
}

export default function PokemonDataManagementPage() {
  const [activeTab, setActiveTab] = useState<"moves" | "abilities">("moves");

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<PokemonMoveSyncResponse | null>(
    null,
  );

  const [moveRows, setMoveRows] = useState<MoveRow[]>([]);
  const [moveListError, setMoveListError] = useState<string | null>(null);
  const [isMoveListLoading, setIsMoveListLoading] = useState(false);
  const [moveSearch, setMoveSearch] = useState("");

  const loadMoves = useCallback(async (signal: AbortSignal) => {
    setIsMoveListLoading(true);
    setMoveListError(null);
    try {
      const res = await apiFetch("/api/user/data/pokemon/moves", {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(res.status === 401 ? "로그인이 필요합니다." : `HTTP ${res.status}`);
      }
      const data = (await res.json()) as MoveRow[];
      if (!signal.aborted) {
        setMoveRows(Array.isArray(data) ? data : []);
      }
    } catch (e: unknown) {
      if (signal.aborted) return;
      setMoveListError(
        e instanceof Error ? e.message : "기술 목록을 불러오지 못했습니다.",
      );
      setMoveRows([]);
    } finally {
      if (!signal.aborted) setIsMoveListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "moves") return;
    const controller = new AbortController();
    void loadMoves(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadMoves]);

  const handleSyncMoves = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const data = await apiJson<PokemonMoveSyncResponse>(
        "/api/user/data/pokemon/moves",
        {
          method: "POST",
          headers: { Accept: "application/json" },
        },
      );
      setSyncResult(data);
      const controller = new AbortController();
      await loadMoves(controller.signal);
    } catch (e: unknown) {
      setSyncError(
        e instanceof Error ? e.message : "동기화 요청에 실패했습니다.",
      );
    } finally {
      setIsSyncing(false);
    }
  }, [loadMoves]);

  const filteredMoves = useMemo(() => {
    const q = moveSearch.trim().toLowerCase();
    if (!q) return moveRows;
    return moveRows.filter((r) => {
      const idStr = String(r.id);
      const ko = (r.nameKo ?? "").toLowerCase();
      const en = (r.nameEn ?? "").toLowerCase();
      const type = (r.typeName ?? "").toLowerCase();
      const desc = (r.descKo ?? "").toLowerCase();
      return (
        idStr.includes(q) ||
        ko.includes(q) ||
        en.includes(q) ||
        type.includes(q) ||
        desc.includes(q)
      );
    });
  }, [moveRows, moveSearch]);

  return (
    <div className="w-full flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">포켓몬 데이터</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          PokeAPI와 동기화 및 설명 수정용 페이지입니다.
        </p>
      </header>

      <div
        className="flex flex-wrap gap-0 border-b border-black/[.12] dark:border-white/[.18]"
        role="tablist"
        aria-label="포켓몬 데이터 구분"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "moves"}
          id="tab-pokemon-moves"
          aria-controls="panel-pokemon-moves"
          onClick={() => setActiveTab("moves")}
          className={tabClass(activeTab === "moves")}
        >
          기술 목록
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "abilities"}
          id="tab-pokemon-abilities"
          aria-controls="panel-pokemon-abilities"
          onClick={() => setActiveTab("abilities")}
          className={tabClass(activeTab === "abilities")}
        >
          특성 목록
        </button>
      </div>

      {activeTab === "moves" ? (
        <div
          id="panel-pokemon-moves"
          role="tabpanel"
          aria-labelledby="tab-pokemon-moves"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void handleSyncMoves();
              }}
              disabled={isSyncing}
              className="rounded-md border border-black/[.12] bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.18] dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {isSyncing ? "동기화 중…" : "PokeAPI에서 기술 목록 동기화"}
            </button>
          </div>

          {syncError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {syncError}
            </p>
          ) : null}

          {syncResult ? (
            <div className="rounded-md border border-black/[.1] bg-neutral-50 p-4 text-sm dark:border-white/[.16] dark:bg-neutral-900/60">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                동기화 완료
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-neutral-700 dark:text-neutral-300">
                <li>전체 {syncResult.total}건</li>
                <li>신규 {syncResult.inserted}건</li>
                <li>업데이트 {syncResult.updated}건</li>
                {syncResult.syncedAt ? (
                  <li className="text-xs text-neutral-500">
                    처리 시각 {syncResult.syncedAt}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <input
              type="search"
              value={moveSearch}
              onChange={(e) => setMoveSearch(e.target.value)}
              placeholder="검색 (번호·한글명·영문명·타입·설명)"
              autoComplete="off"
              spellCheck={false}
              className="w-full max-w-md rounded-md border border-black/[.14] bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-white/[.2] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-300 sm:w-80"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:shrink-0">
              {isMoveListLoading
                ? "목록 불러오는 중…"
                : `총 ${moveRows.length}개 · 표시 ${filteredMoves.length}개`}
            </p>
          </div>

          {moveListError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{moveListError}</p>
          ) : isMoveListLoading && moveRows.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              목록을 불러오는 중입니다…
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-black/[.1] dark:border-white/[.16]">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/[.1] bg-neutral-50 dark:border-white/[.16] dark:bg-neutral-900/80">
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      No.
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      한글명
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      영문명
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      타입
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      분류
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      위력
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      PP
                    </th>
                    <th className="min-w-[12rem] px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      효과 요약
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMoves.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400"
                      >
                        {moveRows.length === 0
                          ? "저장된 기술이 없습니다. 위 버튼으로 동기화해 보세요."
                          : "검색 결과가 없습니다."}
                      </td>
                    </tr>
                  ) : (
                    filteredMoves.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-black/[.06] last:border-b-0 dark:border-white/[.08]"
                      >
                        <td className="px-3 py-2 tabular-nums text-neutral-600 dark:text-neutral-400">
                          {r.id}
                        </td>
                        <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                          {r.nameKo ?? (
                            <span className="font-normal text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                          {r.nameEn ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                          {r.typeName ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                          {r.damageClass ?? "—"}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-neutral-600 dark:text-neutral-400">
                          {r.power ?? "—"}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-neutral-600 dark:text-neutral-400">
                          {r.pp ?? "—"}
                        </td>
                        <td className="max-w-md px-3 py-2 text-neutral-600 dark:text-neutral-400">
                          {r.descKo ? (
                            r.descKo
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div
          id="panel-pokemon-abilities"
          role="tabpanel"
          aria-labelledby="tab-pokemon-abilities"
        >
          <PokemonAbilityListPage />
        </div>
      )}
    </div>
  );
}
