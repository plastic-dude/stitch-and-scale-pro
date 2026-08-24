/** @vitest-environment happy-dom */

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStorageProtectionDecision,
  getPersistentStorageStatus,
  STORAGE_PROTECTION_DISMISSAL_COOLDOWN_MS,
  isMeaningfulManualProject,
  isPersistentStorageSupported,
  readStorageProtectionDecision,
  requestPersistentStorageProtection,
  writeStorageProtectionDecision,
} from "./storage-protection";
import { getSettingsCopy } from "./settings-copy";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const { useProjectsMock, useSettingsMock } = vi.hoisted(() => ({
  useProjectsMock: vi.fn(),
  useSettingsMock: vi.fn(),
}));
vi.mock("@/context/ProjectsContext", () => ({ useProjects: useProjectsMock }));
vi.mock("@/context/SettingsContext", () => ({ useSettings: useSettingsMock }));

import { StorageProtectionBanner } from "@/components/storage-protection-banner";

function installStorage(
  storage:
    | { persist?: () => Promise<boolean>; persisted?: () => Promise<boolean> }
    | undefined,
) {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: storage,
  });
}

async function settleReact() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

describe("persistent storage capability seam", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installStorage(undefined);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("classifies a complete manual project and rejects incomplete records", () => {
    expect(
      isMeaningfulManualProject({
        name: "Harbour cardigan",
        author: "Ada",
        gauge: { stitchesPer4In: 20, rowsPer4In: 28 },
      }),
    ).toBe(true);
    expect(
      isMeaningfulManualProject({
        name: "  ",
        author: "Ada",
        gauge: { stitchesPer4In: 20, rowsPer4In: 28 },
      }),
    ).toBe(false);
    expect(
      isMeaningfulManualProject({
        name: "Harbour cardigan",
        author: "Ada",
        gauge: { stitchesPer4In: 0, rowsPer4In: 28 },
      }),
    ).toBe(false);
  });

  it("returns unavailable without navigator.storage and never throws", async () => {
    expect(isPersistentStorageSupported()).toBe(false);
    expect(await getPersistentStorageStatus()).toBe("unavailable");
    expect(await requestPersistentStorageProtection()).toBe("unavailable");
  });

  it("distinguishes protected, not-requested, declined, and rejected outcomes", async () => {
    installStorage({
      persisted: vi.fn().mockResolvedValue(true),
      persist: vi.fn().mockResolvedValue(true),
    });
    expect(await getPersistentStorageStatus()).toBe("protected");
    expect(await requestPersistentStorageProtection()).toBe("protected");

    const persisted = vi.fn().mockResolvedValue(false);
    const persist = vi.fn().mockResolvedValue(false);
    installStorage({ persisted, persist });
    expect(await getPersistentStorageStatus()).toBe("not-requested");
    expect(await requestPersistentStorageProtection()).toBe("declined");

    installStorage({
      persisted: vi
        .fn()
        .mockRejectedValue(new TypeError("storage unavailable")),
      persist: vi.fn().mockRejectedValue(new TypeError("storage unavailable")),
    });
    expect(await getPersistentStorageStatus()).toBe("error");
    expect(await requestPersistentStorageProtection()).toBe("error");
  });

  it("expires a dismissal after its cooldown but retains actionable outcomes", () => {
    const now = new Date("2026-08-24T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      writeStorageProtectionDecision("dismissed");
      expect(readStorageProtectionDecision()).toBe("dismissed");
      vi.setSystemTime(
        new Date(now.getTime() + STORAGE_PROTECTION_DISMISSAL_COOLDOWN_MS),
      );
      expect(readStorageProtectionDecision()).toBeNull();

      writeStorageProtectionDecision("protected");
      vi.setSystemTime(
        new Date(now.getTime() + STORAGE_PROTECTION_DISMISSAL_COOLDOWN_MS * 2),
      );
      expect(readStorageProtectionDecision()).toBe("protected");
    } finally {
      vi.useRealTimers();
    }
  });

  it("persists only recognized decisions and ignores corrupt values", () => {
    expect(readStorageProtectionDecision()).toBeNull();
    writeStorageProtectionDecision("dismissed");
    expect(readStorageProtectionDecision()).toBe("dismissed");
    window.localStorage.setItem(
      "stitch-and-scale-storage-protection-v1",
      "corrupt",
    );
    expect(readStorageProtectionDecision()).toBeNull();
    clearStorageProtectionDecision();
    expect(readStorageProtectionDecision()).toBeNull();
  });
});

describe("StorageProtectionBanner interaction boundary", () => {
  let container: HTMLDivElement;
  let root: Root;
  let dismissStorageProtectionPrompt: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    const persisted = vi.fn().mockResolvedValue(false);
    const persist = vi.fn().mockResolvedValue(true);
    installStorage({ persisted, persist });
    dismissStorageProtectionPrompt = vi.fn();
    useProjectsMock.mockReturnValue({
      storageProtectionPromptAvailable: true,
      dismissStorageProtectionPrompt,
    });
    useSettingsMock.mockReturnValue({
      language: "en",
      getCopy: () => getSettingsCopy("en"),
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    container.remove();
    window.localStorage.clear();
  });

  it("does not call browser persistence APIs on render or from a prior decision", async () => {
    const storage = (
      navigator as Navigator & {
        storage: {
          persisted: ReturnType<typeof vi.fn>;
          persist: ReturnType<typeof vi.fn>;
        };
      }
    ).storage;
    await act(async () => root.render(<StorageProtectionBanner />));
    await settleReact();
    expect(storage.persisted).not.toHaveBeenCalled();
    expect(storage.persist).not.toHaveBeenCalled();

    await act(async () => root.render(<div />));
    writeStorageProtectionDecision("dismissed");
    await act(async () => root.render(<StorageProtectionBanner />));
    await settleReact();
    expect(storage.persisted).not.toHaveBeenCalled();
    expect(storage.persist).not.toHaveBeenCalled();
  });

  it("calls persist only after the explicit primary button action", async () => {
    const storage = (
      navigator as Navigator & {
        storage: {
          persisted: ReturnType<typeof vi.fn>;
          persist: ReturnType<typeof vi.fn>;
        };
      }
    ).storage;
    await act(async () => root.render(<StorageProtectionBanner />));
    await settleReact();
    expect(storage.persist).not.toHaveBeenCalled();

    const button = container.querySelector(
      '[data-testid="button-protect-local-storage"]',
    ) as HTMLButtonElement;
    expect(button).toBeTruthy();
    await act(async () => button.click());
    await settleReact();

    expect(storage.persist).toHaveBeenCalledTimes(1);
    expect(readStorageProtectionDecision()).toBe("protected");
    expect(container.textContent).toContain(
      "protected from automatic eviction",
    );

    const close = container.querySelector(
      '[data-testid="button-close-storage-protection"]',
    ) as HTMLButtonElement;
    await act(async () => close.click());
    expect(readStorageProtectionDecision()).toBe("protected");
  });

  it("dismisses without calling persistence and remembers the choice", async () => {
    const storage = (
      navigator as Navigator & {
        storage: {
          persisted: ReturnType<typeof vi.fn>;
          persist: ReturnType<typeof vi.fn>;
        };
      }
    ).storage;
    await act(async () => root.render(<StorageProtectionBanner />));
    await settleReact();

    const button = container.querySelector(
      '[data-testid="button-dismiss-storage-protection"]',
    ) as HTMLButtonElement;
    await act(async () => button.click());
    await settleReact();

    expect(storage.persist).not.toHaveBeenCalled();
    expect(readStorageProtectionDecision()).toBe("dismissed");
    expect(dismissStorageProtectionPrompt).toHaveBeenCalled();
  });
});
