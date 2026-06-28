import QRCode from 'qrcode';

/**
 * Generates a base64 PNG data URL of a QR code.
 * High resolution (width 256px, margin 1) for crystal clear thermal printing.
 */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR Code Data URL:', err);
    return '';
  }
}

/**
 * Generates a clean SVG string of a QR code.
 */
export async function generateQrCodeSvg(data: string): Promise<string> {
  try {
    return await QRCode.toString(data, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR Code SVG:', err);
    return '';
  }
}
