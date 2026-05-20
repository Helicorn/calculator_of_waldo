"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { OverwatchHeroSummary } from "@/app/containers/games/overwatch/catalogs/overwatchHeroTypes";

type RoleFilter = "all" | "tank" | "damage" | "support";

const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "tank", label: "돌격" },
  { id: "damage", label: "공격" },
  { id: "support", label: "지원" },
];

const btnBase =
  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors";
const btnIdle =
  "border-black/[.12] text-neutral-700 hover:bg-black/[.05] dark:border-white/[.18] dark:text-neutral-300 dark:hover:bg-white/[.06]";
const btnActive =
  "border-transparent bg-foreground text-background dark:bg-foreground dark:text-background";

export function OverwatchHeroesTabClient({
  heroes,
}: {
  heroes: OverwatchHeroSummary[];
}) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filtered = useMemo(() => {
    const list =
      roleFilter === "all"
        ? heroes
        : heroes.filter((h) => h.role === roleFilter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [heroes, roleFilter]);

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Blizzard 공식 영웅 페이지 기준 {heroes.length}명 · 역할별 필터
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${btnBase} ${roleFilter === item.id ? btnActive : btnIdle}`}
            onClick={() => setRoleFilter(item.id)}
            aria-pressed={roleFilter === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex w-full flex-wrap content-start gap-3">
        {filtered.map((hero) => (
          <Link
            key={hero.id}
            href={`/games/overwatch/hero/${encodeURIComponent(hero.id)}`}
            className="group flex w-[5.5rem] flex-col items-center gap-1.5 rounded-lg p-1 outline-none ring-offset-2 ring-offset-[var(--background)] transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
            title={`${hero.name} · ${hero.roleLabel}`}
          >
            <div className="relative">
              <Image
                src={hero.portraitUrl}
                alt={hero.name}
                width={72}
                height={72}
                unoptimized
                className="rounded-full border border-black/[.08] bg-black/[.03] object-cover dark:border-white/[.12] dark:bg-white/[.04]"
              />
              {hero.isNew ? (
                <span className="absolute -right-1 -top-1 rounded bg-amber-500 px-1 py-0.5 text-[10px] font-semibold text-white">
                  NEW
                </span>
              ) : null}
            </div>
            <span className="max-w-full truncate text-center text-xs font-medium text-neutral-800 dark:text-neutral-200">
              {hero.name}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {hero.roleLabel}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
