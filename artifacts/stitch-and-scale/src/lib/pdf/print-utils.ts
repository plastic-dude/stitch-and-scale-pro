// Client-side PDF utilities — Stitch & Scale
// Uses the browser's built-in print engine for pixel-perfect PDF output.
// No dependencies. Open HTML in new tab → auto-trigger OS print dialog.

/**
 * Print HTML directly using a hidden iframe.
 * Temporarily swaps the main document title to ensure the OS "Save as PDF" 
 * dialog picks up the correct suggested filename.
 */
export function openPrintWindow(html: string, suggestedFilename: string): void {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
  const titleForPrint = suggestedFilename.replace(/\.pdf$/i, '');

  if (isMobile) {
    // Mobile relies on visible windows to reliably trigger the OS print/share sheet
    const win = window.open('', '_blank');
    if (!win) {
      // If popup blocked, use blob navigation
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.click();
      return;
    }
    
    win.document.open();
    win.document.write(html);
    win.document.close();
    
    win.addEventListener('load', () => {
      win.document.title = titleForPrint;
      setTimeout(() => {
        win.focus();
        win.print();
      }, 800);
    });
    return;
  }

  // Desktop implementation: hidden iframe for seamless experience
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  
  document.body.appendChild(iframe);
  
  const win = iframe.contentWindow;
  if (!win) {
    document.body.removeChild(iframe);
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Wait for fonts and layout to render
  setTimeout(() => {
    const originalTitle = document.title;
    document.title = titleForPrint;
    win.document.title = titleForPrint;

    try {
      win.focus();
      win.print();
    } finally {
      // Restore title and cleanup after print dialog is closed/canceled
      document.title = originalTitle;
      // Delay removal to ensure print dialog has launched successfully
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  }, 1200); // Allow time for Google Fonts to load
}

/**
 * Build the default export filename from project data.
 * Prefers project name. Never falls back to generic "Pattern.pdf".
 */
export function getDefaultFilename(projectName: string): string {
  const clean = (projectName || 'Untitled Pattern').trim();
  // Sanitize: remove characters invalid in filenames
  return clean.replace(/[/\\:*?"<>|]/g, '-').slice(0, 180);
}

/**
 * Detect whether the user has used a custom naming pattern by comparing
 * their edited filename to what the default would have been.
 * Returns the custom suffix/prefix they added (if any), for remembering.
 */
export function detectNamingStyle(edited: string, defaultName: string): string | null {
  const e = edited.trim().replace(/\.pdf$/i, '');
  const d = defaultName.trim().replace(/\.pdf$/i, '');
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
  if (!template || !template.includes('{name}')) return getDefaultFilename(projectName);
  return template.replace('{name}', projectName.trim()).replace(/[/\\:*?"<>|]/g, '-').slice(0, 180);
}
