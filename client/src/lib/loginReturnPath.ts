export const LOGIN_RETURN_PATH_KEY = "starrail-build-advisor.login-return-path";
export const ADMIN_LOGIN_RETURN_PATHS = ["/admin", "/admin/feedback"] as const;

type AdminLoginReturnPath = (typeof ADMIN_LOGIN_RETURN_PATHS)[number];

function isAdminLoginReturnPath(value: string | null | undefined): value is AdminLoginReturnPath {
  return Boolean(value && (ADMIN_LOGIN_RETURN_PATHS as readonly string[]).includes(value));
}

export function saveLoginReturnPath(returnTo?: string) {
  if (!isAdminLoginReturnPath(returnTo)) return;
  try {
    sessionStorage.setItem(LOGIN_RETURN_PATH_KEY, returnTo);
  } catch {
    // Login can proceed when storage is unavailable.
  }
}

export function consumeLoginReturnPath() {
  try {
    const returnTo = sessionStorage.getItem(LOGIN_RETURN_PATH_KEY);
    sessionStorage.removeItem(LOGIN_RETURN_PATH_KEY);
    return isAdminLoginReturnPath(returnTo) ? returnTo : null;
  } catch {
    return null;
  }
}
