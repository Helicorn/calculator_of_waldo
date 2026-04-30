"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { POKEDEX_DROPDOWN_ITEMS } from "../pokemonDropdownItems";

const INPUT_CLASS =
  "pokemon-pokedex-input w-full appearance-none rounded-md border border-black/[.14] bg-white px-3 py-2 pr-9 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-500 dark:border-white/[.2] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-300";

type PokemonNameComboboxProps = {
  id: string;
  /** 접근성: 라벨 요소 id */
  labelledBy?: string;
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  /** 바깥 래퍼 너비 (도감은 `w-full sm:w-72`, 피해량은 더 좁게) */
  wrapperClassName?: string;
};

export function PokemonNameCombobox({
  id,
  labelledBy,
  value,
  onChange,
  placeholder = "포켓몬을 입력하거나 목록에서 선택하세요",
  wrapperClassName = "w-full",
}: PokemonNameComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = value.trim();
    if (!q) return POKEDEX_DROPDOWN_ITEMS;
    return POKEDEX_DROPDOWN_ITEMS.filter((name) => name.includes(q));
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={wrapperClassName} ref={rootRef}>
      <div className="relative">
        <form
          autoComplete="off"
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input
            id={id}
            name={`${id}-query`}
            aria-labelledby={labelledBy}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={placeholder}
            value={value}
            onFocus={() => {
              setIsOpen(true);
            }}
            onChange={(event) => {
              onChange(event.target.value);
              setIsOpen(true);
            }}
            className={INPUT_CLASS}
          />
        </form>
        <button
          type="button"
          aria-label="포켓몬 목록 열기"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-xs text-neutral-500 dark:text-neutral-400"
        >
          ▼
        </button>
        {isOpen ? (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-black/[.14] bg-white py-1 text-sm shadow-md dark:border-white/[.2] dark:bg-neutral-950">
            {filtered.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    onChange(name);
                    setIsOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {name}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                일치하는 포켓몬이 없습니다.
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
