/**
 * Blizzard 페이지에 없는 기술 상세 수치 — API 응답 위에 덮어씁니다.
 *
 * key: "{heroId}#{abilityId}" (예: "sojourn#railgun")
 */

import {
  OW_MOUSE_BUTTON_LEFT_ICON,
  OW_MOUSE_BUTTON_RIGHT_ICON,
} from "./overwatchMouseButtonIcons";

export type OverwatchAbilityStatLine = {
  label: string;
  value: string;
};

export type OverwatchAbilityAttackOverride = {
  /** 입력 방식 (예: 좌클릭, 우클릭) */
  label: string;
  /** 게임 내 스킬 표기명 (예: 전자포). 비우면 label만 사용 */
  skillName?: string;
  /** 스킬 아이콘 — 생략 시 부모 기술과 동일 URL + spriteFrame */
  skillIconUrl?: string;
  /**
   * 부모 아이콘이 360×132 등 2프레임 스프라이트일 때: start=좌, end=우.
   * Blizzard는 우클릭 전용 PNG를 따로 주지 않음 — 탭 아이콘 우측 프레임 사용.
   */
  spriteFrame?: "start" | "end";
  /** 마우스 버튼 힌트 (작은 아이콘) */
  mouseIconUrl?: string;
  description?: string;
  stats?: OverwatchAbilityStatLine[];
};

export type OverwatchAbilityOverride = {
  /** 단일 표 (레거시) — attacks가 있으면 무시됨 */
  stats?: OverwatchAbilityStatLine[];
  /** 주 무기 등 좌/우클릭 분리 */
  attacks?: OverwatchAbilityAttackOverride[];
};

export const OVERWATCH_HERO_ABILITY_OVERRIDES: Record<string, OverwatchAbilityOverride> = {
  "sojourn#railgun": {
    attacks: [
      {
        label: "좌클릭",
        skillName: "전자포",
        spriteFrame: "start",
        mouseIconUrl: OW_MOUSE_BUTTON_LEFT_ICON,
        description: "빠르게 연사하며 에너지를 생성할 수 있는 전자포 사격입니다.",
        stats: [
          { label: "공격 유형", value: "투사체" },
          { label: "탄환 수", value: "45발" },
          { label: "재장전 시간", value: "1.2초" },
          { label: "공격력", value: "9" },
          { label: "공격 속도", value: "초당 16발 (DPS: 144)" },
          {
            label: "집탄율",
            value: "0°(5발) ~ 수직 1.6°, 수평 0.64°(12발)",
          },
          { label: "집탄율 회복 시간", value: "1초" },
          { label: "투사체 속도", value: "150m/s" },
          {
            label: "에너지 충전량",
            value: "5(기본), 10(치명타), 1(방벽, 오브젝트)",
          },
          { label: "최대 거리", value: "400m" },
          { label: "치명타 판정", value: "✓ (2배)" },
        ],
      },
      {
        label: "우클릭",
        skillName: "충전 사격",
        spriteFrame: "end",
        mouseIconUrl: OW_MOUSE_BUTTON_RIGHT_ICON,
        description:
          "저장된 에너지를 소모하여 적을 꿰뚫는 강력한 사격을 가합니다.",
        stats: [
          { label: "공격 유형", value: "히트스캔(적 관통 가능)" },
          {
            label: "공격력",
            value: "20(40m)~10(60m) ~ 120(40m)~60(60m)",
          },
          { label: "탄환 크기", value: "최소 0m ~ 최대 0.07m" },
          { label: "발사 후 회복 시간", value: "0.65초" },
          { label: "최대 거리", value: "400m" },
          { label: "치명타 판정", value: "✓ (1.5배, 최대 180)" },
        ],
      },
    ],
  },
  "emre#synthetic-burst-rifle": {
    attacks: [
      {
        label: "좌클릭",
        skillName: "3연발 점사 소총",
        spriteFrame: "start",
        mouseIconUrl: OW_MOUSE_BUTTON_LEFT_ICON,
        description: "3연발 무기를 발사합니다.",
        stats: [
          { label: "공격 유형", value: "히트스캔" },
          { label: "탄환 수", value: "36발" },
          { label: "공격 속도", value: "0.05초당 1발 (DPS: 137.5)" },
          { label: "발사 후 회복 시간", value: "0.38초" },
          { label: "재장전 시간", value: "1.8초" },
          {
            label: "공격력",
            value: "22×3(66) 최대 25m ~ 6.6×3(19.8) 40m",
          },
          { label: "집탄율", value: "~0.45°(2발)" },
          { label: "치명타 판정", value: "✓ (2배)" },
        ],
      },
      {
        label: "우클릭",
        skillName: "정조준",
        spriteFrame: "end",
        mouseIconUrl: OW_MOUSE_BUTTON_RIGHT_ICON,
        description:
          "누르고 있으면 저격 모드로 전환해서 정확도와 유효 사거리가 증가합니다.",
        stats: [
          { label: "시전 시간", value: "0.2초" },
          {
            label: "공격력",
            value: "22×3(66) 최대 35m ~ 6.6×3(19.8) 50m",
          },
          { label: "집탄율", value: "0°" },
        ],
      },
    ],
  },
  "genji#shuriken": {
    attacks: [
      {
        label: "좌클릭",
        skillName: "연달아 발사",
        spriteFrame: "start",
        mouseIconUrl: OW_MOUSE_BUTTON_LEFT_ICON,
        description: "투사체 3개를 연달아 던집니다.",
        stats: [
          { label: "공격력", value: "27×3(81)" },
          { label: "공격 속도", value: "0.1초당 1개, 3연발당 (DPS: 92)" },
          { label: "발사 후 회복 시간", value: "0.68초" },
          { label: "탄환 소모", value: "3연발당 1발" },
          { label: "투사체 속도", value: "75m/s" },
          { label: "최대 거리", value: "100m" },
          { label: "치명타 판정", value: "✓ (2배)" },
        ],
      },
      {
        label: "우클릭",
        skillName: "부채꼴 발사",
        spriteFrame: "end",
        mouseIconUrl: OW_MOUSE_BUTTON_RIGHT_ICON,
        description: "투사체 3개를 부채꼴로 던집니다.",
        stats: [
          { label: "공격력", value: "27×3(81)" },
          { label: "공격 속도", value: "0.68초당 1회 (DPS: 119)" },
          { label: "탄환 소모", value: "3연발당 1발" },
          { label: "탄퍼짐", value: "4.5°" },
          { label: "투사체 속도", value: "75m/s" },
          { label: "최대 거리", value: "100m" },
          { label: "치명타 판정", value: "✓ (2배)" },
        ],
      },
    ],
  },
};

export function overwatchAbilityOverrideKey(heroId: string, abilityId: string): string {
  return `${heroId.trim().toLowerCase()}#${abilityId.trim().toLowerCase()}`;
}
