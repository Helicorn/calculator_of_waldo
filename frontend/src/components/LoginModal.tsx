"use client";

import { useEffect, useId, useRef } from "react";

import { LoginForm } from "@/app/containers/user/login/LoginForm";
import { ModalShell } from "@/components/ModalShell";

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
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [open]);

  return (
    <ModalShell open={open} onClose={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-xl border border-black/[.08] bg-white px-6 py-5 shadow-lg dark:border-white/[.145] dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            로그인
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-neutral-500 hover:bg-black/[.06] dark:text-neutral-400 dark:hover:bg-white/[.08]"
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
    </ModalShell>
  );
}
