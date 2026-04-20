"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MoveOption = {
  value: string;
  label: string;
};

type MoveOptionComboboxProps = {
  id: string;
  labelledBy?: string;
  value: string;
  onChange: (next: string) => void;
  options: MoveOption[];
  disabled?: boolean;
  placeholder?: string;
  wrapperClassName?: string;
  emptyText?: string;
};

const INPUT_CLASS =
  "w-full appearance-none rounded-md border border-black/[.12] bg-white px-2.5 py-2 pr-9 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.16] dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-500";

export function MoveOptionCombobox({
  id,
  labelledBy,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "기술을 선택하세요",
  wrapperClassName = "w-full",
  emptyText = "일치하는 기술이 없습니다.",
}: MoveOptionComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === value);
    return selected?.label ?? "";
  }, [options, value]);

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return options.filter((opt) => opt.label.includes(q));
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(selectedLabel);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedLabel]);

  return (
    <div className={wrapperClassName} ref={rootRef}>
      <div className="relative">
        <input
          id={id}
          aria-labelledby={labelledBy}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            if (!disabled) setIsOpen(true);
            if (!next.trim()) onChange("");
          }}
          disabled={disabled}
          className={INPUT_CLASS}
        />
        <button
          type="button"
          aria-label="기술 목록 열기"
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-xs text-neutral-500 dark:text-neutral-400 disabled:opacity-40"
        >
          ▼
        </button>
        {isOpen && !disabled ? (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-black/[.14] bg-white py-1 text-sm shadow-md dark:border-white/[.2] dark:bg-neutral-950">
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    onChange(opt.value);
                    setQuery(opt.label);
                    setIsOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {opt.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                {emptyText}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
