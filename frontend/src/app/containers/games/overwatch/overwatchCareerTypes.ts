export type OverwatchCareerHero = {
  heroId: string | null;
  name: string;
  statValue: string;
};

export type OverwatchCareerStatCategory = {
  label: string;
  valueId: string;
  heroes: OverwatchCareerHero[];
};

export type OverwatchCareerDebug = {
  inputMode: string;
  battletag: string | null;
  searchUrl: string | null;
  searchFinalUrl: string | null;
  searchHttpStatus: number | null;
  searchResultCount: number | null;
  profileUrlKey: string;
  careerRequestUrl: string;
  careerFinalUrl: string;
  careerRedirected: boolean;
  careerHttpStatus: number;
  careerHtmlLength: number;
  htmlPageTitle: string | null;
  htmlLooksLikeLoginPage: boolean;
  careerPageLooksValid: boolean;
  htmlHasPlayerName: boolean;
  htmlHasQuickPlaySection: boolean;
  parsedHeroCount: number;
  note: string | null;
  searchResponseJson: string | null;
  parsedHeroesJson: string | null;
};

export type OverwatchCareerResponse = {
  profileId: string;
  careerUrl: string;
  battletag: string | null;
  displayName: string;
  title: string | null;
  queueMode: string;
  statLabel: string;
  activeStatIndex?: number;
  statCategories?: OverwatchCareerStatCategory[];
  heroes: OverwatchCareerHero[];
  debug?: OverwatchCareerDebug;
};
