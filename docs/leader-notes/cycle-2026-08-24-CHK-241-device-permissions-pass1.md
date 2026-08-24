# CHK-241 — Device/browser permissions Pass 1

**Date:** 2026-08-24
**Directive:** OWNER DIRECTIVE 2026-08-23-B — device/browser permissions
**Pass:** 1 of 2
**Status:** Pass 1 complete; re-queued for a separate later Pass 2
**Repository HEAD audited:** `0330349845c4b992aa91501a85389481561fae61`
**`origin/main` at audit:** `0330349845c4b992aa91501a85389481561fae61`

## Scope and boundary

This was a research-only verification pass. No application code, permission request, notification flow, service-worker delivery path, data schema, or new implementation ticket was created. The owner directive requires a separate later firing for Pass 2 before any implementation ticket may open.

## Live-HEAD current-state verification

The live HEAD remains aligned with `origin/main`, and the protected invention brief remains unchanged at SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`.

The current source audit confirms:

- `src/hooks/use-pwa-lifecycle.ts` listens for online/offline state, install-prompt lifecycle, service-worker update state, and controller changes. It does not request notification permission, subscribe to Push API, or schedule notifications.
- `src/main.tsx` registers the service worker only for PWA/offline-shell caching. Its comments explicitly state that the app is local-first and has no backend; registration contains no push or notification behavior.
- No shipped client path was found for `Notification`, `PushManager`, `PushSubscription`, `showNotification`, `pushsubscriptionchange`, `onpush`, `navigator.storage.persist()`, or `navigator.storage.persist`.
- Clipboard behavior remains correctly scoped: `src/lib/clipboard.ts` attempts `navigator.clipboard.writeText` and falls back to a hidden textarea plus `document.execCommand('copy')`; it does not request a new product permission and callers must inspect success before claiming a copy occurred.
- File selection remains ordinary browser `<input type="file">` behavior in the existing asset/import surfaces. It uses the operating system picker and does not require a separate browser permission grant.
- The existing PWA install surface in `src/components/install-banner.tsx` is the correct contextual-priming precedent: it is limited to named triggers, explains value before the platform flow, supports iOS manual instructions, and avoids recurring header nags.
- No geolocation, microphone, camera capture, or background-sync API was introduced by the current HEAD. Ordinary product copy mentioning photography/camera concepts is not an API capability.
- Settings already exposes local-first export/restore/wipe and storage-health/reconciliation seams. Persistent-storage protection is a separate missing capability, not a duplicate backup feature.

## Fresh external architecture check

Two current official sources were checked independently:

1. [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) states that web applications receive push messages **from a server**, including when the app is not foregrounded or loaded. It requires an active service worker and a `PushSubscription` containing an endpoint and encryption key used to send a message. This confirms that closed-app/background web push is not a purely local capability.
2. [Apple — Sending web push notifications in web apps and browsers](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) states that web push is available to Home Screen web apps on iOS 16.4 or later and Safari webpages on macOS 13 or later. It describes subscribing users and updating the server to send push notifications, and warns that Safari does not support invisible push notifications. This confirms the iOS Home Screen prerequisite and the server-backed delivery model.

## Pass 1 conclusion

The brief's central finding remains valid: **true push notifications require a server-side sender/relay** and therefore do not fit the current server-less/local-first product boundary. Adding a push relay would be a separate architectural decision and is not authorized by this research pass.

The strongest current permission candidate remains persistent storage via `navigator.storage.persist()`, because it directly supports the app's “your patterns and grading data live on this device” promise without requiring cloud sync or push infrastructure. However, the actual request UX, trigger moment, optional-denial behavior, and five-locale priming copy must wait for the required separate Pass 2. No permission should be requested at first launch or onboarding, and core grading/export must remain fully usable when any optional permission is denied.

## Follow-up required

Set the queue entry to `pass-1-done` and re-queue it for a later firing. Pass 2 must design, but not implement, the request UX for persistent storage and any narrowly scoped local-only notification concept, reusing the existing install-banner priming pattern. Only after Pass 2 may a numbered implementation item be opened, with persistent storage considered first.

**No secrets, credentials, tokens, or environment values are recorded here.**
