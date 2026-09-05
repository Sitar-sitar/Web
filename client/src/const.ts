import { saveLoginReturnPath } from "./lib/loginReturnPath";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

function defaultAdminReturnPath() {
  if (typeof window === "undefined") return "/admin";
  return window.location.pathname.endsWith("/admin/feedback") ? "/admin/feedback" : "/admin";
}

// Start GitHub App administrator authentication on the Railway API. OAuth state,
// the GitHub client secret, and the resulting GitHub access token are handled
// only by the backend; the browser receives only the application session cookie.
export const startLogin = (returnTo?: string) => {
  const safeReturnTo = returnTo === "/admin/feedback" || returnTo === "/admin"
    ? returnTo
    : defaultAdminReturnPath();
  saveLoginReturnPath(safeReturnTo);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const loginUrl = new URL(`${apiBaseUrl}/api/auth/github`, window.location.origin);
  loginUrl.searchParams.set("returnTo", safeReturnTo);
  window.location.assign(loginUrl.toString());
};
