import { describe, expect, it } from "vitest";
import { loadLastUid, saveLastUid } from "./uidHistory";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("UID history", () => {
  it("stores the latest UID separately for each game", () => {
    const storage = createStorage();
    saveLastUid("hsr", "600002947", storage);
    saveLastUid("genshin", "618285856", storage);
    saveLastUid("zzz", "1300622089", storage);

    expect(loadLastUid("hsr", storage)).toBe("600002947");
    expect(loadLastUid("genshin", storage)).toBe("618285856");
    expect(loadLastUid("zzz", storage)).toBe("1300622089");
  });

  it("ignores malformed or wrong-length UIDs", () => {
    const storage = createStorage();
    saveLastUid("zzz", "1234", storage);
    expect(loadLastUid("zzz", storage)).toBe("");
    storage.setItem("stellar-atelier.uid-history.v1", '{"zzz":"invalid"}');
    expect(loadLastUid("zzz", storage)).toBe("");
  });
});
