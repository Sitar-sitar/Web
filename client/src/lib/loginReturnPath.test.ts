// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { ADMIN_LOGIN_RETURN_PATH, consumeLoginReturnPath, LOGIN_RETURN_PATH_KEY, saveLoginReturnPath } from "./loginReturnPath";

describe("管理者ログイン後の復帰先", () => {
  afterEach(() => sessionStorage.clear());

  it("管理者画面だけをログイン後の復帰先として保存・一度だけ消費する", () => {
    saveLoginReturnPath(ADMIN_LOGIN_RETURN_PATH);
    expect(sessionStorage.getItem(LOGIN_RETURN_PATH_KEY)).toBe(ADMIN_LOGIN_RETURN_PATH);
    expect(consumeLoginReturnPath()).toBe(ADMIN_LOGIN_RETURN_PATH);
    expect(consumeLoginReturnPath()).toBeNull();
  });

  it("外部URLや任意の内部パスは復帰先として受け付けない", () => {
    saveLoginReturnPath("https://example.com" as string);
    expect(sessionStorage.getItem(LOGIN_RETURN_PATH_KEY)).toBeNull();
    sessionStorage.setItem(LOGIN_RETURN_PATH_KEY, "/other");
    expect(consumeLoginReturnPath()).toBeNull();
  });
});
