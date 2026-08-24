# CHK-243 — Device permissions: independent Pass 2 UX design

**Status:** Research-only complete. **No application code, permission request, notification API, copy module, storage schema, or runtime behavior was changed before or during this note.**

**Source audited:** `4485690da77e8dcb8bd2ae2999d98538ca3dfcbf` (isolated live HEAD and `origin/main` at the start of this pass).

**Binding sources:**

- `docs/research/device-permissions-2026-08-23.md`
- `docs/leader-notes/cycle-2026-08-24-CHK-241-device-permissions-pass1.md`
- `docs/queue/work-queue.md`
- `src/components/install-banner.tsx`
- `src/lib/install-banner-copy.ts`
- `src/hooks/use-pwa-install.ts`
- `src/lib/i18n.ts`
- Fresh official-source evidence recorded in `/tmp/device-permissions-pass1-sources-20260824.txt`

## Executive decision

The research brief survives its two-pass test with one clear implementation candidate and one future-only candidate:

1. **Implement persistent local storage protection first.** It is directly aligned with the app’s local-first ownership promise, has no server dependency, does not require accounts or uploads, and can remain fully optional. The request should be framed as protecting the maker’s already-created work on this device, not as a prerequisite for grading or export.
2. **Do not implement notifications in the same release.** A local `Notification` API flow is only honest when the app has a genuinely asynchronous, user-started operation that can finish while Stitch & Scale remains open in another tab or window. The current pattern and Project Book flows are browser print/handoff preparation, not a durable background job and not proof that a file was saved. They are therefore not valid notification triggers today.
3. **Do not build push.** Closed-app/background push remains a server-backed architecture and is outside the current local-first/no-server product boundary. It requires a separate product and trust decision, not a permission ticket.

The recommended implementation item opened after this note is **persistent storage only**. It must not include Notification API work, service-worker push, background sync, cloud sync, accounts, analytics, geolocation, camera, microphone, or any change to grading/export semantics.

## Pass 2 principle stress test

The existing install banner is the correct interaction precedent: detect capability first, explain a concrete benefit in the app’s own surface, offer a user-controlled action, provide a clear dismissal path, and avoid recurring interruption. A future storage-protection surface should reuse that shape without copying its install-specific language or pretending that browser persistence is an absolute backup.

| Candidate | Real user value now | Server needed | Trigger can be truthful today | Core loss if denied | Prompt policy | Decision |
|---|---|---:|---:|---:|---|---|
| Persistent storage protection | Reduces the risk of browser eviction of meaningful IndexedDB data under storage pressure | No | Yes, after a real project save | No; grading, editing, and export continue | Contextual in-app priming, then browser API only after explicit action | **Open one narrow implementation item** |
| Local notification for a future long-running operation | Could signal a genuine completion while the app remains open elsewhere | No for same-device open-tab behavior | **No current trigger**; current exports are synchronous print/handoff preparation | No; the operation can be checked in-app | Defer until an operation has a real pending/ready lifecycle | **Future candidate only** |
| Closed-app web push | Re-engagement and completion delivery while fully closed | **Yes**; server and push relay | No current server-backed job or subscription lifecycle | No | Never request now | **Reject for current scope** |
| Clipboard | Copy result after a direct user gesture | No | Already truthful | No | No new request | **No action** |
| File input | User-selected import or image/file attachment | No | Already truthful through the OS picker | No | No new request | **No action** |
| Geolocation, camera, microphone, background sync | No current load-bearing product need | Varies | No | No | Never request pre-emptively | **Reject** |

## Persistent storage request UX

### Eligibility and trigger moment

The proposed trigger is the **first successful save of a user-created project with meaningful data**, after the existing local persistence write has completed. “Meaningful data” should mean the user has created or edited a real project record; opening the app, viewing the sample project, completing or skipping onboarding, changing language, or merely visiting Settings must not trigger it.

The UI should not appear at first launch or during onboarding. It should not claim that storage is guaranteed, that a browser cannot evict data, or that the user must grant access. The app should first show an in-app priming card or banner at the next calm render after the save has completed. Only the user’s explicit action on that card may call `navigator.storage.persist()` in a future implementation.

The future implementation should treat the browser API as a best-effort protection signal:

- If persistent storage is already granted, remain quiet and optionally expose a factual status in Settings.
- If `navigator.storage.persist` is unsupported, remain quiet or show a non-blocking explanation that the browser does not expose this protection; do not simulate success.
- If the browser returns `true`, say that the browser accepted a request to keep this site’s local data protected from automatic eviction where supported; do not say “your data is backed up.”
- If it returns `false` or rejects, preserve the project and all core behavior, offer the existing Export/Restore path as the reliable user-controlled backup, and do not repeatedly ask in the same session.
- A dismiss action must be remembered locally with a bounded cooldown or one-time policy. It must not create a recurring nag or block the workspace.

### Proposed interaction shape

1. The user saves a real project for the first time.
2. A quiet, dismissible in-app banner appears after the save state is already confirmed.
3. The banner explains the narrow reason: protecting local project data on this device from automatic browser eviction where supported.
4. The primary action is explicit and optional, for example “Protect local data.”
5. The secondary action is “Not now.”
6. No browser API is called on render, on route entry, during onboarding, or after a hidden timeout.
7. A later Settings status may show `Protected by browser`, `Not requested`, `Not available`, or `Request declined`; it must not claim an absolute guarantee.

### Persistent-storage five-locale priming copy draft

These are design drafts only. They must not be copied into the application during this research pass. A production copy module must follow the existing `LanguageCode` and locale-parity conventions and receive fluent-speaker review.

#### English (`en`)

- `storageProtectionTitle`: **Keep your local work safer**
- `storageProtectionBody`: **Stitch & Scale saves your projects on this device. The browser can sometimes clear local data under storage pressure. You can ask it to protect this site’s stored work. This is not a backup.**
- `storageProtectionAction`: **Protect local data**
- `storageProtectionNotNow`: **Not now**
- `storageProtectionDismiss`: **Dismiss**
- `storageProtectionAccepted`: **The browser accepted the local-storage protection request. Keep an export as your backup.**
- `storageProtectionDeclined`: **Your project still works normally. Keep an export as your backup.**
- `storageProtectionUnavailable`: **This browser does not offer local-storage protection. Your project still works normally; use Export/Restore for backup.**

#### German (`de`)

- `storageProtectionTitle`: **Lokale Arbeit besser schützen**
- `storageProtectionBody`: **Stitch & Scale speichert deine Projekte auf diesem Gerät. Der Browser kann lokale Daten bei knappem Speicher manchmal löschen. Du kannst ihn bitten, die gespeicherten Daten dieser Website zu schützen. Das ist kein Backup.**
- `storageProtectionAction`: **Lokale Daten schützen**
- `storageProtectionNotNow`: **Jetzt nicht**
- `storageProtectionDismiss`: **Schließen**
- `storageProtectionAccepted`: **Der Browser hat den Schutz lokaler Daten akzeptiert. Bewahre einen Export als Backup auf.**
- `storageProtectionDeclined`: **Dein Projekt funktioniert weiterhin normal. Bewahre einen Export als Backup auf.**
- `storageProtectionUnavailable`: **Dieser Browser bietet keinen Schutz lokaler Daten an. Dein Projekt funktioniert weiterhin normal; nutze Export/Wiederherstellen als Backup.**

#### French (`fr`)

- `storageProtectionTitle`: **Mieux protéger votre travail local**
- `storageProtectionBody`: **Stitch & Scale enregistre vos projets sur cet appareil. Le navigateur peut parfois supprimer des données locales lorsque l’espace manque. Vous pouvez lui demander de protéger les données stockées pour ce site. Ce n’est pas une sauvegarde.**
- `storageProtectionAction`: **Protéger les données locales**
- `storageProtectionNotNow`: **Pas maintenant**
- `storageProtectionDismiss`: **Fermer**
- `storageProtectionAccepted`: **Le navigateur a accepté la demande de protection des données locales. Conservez un export comme sauvegarde.**
- `storageProtectionDeclined`: **Votre projet continue de fonctionner normalement. Conservez un export comme sauvegarde.**
- `storageProtectionUnavailable`: **Ce navigateur ne propose pas la protection des données locales. Votre projet continue de fonctionner normalement ; utilisez Exporter/Restaurer comme sauvegarde.**

#### Spanish (`es`)

- `storageProtectionTitle`: **Protege mejor tu trabajo local**
- `storageProtectionBody`: **Stitch & Scale guarda tus proyectos en este dispositivo. El navegador puede borrar a veces los datos locales cuando queda poco espacio. Puedes pedirle que proteja los datos guardados de este sitio. Esto no es una copia de seguridad.**
- `storageProtectionAction`: **Proteger datos locales**
- `storageProtectionNotNow`: **Ahora no**
- `storageProtectionDismiss`: **Cerrar**
- `storageProtectionAccepted`: **El navegador aceptó la solicitud de protección de los datos locales. Conserva una exportación como copia de seguridad.**
- `storageProtectionDeclined`: **Tu proyecto sigue funcionando con normalidad. Conserva una exportación como copia de seguridad.**
- `storageProtectionUnavailable`: **Este navegador no ofrece protección de datos locales. Tu proyecto sigue funcionando con normalidad; usa Exportar/Restaurar como copia de seguridad.**

#### Portuguese (`pt`)

- `storageProtectionTitle`: **Proteja melhor o seu trabalho local**
- `storageProtectionBody`: **O Stitch & Scale guarda os seus projetos neste dispositivo. O navegador pode, por vezes, apagar dados locais quando há pouco espaço. Pode pedir-lhe que proteja os dados guardados deste site. Isto não é uma cópia de segurança.**
- `storageProtectionAction`: **Proteger dados locais**
- `storageProtectionNotNow`: **Agora não**
- `storageProtectionDismiss`: **Fechar**
- `storageProtectionAccepted`: **O navegador aceitou o pedido de proteção dos dados locais. Guarde uma exportação como cópia de segurança.**
- `storageProtectionDeclined`: **O seu projeto continua a funcionar normalmente. Guarde uma exportação como cópia de segurança.**
- `storageProtectionUnavailable`: **Este navegador não oferece proteção de dados locais. O seu projeto continua a funcionar normalmente; use Exportar/Restaurar como cópia de segurança.**

### Storage copy review

The copy separates three facts that must not be conflated: the app stores data locally; the browser may offer an eviction-protection request; and an export is the user-controlled backup. It never says that data is uploaded, synced, encrypted, guaranteed, or safe from device loss. “Accepted” describes the browser API result only and must not be changed to “protected forever.”

## Local-only notification design — future only

A local notification is only a legitimate feature after the app has a real asynchronous operation with a durable in-memory or local pending state and a factual ready event. The current pattern PDF and Project Book paths are print/handoff preparation flows; they do not prove browser file save, do not create a background job, and do not justify a completion notification.

### Future trigger moments

A future implementation may consider one trigger only:

1. The user explicitly starts a genuinely long-running, user-requested operation.
2. The app presents a visible pending state and tells the user that the operation can be checked in this open app.
3. The user chooses an action such as “Notify me on this device when it is ready.”
4. Only after that explicit action may the app request notification permission, and only if the platform supports the request in the current context.
5. When the operation actually reaches a ready state, the notification may state that exact fact. It must not say that a PDF was saved unless a real browser-save result exists.
6. If the operation completes immediately, no permission request should be shown.
7. The current print/handoff flows, onboarding, route entry, “come back” prompts, inactivity, streaks, and marketing reminders are never triggers.

The proposed local-only scope means the app can notify only while the page or an eligible same-device service-worker context is still alive. It must never imply closed-app delivery. Closed-app push requires a separate server-backed architecture decision and is not covered by this queue item.

### Local-notification five-locale priming copy draft

These strings are future design drafts only and must not be shipped until a real asynchronous operation exists.

#### English (`en`)

- `localNotificationTitle`: **Know when this task is ready?**
- `localNotificationBody`: **If a task takes time, Stitch & Scale can show a notification on this device while the app remains open. Nothing is uploaded.**
- `localNotificationAction`: **Allow on this device**
- `localNotificationNotNow`: **Not now**

#### German (`de`)

- `localNotificationTitle`: **Möchtest du wissen, wann diese Aufgabe bereit ist?**
- `localNotificationBody`: **Wenn eine Aufgabe Zeit braucht, kann Stitch & Scale auf diesem Gerät eine Benachrichtigung anzeigen, solange die App geöffnet bleibt. Es wird nichts hochgeladen.**
- `localNotificationAction`: **Auf diesem Gerät erlauben**
- `localNotificationNotNow`: **Jetzt nicht**

#### French (`fr`)

- `localNotificationTitle`: **Voulez-vous savoir quand cette tâche est prête ?**
- `localNotificationBody`: **Si une tâche prend du temps, Stitch & Scale peut afficher une notification sur cet appareil tant que l’app reste ouverte. Rien n’est envoyé.**
- `localNotificationAction`: **Autoriser sur cet appareil**
- `localNotificationNotNow`: **Pas maintenant**

#### Spanish (`es`)

- `localNotificationTitle`: **¿Quieres saber cuándo está lista esta tarea?**
- `localNotificationBody`: **Si una tarea tarda, Stitch & Scale puede mostrar una notificación en este dispositivo mientras la app siga abierta. No se sube nada.**
- `localNotificationAction`: **Permitir en este dispositivo**
- `localNotificationNotNow`: **Ahora no**

#### Portuguese (`pt`)

- `localNotificationTitle`: **Quer saber quando esta tarefa estiver pronta?**
- `localNotificationBody`: **Se uma tarefa demorar, o Stitch & Scale pode mostrar uma notificação neste dispositivo enquanto a aplicação permanecer aberta. Nada é carregado.**
- `localNotificationAction`: **Permitir neste dispositivo**
- `localNotificationNotNow`: **Agora não**

### Notification boundary

The copy says “while the app remains open” and “nothing is uploaded.” It does not imply a server, push relay, re-engagement, or guaranteed background delivery. A future implementation would need explicit feature detection, user-gesture timing, permission outcome handling, denial cooldown, screen-reader announcements, keyboard access, and tests that core grading/export work identically when permission is denied or unavailable.

## Concrete future implementation ticket

After this Pass 2 receipt lands, open exactly one implementation item:

> **Persistent local-storage protection request:** after the first successful save of a meaningful user-created project, offer a localized, dismissible, accessible in-app explanation and an explicit action that calls `navigator.storage.persist()` only from that action. Record only the local request/outcome needed to avoid recurring prompts. Expose truthful status where useful. Preserve all core behavior if unsupported, denied, rejected, or unavailable. Keep Export/Restore as the user-controlled backup path.

### Required implementation tests

The future ticket should add focused tests for:

1. No request on first launch, onboarding, sample-project viewing, route entry, or Settings entry.
2. The priming surface appears only after a meaningful project save and does not appear before local persistence completes.
3. The browser API is called only after the explicit action and never during render.
4. Existing persistence state causes no redundant request.
5. Unsupported, rejected, false, and true outcomes each produce truthful localized status without blocking the workspace.
6. “Not now” and dismissal are bounded and do not create a recurring nag.
7. Core grading, editing, Export, Restore, and wipe behavior remain available with every outcome.
8. Five-locale parity, keyboard operation, focus visibility, screen-reader labeling, reduced motion, narrow mobile layout, and safe-area clearance.
9. No Notification API, push subscription, server call, account field, analytics event, or export-success claim is introduced.

## Pass 2 decision

**Research-only outcome:** persistent local-storage protection is approved for one narrow future implementation item. It is the best current permission-related improvement because it directly protects local-first work without requiring cloud infrastructure or compromising ownership. Local notifications remain a future candidate only after a real asynchronous operation exists; closed-app push is explicitly out of scope and requires a separate architectural decision.

**Implementation hold:** released only for opening the single persistent-storage item after this note and queue update are committed. No application code should be written in this Pass 2 firing.

**Protected files:** `/home/ubuntu/first_novel_invention_brief.md` and all product-goal documents were not modified.

**Verification scope:** This note does not claim that persistent storage protection, notifications, push, or any new permission behavior exists in the app. It does not claim backup guarantees or publication readiness.

---

*Prepared as an independent research-only UX and architecture artifact, not an implementation patch.*
