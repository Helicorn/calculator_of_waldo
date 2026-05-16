"use client";

import { useId } from "react";

import { ConfirmModal } from "@/components/ConfirmModal";
import {
  lolBoardListModalCancelButtonClass,
  lolBoardListModalConfirmButtonClass,
  lolBoardListModalDangerButtonClass,
} from "@/app/containers/games/lol/board/lolBoardUiClasses";

export type BoardListDeleteModalVariant = "no-selection" | "confirm";

type BoardListDeleteModalProps = {
  open: boolean;
  variant: BoardListDeleteModalVariant;
  pending?: boolean;
  onClose: () => void;
  onConfirmDelete?: () => void;
};

export function BoardListDeleteModal({
  open,
  variant,
  pending = false,
  onClose,
  onConfirmDelete,
}: BoardListDeleteModalProps) {
  const titleId = useId();

  const title = "삭제";
  const body =
    variant === "no-selection"
      ? "삭제할 글을 선택해 주세요."
      : "글을 정말로 삭제하겠습니까?";

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      titleId={titleId}
      backdropLabel="닫기"
      title={title}
      description={<p className="m-0">{body}</p>}
      footer={
        variant === "no-selection" ? (
          <button
            type="button"
            onClick={onClose}
            className={lolBoardListModalConfirmButtonClass}
          >
            확인
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className={lolBoardListModalCancelButtonClass}
            >
              아니오
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onConfirmDelete?.()}
              className={lolBoardListModalDangerButtonClass}
            >
              {pending ? "삭제 중…" : "예"}
            </button>
          </>
        )
      }
    />
  );
}
