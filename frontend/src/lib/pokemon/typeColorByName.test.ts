import { describe, expect, it } from "vitest";

import { TYPE_COLOR_BY_NAME } from "./typeColorByName";

describe("TYPE_COLOR_BY_NAME", () => {
  it("maps known types to hex colors", () => {
    expect(TYPE_COLOR_BY_NAME.fire).toBe("#EE8130");
    expect(TYPE_COLOR_BY_NAME.water).toBe("#6390F0");
  });

  it("covers all eighteen canonical type keys", () => {
    const keys = Object.keys(TYPE_COLOR_BY_NAME).sort();
    expect(keys).toEqual(
      [
        "bug",
        "dark",
        "dragon",
        "electric",
        "fairy",
        "fighting",
        "fire",
        "flying",
        "ghost",
        "grass",
        "ground",
        "ice",
        "normal",
        "poison",
        "psychic",
        "rock",
        "steel",
        "water",
      ].sort(),
    );
  });
});
