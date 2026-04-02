import { Share } from '@capacitor/share';
import { Device } from '@capacitor/device';

/**
 * Handles cross-platform sharing/downloading of files.
 * - Mobile (Capacitor): Opens the native share sheet.
 * - Windows (Electron/Web): Initiates a standard browser download.
 * @param blob The file blob to share
 * @param fileName The name of the file
 * @param title The title for the share sheet (mobile only)
 * @param text Additional text for the share sheet (mobile only)
 */
export const shareOrDownloadFile = async (blob: Blob, fileName: string, title = 'Share Document', text = 'Signed document from StampKE') => {
  try {
    const info = await Device.getInfo();
    const isMobile = info.platform === 'ios' || info.platform === 'android';

    if (isMobile) {
      // 1. Create a temporary URL
      const url = URL.createObjectURL(blob);
      
      // 2. Open Share Sheet
      await Share.share({
        title,
        text,
        url: url, // Some platforms prefer the URL, others the file
        dialogTitle: title,
      });

      // 3. Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      // 4. Standard Download for Windows/Web
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('[Sharing] Failed to share/download:', err);
    // Fallback to standard download if share fails
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
};
