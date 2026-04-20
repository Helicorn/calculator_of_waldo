/** 백엔드 API 루트. 로컬 기본은 server.port(8080)와 맞춤. 배포 시 `NEXT_PUBLIC_API_URL`. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
