"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { LoginResponse } from "@/app/types/login";
import { apiFetch, apiGetJsonIfOk } from "@/lib/apiFetch";

import { GAME_CATEGORIES } from "@/app/containers/games/gameCategories";
import { LoginModal } from "@/components/LoginModal";
import styles from "@/styles/components/SiteHeader.module.css";
import waldoLogo from "@/styles/images/waldo_logo.png";

const SESSION_POLL_MS = 45_000;

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [ready, setReady] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const refreshSession = useCallback(async () => {
    const me = await apiGetJsonIfOk<LoginResponse>("/api/me");
    setUser(me);
    setReady(true);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession, pathname]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshSession();
    }, SESSION_POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshSession]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshSession]);

  async function handleLogout() {
    setLogoutPending(true);
    try {
      await apiFetch("/api/logout", { method: "POST" });
      setUser(null);
      router.push("/main");
    } finally {
      setLogoutPending(false);
    }
  }

  const greetingName =
    user?.username?.trim() ||
    user?.account?.trim() ||
    user?.name?.trim() ||
    "";

  async function handleLoginSuccess() {
    setLoginOpen(false);
    await refreshSession();
    router.push("/main");
  }

  return (
    <>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoggedIn={handleLoginSuccess}
      />
      <div className={styles.headerBar}>
        <header className={styles.pageHeader}>
          <div className={styles.headerLeadingSpacer} aria-hidden />
          <Link href="/main" className={styles.logoLink} aria-label="홈으로">
            <Image
              src={waldoLogo}
              alt="Waldo"
              width={1080}
              height={324}
              className={styles.logoImage}
              priority
            />
          </Link>
          <nav className={styles.authNav} aria-label="계정 메뉴">
            {!ready ? (
              <span
                className={styles.sessionPlaceholder}
                aria-live="polite"
                aria-busy="true"
              >
                …
              </span>
            ) : user ? (
              <>
                <span className={styles.userGreeting}>
                  {greetingName ? `${greetingName} 님` : "회원 님"}
                </span>
                <Link
                  href="/profile"
                  className={styles.settingsIconButton}
                  aria-label="회원정보 수정"
                  title="회원정보 수정"
                >
                  <GearIcon className={styles.settingsIcon} />
                </Link>
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={() => void handleLogout()}
                  disabled={logoutPending}
                >
                  {logoutPending ? "로그아웃 중…" : "로그아웃"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`${styles.loginLink} ${styles.navPlainButton}`}
                  onClick={() => setLoginOpen(true)}
                >
                  로그인
                </button>
                <Link href="/signup" className={styles.signupLink}>
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </header>
        <nav className={styles.categoryNav} aria-label="게임 카테고리">
          <ul className={styles.categoryList}>
            {GAME_CATEGORIES.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/games/${item.slug}`}
                  className={styles.categoryLink}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <hr className={styles.sectionDivider} />
      </div>
    </>
  );
}
