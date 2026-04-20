/** 회원 설정 상세 카테고리 (/profile/* 라우트) */
export const PROFILE_DETAIL_CATEGORIES = [
  { slug: "edit", href: "/profile", label: "회원정보 수정" },
  { slug: "data", href: "/profile/data", label: "데이터 관리" },
] as const;

export type ProfileDetailCategory =
  (typeof PROFILE_DETAIL_CATEGORIES)[number];

export type ProfileDetailSlug =
  (typeof PROFILE_DETAIL_CATEGORIES)[number]["slug"];

export const PROFILE_DETAIL_LABEL_BY_SLUG: Record<
  ProfileDetailSlug,
  string
> = Object.fromEntries(
  PROFILE_DETAIL_CATEGORIES.map((c) => [c.slug, c.label]),
) as Record<ProfileDetailSlug, string>;

export const PROFILE_DETAIL_HREF_BY_SLUG: Record<
  ProfileDetailSlug,
  string
> = Object.fromEntries(
  PROFILE_DETAIL_CATEGORIES.map((c) => [c.slug, c.href]),
) as Record<ProfileDetailSlug, string>;

export const PROFILE_DETAIL_SLUGS: ProfileDetailSlug[] =
  PROFILE_DETAIL_CATEGORIES.map((c) => c.slug);

export function isProfileDetailSlug(s: string): s is ProfileDetailSlug {
  return (PROFILE_DETAIL_SLUGS as readonly string[]).includes(s);
}

export function resolveProfileDetailSlugFromPath(
  pathname: string,
): ProfileDetailSlug {
  if (pathname.startsWith("/profile/data")) return "data";
  return "edit";
}

