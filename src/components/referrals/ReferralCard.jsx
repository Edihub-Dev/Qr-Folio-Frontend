import React, { useRef } from "react";
import { Copy, Share2, QrCode, Download } from "lucide-react";
import QRCodeGenerator from "../qr/QRCodeGenerator";
import toast from "react-hot-toast";

const ReferralCard = ({
  referralCode,
  referralLink,
  qrCodeDataUrl,
  qrValue,
  onShare,
  onCopy,
}) => {
  const qrCodeRef = useRef(null);

  const handleDownloadQr = async () => {
    if (!qrValue || !qrCodeRef.current) return;

    try {
      const canvas = qrCodeRef.current.getCanvas
        ? qrCodeRef.current.getCanvas()
        : null;

      if (!canvas) {
        toast.error("QR not ready yet");
        return;
      }

      const dataUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "qrfolio-referral-qr.png";
      link.click();
      toast.success("Referral QR downloaded");
    } catch (error) {
      console.error("Failed to download referral QR", error);
      toast.error("Unable to download QR");
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
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm">
            {qrValue ? (
              <QRCodeGenerator
                ref={qrCodeRef}
                value={qrValue}
                size={60}
                level="H"
                color="#000000"
                background="#FFFFFF"
                logoSrc="/assets/QrLogo.webp"
                logoSizeRatio={0.18}
                className="overflow-hidden rounded-2xl"
                pixelRatio={3}
              />
            ) : qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Referral QR"
                className="h-40 w-40 object-contain"
              />
            ) : (
              <div className="h-40 w-40 flex items-center justify-center text-slate-400">
                <QrCode className="h-16 w-16" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={!qrValue}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download QR
          </button>
          <span className="text-xs text-slate-400">
            Scan to join with your referral code
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;
