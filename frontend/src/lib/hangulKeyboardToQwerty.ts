/**
 * 한글 두벌식 자판 기준: 입력된 한글(음절·자모)을 해당 키에 대응하는 영문 소문자열로 바꿉니다.
 * 이미 ASCII(영문·숫자·기호)인 문자는 그대로 둡니다.
 */

/** 초성(인덱스) → 영문 키 */
const CHO_KEY = [
  "r",
  "R",
  "s",
  "e",
  "E",
  "f",
  "a",
  "q",
  "Q",
  "t",
  "T",
  "d",
  "w",
  "W",
  "c",
  "z",
  "x",
  "v",
  "g",
];

/** 중성(인덱스) → 영문 키(복모음은 연속 타자) */
const JUNG_KEY = [
  "k",
  "o",
  "i",
  "O",
  "j",
  "p",
  "u",
  "P",
  "h",
  "hk",
  "ho",
  "hl",
  "y",
  "n",
  "nj",
  "np",
  "nl",
  "b",
  "m",
  "ml",
  "l",
];

/** 종성(인덱스) → 영문 키 */
const JONG_KEY = [
  "",
  "r",
  "R",
  "rt",
  "s",
  "sw",
  "sg",
  "e",
  "f",
  "fr",
  "fa",
  "fq",
  "ft",
  "fx",
  "fv",
  "fg",
  "a",
  "q",
  "qt",
  "t",
  "T",
  "d",
  "w",
  "c",
  "z",
  "x",
  "v",
  "g",
];

/** 호환 자모(U+313x) 등 단일 자모 → 키 (음절 밖 입력) */
const JAMO_KEY: Record<string, string> = {
  ㄱ: "r",
  ㄲ: "R",
  ㄴ: "s",
  ㄷ: "e",
  ㄸ: "E",
  ㄹ: "f",
  ㅁ: "a",
  ㅂ: "q",
  ㅃ: "Q",
  ㅅ: "t",
  ㅆ: "T",
  ㅇ: "d",
  ㅈ: "w",
  ㅉ: "W",
  ㅊ: "c",
  ㅋ: "z",
  ㅌ: "x",
  ㅍ: "v",
  ㅎ: "g",
  ㅏ: "k",
  ㅐ: "o",
  ㅑ: "i",
  ㅒ: "O",
  ㅓ: "j",
  ㅔ: "p",
  ㅕ: "u",
  ㅖ: "P",
  ㅗ: "h",
  ㅘ: "hk",
  ㅙ: "ho",
  ㅚ: "hl",
  ㅛ: "y",
  ㅜ: "n",
  ㅝ: "nj",
  ㅞ: "np",
  ㅟ: "nl",
  ㅠ: "b",
  ㅡ: "m",
  ㅢ: "ml",
  ㅣ: "l",
};

function syllableToQwerty(ch: string): string {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 0x2ba4) {
    return JAMO_KEY[ch] ?? ch;
  }
  const cho = Math.floor(code / 588);
  const jung = Math.floor((code % 588) / 28);
  const jong = code % 28;
  return (
    CHO_KEY[cho] + JUNG_KEY[jung] + (jong > 0 ? JONG_KEY[jong] : "")
  );
}

/** 비밀번호 필드용: 문자열 전체를 한글→영문(자판 매핑) 변환 */
export function hangulKeyboardToQwerty(value: string): string {
  let out = "";
  for (const ch of value) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0xac00 && cp <= 0xd7a3) {
      out += syllableToQwerty(ch);
      continue;
    }
    if (cp >= 0x3131 && cp <= 0x3163) {
      out += JAMO_KEY[ch] ?? ch;
      continue;
    }
    out += ch;
  }
  return out;
}
