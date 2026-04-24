import { get, keys, set } from "idb-keyval";

type StoredTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  risk?: "none" | "low" | "moderate" | "high";
};

type SessionMeta = {
  id: string;
  createdAt: number;
};

const SESSION_PREFIX = "shadowfile:session:";
const META_PREFIX = "shadowfile:session-meta:";

function sessionStorageKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

function sessionMetaKey(sessionId: string): string {
  return `${META_PREFIX}${sessionId}`;
}

export async function saveSession(
  sessionId: string,
  turns: StoredTurn[],
  key: Uint8Array
): Promise<void> {
  const { encrypt } = await import("../crypto");
  const metaKey = sessionMetaKey(sessionId);
  const existing = await get<SessionMeta>(metaKey);
  const envelope = await encrypt(key, JSON.stringify(turns));

  await Promise.all([
    set(sessionStorageKey(sessionId), envelope),
    set(metaKey, existing ?? { id: sessionId, createdAt: Date.now() })
  ]);
}

export async function loadSession(sessionId: string, key: Uint8Array): Promise<StoredTurn[]> {
  const { decrypt } = await import("../crypto");
  const envelope = await get<string>(sessionStorageKey(sessionId));
  if (!envelope) return [];
  const plaintext = await decrypt(key, envelope);
  return JSON.parse(plaintext) as StoredTurn[];
}

export async function listSessions(): Promise<Array<{ id: string; createdAt: number }>> {
  const allKeys = await keys();
  const metaKeys = allKeys.filter(
    (key): key is string => typeof key === "string" && key.startsWith(META_PREFIX)
  );
  const entries = await Promise.all(metaKeys.map((key) => get<SessionMeta>(key)));
  return entries
    .filter((entry): entry is SessionMeta => Boolean(entry))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(({ id, createdAt }) => ({ id, createdAt }));
}
