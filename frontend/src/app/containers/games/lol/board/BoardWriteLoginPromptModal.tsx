"use client";

import { useId } from "react";

import { ConfirmModal } from "@/components/ConfirmModal";

type BoardWriteLoginPromptModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirmLogin: () => void;
};

export function BoardWriteLoginPromptModal({
  open,
  onClose,
  onConfirmLogin,
}: BoardWriteLoginPromptModalProps) {
  const titleId = useId();

  const modalTitle = "\uAE00\uC4F0\uAE30";
  const modalBody =
    "\uAE00\uC4F0\uAE30\uB97C \uD558\uB824\uBA74 \uB85C\uADF8\uC778\uC744 \uD574\uC57C \uD569\uB2C8\uB2E4. \uB85C\uADF8\uC778 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?";
  const labelCloseBackdrop = "\uB2EB\uAE30";
  const labelNo = "\uC544\uB2C8\uC624";
  const labelYes = "\uC608";

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      titleId={titleId}
      backdropLabel={labelCloseBackdrop}
      title={modalTitle}
      description={<p className="m-0">{modalBody}</p>}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800/50"
          >
            {labelNo}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirmLogin();
            }}
            className="inline-flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-900 dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white"
          >
            {labelYes}
          </button>
        </>
      }
    />
  );
}
