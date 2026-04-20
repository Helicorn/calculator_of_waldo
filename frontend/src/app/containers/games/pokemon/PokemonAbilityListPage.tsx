"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LoginResponse } from "@/app/types/login";
import { apiGetJsonIfOk, apiPatchJson } from "@/lib/apiFetch";
import { BACKEND_BASE_URL } from "@/lib/backendBaseUrl";

const WALDO_POKEMON_GAMES_URL = `${BACKEND_BASE_URL}/api/waldo/games/pokemon`;
const WALDO_POKEMON_ABILITIES_URL = `${WALDO_POKEMON_GAMES_URL}/abilities`;

function isAuthorityZero(authority: string | undefined | null): boolean {
  return authority != null && authority.trim() === "0";
}

type AbilityRow = {
  id: number | null;
  nameKo: string | null;
  nameEn: string | null;
  descKo: string | null;
};

type AbilityListResponse = Array<{
  id: number | null;
  nameKo: string | null;
  nameEn: string | null;
  descKo: string | null;
}>;

type EditableRow = {
  id: number;
  nameKo: string;
  descKo: string;
};

type PokemonAbilityListPageProps = {
  /**
   * `false`이면 갱신·수정 UI를 숨깁니다(게임 상세 `?detail=ability` 등).
   * 데이터 관리 화면에서는 넘기지 않거나 `true`(기본)로 둡니다.
   */
  showSyncAndEdit?: boolean;
};

/** 포켓몬 게임 페이지 `?detail=ability` 본문 등 */
export function PokemonAbilityListPage({
  showSyncAndEdit = true,
}: PokemonAbilityListPageProps) {
  const [rows, setRows] = useState<AbilityRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isBackendRefreshing, setIsBackendRefreshing] = useState(false);
  const [backendRefreshError, setBackendRefreshError] = useState<string | null>(
    null,
  );
  const [sessionUser, setSessionUser] = useState<LoginResponse | null | undefined>(
    undefined,
  );
  const [editMode, setEditMode] = useState(false);
  const [editableRows, setEditableRows] = useState<EditableRow[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editModeRef = useRef(false);

  const canEditAbilities =
    sessionUser != null && isAuthorityZero(sessionUser.authority);

  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);

  const loadAbilities = useCallback(async (signal: AbortSignal): Promise<AbilityRow[] | null> => {
    setIsListLoading(true);
    setListError(null);
    try {
      const response = await fetch(WALDO_POKEMON_ABILITIES_URL, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const refs = (await response.json()) as AbilityListResponse;
      if (signal.aborted) return null;
      setRows(refs);
      setIsListLoading(false);
      return refs;
    } catch {
      if (signal.aborted) return null;
      setListError("특성 목록을 DB에서 불러오는 중 오류가 발생했습니다.");
      setRows([]);
      setIsListLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadAbilities(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadAbilities]);

  useEffect(() => {
    let cancelled = false;
    void apiGetJsonIfOk<LoginResponse>("/api/me").then((me) => {
      if (!cancelled) setSessionUser(me);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const beginEditMode = useCallback(() => {
    const next = rows
      .filter((r): r is AbilityRow & { id: number } => r.id != null)
      .map((r) => ({
        id: r.id,
        nameKo: r.nameKo ?? "",
        descKo: r.descKo ?? "",
      }));
    setEditableRows(next);
    setEditMode(true);
    setSaveError(null);
  }, [rows]);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
    setEditableRows([]);
    setSaveError(null);
  }, []);

  const updateDraft = useCallback(
    (id: number, field: "nameKo" | "descKo", value: string) => {
      setEditableRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      );
    },
    [],
  );

  const handleSaveRow = useCallback(
    async (abilityId: number) => {
      const row = editableRows.find((r) => r.id === abilityId);
      if (!row) return;
      setSaveError(null);
      setSavingId(abilityId);
      try {
        await apiPatchJson(`/api/waldo/games/pokemon/abilities/${abilityId}`, {
          nameKo: row.nameKo,
          descKo: row.descKo,
        });
        const controller = new AbortController();
        const refreshed = await loadAbilities(controller.signal);
        if (refreshed && editModeRef.current) {
          setEditableRows(
            refreshed
              .filter((r): r is AbilityRow & { id: number } => r.id != null)
              .map((r) => ({
                id: r.id,
                nameKo: r.nameKo ?? "",
                descKo: r.descKo ?? "",
              })),
          );
        }
      } catch (e: unknown) {
        setSaveError(
          e instanceof Error ? e.message : "저장에 실패했습니다. 권한·로그인을 확인해 주세요.",
        );
      } finally {
        setSavingId(null);
      }
    },
    [editableRows, loadAbilities],
  );

  const handleBackendRefresh = useCallback(async () => {
    setBackendRefreshError(null);
    setIsBackendRefreshing(true);
    try {
      const response = await fetch(WALDO_POKEMON_GAMES_URL, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`서버 응답 ${response.status}`);
      }
      const controller = new AbortController();
      await loadAbilities(controller.signal);
    } catch {
      setBackendRefreshError("갱신 요청에 실패했습니다. 백엔드 주소를 확인해 주세요.");
    } finally {
      setIsBackendRefreshing(false);
    }
  }, [loadAbilities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const idStr = String(r.id ?? "");
      const ko = (r.nameKo ?? "").toLowerCase();
      const en = (r.nameEn ?? "").toLowerCase();
      const desc = (r.descKo ?? "").toLowerCase();
      return idStr.includes(q) || ko.includes(q) || en.includes(q) || desc.includes(q);
    });
  }, [rows, search]);

  const showSaveColumn = showSyncAndEdit && editMode && canEditAbilities;
  const inputClass =
    "w-full min-w-[6rem] rounded border border-black/[.14] bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-white/[.2] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-300";
  const textareaClass = `${inputClass} min-h-[4rem] resize-y font-normal`;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 text-left">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          특성
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          DB에 저장된 특성 목록입니다. 검색어로 번호·한글명·영문명·설명을 필터할 수
          있습니다.
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색 (예: 1, 위력, 비가 오면)"
          autoComplete="off"
          spellCheck={false}
          className="w-full max-w-md rounded-md border border-black/[.14] bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-white/[.2] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-300 sm:w-80"
        />
        <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0 sm:gap-3">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isListLoading
              ? "목록 불러오는 중…"
              : `총 ${rows.length}개 · 표시 ${filtered.length}개`}
          </p>
          {showSyncAndEdit ? (
            <>
              <button
                type="button"
                onClick={() => {
                  void handleBackendRefresh();
                }}
                disabled={isBackendRefreshing || isListLoading}
                className="rounded-md border border-black/[.12] bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.18] dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {isBackendRefreshing ? "요청 중…" : "갱신"}
              </button>
              {canEditAbilities ? (
                <button
                  type="button"
                  onClick={() => {
                    if (editMode) exitEditMode();
                    else beginEditMode();
                  }}
                  disabled={isListLoading}
                  className="rounded-md border border-black bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
                >
                  {editMode ? "편집 종료" : "수정"}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {showSyncAndEdit && backendRefreshError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {backendRefreshError}
        </p>
      ) : null}

      {saveError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
      ) : null}

      {listError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{listError}</p>
      ) : isListLoading && rows.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          목록을 불러오는 중입니다…
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-black/[.1] dark:border-white/[.16]">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/[.1] bg-neutral-50 dark:border-white/[.16] dark:bg-neutral-900/80">
                <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                  No.
                </th>
                <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                  한글명
                </th>
                <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                  설명
                </th>
                {showSaveColumn ? (
                  <th className="w-24 whitespace-nowrap px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                    저장
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const draft =
                  r.id != null
                    ? editableRows.find((e) => e.id === r.id)
                    : undefined;
                const editingRow = showSaveColumn && draft != null;
                return (
                <tr
                  key={r.id ?? `row-${r.nameEn}-${r.nameKo}`}
                  className="border-b border-black/[.06] last:border-b-0 dark:border-white/[.08]"
                >
                  <td className="px-3 py-2 tabular-nums text-neutral-600 dark:text-neutral-400">
                    {r.id ?? "-"}
                  </td>
                  <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                    {editingRow ? (
                      <input
                        type="text"
                        value={draft.nameKo}
                        onChange={(e) =>
                          updateDraft(r.id as number, "nameKo", e.target.value)
                        }
                        className={inputClass}
                        autoComplete="off"
                        spellCheck={false}
                        aria-label={`특성 ${r.id} 한글명`}
                      />
                    ) : r.nameKo ?? r.nameEn ?? (
                      <span className="font-normal text-neutral-400">…</span>
                    )}
                  </td>
                  <td className="max-w-xl px-3 py-2 text-neutral-600 dark:text-neutral-400">
                    {editingRow ? (
                      <textarea
                        value={draft.descKo}
                        onChange={(e) =>
                          updateDraft(r.id as number, "descKo", e.target.value)
                        }
                        className={textareaClass}
                        rows={3}
                        aria-label={`특성 ${r.id} 설명`}
                      />
                    ) : r.descKo ? (
                      r.descKo
                    ) : (
                      <span className="text-neutral-400">설명 없음</span>
                    )}
                  </td>
                  {showSaveColumn ? (
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      {r.id != null && draft != null ? (
                        <button
                          type="button"
                          disabled={savingId !== null}
                          onClick={() => {
                            void handleSaveRow(r.id as number);
                          }}
                          className="rounded-md border border-black/[.12] bg-white px-2 py-1 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.18] dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                          {savingId === r.id ? "저장 중…" : "저장"}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
