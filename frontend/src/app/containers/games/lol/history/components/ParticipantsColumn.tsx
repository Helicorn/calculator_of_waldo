import Image from "next/image";

import { ddragonChampionImageUrl } from "@/lib/lolDdragon";
import type { LolMatchSummary } from "../lolMatchHistoryActions";

type Props = {
  participants: LolMatchSummary["participants"];
  searchedRiotId: string;
  ddragonVersion: string | null;
  matchId: string;
  side: "left" | "right";
  onClickSummoner: (riotId: string) => void;
};

export function ParticipantsColumn({
  participants,
  searchedRiotId,
  ddragonVersion,
  matchId,
  side,
  onClickSummoner,
}: Props) {
  const sliced =
    side === "left" ? participants.slice(0, 5) : participants.slice(5, 10);

  return (
    <ul className="flex flex-col gap-1">
      {sliced.map((p, i) => (
        <li
          key={`${side}-${matchId}-${i}`}
          className={`truncate text-xs ${
            p.riotId === searchedRiotId
              ? "font-semibold text-neutral-900 dark:text-neutral-100"
              : "text-neutral-700 dark:text-neutral-300"
          }`}
        >
          <div className="flex min-w-0 items-center gap-1" title={p.riotId}>
            {ddragonVersion && p.championDdragonId ? (
              <Image
                src={ddragonChampionImageUrl(ddragonVersion, p.championDdragonId)}
                alt=""
                width={16}
                height={16}
                className="shrink-0 rounded-sm"
              />
            ) : null}
            <button
              type="button"
              className="min-w-0 truncate text-left underline-offset-2 hover:underline"
              onClick={() => onClickSummoner(p.riotId)}
            >
              {p.riotId}
            </button>
            {p.kills != null && p.deaths != null && p.assists != null ? (
              <span className="shrink-0"> ({p.kills}/{p.deaths}/{p.assists})</span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
