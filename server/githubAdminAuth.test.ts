import { afterEach, describe, expect, it } from "vitest";
import {
  hasGitHubAdminAllowlist,
  isGitHubAdminIdAllowed,
  isGitHubAdminOpenIdAllowed,
  parseAdminGitHubIds,
  sanitizeAdminReturnPath,
} from "./_core/githubAdminAuth";

const originalAdminIds = process.env.ADMIN_GITHUB_IDS;

afterEach(() => {
  if (originalAdminIds === undefined) delete process.env.ADMIN_GITHUB_IDS;
  else process.env.ADMIN_GITHUB_IDS = originalAdminIds;
});

describe("GitHub administrator allowlist", () => {
  it("accepts numeric GitHub IDs separated by commas or whitespace", () => {
    const ids = parseAdminGitHubIds("123, 456\n789 invalid user:1");
    expect([...ids]).toEqual(["123", "456", "789"]);
  });

  it("checks both raw GitHub IDs and github: openIds", () => {
    process.env.ADMIN_GITHUB_IDS = "12345678,87654321";
    expect(hasGitHubAdminAllowlist()).toBe(true);
    expect(isGitHubAdminIdAllowed(12345678)).toBe(true);
    expect(isGitHubAdminOpenIdAllowed("github:87654321")).toBe(true);
    expect(isGitHubAdminOpenIdAllowed("github:99999999")).toBe(false);
    expect(isGitHubAdminOpenIdAllowed("manus:87654321")).toBe(false);
  });
});

describe("administrator OAuth return path", () => {
  it("allows only local /admin paths", () => {
    expect(sanitizeAdminReturnPath("/admin")).toBe("/admin");
    expect(sanitizeAdminReturnPath("/admin/feedback")).toBe("/admin/feedback");
    expect(sanitizeAdminReturnPath("https://example.com/admin")).toBe("/admin");
    expect(sanitizeAdminReturnPath("//evil.example/admin")).toBe("/admin");
    expect(sanitizeAdminReturnPath("/admin/../other")).toBe("/admin");
  });
});
