export type SpecialMoveRule =
  | {
      kind: "power_sequence";
      powers: number[];
      note: string;
    }
  | {
      kind: "weather_power_multiplier";
      multiplier: number;
      weatherTypeByWeather?: Partial<
        Record<"sunny" | "rain" | "sandstorm" | "snow", string>
      >;
      note: string;
    }
  | {
      kind: "stat_source_override";
      attackStatOwner: "attacker" | "defender";
      attackRankOwner?: "attacker" | "defender";
      note: string;
    };

export const AEGISLASH_BLADE_BASE_STATS = {
  hp: 60,
  attack: 150,
  defense: 50,
  "special-attack": 150,
  "special-defense": 50,
  speed: 60,
} as const;

export const AEGISLASH_SHIELD_BASE_STATS = {
  hp: 60,
  attack: 50,
  defense: 150,
  "special-attack": 50,
  "special-defense": 150,
  speed: 60,
} as const;

export const KINGS_SHIELD_MOVE_ID = 588;

/**
 * 기술별 특수 룰.
 * key: PokeAPI move id
 */
export const SPECIAL_MOVE_RULES: Record<number, SpecialMoveRule> = {
  // Triple Axel
  813: {
    kind: "power_sequence",
    powers: [20, 40, 60],
    note: "3연타(위력 20→40→60)",
  },
  // Weather Ball
  311: {
    kind: "weather_power_multiplier",
    multiplier: 2,
    weatherTypeByWeather: {
      sunny: "fire",
      rain: "water",
      sandstorm: "rock",
      snow: "ice",
    },
    note: "날씨 상태에서 위력 2배, 타입 변경",
  },
  // Foul Play
  492: {
    kind: "stat_source_override",
    attackStatOwner: "defender",
    attackRankOwner: "defender",
    note: "상대 공격 스탯·공격 랭크를 사용",
  },
};
