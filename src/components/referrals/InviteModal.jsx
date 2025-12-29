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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/70">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Share invite</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">
              Referral code • {referralCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm text-slate-200">
          <div className="rounded-2xl border border-primary-500/40 bg-primary-500/10 px-4 py-3 text-primary-100">
            {shareText}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" /> Copy message
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-primary-500/40 hover:bg-primary-400"
            >
              <Share2 className="h-4 w-4" /> Share via apps
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25"
            >
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </a>
            <a
              href={`mailto:?subject=Join%20me%20on%20QrFolio&body=${encodeURIComponent(
                shareText
              )}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
            >
              Send email invite
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
