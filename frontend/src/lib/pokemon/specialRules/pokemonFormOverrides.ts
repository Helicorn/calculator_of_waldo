/**
 * 피해량 계산에서 기본 포켓몬 정보를 폼(메가진화 포함) 기준으로 덮어쓸 때 사용하는 스키마.
 *
 * key 규칙:
 * - 기본 포켓몬명 + "#" + 폼 키
 * - 예: "리자몽#mega_x", "뮤츠#mega_y", "가디안#mega"
 */

export type PokemonTypeName =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export type PokemonStatName =
  | "hp"
  | "attack"
  | "defense"
  | "special-attack"
  | "special-defense"
  | "speed";

export type FormKind = "mega" | "regional" | "primal" | "other";

export type PokemonFormOverride = {
  /** UI 표기 이름 */
  displayName: string;
  /** 폼 분류 */
  kind: FormKind;
  /** 타입 덮어쓰기 (길이 1~2 권장) */
  types?: PokemonTypeName[];
  /** 종족값 덮어쓰기 */
  baseStats?: Partial<Record<PokemonStatName, number>>;
  /** 필요 시 계산/표시용 메모 */
  note?: string;
};

/**
 * 포켓몬 폼 오버라이드 맵.
 * 현재는 스키마만 정의하고, 실제 값은 차후 단계에서 채웁니다.
 */
export const POKEMON_FORM_OVERRIDES: Record<string, PokemonFormOverride> = {
  "리자몽#mega_x": {
    displayName: "엑자몽",
    kind: "mega",
    types: ["fire", "dragon"],
    baseStats: {
      hp: 78,
      attack: 130,
      defense: 111,
      "special-attack": 130,
      "special-defense": 85,
      speed: 100,
    },
    note: "메가리자몽X",
  },
  "리자몽#mega_y": {
    displayName: "와자몽",
    kind: "mega",
    types: ["fire", "flying"],
    baseStats: {
      hp: 78,
      attack: 104,
      defense: 78,
      "special-attack": 159,
      "special-defense": 115,
      speed: 100,
    },
    note: "메가리자몽Y",
  },
};
