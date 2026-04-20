/** Spring 백엔드 베이스 URL (끝 슬래시 없음). 예: http://localhost:8080 */
export const BACKEND_BASE_URL =
  (process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8080").replace(
    /\/$/,
    "",
  );
