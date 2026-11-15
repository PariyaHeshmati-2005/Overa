import "server-only";
import QRCode from "qrcode";

/**
 * Resolves the canonical public base URL of the deployment.
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL  — set in Vercel to https://overa.vercel.app
 *  2. VERCEL_URL            — automatic per-deployment domain on Vercel
 *  3. localhost:3000        — local development fallback
 * The QR code must always encode the real published address so a phone that
 * scans it lands on the live install page.
 */
export function getSiteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, "")}`;
  if (process.env.NODE_ENV === "production") {
    // Production without an explicit URL: fall back to the known public domain.
    return "https://overa.vercel.app";
  }
  return "http://localhost:3000";
}

/**
 * Generates a real, scannable QR code (SVG) pointing at the install page.
 * Generated locally with the `qrcode` package — no external image services,
 * no placeholder graphics. Error-correction level M keeps it scannable even
 * when partially covered.
 */
export async function installQrSvg(): Promise<string> {
  const target = `${getSiteBaseUrl()}/install`;
  return QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#1e1143", light: "#ffffff" },
  });
}
