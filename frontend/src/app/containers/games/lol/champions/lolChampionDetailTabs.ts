export const CHAMPION_DETAIL_TABS = [
  { id: "overview", label: "개요" },
  { id: "skins", label: "스킨" },
  { id: "stats", label: "기본 능력치" },
] as const;

export type ChampionDetailTabId = (typeof CHAMPION_DETAIL_TABS)[number]["id"];

export function resolveChampionDetailTab(
  raw: string | undefined,
): ChampionDetailTabId {
  const ids = CHAMPION_DETAIL_TABS.map((t) => t.id);
  if (raw && (ids as readonly string[]).includes(raw)) {
    return raw as ChampionDetailTabId;
  }
  return "overview";
}
