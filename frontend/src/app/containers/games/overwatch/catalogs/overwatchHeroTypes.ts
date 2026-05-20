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

export type OverwatchHeroAbility = {
  id: string;
  name: string;
  iconUrl: string;
  description: string | null;
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
