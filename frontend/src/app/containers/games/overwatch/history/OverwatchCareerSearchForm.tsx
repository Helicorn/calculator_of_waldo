"use client";

import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { fetchOverwatchCareerByBattleTag } from "@/app/containers/games/overwatch/overwatchCareerActions";
import type { OverwatchCareerResponse } from "@/app/containers/games/overwatch/overwatchCareerTypes";

const inputClass =
  "w-full rounded-md border border-black/[.12] bg-[var(--background)] px-3 py-2 text-sm text-neutral-900 outline-none ring-offset-2 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/30 dark:border-white/[.18] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/30";

export function OverwatchCareerSearchForm() {
  const searchParams = useSearchParams();
  const debugMode =
    searchParams.get("debug") === "1" || searchParams.get("debug") === "true";

  const [battleTagName, setBattleTagName] = useState("");
  const [battleTagCode, setBattleTagCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [career, setCareer] = useState<OverwatchCareerResponse | null>(null);
  const [statIndex, setStatIndex] = useState(0);

  async function runLookup(name: string, tag: string) {
    setError(null);
    setCareer(null);
    setLoading(true);
    try {
      const result = await fetchOverwatchCareerByBattleTag(name, tag, {
        debug: debugMode,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCareer(result.data);
      setStatIndex(result.data.activeStatIndex ?? 0);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await runLookup(battleTagName, battleTagCode);
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
            htmlFor="ow-battletag-name"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            배틀태그 (닉네임)
          </label>
          <input
            id="ow-battletag-name"
            name="name"
            type="text"
            autoComplete="off"
            placeholder="예: 소별왕"
            value={battleTagName}
            onChange={(e) => setBattleTagName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex w-full min-w-0 flex-col gap-1.5 sm:max-w-[8rem]">
          <label
            htmlFor="ow-battletag-code"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            #
          </label>
          <input
            id="ow-battletag-code"
            name="tag"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="1234"
            value={battleTagCode}
            onChange={(e) => setBattleTagCode(e.target.value)}
            className={inputClass}
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
        aria-labelledby="ow-career-results-heading"
        className="rounded-lg border border-black/[.08] bg-black/[.02] p-6 dark:border-white/[.12] dark:bg-white/[.04]"
      >
        <h3
          id="ow-career-results-heading"
          className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
        >
          검색 결과
        </h3>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {!error && !career && !loading ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            배틀넷 배틀태그로 Blizzard career 페이지를 조회합니다. 프로필이
            비공개이면 검색되지 않을 수 있습니다.
            {debugMode ? (
              <>
                {" "}
                (URL에{" "}
                <code className="text-xs">?debug=true</code> — 호출 URL·HTTP
                상태가 결과에 표시됩니다.)
              </>
            ) : null}
          </p>
        ) : null}

        {career ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {career.displayName}
                {career.title ? (
                  <span className="ml-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {career.title}
                  </span>
                ) : null}
              </p>
              {career.battletag ? (
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {career.battletag}
                </p>
              ) : null}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                빠른 대전 · Top Heroes
              </p>
              {(career.statCategories ?? []).length > 0 ? (
                <label className="flex max-w-md flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    통계 항목
                  </span>
                  <select
                    value={statIndex}
                    onChange={(e) => setStatIndex(Number(e.target.value))}
                    className={inputClass}
                  >
                    {(career.statCategories ?? []).map((cat, index) => (
                      <option key={cat.valueId} value={index}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {career.statLabel}
                </p>
              )}
              <a
                href={career.careerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
              >
                Blizzard career에서 보기
              </a>
            </div>

            {career.debug ? (
              <details className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-neutral-700 dark:text-neutral-300">
                <summary className="cursor-pointer font-medium text-amber-800 dark:text-amber-200">
                  디버그 (URL · HTTP · 파싱)
                </summary>
                <dl className="mt-2 grid gap-1.5 font-mono">
                  <div>
                    <dt className="text-neutral-500">inputMode</dt>
                    <dd>{career.debug.inputMode}</dd>
                  </div>
                  {career.debug.searchUrl ? (
                    <div>
                      <dt className="text-neutral-500">searchUrl</dt>
                      <dd className="break-all">{career.debug.searchUrl}</dd>
                    </div>
                  ) : null}
                  {career.debug.searchHttpStatus != null ? (
                    <div>
                      <dt className="text-neutral-500">search HTTP</dt>
                      <dd>
                        {career.debug.searchHttpStatus} · results{" "}
                        {career.debug.searchResultCount}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-neutral-500">profileUrlKey</dt>
                    <dd className="break-all">{career.debug.profileUrlKey}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">careerRequestUrl</dt>
                    <dd className="break-all">{career.debug.careerRequestUrl}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">careerFinalUrl</dt>
                    <dd className="break-all">{career.debug.careerFinalUrl}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">career HTTP</dt>
                    <dd>
                      {career.debug.careerHttpStatus}
                      {career.debug.careerRedirected ? " · redirected" : ""} · HTML{" "}
                      {career.debug.careerHtmlLength.toLocaleString()} bytes
                    </dd>
                  </div>
                  {career.debug.htmlPageTitle ? (
                    <div>
                      <dt className="text-neutral-500">HTML title</dt>
                      <dd>{career.debug.htmlPageTitle}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-neutral-500">career page</dt>
                    <dd>
                      login={String(career.debug.htmlLooksLikeLoginPage)} valid=
                      {String(career.debug.careerPageLooksValid)} name=
                      {String(career.debug.htmlHasPlayerName)} heroes=
                      {career.debug.parsedHeroCount}
                    </dd>
                  </div>
                  {career.debug.note ? (
                    <div>
                      <dt className="text-neutral-500">note</dt>
                      <dd className="font-sans text-neutral-600 dark:text-neutral-400">
                        {career.debug.note}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </details>
            ) : null}

            {((career.statCategories ?? [])[statIndex]?.heroes ?? career.heroes ?? [])
              .length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                영웅 통계를 찾지 못했습니다.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-700">
                {((career.statCategories ?? [])[statIndex]?.heroes ?? career.heroes ?? []).map(
                  (hero, index) => (
                  <li
                    key={`${hero.heroId ?? hero.name}-${index}`}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {hero.name}
                    </span>
                    <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
                      {hero.statValue}
                    </span>
                  </li>
                  ),
                )}
              </ul>
            )}
          </div>
        ) : null}
      </section>
    </>
  );
}
