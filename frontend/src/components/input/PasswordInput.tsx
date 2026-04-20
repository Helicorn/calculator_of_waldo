"use client";

import {
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CompositionEvent,
} from "react";

import { hangulKeyboardToQwerty } from "@/lib/hangulKeyboardToQwerty";

export type PasswordInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type"
> & {
  className: string;
};

function syntheticChange(
  el: HTMLInputElement,
  value: string,
): ChangeEvent<HTMLInputElement> {
  return {
    target: { value, name: el.name, id: el.id } as HTMLInputElement,
    currentTarget: el,
  } as ChangeEvent<HTMLInputElement>;
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19 12 19c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 5c4.756 0 8.773 2.662 10.065 7.998a10.525 10.525 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

/** 비밀번호 표시/숨김 토글. `className`은 일반 텍스트 인풋과 동일하게 주면 됩니다. */
export function PasswordInput({
  className,
  onChange,
  onCompositionEnd,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const native = e.nativeEvent as InputEvent;
    if (native.isComposing) {
      onChange?.(e);
      return;
    }
    const next = hangulKeyboardToQwerty(e.target.value);
    if (next === e.target.value) {
      onChange?.(e);
      return;
    }
    onChange?.(syntheticChange(e.currentTarget, next));
  }

  function handleCompositionEnd(e: CompositionEvent<HTMLInputElement>) {
    onCompositionEnd?.(e);
    const el = e.currentTarget;
    const next = hangulKeyboardToQwerty(el.value);
    if (next === el.value) return;
    onChange?.(syntheticChange(el, next));
  }

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={visible ? "text" : "password"}
        lang="en"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={`${className} !pr-10`}
        onChange={handleChange}
        onCompositionEnd={handleCompositionEnd}
      />
      <button
        type="button"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 outline-none ring-offset-2 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 dark:focus-visible:ring-neutral-500"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
      >
        {visible ? <EyeSlashIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
