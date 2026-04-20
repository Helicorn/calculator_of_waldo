"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { PageMain } from "@/components/common";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfileDetailSidebar } from "@/app/containers/user/profile/ProfileDetailSidebar";
import { PROFILE_DETAIL_CATEGORIES } from "@/app/containers/user/profile/profileCategories";
import styles from "@/styles/containers/main/MainPage.module.css";

type ProfileLayoutProps = {
  children: ReactNode;
};

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const pathname = usePathname();

  return (
    <div className={styles.root}>
      <PageMain variant="content">
        <div className={`${styles.intro} w-full`}>
          <SiteHeader />
        </div>

        <div className="w-full flex flex-col gap-6 md:flex-row md:items-start">
          <ProfileDetailSidebar
            items={PROFILE_DETAIL_CATEGORIES}
            pathname={pathname}
          />

          <div
            className="min-w-0 flex-1 flex flex-col gap-4"
          >
            {children}
          </div>
        </div>
      </PageMain>
    </div>
  );
}

