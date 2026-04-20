"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { PasswordConfirmInput, PasswordInput } from "@/components/input";
import {
  usePasswordWithConfirm,
  validateSignupPasswordFields,
} from "@/hooks/usePasswordFields";
import { apiPostJson } from "@/lib/apiFetch";

const inputClass =
  "w-full rounded-lg border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-800";

const labelClass =
  "text-sm font-medium text-neutral-700 dark:text-neutral-300";

export function SignupForm() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const {
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
  } = usePasswordWithConfirm();
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const pwErr = validateSignupPasswordFields(password, passwordConfirm);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    setPending(true);
    apiPostJson<unknown>("/api/signup", {
      account: account.trim() || null,
      name: name.trim() || null,
      password,
      phone: phone.trim() || null,
      username: username.trim() || null,
      authority: "USER",
      delYn: null,
    })
      .then(() => {
        router.push("/main");
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "회원가입에 실패했습니다.",
        );
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
        <label htmlFor="signup-account" className={labelClass}>
          아이디 (account)
        </label>
        <input
          id="signup-account"
          name="account"
          type="text"
          autoComplete="username"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className={inputClass}
          placeholder="로그인에 사용할 아이디"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-name" className={labelClass}>
          이름
        </label>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="이름"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-password" className={labelClass}>
          비밀번호
        </label>
        <PasswordInput
          id="signup-password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="비밀번호"
        />
      </div>
      <PasswordConfirmInput
        matchPassword={password}
        id="signup-password-confirm"
        name="passwordConfirm"
        label="비밀번호 확인"
        labelClassName={labelClass}
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        className={inputClass}
        placeholder="비밀번호 다시 입력"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-phone" className={labelClass}>
          전화번호
        </label>
        <input
          id="signup-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="01012345678"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-username" className={labelClass}>
          사용자명 (username)
        </label>
        <input
          id="signup-username"
          name="username"
          type="text"
          autoComplete="nickname"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          placeholder="표시용 닉네임 등"
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
        {pending ? "가입 중…" : "회원가입"}
      </button>
    </form>
  );
}
