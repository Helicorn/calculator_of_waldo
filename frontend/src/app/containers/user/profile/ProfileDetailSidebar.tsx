"use client";

import Link from "next/link";

import type {
  ProfileDetailCategory,
} from "./profileCategories";

type ProfileDetailSidebarProps = {
  items: readonly ProfileDetailCategory[];
  pathname: string;
};

export function ProfileDetailSidebar({
  items,
  pathname,
}: ProfileDetailSidebarProps) {
  const normalizedPathname = pathname.replace(/\/$/, "");

  return (
    <aside className="w-full shrink-0 md:w-48 lg:w-52">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        상세 카테고리
      </p>
      <nav
        className="flex flex-col gap-0.5 border-b border-black/[.08] pb-4 dark:border-white/[.12] md:border-b-0 md:border-r md:pb-0 md:pr-4 lg:pr-5"
        aria-label="회원 설정 상세 카테고리"
      >
        {items.map((item) => {
          // 상위 카테고리는 “상위 라우트 그 자체”에서만 선택 스타일(검은색 채움)을 적용합니다.
          // (하위 카테고리가 선택된 경우 상위는 펼쳐져만 있고 채워지지 않게 하기 위함)
          const selected = normalizedPathname === item.href;

          const expanded = item.slug === "data" && normalizedPathname.startsWith("/profile/data");
          const selectedPokemon =
            expanded && normalizedPathname.startsWith("/profile/data/pokemon");

          return (
            <div key={item.slug} className="flex flex-col">
              <Link
                href={item.href}
                className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-foreground text-background"
                    : "text-neutral-600 hover:bg-black/[.05] dark:text-neutral-400 dark:hover:bg-white/[.06]"
                }`}
                aria-current={selected ? "page" : undefined}
              >
                {item.label}
              </Link>

              {expanded && (
                <ul className="mt-0.5 flex flex-col gap-0.5 pl-3">
                  <li>
                    <Link
                      href="/profile/data/pokemon"
                      className={`block rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                        selectedPokemon
                          ? "bg-foreground text-background"
                          : "text-neutral-600 hover:bg-black/[.05] dark:text-neutral-400 dark:hover:bg-white/[.06]"
                      }`}
                      aria-current={selectedPokemon ? "page" : undefined}
                    >
                      포켓몬 데이터
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

