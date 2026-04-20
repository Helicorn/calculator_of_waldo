import { PageMain } from "@/components/common";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "@/styles/containers/main/MainPage.module.css";

import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className={styles.root}>
      <PageMain variant="content">
        <div className={`${styles.intro} w-full`}>
          <SiteHeader />
        </div>
        <div className="w-full flex flex-col gap-6 items-center">
          <h1 className="text-xl font-semibold tracking-tight text-center w-full">
            로그인
          </h1>
          <div className="w-full flex justify-center">
            <LoginForm />
          </div>
        </div>
      </PageMain>
    </div>
  );
}
