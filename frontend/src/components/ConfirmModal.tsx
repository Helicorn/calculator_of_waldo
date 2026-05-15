"use client";

import type { ReactNode } from "react";

import { ModalShell } from "@/components/ModalShell";

const panelClass =
  "relative w-full max-w-md rounded-xl border border-black/[.08] bg-white px-6 py-5 shadow-lg dark:border-white/[.145] dark:bg-neutral-950";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: ReactNode;
  description: ReactNode;
  footer: ReactNode;
  backdropLabel?: string;
};

/** 제목·본문·하단 버튼을 갖춘 간단 확인/안내 모달 */
export function ConfirmModal({
  open,
  onClose,
  titleId,
  title,
  description,
  footer,
  backdropLabel = "닫기",
}: ConfirmModalProps) {
  return (
    <ModalShell open={open} onClose={onClose} backdropLabel={backdropLabel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-base font-semibold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {description}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>
      </div>
    </ModalShell>
  );
}
