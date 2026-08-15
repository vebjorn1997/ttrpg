/** Public API base URL — safe for client and server components. */
export const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:5000"
).replace(/\/+$/, "")
