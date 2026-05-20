import Image from "next/image";

import { OverwatchGameIcon } from "@/app/containers/games/overwatch/catalogs/OverwatchGameIcon";
import type {
  OverwatchHeroAbility,
  OverwatchHeroAbilityAttack,
  OverwatchHeroDetailResponse,
} from "@/app/containers/games/overwatch/catalogs/overwatchHeroTypes";

type AbilityRow =
  | { kind: "simple"; ability: OverwatchHeroAbility }
  | {
      kind: "split";
      ability: OverwatchHeroAbility;
      attacks: OverwatchHeroAbilityAttack[];
    };

function groupAbilityRows(abilities: OverwatchHeroAbility[]): AbilityRow[] {
  return abilities.map((ability) =>
    ability.attacks?.length
      ? { kind: "split" as const, ability, attacks: ability.attacks }
      : { kind: "simple" as const, ability },
  );
}

const SPLIT_ABILITY_ICON_SIZE = 56;

function OverwatchAbilityAttackHeader({
  attack,
  showSkillIcon,
  className,
}: {
  attack: OverwatchHeroAbilityAttack;
  showSkillIcon: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-14 items-center gap-2 ${className ?? ""}`}
    >
      {showSkillIcon && attack.skillIconUrl ? (
        <OverwatchGameIcon
          src={attack.skillIconUrl}
          alt={attack.skillName ?? attack.label}
          size={SPLIT_ABILITY_ICON_SIZE}
          spriteFrame={attack.spriteFrame === "end" ? "end" : "start"}
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {attack.skillName ?? attack.label}
        </span>
        {attack.mouseIconUrl ? (
          <Image
            src={attack.mouseIconUrl}
            alt=""
            width={22}
            height={22}
            unoptimized
            className="shrink-0 opacity-90"
          />
        ) : null}
      </div>
    </div>
  );
}

function OverwatchAbilityAttackBody({
  ability,
  attack,
  className,
}: {
  ability: OverwatchHeroAbility;
  attack: OverwatchHeroAbilityAttack;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className ?? ""}`}>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {ability.name} · {attack.label}
      </p>
      {attack.description ? (
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          {attack.description}
        </p>
      ) : null}
      {attack.stats.length > 0 ? (
        <dl className="mt-1 grid grid-cols-1 gap-x-3 gap-y-1 text-xs">
          {attack.stats.map((stat) => (
            <div key={stat.label} className="contents">
              <dt className="text-neutral-500 dark:text-neutral-400">
                {stat.label}
              </dt>
              <dd className="text-neutral-800 dark:text-neutral-200">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function OverwatchSplitAbilityCard({
  ability,
  attacks,
}: {
  ability: OverwatchHeroAbility;
  attacks: OverwatchHeroAbilityAttack[];
}) {
  const columnDivider =
    "border-l border-black/[.08] pl-3 dark:border-white/[.12]";

  return (
    <div className="grid grid-cols-2">
      {attacks.map((attack, index) => (
        <OverwatchAbilityAttackHeader
          key={`${attack.label}-header`}
          attack={attack}
          showSkillIcon={index === 0}
          className={index === 0 ? "pr-3" : columnDivider}
        />
      ))}
      <hr className="col-span-2 border-0 border-t border-black/[.08] dark:border-white/[.12]" />
      {attacks.map((attack, index) => (
        <OverwatchAbilityAttackBody
          key={`${attack.label}-body`}
          ability={ability}
          attack={attack}
          className={`pt-2 ${index === 0 ? "pr-3" : columnDivider}`}
        />
      ))}
    </div>
  );
}

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
          <ul className="flex flex-col gap-3">
            {groupAbilityRows(abilities).map((row) =>
              row.kind === "split" ? (
                <li
                  key={row.ability.id}
                  className="rounded-lg border border-black/[.08] bg-black/[.02] p-3 dark:border-white/[.12] dark:bg-white/[.04]"
                >
                  <OverwatchSplitAbilityCard
                    ability={row.ability}
                    attacks={row.attacks}
                  />
                </li>
              ) : (
                <li
                  key={row.ability.id}
                  className="flex gap-3 rounded-lg border border-black/[.08] bg-black/[.02] p-3 dark:border-white/[.12] dark:bg-white/[.04]"
                >
                  {row.ability.iconUrl ? (
                    <OverwatchGameIcon
                      src={row.ability.iconUrl}
                      alt={row.ability.name}
                      size={56}
                    />
                  ) : null}
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {row.ability.name}
                    </span>
                    {row.ability.description ? (
                      <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {row.ability.description}
                      </p>
                    ) : null}
                    {row.ability.stats && row.ability.stats.length > 0 ? (
                      <dl className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 border-t border-black/[.06] pt-2 text-xs dark:border-white/[.08]">
                        {row.ability.stats.map((stat) => (
                          <div key={stat.label} className="contents">
                            <dt className="text-neutral-500 dark:text-neutral-400">
                              {stat.label}
                            </dt>
                            <dd className="text-neutral-800 dark:text-neutral-200">
                              {stat.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                </li>
              )
            )}
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
                  <OverwatchGameIcon src={perk.iconUrl} alt={perk.name} size={48} />
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
                  <OverwatchGameIcon src={talent.iconUrl} alt={talent.name} size={44} />
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
