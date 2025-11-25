// SEO configuration utilities for QR Folio

export const SITE_NAME = "QR Folio";

// Prefer explicit public site URL via Vite env, otherwise fall back to window origin at runtime
export const SITE_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_SITE_URL) ||
    (typeof window !== "undefined" && window.location?.origin) ||
    "https://www.qrfolio.net";

export const DEFAULT_OG_IMAGE = `${SITE_URL.replace(/\/$/, "")}/assets/landingpage.png`;
export const DEFAULT_OG_IMAGE_ALT =
    "QR Folio dashboard preview – digital business card platform";

export const buildAbsoluteUrl = (path = "/") => {
    const base = SITE_URL.replace(/\/$/, "");
    if (!path) return base;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};
