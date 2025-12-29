import React, { useRef } from "react";
import { Copy, Share2, QrCode, Download } from "lucide-react";
import QRCodeGenerator from "../QRCodeGenerator";
import toast from "react-hot-toast";

const ReferralCard = ({
  referralCode,
  referralLink,
  qrCodeDataUrl,
  qrValue,
  onShare,
}) => {
  const qrCardRef = useRef(null);

  const handleDownloadQr = async () => {
    if (!qrValue || !qrCardRef.current) return;

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(qrCardRef.current, {
        cacheBust: true,
        // backgroundColor: "#020617",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "qrfolio-referral-qr.png";
      link.click();
    } catch (error) {
      console.error("Failed to download referral QR", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
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
            Invite friends to join QrFolio and earn rewards when they purchase a
            paid plan. Share your link across WhatsApp, Telegram, or email in
            one tap.
          </p>
          <div className="mt-4 break-all rounded-2xl border border-primary-500/40 bg-primary-500/10 px-4 py-3 text-sm text-primary-100">
            {referralLink}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div
            ref={qrCardRef}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm"
          >
            {qrValue ? (
              <QRCodeGenerator
                value={qrValue}
                size={160}
                level="H"
                color="#000000"
                background="#FFFFFF"
                logoSrc="/assets/QrLogo.svg"
                logoSizeRatio={0.22}
                className="overflow-hidden rounded-2xl"
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
