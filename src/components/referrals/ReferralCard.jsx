import React, { useRef, useMemo } from "react";
import { Copy, Share2, QrCode, Download } from "lucide-react";
import toast from "react-hot-toast";

const ReferralCard = ({
  referralCode,
  referralLink,
  qrCodeDataUrl,
  qrValue,
  onShare,
  onCopy,
}) => {
  const qrCardRef = useRef(null);

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000",
    []
  );
  const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

  const handleDownloadQr = async () => {
    const node = qrCardRef.current;
    if (!node) return;

    try {
      const { toPng } = await import("html-to-image");

      // Wait for image to fully load
      const images = Array.from(node.querySelectorAll("img"));
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
              setTimeout(done, 1500);
            })
        )
      );

      const dataUrl = await toPng(node, {
        backgroundColor: "transparent",
        pixelRatio: 4, // Ultra-sharp 4x scale
        cacheBust: true,
      });

      const safeName = (referralCode || "Referral").replace(/\s+/g, "_");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${safeName}_Referral_Card.png`;
      link.click();

      toast.success("Referral Card downloaded successfully");
    } catch (e) {
      console.error("Referral QR download failed:", e);
      toast.error("Unable to download Referral Card");
    }
  };

  const handleCopyReferralLink = async () => {
    if (!referralLink) return;

    if (typeof onCopy === "function") {
      onCopy();
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied");
    } catch (error) {
      toast.error("Unable to copy referral link");
      console.error("copy.referral.link", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Your referral code
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-semibold tracking-wider text-white lg:text-4xl">
              {referralCode || "———"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!referralCode) return;
                navigator.clipboard.writeText(referralCode);
                toast.success("Referral code copied!");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>

            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/40 hover:bg-primary-400"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Invite friends to join QR Folio and earn rewards when they purchase
            a paid plan. Share your link across WhatsApp, Telegram, or email in
            one tap.
          </p>
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary-500/40 bg-primary-500/10 p-4 text-sm text-primary-100 sm:flex-row sm:items-center">
            <div className="flex-1 break-all text-base font-medium text-white/90">
              {referralLink || "Referral link unavailable"}
            </div>
            <button
              type="button"
              onClick={handleCopyReferralLink}
              disabled={!referralLink}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" />
              Copy link
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          {/* Outer shadow-only wrapper for gorgeous screen rendering */}
          <div className="rounded-3xl shadow-[0_22px_50px_rgba(15,23,42,0.9)]">
            {/* Inner container captured by html-to-image with NO shadow to prevent gray corner artifacts */}
            <div
              ref={qrCardRef}
              className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-emerald-400 p-[1px] w-[240px]"
            >
              <div className="rounded-[26px] border border-slate-900 bg-slate-950/95 p-5 text-center">
                <div className="flex justify-center">
                  {qrValue ? (
                    <img
                      src={`${base}/qrcode/custom?text=${encodeURIComponent(qrValue)}`}
                      alt="Referral QR"
                      style={{ width: 150, height: 150, imageRendering: "pixelated" }}
                      className="overflow-hidden rounded-2xl border border-slate-800"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  ) : qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Referral QR"
                      className="h-36 w-36 object-contain rounded-2xl border border-slate-800"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  ) : (
                    <div className="h-36 w-36 flex items-center justify-center text-slate-400">
                      <QrCode className="h-14 w-14" />
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-white tracking-wider">
                    {referralCode || "—"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Scan to join with referral code
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={!qrValue}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-slate-950/50"
          >
            <Download className="h-4 w-4" />
            Download Referral Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;
