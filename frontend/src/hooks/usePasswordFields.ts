"use client";

import { useCallback, useState } from "react";

/** 로그인 등 비밀번호 단일 필드 */
export function usePasswordField(initial = "") {
  const [password, setPassword] = useState(initial);
  const resetPassword = useCallback(() => setPassword(initial), [initial]);
  return { password, setPassword, resetPassword };
}

/** 회원가입·프로필 등 비밀번호 + 확인 */
export function usePasswordWithConfirm(initialPassword = "", initialConfirm = "") {
  const [password, setPassword] = useState(initialPassword);
  const [passwordConfirm, setPasswordConfirm] = useState(initialConfirm);
  const resetPasswordFields = useCallback(() => {
    setPassword(initialPassword);
    setPasswordConfirm(initialConfirm);
  }, [initialPassword, initialConfirm]);
  return {
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    resetPasswordFields,
  };
}

/** 회원가입: 둘 다 필수 + 일치 */
export function validateSignupPasswordFields(
  password: string,
  passwordConfirm: string,
): string | null {
  if (!password.trim()) return "비밀번호를 입력해 주세요.";
  if (!passwordConfirm.trim()) return "비밀번호 확인을 입력해 주세요.";
  if (password !== passwordConfirm) return "비밀번호가 일치하지 않습니다.";
  return null;
}

/** 프로필: 비워 두면 변경 없음, 하나라도 입력 시 둘 다 일치해야 함 */
export function validateProfilePasswordFields(
  password: string,
  passwordConfirm: string,
): string | null {
  const changingPw =
    password.trim().length > 0 || passwordConfirm.trim().length > 0;
  if (!changingPw) return null;
  if (!password.trim()) return "비밀번호를 입력해 주세요.";
  if (password !== passwordConfirm) {
    return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
  }
  return null;
}
