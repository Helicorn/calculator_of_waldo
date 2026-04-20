import pokemon from "pokemon";

/** 도감·피해량 계산 등에서 쓰는 한글 포켓몬 이름 목록 */
export const POKEDEX_DROPDOWN_ITEMS =
  (
    pokemon as typeof pokemon & {
      al?: (locale?: string) => string[];
    }
  ).al?.("ko") ?? pokemon.all("ko");
