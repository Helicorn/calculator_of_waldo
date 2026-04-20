/** 헤더 카테고리·/games/[slug] 라우트와 동일한 목록 */
export const GAME_CATEGORIES = [
  { slug: "lol", label: "리그 오브 레전드" },
  { slug: "overwatch", label: "오버워치" },
  { slug: "wow", label: "월드 오브 워크래프트" },
  { slug: "pokemon", label: "포켓몬" },
] as const;

export type GameSlug = (typeof GAME_CATEGORIES)[number]["slug"];

export const GAME_TITLE_BY_SLUG: Record<GameSlug, string> =
  Object.fromEntries(
    GAME_CATEGORIES.map((c) => [c.slug, c.label]),
  ) as Record<GameSlug, string>;

export const GAME_SLUGS: GameSlug[] = GAME_CATEGORIES.map((c) => c.slug);

export function isGameSlug(s: string): s is GameSlug {
  return (GAME_SLUGS as readonly string[]).includes(s);
}

/** 게임 페이지 왼쪽 상세 카테고리 (쿼리 `?detail=` id) */
export type GameDetailItem = { id: string; label: string };

export const GAME_DETAIL_ITEMS: Record<GameSlug, GameDetailItem[]> = {
  lol: [
    { id: "champions", label: "챔피언 정보" },
    { id: "patch", label: "패치 노트" },
    { id: "esports", label: "e스포츠" },
    { id: "community", label: "커뮤니티" },
    { id: "history", label: "전적 검색" },
  ],
  overwatch: [
    { id: "overview", label: "개요" },
    { id: "heroes", label: "영웅" },
    { id: "season", label: "시즌" },
    { id: "news", label: "뉴스" },
  ],
  wow: [
    { id: "overview", label: "개요" },
    { id: "classes", label: "직업" },
    { id: "dungeons", label: "던전" },
    { id: "pvp", label: "PvP" },
  ],
  pokemon: [
    { id: "overview", label: "개요" },
    { id: "pokedex", label: "도감" },
    { id: "ability", label: "특성" },
    { id: "damage", label: "피해량 계산" },
  ],
};

export function resolveGameDetailId(
  slug: GameSlug,
  requested: string | undefined,
): string {
  const items = GAME_DETAIL_ITEMS[slug];
  if (requested && items.some((i) => i.id === requested)) {
    return requested;
  }
  return items[0]!.id;
}
