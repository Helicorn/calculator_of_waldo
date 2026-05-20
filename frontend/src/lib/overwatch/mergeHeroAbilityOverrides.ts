import type { OverwatchHeroDetailResponse } from "@/app/containers/games/overwatch/catalogs/overwatchHeroTypes";

import {
  OVERWATCH_HERO_ABILITY_OVERRIDES,
  overwatchAbilityOverrideKey,
} from "./overwatchHeroAbilityOverrides";

export function mergeHeroAbilityOverrides(
  hero: OverwatchHeroDetailResponse,
): OverwatchHeroDetailResponse {
  const heroId = hero.id.trim().toLowerCase();

  return {
    ...hero,
    abilities: (hero.abilities ?? []).map((ability) => {
      const override =
        OVERWATCH_HERO_ABILITY_OVERRIDES[
          overwatchAbilityOverrideKey(heroId, ability.id)
        ];
      if (override?.attacks?.length) {
        return {
          ...ability,
          attacks: override.attacks.map((attack, index) => ({
            label: attack.label,
            skillName: attack.skillName ?? null,
            skillIconUrl: attack.skillIconUrl ?? ability.iconUrl,
            spriteFrame:
              attack.spriteFrame ?? (index === 1 ? "end" : "start"),
            mouseIconUrl: attack.mouseIconUrl ?? null,
            description: attack.description ?? null,
            stats: attack.stats ?? [],
          })),
        };
      }
      if (!override?.stats?.length) {
        return ability;
      }
      return { ...ability, stats: override.stats };
    }),
  };
}
