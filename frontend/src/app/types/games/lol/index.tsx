/** Data Dragon `champion.json` 최상위 형태 */
export type ChampionDataJsonResponse = {
  type: string;
  format: string;
  version: string;
  data: Record<string, ChampionType>;
};

export type ChampionSkin = {
  id: number;
  num: number;
  name: string;
  chromas: boolean;
};

/** 패시브 / 스킬 아이콘 (Data Dragon `image.full` 파일명) */
export type ChampionSpellImageRef = {
  full: string;
};

export type ChampionPassive = {
  name: string;
  description: string;
  image: ChampionSpellImageRef;
};

export type ChampionSpell = {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  cooldownBurn: string;
  costBurn: string;
  image: ChampionSpellImageRef;
  maxrank?: number;
  cooldown?: number[];
  cost?: number[];
  range?: number[];
  rangeBurn?: string;
  /** Data Dragon `effect` 행 (e1…e10 등과 대응) */
  effect?: (number[] | null)[];
  effectBurn?: (string | null)[];
  datavalues?: Record<string, number | string>;
};

export type ChampionType = {
    version: string;
    id: string;
    key: string;
    name: string;
    title: string;
    blurb: string;
    skins: ChampionSkin[];
    passive: ChampionPassive;
    spells: ChampionSpell[];
    info: {
        attack: number;
        defense: number;
        magic: number;
        difficulty: number;
    };
    image: {
        full: string;
        sprite: string;
        group: string;
        x: number;
        y: number;
        w: number;
        h: number;
    };
    tags: string[];
    partype: string;
    stats: {
        hp: number;
        hpperlevel: number;
        mp: number;
        mpperlevel: number;
        movespeed: number;
        armor: number;
        armorperlevel: number;
        spellblock: number;
        spellblockperlevel: number;
        attackrange: number;
        hpregen: number;
        hpregenperlevel: number;
        mpregen: number;
        mpregenperlevel: number;
        crit: number;
        critperlevel: number;
        attackdamage: number;
        attackdamageperlevel: number;
        attackspeed: number;
        attackspeedperlevel: number;
    };
};