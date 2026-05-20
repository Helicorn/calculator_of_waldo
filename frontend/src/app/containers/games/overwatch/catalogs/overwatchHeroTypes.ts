export type OverwatchHeroSummary = {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  subrole: string | null;
  portraitUrl: string;
  isNew: boolean;
};

export type OverwatchHeroListResponse = {
  sourceUrl: string;
  heroes: OverwatchHeroSummary[];
};

export type OverwatchHeroFact = {
  type: string;
  label: string;
  value: string;
};

export type OverwatchHeroAbilityStat = {
  label: string;
  value: string;
};

export type OverwatchHeroAbilityAttackSpriteFrame = "start" | "end";

export type OverwatchHeroAbilityAttack = {
  /** 입력 방식 힌트 (예: 좌클릭, 우클릭) */
  label: string;
  /** 게임 내 스킬 이름 (예: 전자포) — 없으면 label만 표시 */
  skillName?: string | null;
  /** 스킬 아이콘 URL — 없으면 병합 시 부모 기술 icon 사용 */
  skillIconUrl?: string | null;
  /** 부모 아이콘이 가로 스프라이트일 때 표시 프레임 */
  spriteFrame?: OverwatchHeroAbilityAttackSpriteFrame | null;
  /** 마우스 버튼 등 작은 아이콘 */
  mouseIconUrl?: string | null;
  description?: string | null;
  stats: OverwatchHeroAbilityStat[];
};

export type OverwatchHeroAbility = {
  id: string;
  name: string;
  iconUrl: string;
  description: string | null;
  /** 수동 보정 — 단일 표 (attacks 없을 때) */
  stats?: OverwatchHeroAbilityStat[];
  /** 수동 보정 — 좌/우클릭 등 분리 */
  attacks?: OverwatchHeroAbilityAttack[];
};

export type OverwatchHeroPerk = {
  name: string;
  iconUrl: string;
  description: string | null;
  category: string | null;
  tierLabel: string | null;
};

export type OverwatchHeroTalent = {
  name: string;
  description: string | null;
  iconUrl: string;
};

export type OverwatchHeroStorySection = {
  group: number;
  storyId: string;
  label: string;
  paragraphs: string[];
  imageUrl: string | null;
};

export type OverwatchHeroDetailResponse = {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  subrole: string | null;
  portraitUrl: string | null;
  description: string | null;
  storyIntro: string | null;
  detailUrl: string;
  facts: OverwatchHeroFact[];
  abilities: OverwatchHeroAbility[];
  perks: OverwatchHeroPerk[];
  perksIntro: string | null;
  stadiumIntro: string | null;
  talents: OverwatchHeroTalent[];
  storySections: OverwatchHeroStorySection[];
};

