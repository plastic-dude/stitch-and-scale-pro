/**
 * QUEUE-068: best-effort browser protection for this origin's local storage.
 *
 * This is not backup, sync, encryption, or protection from device loss. The
 * browser may decline or reject the request, and users can still clear data.
 * Keep browser capability detection here so UI code never reaches into
 * navigator.storage directly.
 */

export type StorageProtectionStatus =
  "protected" | "not-requested" | "unavailable" | "error";
export type StorageProtectionRequestResult =
  "protected" | "declined" | "unavailable" | "error";
export type StorageProtectionDecision =
  | Exclude<StorageProtectionRequestResult, "protected">
  | "protected"
  | "dismissed";

export const STORAGE_PROTECTION_DECISION_KEY =
  "stitch-and-scale-storage-protection-v1";
export const STORAGE_PROTECTION_DISMISSAL_COOLDOWN_MS =
  30 * 24 * 60 * 60 * 1000;

export function isMeaningfulManualProject(project: {
  name?: string;
  author?: string;
  gauge?: { stitchesPer4In?: number; rowsPer4In?: number };
}): boolean {
  return Boolean(
    project.name?.trim() &&
    project.author?.trim() &&
    (project.gauge?.stitchesPer4In ?? 0) > 0 &&
    (project.gauge?.rowsPer4In ?? 0) > 0,
  );
}

type StorageManagerLike = {
  persist?: () => Promise<boolean>;
  persisted?: () => Promise<boolean>;
};

function getStorageManager(): StorageManagerLike | null {
  if (typeof navigator === "undefined") return null;
  const storage = (navigator as Navigator & { storage?: StorageManagerLike })
    .storage;
  return storage && typeof storage === "object" ? storage : null;
}

/** True only when the browser exposes the request method required by QUEUE-068. */
export function isPersistentStorageSupported(): boolean {
  return typeof getStorageManager()?.persist === "function";
}

/**
 * Read the browser's current bucket status. This never requests permission.
 * Callers should use it only after an eligible user-save signal or for an
 * explicitly user-opened factual status surface.
 */
export async function getPersistentStorageStatus(): Promise<StorageProtectionStatus> {
  const storage = getStorageManager();
  if (!storage || typeof storage.persisted !== "function") return "unavailable";
  try {
    return (await storage.persisted()) ? "protected" : "not-requested";
  } catch {
    return "error";
  }
}

/** Invoke the browser request only from an explicit user action. */
export async function requestPersistentStorageProtection(): Promise<StorageProtectionRequestResult> {
  const storage = getStorageManager();
  if (!storage || typeof storage.persist !== "function") return "unavailable";
  try {
    return (await storage.persist()) ? "protected" : "declined";
  } catch {
    return "error";
  }
}

const STORAGE_PROTECTION_DECISIONS = new Set<StorageProtectionDecision>([
  "protected",
  "declined",
  "unavailable",
  "error",
  "dismissed",
]);

type StoredStorageProtectionDecision = {
  decision: StorageProtectionDecision;
  recordedAt: number;
};

export function readStorageProtectionDecision(): StorageProtectionDecision | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(STORAGE_PROTECTION_DECISION_KEY);
    if (!value) return null;

    // Accept the pre-envelope form for forward-compatible migration of any
    // local decision written during an interrupted upgrade.
    if (STORAGE_PROTECTION_DECISIONS.has(value as StorageProtectionDecision)) {
      return value as StorageProtectionDecision;
    }

    const parsed = JSON.parse(
      value,
    ) as Partial<StoredStorageProtectionDecision>;
    if (
      !STORAGE_PROTECTION_DECISIONS.has(
        parsed.decision as StorageProtectionDecision,
      )
    )
      return null;
    if (
      parsed.decision === "dismissed" &&
      typeof parsed.recordedAt === "number" &&
      Date.now() - parsed.recordedAt >= STORAGE_PROTECTION_DISMISSAL_COOLDOWN_MS
    ) {
      return null;
    }
    return parsed.decision as StorageProtectionDecision;
  } catch {
    // A blocked or corrupt preference must never prevent project work.
  }
  return null;
}

export function writeStorageProtectionDecision(
  decision: StorageProtectionDecision,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const record: StoredStorageProtectionDecision = {
      decision,
      recordedAt: Date.now(),
    };
    localStorage.setItem(
      STORAGE_PROTECTION_DECISION_KEY,
      JSON.stringify(record),
    );
  } catch {
    // A blocked localStorage must never prevent project work.
  }
}

export function clearStorageProtectionDecision(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_PROTECTION_DECISION_KEY);
  } catch {
    // Best effort only.
  }
}
