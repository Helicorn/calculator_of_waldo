"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { PasswordInput } from "@/components/input";
import { usePasswordField } from "@/hooks/usePasswordFields";
import { apiPostJson } from "@/lib/apiFetch";
import type { LoginResponse } from "@/app/types/login";

const inputClass =
  "w-full rounded-lg border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-800";

type LoginFormProps = {
  /** 있으면 로그인 성공 시 호출(모달 닫기 등). 없으면 `/main` 으로 이동 */
  onSuccess?: () => void | Promise<void>;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const { password, setPassword } = usePasswordField();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    apiPostJson<LoginResponse>("/api/login", { account, password })
      .then(async () => {
        if (onSuccess) {
          await onSuccess();
        } else {
          router.push("/main");
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      })
      .finally(() => setPending(false));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm flex flex-col gap-5"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-account"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          아이디
        </label>
        <input
          id="login-account"
          name="account"
          type="text"
          autoComplete="username"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className={inputClass}
          placeholder="아이디를 입력하세요"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-password"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          비밀번호
        </label>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="비밀번호를 입력하세요"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-lg bg-foreground text-background py-2.5 text-sm font-semibold transition hover:opacity-90 active:opacity-95 disabled:opacity-50"
      >
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
