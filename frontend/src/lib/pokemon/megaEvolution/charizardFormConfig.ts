import { POKEMON_FORM_OVERRIDES } from "@/lib/pokemon/specialRules/pokemonFormOverrides";

export type CharizardFormKey = "base" | "mega_x" | "mega_y";

export const CHARIZARD_FORM_OPTIONS: Array<{
  key: CharizardFormKey;
  label: string;
}> = [
  { key: "base", label: "기본" },
  {
    key: "mega_x",
    label: POKEMON_FORM_OVERRIDES["리자몽#mega_x"]?.displayName ?? "엑자몽",
  },
  {
    key: "mega_y",
    label: POKEMON_FORM_OVERRIDES["리자몽#mega_y"]?.displayName ?? "와자몽",
  },
];

export function isCharizardName(name: string): boolean {
  return name.trim() === "리자몽";
}

export function getCharizardFormOverride(form: CharizardFormKey) {
  if (form === "base") return undefined;
  return POKEMON_FORM_OVERRIDES[`리자몽#${form}`];
}
