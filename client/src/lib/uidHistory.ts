export type UidGame = "hsr" | "genshin" | "zzz";

type UidStore = Partial<Record<UidGame, string>>;

const STORAGE_KEY = "stellar-atelier.uid-history.v1";

export function isValidUidForGame(game: UidGame, uid: string) {
  return game === "zzz" ? /^\d{8,10}$/.test(uid) : /^\d{9,10}$/.test(uid);
}

function getStorage(storage?: Pick<Storage, "getItem" | "setItem">) {
  if (storage) return storage;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

export function loadLastUid(game: UidGame, storage?: Pick<Storage, "getItem" | "setItem">) {
  try {
    const raw = getStorage(storage)?.getItem(STORAGE_KEY);
    if (!raw) return "";
    const saved = JSON.parse(raw) as UidStore;
    const uid = typeof saved[game] === "string" ? saved[game] : "";
    return isValidUidForGame(game, uid) ? uid : "";
  } catch {
    return "";
  }
}

export function saveLastUid(game: UidGame, uid: string, storage?: Pick<Storage, "getItem" | "setItem">) {
  if (!isValidUidForGame(game, uid)) return;
  try {
    const target = getStorage(storage);
    if (!target) return;
    const raw = target.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) as UidStore : {};
    target.setItem(STORAGE_KEY, JSON.stringify({ ...existing, [game]: uid }));
  } catch {
    // Storage access can be disabled by browser privacy settings; lookup remains available without persistence.
  }
}
