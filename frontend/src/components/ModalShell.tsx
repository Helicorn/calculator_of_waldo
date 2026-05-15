"use client";

import { type ReactNode, useEffect } from "react";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 배경 클릭 시 `onClose` (기본 true) */
  closeOnBackdrop?: boolean;
  /** 오버레이 버튼 스크린리더 레이블 */
  backdropLabel?: string;
};

/**
 * 고정 레이아웃 공통 모달 바깥 뼈대: 딤, Escape, {@code body} 스크롤 잠금.
 * 안쪽은 보통 {@code role="dialog"} 패널을 두면 된다.
 */
export function ModalShell({
  open,
  onClose,
  children,
  closeOnBackdrop = true,
  backdropLabel = "닫기",
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
        className="absolute inset-0 z-0 h-full w-full cursor-default border-0 bg-black/50 dark:bg-black/60"
        aria-label={backdropLabel}
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />
      <div className="relative z-[1] pointer-events-none flex max-h-full w-full justify-center [&>*]:pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
