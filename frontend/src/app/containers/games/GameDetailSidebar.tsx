import Link from "next/link";

import type { GameDetailItem } from "@/app/containers/games/gameCategories";

type GameDetailSidebarProps = {
  gameSlug: string;
  items: GameDetailItem[];
  activeId: string;
};

export function GameDetailSidebar({
  gameSlug,
  items,
  activeId,
}: GameDetailSidebarProps) {
  return (
    <aside className="w-full shrink-0 md:w-48 lg:w-52">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        상세 카테고리
      </p>
      <nav
        className="flex flex-col gap-0.5 border-b border-black/[.08] pb-4 dark:border-white/[.12] md:border-b-0 md:border-r md:pb-0 md:pr-4 lg:pr-5"
        aria-label="상세 카테고리"
      >
        {items.map((item) => {
          const selected = item.id === activeId;
          const href =
            item.id === items[0]!.id
              ? `/games/${gameSlug}`
              : `/games/${gameSlug}?detail=${encodeURIComponent(item.id)}`;
          return (
            <Link
              key={item.id}
              href={href}
              className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "bg-foreground text-background"
                  : "text-neutral-600 hover:bg-black/[.05] dark:text-neutral-400 dark:hover:bg-white/[.06]"
              }`}
              aria-current={selected ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
