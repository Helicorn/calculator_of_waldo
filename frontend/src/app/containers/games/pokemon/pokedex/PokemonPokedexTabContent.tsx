"use client";

import Image from "next/image";
import type { ComponentType, CSSProperties } from "react";
import type { EChartsOption } from "echarts";

import { PokemonNameCombobox } from "../components/PokemonNameCombobox";

type PokemonAbilityRow = {
  kind: "일반특성" | "숨은특성";
  name: string;
  description: string;
};

type PokemonApiResponse = {
  id: number;
  sprites?: {
    front_default?: string | null;
  };
};

type PokemonPokedexTabContentProps = {
  selectedName: string;
  onChangeSelectedName: (name: string) => void;
  isLoading: boolean;
  error: string | null;
  pokemonData: PokemonApiResponse | null;
  nameBarClassName: string;
  radarOption: EChartsOption;
  isAbilityLoading: boolean;
  abilityRows: PokemonAbilityRow[];
  moveRows: string[];
  reactECharts: ComponentType<{ option: EChartsOption; style?: CSSProperties }>;
};

export function PokemonPokedexTabContent({
  selectedName,
  onChangeSelectedName,
  isLoading,
  error,
  pokemonData,
  nameBarClassName,
  radarOption,
  isAbilityLoading,
  abilityRows,
  moveRows,
  reactECharts: ReactECharts,
}: PokemonPokedexTabContentProps) {
  return (
    <>
      <div className="mb-3">
        <PokemonNameCombobox
          id="pokemon-pokedex-input"
          value={selectedName}
          onChange={onChangeSelectedName}
          wrapperClassName="w-full sm:w-72"
        />
      </div>
      {!selectedName ? (
        <p className="text-neutral-600 dark:text-neutral-400">
          포켓몬을 선택하면 정보가 표시됩니다.
        </p>
      ) : isLoading ? (
        <p className="text-neutral-600 dark:text-neutral-400">불러오는 중...</p>
      ) : error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : pokemonData ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="overflow-hidden rounded-md border border-black/[.1] dark:border-white/[.16]">
              <div className="flex h-72 items-center justify-center bg-neutral-200 dark:bg-neutral-800">
                {pokemonData.sprites?.front_default ? (
                  <Image
                    src={pokemonData.sprites.front_default}
                    alt={selectedName.trim()}
                    width={192}
                    height={192}
                    className="h-48 w-48 object-contain"
                  />
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    이미지가 없습니다.
                  </p>
                )}
              </div>
              <div
                className={`${nameBarClassName} flex items-center justify-between px-4 py-2 text-white`}
              >
                <span className="text-xs font-medium uppercase tracking-wide text-white/90">
                  No. {pokemonData.id}
                </span>
                <span className="text-xl font-bold tracking-tight">
                  {selectedName.trim()}
                </span>
                <span className="w-12" aria-hidden />
              </div>
            </div>
            <div className="rounded-md border border-black/[.1] bg-white p-2 dark:border-white/[.16] dark:bg-neutral-900">
              <ReactECharts option={radarOption} style={{ height: 320 }} />
            </div>
          </div>

          <div className="rounded-md border border-black/[.1] bg-white p-3 dark:border-white/[.16] dark:bg-neutral-900">
            <p className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              특성
            </p>
            {isAbilityLoading ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                특성 정보를 불러오는 중...
              </p>
            ) : abilityRows.length > 0 ? (
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/[.1] dark:border-white/[.16]">
                    <th className="px-2 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      구분
                    </th>
                    <th className="px-2 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      특성
                    </th>
                    <th className="px-2 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                      설명
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {abilityRows.map((row) => (
                    <tr
                      key={`${row.kind}-${row.name}`}
                      className="border-b border-black/[.06] align-top last:border-b-0 dark:border-white/[.1]"
                    >
                      <td className="px-2 py-2 text-neutral-700 dark:text-neutral-300">
                        {row.kind}
                      </td>
                      <td className="px-2 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                        {row.name}
                      </td>
                      <td className="px-2 py-2 text-neutral-700 dark:text-neutral-300">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                표시할 특성 정보가 없습니다.
              </p>
            )}
          </div>

          <div className="rounded-md border border-black/[.1] bg-white p-3 dark:border-white/[.16] dark:bg-neutral-900">
            <p className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              기술 목록 ({moveRows.length}개)
            </p>
            {moveRows.length > 0 ? (
              <div className="max-h-[28rem] overflow-y-auto rounded-md border border-black/[.08] dark:border-white/[.12]">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/[.08] bg-neutral-50 dark:border-white/[.12] dark:bg-neutral-900/80">
                      <th className="w-16 px-2 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                        No.
                      </th>
                      <th className="px-2 py-2 font-medium text-neutral-700 dark:text-neutral-300">
                        기술명
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {moveRows.map((moveName, idx) => (
                      <tr
                        key={`${moveName}-${idx}`}
                        className="border-b border-black/[.06] last:border-b-0 dark:border-white/[.08]"
                      >
                        <td className="px-2 py-2 tabular-nums text-neutral-500 dark:text-neutral-400">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-2 text-neutral-800 dark:text-neutral-200">
                          {moveName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                표시할 기술 정보가 없습니다.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-neutral-600 dark:text-neutral-400">
          일치하는 포켓몬이 없습니다. 목록에서 다시 선택해 주세요.
        </p>
      )}
    </>
  );
}
