import Image from "next/image";

import type { OverwatchHeroDetailResponse } from "@/app/containers/games/overwatch/catalogs/overwatchHeroTypes";

/** Blizzard 특전/파워 아이콘은 밝은 선화 PNG라 어두운 배경이 필요함 */
const owPerkIconClass =
  "shrink-0 rounded-md bg-neutral-800 object-contain p-1 dark:bg-neutral-700";

export function OverwatchHeroDetailView({ hero }: { hero: OverwatchHeroDetailResponse }) {
  const facts = hero.facts ?? [];
  const abilities = hero.abilities ?? [];
  const perks = hero.perks ?? [];
  const talents = hero.talents ?? [];
  const storySections = hero.storySections ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {hero.portraitUrl ? (
          <Image
            src={hero.portraitUrl}
            alt={hero.name}
            width={160}
            height={160}
            unoptimized
            className="shrink-0 rounded-full border border-black/[.08] object-cover dark:border-white/[.12]"
          />
        ) : null}
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {hero.roleLabel}
            {hero.subrole ? ` · ${hero.subrole}` : ""}
          </p>
          {facts.length > 0 ? (
            <ul className="flex flex-col gap-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              {facts.map((fact) => (
                <li key={fact.type}>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {fact.label}
                  </span>
                  {": "}
                  {fact.value}
                </li>
              ))}
            </ul>
          ) : null}
          <a
            href={hero.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            Blizzard에서 보기
          </a>
        </div>
      </div>

      {hero.description ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            소개
          </h3>
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {hero.description}
          </p>
        </section>
      ) : null}

      {abilities.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            기술
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {abilities.map((ability) => (
              <li
                key={ability.id}
                className="flex gap-3 rounded-lg border border-black/[.08] bg-black/[.02] p-3 dark:border-white/[.12] dark:bg-white/[.04]"
              >
                <Image
                  src={ability.iconUrl}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="shrink-0 rounded-md bg-black/[.04] dark:bg-white/[.06]"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {ability.name}
                  </span>
                  {ability.description ? (
                    <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {ability.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {perks.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            특전
          </h3>
          {hero.perksIntro ? (
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {hero.perksIntro}
            </p>
          ) : null}
          <ul className="flex flex-col gap-3">
            {perks.map((perk) => (
              <li
                key={`${perk.category ?? "perk"}-${perk.name}`}
                className="flex gap-3 rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.12]"
              >
                {perk.iconUrl ? (
                  <Image
                    src={perk.iconUrl}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className={owPerkIconClass}
                  />
                ) : null}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    {perk.name}
                    {perk.tierLabel ? (
                      <span className="ml-1 font-normal text-neutral-500">
                        ({perk.tierLabel})
                      </span>
                    ) : null}
                  </span>
                  {perk.description ? (
                    <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {perk.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {talents.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            스타디움 파워
          </h3>
          {hero.stadiumIntro ? (
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {hero.stadiumIntro}
            </p>
          ) : null}
          <ul className="grid gap-2 sm:grid-cols-2">
            {talents.map((talent) => (
              <li
                key={talent.name}
                className="flex gap-2 rounded-lg border border-black/[.08] bg-black/[.02] p-2 dark:border-white/[.12] dark:bg-white/[.04]"
              >
                {talent.iconUrl ? (
                  <Image
                    src={talent.iconUrl}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    className={owPerkIconClass}
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    {talent.name}
                  </p>
                  {talent.description ? (
                    <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {talent.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {storySections.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            이야기
          </h3>
          {hero.storyIntro ? (
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {hero.storyIntro}
            </p>
          ) : null}
          <div className="flex flex-col gap-4">
            {storySections.map((section) => (
              <article
                key={section.group}
                className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-3 dark:border-white/[.12]"
              >
                <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {section.label}
                </h4>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
                  >
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <details
        open
        className="rounded-lg border border-amber-500/40 bg-amber-500/[.06] dark:border-amber-400/30 dark:bg-amber-400/[.08]"
      >
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-amber-900 dark:text-amber-200">
          API 응답 JSON (디버그)
        </summary>
        <pre className="max-h-[min(70vh,32rem)] overflow-auto border-t border-amber-500/30 px-3 py-3 text-xs leading-relaxed text-neutral-800 dark:border-amber-400/20 dark:text-neutral-200">
          {JSON.stringify(hero, null, 2)}
        </pre>
      </details>
    </div>
  );
}
