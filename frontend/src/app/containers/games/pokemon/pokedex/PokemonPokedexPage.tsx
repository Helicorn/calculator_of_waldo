"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { EChartsOption } from "echarts";
import pokemon from "pokemon";

import { PokemonMoveDexTabContent } from "./PokemonMoveDexTabContent";
import { PokemonPokedexTabContent } from "./PokemonPokedexTabContent";

type PokemonApiResponse = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types?: Array<{
    slot: number;
    type?: {
      name?: string;
      url?: string;
    };
  }>;
  stats?: Array<{
    base_stat: number;
    stat?: {
      name?: string;
    };
  }>;
  abilities?: Array<{
    is_hidden: boolean;
    ability?: {
      name?: string;
      url?: string;
    };
  }>;
  sprites?: {
    front_default?: string | null;
  };
  moves?: Array<{
    move?: {
      name?: string;
      url?: string;
    };
  }>;
};

type PokemonAbilityDetailResponse = {
  names?: Array<{
    language?: { name?: string };
    name?: string;
  }>;
  flavor_text_entries?: Array<{
    language?: { name?: string };
    flavor_text?: string;
  }>;
};

type PokemonAbilityRow = {
  kind: "일반특성" | "숨은특성";
  name: string;
  description: string;
};

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
});

const TYPE_NAME_BAR_CLASS: Record<string, string> = {
  normal: "bg-gray-500",
  fire: "bg-red-600",
  water: "bg-blue-600",
  electric: "bg-yellow-400",
  ice: "bg-cyan-300",
  fighting: "bg-orange-600",
  poison: "bg-purple-300",
  ground: "bg-amber-700",
  flying: "bg-[rgb(193,200,213)]",
  psychic: "bg-pink-700",
  bug: "bg-lime-600",
  rock: "bg-stone-600",
  ghost: "bg-purple-800",
  dragon: "bg-indigo-800",
  dark: "bg-black",
  steel: "bg-sky-700",
  fairy: "bg-pink-300",
  grass: "bg-green-600",
};

function safeGetPokemonIdByKoreanName(name: string): number | null {
  try {
    const id = pokemon.getId(name, "ko");
    return typeof id === "number" && Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

function normalizeFlavorText(text: string): string {
  return text.replace(/\f|\n/g, " ").replace(/\s+/g, " ").trim();
}

function pokedexTabClass(active: boolean): string {
  const base =
    "rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium transition-colors -mb-px";
  if (active) {
    return `${base} border-black/[.12] bg-[var(--background)] text-neutral-900 dark:border-white/[.18] dark:text-neutral-100`;
  }
  return `${base} border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200`;
}

/** 포켓몬 게임 페이지 `?detail=pokedex` 본문 */
export function PokemonPokedexPage() {
  const [activeTab, setActiveTab] = useState<"pokemon" | "move">("pokemon");
  const [selectedName, setSelectedName] = useState("");
  const [pokemonData, setPokemonData] = useState<PokemonApiResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abilityRows, setAbilityRows] = useState<PokemonAbilityRow[]>([]);
  const [isAbilityLoading, setIsAbilityLoading] = useState(false);
  const firstTypeName = pokemonData?.types?.[0]?.type?.name;
  const secondTypeName = pokemonData?.types?.[1]?.type?.name;
  const activeTypeName =
    firstTypeName === "normal" && secondTypeName ? secondTypeName : firstTypeName;
  const nameBarClassName = activeTypeName
    ? (TYPE_NAME_BAR_CLASS[activeTypeName] ?? "bg-red-600")
    : "bg-red-600";
  const pokemonStats = pokemonData?.stats ?? [];
  const statByName = Object.fromEntries(
    pokemonStats.map((item) => [item.stat?.name ?? "", item.base_stat]),
  );
  const radarValues = [
    statByName.hp ?? 0,
    statByName["special-attack"] ?? 0,
    statByName["special-defense"] ?? 0,
    statByName.speed ?? 0,
    statByName.defense ?? 0,
    statByName.attack ?? 0,
  ];
  const moveRows = (pokemonData?.moves ?? []).map((item) => item.move?.name ?? "-");
  const radarOption: EChartsOption = {
    animation: true,
    radar: {
      startAngle: 90,
      radius: "65%",
      splitNumber: 5,
      indicator: [
        { name: "HP", max: 200 },
        { name: "특수공격", max: 200 },
        { name: "특수방어", max: 200 },
        { name: "스피드", max: 200 },
        { name: "방어", max: 200 },
        { name: "공격", max: 200 },
      ],
    },
    tooltip: {},
    series: [
      {
        type: "radar",
        data: [
          {
            value: radarValues,
            areaStyle: { opacity: 0.35 },
          },
        ],
      },
    ],
  };

  useEffect(() => {
    const normalizedName = selectedName.trim();
    if (!normalizedName) {
      setPokemonData(null);
      setAbilityRows([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const pokemonId = safeGetPokemonIdByKoreanName(normalizedName);
    if (!pokemonId) {
      setPokemonData(null);
      setAbilityRows([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setPokemonData(null);
    setError(null);
    setIsLoading(true);

    void (async () => {
      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        if (!response.ok) {
          throw new Error(`포켓몬 정보를 불러오지 못했습니다. (${response.status})`);
        }
        const data = (await response.json()) as PokemonApiResponse;
        console.log("[PokemonPokedexPage] fetched pokemon data:", data);
        setPokemonData(data);
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setError("포켓몬 정보를 가져오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [selectedName]);

  useEffect(() => {
    const abilityList = pokemonData?.abilities ?? [];
    if (abilityList.length === 0) {
      setAbilityRows([]);
      setIsAbilityLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsAbilityLoading(true);

    void (async () => {
      try {
        const rows = await Promise.all(
          abilityList.map(async (item): Promise<PokemonAbilityRow> => {
            const fallbackName = item.ability?.name ?? "-";
            const url = item.ability?.url;
            if (!url) {
              return {
                kind: item.is_hidden ? "숨은특성" : "일반특성",
                name: fallbackName,
                description: "설명 정보를 찾을 수 없습니다.",
              };
            }

            const response = await fetch(url, {
              signal: controller.signal,
              cache: "no-store",
            });
            if (!response.ok) {
              return {
                kind: item.is_hidden ? "숨은특성" : "일반특성",
                name: fallbackName,
                description: "설명 정보를 불러오지 못했습니다.",
              };
            }

            const detail = (await response.json()) as PokemonAbilityDetailResponse;
            const koName =
              detail.names?.find((n) => n.language?.name === "ko")?.name ??
              fallbackName;
            const koFlavor =
              detail.flavor_text_entries?.find((f) => f.language?.name === "ko")
                ?.flavor_text ?? "설명 정보가 없습니다.";

            return {
              kind: item.is_hidden ? "숨은특성" : "일반특성",
              name: koName,
              description: normalizeFlavorText(koFlavor),
            };
          }),
        );
        setAbilityRows(rows);
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setAbilityRows([]);
      } finally {
        setIsAbilityLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [pokemonData]);

  return (
    <section className="flex w-full max-w-5xl flex-col gap-4 text-left">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          도감
        </h2>
      </header>

      <div
        role="tablist"
        aria-label="포켓몬 도감 상세 탭"
        className="flex flex-wrap gap-0.5 border-b border-black/[.12] dark:border-white/[.18]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pokemon"}
          onClick={() => setActiveTab("pokemon")}
          className={pokedexTabClass(activeTab === "pokemon")}
        >
          포켓몬 도감
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "move"}
          onClick={() => setActiveTab("move")}
          className={pokedexTabClass(activeTab === "move")}
        >
          기술 도감
        </button>
      </div>

      <div className="w-full rounded-lg border border-black/[.08] bg-white p-4 text-sm dark:border-white/[.14] dark:bg-neutral-900">
        {activeTab === "pokemon" ? (
          <PokemonPokedexTabContent
            selectedName={selectedName}
            onChangeSelectedName={setSelectedName}
            isLoading={isLoading}
            error={error}
            pokemonData={pokemonData}
            nameBarClassName={nameBarClassName}
            radarOption={radarOption}
            isAbilityLoading={isAbilityLoading}
            abilityRows={abilityRows}
            moveRows={moveRows}
            reactECharts={ReactECharts}
          />
        ) : (
          <PokemonMoveDexTabContent />
        )}
      </div>
    </section>
  );
}
