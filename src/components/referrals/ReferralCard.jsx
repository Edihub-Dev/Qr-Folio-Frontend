import React from "react";
import { Copy, Share2, QrCode } from "lucide-react";

const ReferralCard = ({
  referralCode,
  referralLink,
  qrCodeDataUrl,
  onCopy,
  onShare,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Your referral code
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-3xl lg:text-4xl font-semibold tracking-wider text-slate-900">
              {referralCode || "———"}
            </span>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Invite friends to join QrFolio and earn rewards when they purchase a paid plan. Share your link across WhatsApp, Telegram, or email in one tap.
          </p>
          <div className="mt-4 bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 text-sm text-primary-700 break-all">
            {referralLink}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            {qrCodeDataUrl ? (
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
          <span className="text-xs text-slate-500">
            Scan to join with your referral code
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;
