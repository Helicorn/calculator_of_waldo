"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { UserProfile } from "@/app/types/userProfile";
import { PasswordConfirmInput, PasswordInput } from "@/components/input";
import {
  usePasswordWithConfirm,
  validateProfilePasswordFields,
} from "@/hooks/usePasswordFields";
import { apiFetch, apiPatchJson } from "@/lib/apiFetch";

const inputClass =
  "w-full rounded-lg border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-800";

const labelClass =
  "text-sm font-medium text-neutral-700 dark:text-neutral-300";

export function ProfileEditForm() {
  const router = useRouter();
  const [loadFatalMessage, setLoadFatalMessage] = useState<string | null>(null);
  const [initialDone, setInitialDone] = useState(false);
  const [account, setAccount] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const {
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    resetPasswordFields,
  } = usePasswordWithConfirm();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/user/profile");
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          setLoadFatalMessage(
            text.trim() || `회원정보를 불러오지 못했습니다. (${res.status})`,
          );
          setInitialDone(true);
          return;
        }
        const text = await res.text();
        if (!text.trim()) {
          setLoadFatalMessage("서버 응답이 비어 있습니다.");
          setInitialDone(true);
          return;
        }
        const data = JSON.parse(text) as UserProfile;
        setAccount(data.account ?? "");
        setUsername(data.username ?? "");
        setPhone(data.phone ?? "");
        setInitialDone(true);
      } catch {
        if (!cancelled) {
          setLoadFatalMessage(
            "백엔드에 연결할 수 없습니다. 서버가 켜져 있는지 확인해 주세요.",
          );
          setInitialDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const u = username.trim();
    const p = phone.trim();
    if (!u || !p) {
      setError("닉네임과 핸드폰 번호를 입력해 주세요.");
      return;
    }

    const pwErr = validateProfilePasswordFields(password, passwordConfirm);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    const changingPw =
      password.trim().length > 0 || passwordConfirm.trim().length > 0;

    setPending(true);
    apiPatchJson<UserProfile>("/api/user/profile", {
      username: u,
      phone: p,
      password: changingPw ? password : "",
      passwordConfirm: changingPw ? passwordConfirm : "",
    })
      .then((data) => {
        setUsername(data.username ?? "");
        setPhone(data.phone ?? "");
        resetPasswordFields();
        setSaved(true);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "저장에 실패했습니다.",
        );
      })
      .finally(() => setPending(false));
  }

  if (!initialDone) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        불러오는 중…
      </p>
    );
  }

  if (loadFatalMessage) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400 max-w-sm" role="alert">
        {loadFatalMessage}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm flex flex-col gap-5"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>아이디</span>
        <p
          className="rounded-lg border border-black/[.06] dark:border-white/[.12] bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 text-sm text-neutral-600 dark:text-neutral-400"
          aria-readonly
        >
          {account || "—"}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          아이디는 변경할 수 없습니다.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-username" className={labelClass}>
          닉네임
        </label>
        <input
          id="profile-username"
          name="username"
          type="text"
          autoComplete="nickname"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          placeholder="표시 닉네임"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-phone" className={labelClass}>
          핸드폰 번호
        </label>
        <input
          id="profile-phone"
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
        <label htmlFor="profile-password" className={labelClass}>
          새 비밀번호
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-500 -mt-0.5">
          변경하지 않으려면 비워 두세요.
        </p>
        <PasswordInput
          id="profile-password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="새 비밀번호"
        />
      </div>
      <PasswordConfirmInput
        matchPassword={password}
        id="profile-password-confirm"
        name="passwordConfirm"
        label="새 비밀번호 확인"
        labelClassName={labelClass}
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        className={inputClass}
        placeholder="새 비밀번호 확인"
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          저장되었습니다.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-lg bg-foreground text-background py-2.5 text-sm font-semibold transition hover:opacity-90 active:opacity-95 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
