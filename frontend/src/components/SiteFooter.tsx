"use client";

import Link from "next/link";

import styles from "@/styles/components/SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copyright}>© {new Date().getFullYear()} Waldo</p>
        <nav aria-label="푸터 메뉴">
          <ul className={styles.links}>
            <li>
              <Link href="/main" className={styles.link}>
                홈
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
