export type RotomFormMoveOverride = {
  addMoveIds: number[];
};

/**
 * 로토무 폼별 추가 기술.
 * key: RotomFormKey와 동일한 문자열
 */
export const ROTOM_FORM_MOVE_OVERRIDES: Record<string, RotomFormMoveOverride> = {
  base: { addMoveIds: [] },
  heat: { addMoveIds: [315] }, // 오버히트
  wash: { addMoveIds: [56] }, // 하이드로펌프
  frost: { addMoveIds: [59] }, // 눈보라
  fan: { addMoveIds: [403] }, // 에어슬래시
  mow: { addMoveIds: [437] }, // 리프스톰
};
