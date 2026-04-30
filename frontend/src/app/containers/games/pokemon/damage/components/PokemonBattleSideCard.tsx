"use client";

import type { CSSProperties, ReactNode } from "react";

import { MoveOptionCombobox } from "../../components/MoveOptionCombobox";
import { PokemonNameCombobox } from "../../components/PokemonNameCombobox";
import {
  Level50StatCards,
  type EvMap,
  type StatName,
} from "./Level50StatCards";
import { RankControls, type RankStage } from "./RankControls";

type FormOption = {
  key: string;
  label: string;
};

type MoveOption = {
  value: string;
  label: string;
};

export function PokemonBattleSideCard({
  cardClassName,
  titleId,
  title,
  cardStyle,
  fontClassName,
  nameInputId,
  name,
  onChangeName,
  nameComboboxWidthClassName,
  showRotomForm,
  rotomFormId,
  rotomFormValue,
  rotomFormOptions,
  onChangeRotomForm,
  showCharizardForm,
  charizardFormId,
  charizardFormValue,
  charizardFormOptions,
  onChangeCharizardForm,
  error,
  stats,
  isLoading,
  evMap,
  natureKey,
  onNatureChange,
  evInputIdPrefix,
  onEvChange,
  moveInputId,
  moveValue,
  onChangeMove,
  moveOptions,
  isMoveDisabled,
  showDbMissingMoveHint,
  moveDetail,
  rankIdPrefix,
  attackRank,
  specialAttackRank,
  defenseRank,
  specialDefenseRank,
  onAttackRankChange,
  onSpecialAttackRankChange,
  onDefenseRankChange,
  onSpecialDefenseRankChange,
}: {
  cardClassName: string;
  titleId: string;
  title: string;
  cardStyle?: CSSProperties;
  fontClassName: string;
  nameInputId: string;
  name: string;
  onChangeName: (next: string) => void;
  nameComboboxWidthClassName: string;
  showRotomForm: boolean;
  rotomFormId: string;
  rotomFormValue: string;
  rotomFormOptions: FormOption[];
  onChangeRotomForm: (next: string) => void;
  showCharizardForm: boolean;
  charizardFormId: string;
  charizardFormValue: string;
  charizardFormOptions: FormOption[];
  onChangeCharizardForm: (next: string) => void;
  error: string | null;
  stats: Record<string, number> | null;
  isLoading: boolean;
  evMap: EvMap;
  natureKey: string;
  onNatureChange: (next: string) => void;
  evInputIdPrefix: string;
  onEvChange: (stat: StatName, value: number) => void;
  moveInputId: string;
  moveValue: string;
  onChangeMove: (next: string) => void;
  moveOptions: MoveOption[];
  isMoveDisabled: boolean;
  showDbMissingMoveHint: boolean;
  moveDetail: ReactNode;
  rankIdPrefix: string;
  attackRank: RankStage;
  specialAttackRank: RankStage;
  defenseRank: RankStage;
  specialDefenseRank: RankStage;
  onAttackRankChange: (next: RankStage) => void;
  onSpecialAttackRankChange: (next: RankStage) => void;
  onDefenseRankChange: (next: RankStage) => void;
  onSpecialDefenseRankChange: (next: RankStage) => void;
}) {
  return (
    <div className={cardClassName} aria-labelledby={titleId} style={cardStyle}>
      <h3
        id={titleId}
        className={`${fontClassName} text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100`}
      >
        {title}
      </h3>
      <PokemonNameCombobox
        id={nameInputId}
        labelledBy={titleId}
        value={name}
        onChange={onChangeName}
        wrapperClassName={nameComboboxWidthClassName}
      />
      {showRotomForm ? (
        <div className="flex items-center gap-2">
          <label
            htmlFor={rotomFormId}
            className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
          >
            로토무 폼
          </label>
          <select
            id={rotomFormId}
            value={rotomFormValue}
            onChange={(e) => onChangeRotomForm(e.target.value)}
            className="rounded-md border border-black/[.12] bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-white/[.16] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
          >
            {rotomFormOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {showCharizardForm ? (
        <div className="flex items-center gap-2">
          <label
            htmlFor={charizardFormId}
            className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
          >
            메가 폼
          </label>
          <select
            id={charizardFormId}
            value={charizardFormValue}
            onChange={(e) => onChangeCharizardForm(e.target.value)}
            className="rounded-md border border-black/[.12] bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 dark:border-white/[.16] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
          >
            {charizardFormOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      <Level50StatCards
        stats={stats}
        isLoading={isLoading}
        evMap={evMap}
        natureKey={natureKey}
        onNatureChange={onNatureChange}
        evInputIdPrefix={evInputIdPrefix}
        fontClassName={fontClassName}
        onEvChange={onEvChange}
      />
      <div className="mt-1">
        <label
          htmlFor={moveInputId}
          className={`${fontClassName} mb-0.5 block text-sm font-semibold text-neutral-800 dark:text-neutral-200`}
        >
          사용 기술
        </label>
        <MoveOptionCombobox
          id={moveInputId}
          labelledBy={titleId}
          value={moveValue}
          onChange={onChangeMove}
          options={moveOptions}
          disabled={isMoveDisabled}
          placeholder="기술을 입력하거나 목록에서 선택하세요"
          emptyText="일치하는 기술이 없습니다."
        />
        {showDbMissingMoveHint ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            이 포켓몬 도감 기술 중 DB(T_POKEMON_MOVE)에 있는 기술이 없습니다.
          </p>
        ) : null}
        {moveDetail}
        <RankControls
          idPrefix={rankIdPrefix}
          attackRank={attackRank}
          specialAttackRank={specialAttackRank}
          defenseRank={defenseRank}
          specialDefenseRank={specialDefenseRank}
          onAttackRankChange={onAttackRankChange}
          onSpecialAttackRankChange={onSpecialAttackRankChange}
          onDefenseRankChange={onDefenseRankChange}
          onSpecialDefenseRankChange={onSpecialDefenseRankChange}
          fontClassName={fontClassName}
        />
      </div>
    </div>
  );
}
