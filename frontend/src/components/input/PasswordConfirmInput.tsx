"use client";

import { useId, type ChangeEvent, type ReactNode } from "react";

import { PasswordInput, type PasswordInputProps } from "./PasswordInput";

const defaultHintClass =
  "text-sm text-red-600 dark:text-red-400";

export type PasswordConfirmInputProps = {
  /** 첫 번째 비밀번호 필드 값과 비교 */
  matchPassword: string;
  id: string;
  name?: string;
  label: ReactNode;
  labelClassName: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className: PasswordInputProps["className"];
  placeholder?: string;
  autoComplete?: string;
  /** 입력이 있을 때 불일치하면 안내 문구 표시 */
  showMismatchHint?: boolean;
};

export function PasswordConfirmInput({
  matchPassword,
  id,
  name,
  label,
  labelClassName,
  value,
  onChange,
  className,
  placeholder,
  autoComplete = "new-password",
  showMismatchHint = true,
}: PasswordConfirmInputProps) {
  const hintId = useId();
  const hasInput = value.length > 0;
  const mismatch = hasInput && value !== matchPassword;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <PasswordInput
        id={id}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={className}
        placeholder={placeholder}
        aria-invalid={mismatch || undefined}
        aria-describedby={mismatch && showMismatchHint ? hintId : undefined}
      />
      {showMismatchHint && mismatch && (
        <p id={hintId} className={defaultHintClass} role="status">
          비밀번호가 일치하지 않습니다.
        </p>
      )}
    </div>
  );
}
