export const LOGIN_RETURN_PATH_KEY = "starrail-build-advisor.login-return-path";
export const ADMIN_LOGIN_RETURN_PATH = "/admin/feedback";

export function saveLoginReturnPath(returnTo?: string) {
  if (returnTo !== ADMIN_LOGIN_RETURN_PATH) return;
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
    return returnTo === ADMIN_LOGIN_RETURN_PATH ? returnTo : null;
  } catch {
    return null;
  }
}
