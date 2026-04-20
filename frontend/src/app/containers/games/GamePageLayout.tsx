import type { ReactNode } from "react";

import type { GameSlug } from "@/app/containers/games/gameCategories";
import { GAME_DETAIL_ITEMS } from "@/app/containers/games/gameCategories";
import { GameDetailSidebar } from "@/app/containers/games/GameDetailSidebar";
import { PageMain } from "@/components/common";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "@/styles/containers/main/MainPage.module.css";

type GamePageLayoutProps = {
  title: string;
  gameSlug: GameSlug;
  activeDetailId: string;
  /** 현재 상세 항목 라벨 옆에 붙일 보조 텍스트 (예: 챔피언명 ` - 이름`) */
  activeDetailSuffix?: string;
  children?: ReactNode;
};

export function GamePageLayout({
  title,
  gameSlug,
  activeDetailId,
  activeDetailSuffix,
  children,
}: GamePageLayoutProps) {
  const detailItems = GAME_DETAIL_ITEMS[gameSlug];
  const activeLabel =
    detailItems.find((i) => i.id === activeDetailId)?.label ?? "";

  return (
    <div className={styles.root}>
      <PageMain variant="content">
        <div className={`${styles.intro} w-full`}>
          <SiteHeader />
        </div>
        <div className="w-full flex flex-col gap-4">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <div className="flex w-full flex-col gap-6 md:flex-row md:items-start">
            <GameDetailSidebar
              gameSlug={gameSlug}
              items={detailItems}
              activeId={activeDetailId}
            />
            <div className="min-w-0 flex-1 flex flex-col gap-3">
              {activeLabel ? (
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {activeLabel}
                  {activeDetailSuffix ? (
                    <>
                      {" "}
                      <span className="text-neutral-400 dark:text-neutral-500">
                        -
                      </span>{" "}
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {activeDetailSuffix}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}
              {children ?? (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  준비 중입니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </PageMain>
    </div>
  );
}
