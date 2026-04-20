import Image from "next/image";

import { ddragonChampionImageUrl, ddragonSpellImageUrl } from "@/lib/lolDdragon";
import type { LolMatchSummary } from "../lolMatchHistoryActions";
import { ParticipantsColumn } from "./ParticipantsColumn";

type Props = {
  match: LolMatchSummary;
  ddragonVersion: string | null;
  onClickSummoner: (riotId: string) => void;
};

export function MatchSummaryItem({ match, ddragonVersion, onClickSummoner }: Props) {
  const portraitSrc =
    ddragonVersion &&
    match.searchedChampionDdragonId &&
    ddragonChampionImageUrl(ddragonVersion, match.searchedChampionDdragonId);
  const spell1Src =
    ddragonVersion &&
    match.searchedSummonerSpell1ImageFull &&
    ddragonSpellImageUrl(ddragonVersion, match.searchedSummonerSpell1ImageFull);
  const spell2Src =
    ddragonVersion &&
    match.searchedSummonerSpell2ImageFull &&
    ddragonSpellImageUrl(ddragonVersion, match.searchedSummonerSpell2ImageFull);

  return (
    <li className="flex gap-3 rounded-md border border-black/[.08] bg-[var(--background)] px-3 py-2 text-xs dark:border-white/[.12]">
      {portraitSrc ? (
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <div className="relative h-14 w-14 overflow-hidden rounded-md border border-black/[.08] dark:border-white/[.12]">
            <Image src={portraitSrc} alt="챔피언 초상화" width={56} height={56} className="object-cover object-center" />
          </div>
          {spell1Src || spell2Src ? (
            <div className="mt-0.5 flex w-14 items-center gap-0">
              {spell1Src ? <Image src={spell1Src} alt="소환사 스펠 1" width={28} height={28} className="rounded-sm" /> : null}
              {spell2Src ? <Image src={spell2Src} alt="소환사 스펠 2" width={28} height={28} className="rounded-sm" /> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="mt-2 grid grid-cols-2 gap-3">
          <ParticipantsColumn
            participants={match.participants}
            searchedRiotId={match.searchedRiotId}
            ddragonVersion={ddragonVersion}
            matchId={match.matchId}
            side="left"
            onClickSummoner={onClickSummoner}
          />
          <ParticipantsColumn
            participants={match.participants}
            searchedRiotId={match.searchedRiotId}
            ddragonVersion={ddragonVersion}
            matchId={match.matchId}
            side="right"
            onClickSummoner={onClickSummoner}
          />
        </div>
      </div>
    </li>
  );
}
