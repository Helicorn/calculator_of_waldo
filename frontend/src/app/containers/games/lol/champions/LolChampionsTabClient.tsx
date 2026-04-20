"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ChampionType } from "@/app/types/games/lol";
import { ddragonChampionImageUrl } from "@/lib/lolDdragon";

type SortMode = "ko" | "en";

function sortChampions(
  champions: ChampionType[],
  mode: SortMode,
): ChampionType[] {
  const copy = [...champions];
  if (mode === "ko") {
    copy.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  } else {
    copy.sort((a, b) =>
      a.id.localeCompare(b.id, "en", { sensitivity: "base" }),
    );
  }
  return copy;
}

const btnBase =
  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors";
const btnIdle =
  "border-black/[.12] text-neutral-700 hover:bg-black/[.05] dark:border-white/[.18] dark:text-neutral-300 dark:hover:bg-white/[.06]";
const btnActive =
  "border-transparent bg-foreground text-background dark:bg-foreground dark:text-background";

type LolChampionsTabClientProps = {
  version: string;
  champions: ChampionType[];
};

export function LolChampionsTabClient({
  version,
  champions,
}: LolChampionsTabClientProps) {
  const [sortMode, setSortMode] = useState<SortMode>("ko");

  const sorted = useMemo(
    () => sortChampions(champions, sortMode),
    [champions, sortMode],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${btnBase} ${sortMode === "ko" ? btnActive : btnIdle}`}
          onClick={() => setSortMode("ko")}
          aria-pressed={sortMode === "ko"}
        >
          한글 순
        </button>
        <button
          type="button"
          className={`${btnBase} ${sortMode === "en" ? btnActive : btnIdle}`}
          onClick={() => setSortMode("en")}
          aria-pressed={sortMode === "en"}
        >
          영어 순
        </button>
      </div>
      <div className="flex w-full flex-wrap content-start gap-2">
        {sorted.map((champion) => (
          <Link
            key={champion.id}
            href={`/games/lol/champion/${encodeURIComponent(champion.id)}`}
            className="shrink-0 rounded-lg outline-none ring-offset-2 ring-offset-[var(--background)] transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
            title={`${champion.name} 정보`}
          >
            <Image
              src={ddragonChampionImageUrl(version, champion.id)}
              alt={champion.name}
              width={60}
              height={60}
              className="rounded-lg border border-black/[.08] bg-black/[.03] dark:border-white/[.12] dark:bg-white/[.04]"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
