"use client";

import { useEffect, useState } from "react";

import { apiJson } from "@/lib/apiFetch";

export function BackendPing() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiJson<{ message: string }>("/api/hello")
      .then((data) => {
        if (!cancelled) setMessage(data.message);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Request failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
      {message && <span>API: {message}</span>}
      {error && (
        <span>
          API 연결 안 됨 ({error}).{" "}
          <code className="text-xs">backend</code>에서{" "}
          <code className="text-xs">.\mvnw.cmd spring-boot:run</code> 실행.
        </span>
      )}
      {!message && !error && <span>API 확인 중…</span>}
    </p>
  );
}
