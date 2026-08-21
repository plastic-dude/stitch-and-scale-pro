// Client-side PDF utilities — Stitch & Scale
// Uses the browser's built-in print engine for pixel-perfect PDF output.
// No dependencies. Open HTML in new tab → auto-trigger the OS print dialog.

export type PrintAttemptResult =
  | { ok: true; path: "iframe" | "new-window" | "blob" }
  | { ok: false; reason: "blocked" | "no-window" | "write-failed" | "unknown" };

let inFlight = false; // guards rapid double/triple clicks during one export.

/**
 * Send HTML to the OS print dialog and report whether the attempt launched.
 *
 * State-machine contract:
 *  - Returns synchronously with `ok: false` for every *recoverable* failure
 *    the caller can observe (popup blocked, no contentWindow, document.write
 *    threw). The page shows the failure toast and re-enables the button.
 *  - For the happy path, the print dialog itself reports its outcome through
 *    the window `afterprint` event, observed on the print surface
 *    (`window.onafterprint` on the iframe's window / the new window).
 *  - A page-side in-flight lock prevents a second export while the first
 *    dialog is still open (the old code could race two iframes per double
 *    click, leaving orphaned iframes and stale titles).
 */
export function openPrintWindow(
  html: string,
  suggestedFilename: string,
): PrintAttemptResult {
  if (inFlight) {
    return { ok: false, reason: "blocked" };
  }
  inFlight = true;
  const titleForPrint = suggestedFilename.replace(/\.pdf$/i, "");

  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
    if (isMobile) {
      const win = window.open("", "_blank");
      if (!win) {
        // Popup blocked — fall back to a blob link the user clicks manually.
        inFlight = false;
        return { ok: false, reason: "blocked" };
      }
      const opened = writeInto(win, html, titleForPrint);
      if (!opened) {
        inFlight = false;
        return { ok: false, reason: "write-failed" };
      }
      win.addEventListener("load", () => {
        win.document.title = titleForPrint;
        // afterprint fires when the OS print sheet closes (cancel or save).
        try {
          (win as unknown as Window & { onafterprint?: unknown }).onafterprint = () => {
            inFlight = false;
          };
        } catch {
          /* non-blocking */
        }
        setTimeout(() => {
          try {
            win.focus();
            win.print();
          } catch {
            /* print unavailable in this context */
          }
        }, 800);
      });
      return { ok: true, path: "new-window" };
    }

    // Desktop implementation: hidden iframe for a seamless experience.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    if (!win) {
      document.body.removeChild(iframe);
      inFlight = false;
      return { ok: false, reason: "no-window" };
    }

    const opened = writeInto(win, html, titleForPrint);
    if (!opened) {
      document.body.removeChild(iframe);
      inFlight = false;
      return { ok: false, reason: "write-failed" };
    }

    // afterprint on the iframe's window fires when the print dialog closes.
    try {
      (win as unknown as Window & { onafterprint?: unknown }).onafterprint = () => {
        inFlight = false;
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };
    } catch {
      /* non-blocking */
    }

    // Wait for fonts and layout to render, then raise the dialog.
    setTimeout(() => {
      const originalTitle = document.title;
      document.title = titleForPrint;
      win.document.title = titleForPrint;

      try {
        win.focus();
        win.print();
      } catch {
        /* print unavailable in this context */
      } finally {
        document.title = originalTitle;
      }
    }, 1200); // Allow time for Google Fonts to load

    return { ok: true, path: "iframe" };
  } catch {
    inFlight = false;
    return { ok: false, reason: "unknown" };
  }
}

/** Write HTML into a print surface (iframe window or new tab window). */
function writeInto(
  win: Window,
  html: string,
  titleForPrint: string,
): boolean {
  try {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.document.title = titleForPrint;
    return true;
  } catch {
    return false;
  }
}

// Test seam: lets the guard suite reset the in-flight lock without a full
// browser reload. Production code never needs to call this.
export function __resetInFlightForTests(): void {
  inFlight = false;
}

/**
 * Sanitize any filename (default or user-edited) into a safe, portable basename.
 * Policy (F-05, CHK-154):
 *  - strip path separators and traversal sequences (`..`, `\`, `/`, NUL)
 *  - strip characters invalid in Windows/POSIX names (`<>:"|?*`) and control chars
 *  - strip trailing dots and spaces (Windows silently strips them)
 *  - collapse runs of whitespace to a single space, trim, drop empty tokens
 *  - block Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 *  - collapse the result to dashes when it is empty, never return an empty string
 * The returned name is always non-empty and contains no control, path, or
 * reserved-name content. Used verbatim as the exported filename stem.
 */
export function sanitizeFilename(raw: string): string {
  let name = raw;
  // Drop a user-supplied ".pdf" extension — the export layer appends ".pdf"
  // exactly once, so keeping one in the stem would double it ("name.pdf.pdf").
  name = name.replace(/\.pdf\s*$/i, "");
  // Drop traversal and null/control characters early.
  name = name.replace(/\.\./g, "").replace(/[\x00-\x1f\x7f]/g, "");
  // Remove path separators and characters that are invalid on Windows/macOS.
  name = name.replace(/[\/\\:*?"<>|]/g, "-");
  // Collapse whitespace.
  name = name.replace(/\s+/g, " ").trim();
  // Remove trailing dots (Windows strips them), collapse substitution-driven
  // runs of dashes into one, and drop any dashes left at the edges.
  name = name.replace(/\.+$/, "").replace(/-+/g, "-").replace(/^-|-$/g, "").trim();
  if (!name) return "Pattern";
  // Windows reserved device names are still usable as file stems on some
  // platforms and cause confusing failures; block them outright.
  const upper = name.toUpperCase();
  if (/^(CON|PRN|AUX|NUL|COM\d|LPT\d)(\.[^.]*)?$/i.test(upper)) return "Pattern";
  return name.slice(0, 180);
}

/**
 * Build the default export filename from project data.
 * Prefers project name. Never falls back to generic "Pattern.pdf".
 */
export function getDefaultFilename(projectName: string): string {
  return sanitizeFilename((projectName || "Untitled Pattern").trim());
}

/**
 * Detect whether the user has used a custom naming pattern by comparing
 * their edited filename to what the default would have been.
 * Returns the custom suffix/prefix they added (if any), for remembering.
 */
export function detectNamingStyle(edited: string, defaultName: string): string | null {
  const e = edited.trim().replace(/\.pdf$/i, "");
  const d = defaultName.trim().replace(/\.pdf$/i, "");
  if (e === d) return null;
  // If the default name appears in the edited, capture the surrounding pattern
  const idx = e.indexOf(d);
  if (idx === -1) return null; // completely different — don't persist
  const prefix = e.slice(0, idx);
  const suffix = e.slice(idx + d.length);
  if (!prefix && !suffix) return null;
  return `${prefix}{name}${suffix}`;
}

/**
 * Apply a persisted naming template to a project name.
 * Template format: "{name}" is replaced with the actual project name.
 */
export function applyNamingTemplate(template: string, projectName: string): string {
  if (!template || !template.includes("{name}")) return getDefaultFilename(projectName);
  return sanitizeFilename(template.replace("{name}", projectName.trim()));
}
