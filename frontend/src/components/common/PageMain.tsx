import type { ReactNode } from "react";

type PageMainProps = {
  children: ReactNode;
  /** 추가 Tailwind 클래스 */
  className?: string;
  /**
   * content — 본문 (max-w-6xl)
   * auth — 좁은 폼용 (max-w-lg / sm:max-w-xl)
   */
  variant?: "content" | "auth";
};

const baseClass = "flex flex-col gap-8 row-start-2";

const variantClass: Record<NonNullable<PageMainProps["variant"]>, string> = {
  content: "w-full max-w-6xl mx-auto items-center sm:items-start",
  auth: "w-full max-w-lg sm:max-w-xl mx-auto self-center items-center justify-center",
};

export function PageMain({
  children,
  className = "",
  variant = "content",
}: PageMainProps) {
  return (
    <main
      className={`${baseClass} ${variantClass[variant]} ${className}`.trim()}
    >
      {children}
    </main>
  );
}
