// Compresses an uploaded image down to a small data: URI, entirely
// client-side, before it's stored in localStorage (via PdfDefaults.customLogo
// in SettingsContext) or sent to the PDF renderer.
//
// NOTE ON VERIFICATION: this file uses browser-only APIs (HTMLCanvasElement,
// Image, FileReader) that don't exist in a plain Node/tsx environment, so
// unlike the CSV import engine, this couldn't be run through an automated
// test in this session - it's been written carefully and reviewed, not
// behaviorally proven the way the rest of tonight's work was. Worth an
// actual upload test in the real app before trusting it fully.

const MAX_DIMENSION = 400; // generous for the largest cover-mark usage (26px), well past what any print/export resolution needs
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024; // 2MB hard ceiling - a sanity backstop, resizing should make this unreachable in normal use

export interface CompressImageResult {
  dataUrl: string | null;
  error: string | null;
}

export function compressImageToDataUrl(file: File): Promise<CompressImageResult> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ dataUrl: null, error: 'That file isn\'t an image.' });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve({ dataUrl: null, error: 'The file could not be read.' });
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve({ dataUrl: null, error: 'That file doesn\'t look like a valid image.' });
      img.onload = () => {
        try {
          const { width, height } = img;
          const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
          const targetW = Math.max(1, Math.round(width * scale));
          const targetH = Math.max(1, Math.round(height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: null, error: 'Your browser could not process this image.' });
            return;
          }
          // PNG, not JPEG - logos are frequently transparent, and JPEG has
          // no alpha channel. A resized 400px logo is small enough as PNG
          // that the format's larger size vs. JPEG doesn't matter here.
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const dataUrl = canvas.toDataURL('image/png');

          // Rough byte size from a base64 data URI: strip the header, every
          // 4 base64 chars decode to 3 bytes.
          const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;
          const approxBytes = base64Length * 0.75;
          if (approxBytes > MAX_OUTPUT_BYTES) {
            resolve({ dataUrl: null, error: 'This image is too complex to store even after resizing. Try a simpler logo.' });
            return;
          }

          resolve({ dataUrl, error: null });
        } catch {
          resolve({ dataUrl: null, error: 'Something went wrong processing this image.' });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
