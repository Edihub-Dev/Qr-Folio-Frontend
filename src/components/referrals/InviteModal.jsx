import React, { useMemo } from "react";
import { X, Copy, Share2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

const InviteModal = ({ isOpen, onClose, referralLink, referralCode }) => {
  const shareText = useMemo(
    () =>
      `Join me on QrFolio using my referral link and get ₹50 off your first purchase. Sign up: ${referralLink}`,
    [referralLink]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Invite message copied");
    } catch (error) {
      toast.error("Unable to copy message");
      console.error(error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on QrFolio",
          text: shareText,
          url: referralLink,
        });
      } catch (error) {
        if (error?.name !== "AbortError") {
          toast.error("Unable to open share sheet");
        }
      }
    } else {
      handleCopy();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Share invite</h3>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-1">
              Referral code • {referralCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 text-sm text-slate-600">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 text-primary-700">
            {shareText}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" /> Copy message
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow hover:bg-primary-700"
            >
              <Share2 className="h-4 w-4" /> Share via apps
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </a>
            <a
              href={`mailto:?subject=Join%20me%20on%20QrFolio&body=${encodeURIComponent(shareText)}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Send email invite
            </a>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
