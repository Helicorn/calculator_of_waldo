"use client";

import { useEffect, useId, useRef } from "react";

import { LoginForm } from "@/app/containers/user/login/LoginForm";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLoggedIn: () => void | Promise<void>;
};

export function LoginModal({ open, onClose, onLoggedIn }: LoginModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 dark:bg-black/60 border-0 cursor-default w-full h-full"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-xl border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-neutral-950 shadow-lg px-6 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <h2
            id={titleId}
            className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            로그인
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-neutral-500 hover:bg-black/[.06] dark:hover:bg-white/[.08] dark:text-neutral-400"
            aria-label="닫기"
          >
            <span className="text-xl leading-none" aria-hidden>
              ×
            </span>
          </button>
        </div>
        <LoginForm
          onSuccess={async () => {
            await onLoggedIn();
          }}
        />
      </div>
    </div>
  );
}
