// CHK-151 / QUEUE-006 (S160 "migration delta") — deliberate reproduction
// attempt against the reads-once legacy-key migration in projectStorage().
//
// The queue item asks one concrete repro: seed a legacy flat key and verify
// the migration. Beyond the happy path, this suite probes the edges where a
// "delta" (data silently lost in migration) could actually be born:
// primitive legacy values, partitioned blobs with primitive partitions,
// corrupt blobs, stale-vs-fresh keys, hostile projectId embedding.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// localStorage stub — the migration runs exclusively against localStorage.
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal(
    "localStorage",
    {
      getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

import { projectStorage } from "./storage-lib";

const PID = "proj-abc";

describe("S160 migration repro — happy path (no delta expected)", () => {
  it("folds a plain object legacy key into the scoped key and removes the legacy key", () => {
    store.set("snsp-v1", JSON.stringify({ rate: 0.03, lastRun: "2026-08-01" }));
    const handle = projectStorage<{ rate: number; lastRun: string }>(
      "snsp",
      PID,
      ["snsp-v1"],
    );
    expect(handle.read()).toEqual({ rate: 0.03, lastRun: "2026-08-01" });
    expect(store.has("snsp-v1")).toBe(false);
    expect(store.get(handle.scopedKey)).toBeTruthy();
  });

  it("does nothing when no legacy key exists", () => {
    const handle = projectStorage<{ x: number }>("kskroi", PID, ["kskroi-v1"]);
    expect(handle.read()).toBeNull();
    expect(store.has("kskroi-v1")).toBe(false);
    expect(store.has(handle.scopedKey)).toBe(false);
  });
});

describe("S160 migration repro — primitive legacy values (the delta class)", () => {
  // Many pre-seam tabs stored primitives (a count, a rate, a string token)
  // directly. If migrateFrom refuses to fold them, the data silently
  // disappears: scoped key stays empty, legacy key stays in place, and the
  // card reads null forever. That is exactly the "migration delta" S160
  // alleges — data vanished with no trace.
  it("folds a numeric legacy value into the scoped key", () => {
    store.set("rtpl-v1", JSON.stringify(12));
    const handle = projectStorage<number>("rtpl", PID, ["rtpl-v1"]);
    expect(handle.read()).toBe(12);
    expect(store.has("rtpl-v1")).toBe(false);
  });

  it("folds a string legacy value into the scoped key", () => {
    store.set("promo-v1", JSON.stringify("evergreen"));
    const handle = projectStorage<string>("promo", PID, ["promo-v1"]);
    expect(handle.read()).toBe("evergreen");
    expect(store.has("promo-v1")).toBe(false);
  });

  it("folds a boolean legacy value into the scoped key", () => {
    store.set("pmix-v1", JSON.stringify(true));
    const handle = projectStorage<boolean>("pmix", PID, ["pmix-v1"]);
    expect(handle.read()).toBe(true);
    expect(store.has("pmix-v1")).toBe(false);
  });
});

describe("S160 migration repro — partitioned legacy blobs", () => {
  it("folds only this project's partition and discards the rest", () => {
    store.set(
      "stitch-and-scale-testknit",
      JSON.stringify({
        [PID]: { partner: "knitwise", tier: 2 },
        "proj-other": { partner: "rival", tier: 5 },
      }),
    );
    const handle = projectStorage<{ partner: string; tier: number }>(
      "testknit",
      PID,
      ["stitch-and-scale-testknit"],
      { partition: true },
    );
    expect(handle.read()).toEqual({ partner: "knitwise", tier: 2 });
    expect(store.has("stitch-and-scale-testknit")).toBe(false);
    // The blob is discarded whole — other projects' state never lands anywhere.
  });

  it("folds a primitive partition value verbatim instead of silently emptying it", () => {
    store.set(
      "stitch-and-scale-trunkshow",
      JSON.stringify({ [PID]: 3, "proj-other": 7 }),
    );
    const handle = projectStorage<number>("trunkshow", PID, [
      "stitch-and-scale-trunkshow",
    ], { partition: true });
    expect(handle.read()).toBe(3);
    expect(store.has("stitch-and-scale-trunkshow")).toBe(false);
  });
});

describe("S160 migration repro — realistic pre-seam blobs", () => {
  // trunk-show and translation-bundle wrote legacy blobs of shape
  // { [projectId]: { trunk: {...}, licensePrices: {...} } } — the real data
  // shape the migration must survive without loss.
  it("folds a realistic trunk-show legacy blob without loss", () => {
    store.set(
      "stitch-and-scale-trunk-show",
      JSON.stringify({
        [PID]: { trunk: { eventDate: "2026-09-01", venue: "KnitCon" }, licensePrices: { standard: 29 }, licenseConfig: {} },
        "proj-b": { trunk: { eventDate: "2026-10-01", venue: "YarnFest" }, licensePrices: {}, licenseConfig: {} },
      }),
    );
    const handle = projectStorage<{
      trunk?: unknown;
      licensePrices?: unknown;
      licenseConfig?: unknown;
    }>("trunkshow", PID, ["stitch-and-scale-trunk-show"], { partition: true });
    expect(handle.read()).toEqual({
      trunk: { eventDate: "2026-09-01", venue: "KnitCon" },
      licensePrices: { standard: 29 },
      licenseConfig: {},
    });
    expect(store.has("stitch-and-scale-trunk-show")).toBe(false);
  });

  // hydrateTrunkShowStored only accepts object state and defaults cleanly on
  // anything else — verify that even a hostile primitive partition cannot
  // crash the consumer path (it degrades to defaults, data is never lost).
  it("a hostile primitive partition degrades to consumer defaults instead of crashing", () => {
    store.set(
      "stitch-and-scale-trunk-show",
      JSON.stringify({ [PID]: "not-an-object" }),
    );
    const handle = projectStorage<unknown>("trunkshow", PID, [
      "stitch-and-scale-trunk-show",
    ], { partition: true });
    expect(handle.read()).toBe("not-an-object");
    // Legacy removed (folded), scoped holds the primitive; the consumer's
    // hydrate helper then falls back to defaults — verified separately in
    // trunk-show-planner.test.ts; here we only pin the seam's folding.
    expect(store.has("stitch-and-scale-trunk-show")).toBe(false);
  });
});

describe("S160 migration repro — conflict and corruption rules", () => {
  it("drops a stale legacy key when the scoped key already holds newer data", () => {
    store.set(handle_scopedKey("kskwseb", PID), JSON.stringify({ v: 2 }));
    store.set("kskwseb-v1", JSON.stringify({ v: 1 }));
    projectStorage<{ v: number }>("kskwseb", PID, ["kskwseb-v1"]);
    expect(store.get(handle_scopedKey("kskwseb", PID))).toBe(JSON.stringify({ v: 2 }));
    expect(store.has("kskwseb-v1")).toBe(false);
  });

  it("leaves a corrupt legacy key alone and keeps reading null", () => {
    store.set("sncis-v1", "not-valid-json{");
    const handle = projectStorage<{ n: number }>("sncis", PID, ["sncis-v1"]);
    expect(handle.read()).toBeNull();
    expect(store.has("sncis-v1")).toBe(true); // untouched, not claimed
  });

  it("never folds a legacy key into itself", () => {
    const key = "stitch-and-scale-kskclubrev-evil";
    store.set(key, JSON.stringify({ x: 1 }));
    // projectId carries the full scoped shape — must strip the prefix rather
    // than double-embed it, and the legacy key coinciding with the scoped key
    // must not trigger self-migration.
    const handle = projectStorage<{ x: number }>("kskclubrev", key, [key]);
    expect(handle.scopedKey).toBe("stitch-and-scale-kskclubrev-evil");
    expect(handle.read()).toEqual({ x: 1 });
  });
});

// Small helper so the conflict test doesn't depend on private lib internals.
function handle_scopedKey(prefix: string, projectId: string): string {
  return `stitch-and-scale-${prefix}-${projectId}`;
}
