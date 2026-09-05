const ADMIN_SESSION_STORAGE_KEY = "hoyoverse-admin-session";
const ADMIN_EXCHANGE_FRAGMENT_KEY = "admin_exchange_code";

export function getAdminBearerToken() {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminBearerToken(token: string) {
  try {
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token);
  } catch {
    // If sessionStorage is unavailable, the existing HttpOnly cookie flow can
    // still work in browsers that permit the cross-site cookie.
  }
}

export function clearAdminBearerToken() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

export function consumeAdminExchangeCodeFromLocation() {
  if (typeof window === "undefined" || !window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get(ADMIN_EXCHANGE_FRAGMENT_KEY);
  if (!code) return null;

  // Remove the one-time code before any application requests or navigation.
  params.delete(ADMIN_EXCHANGE_FRAGMENT_KEY);
  const remainingHash = params.toString();
  const cleanUrl = `${window.location.pathname}${window.location.search}${remainingHash ? `#${remainingHash}` : ""}`;
  window.history.replaceState(window.history.state, "", cleanUrl);

  return code;
}
