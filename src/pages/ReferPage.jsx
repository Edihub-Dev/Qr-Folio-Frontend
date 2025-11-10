import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import ReferralCard from "../components/referrals/ReferralCard";
import ReferralHistoryTable from "../components/referrals/ReferralHistoryTable";
import LeaderboardCard from "../components/referrals/LeaderboardCard";
import RewardRulesCard from "../components/referrals/RewardRulesCard";
import InviteModal from "../components/referrals/InviteModal";
import WithdrawalModal from "../components/referrals/WithdrawalModal";
import {
  getReferralOverview,
  getReferralHistory,
  submitWithdrawal,
} from "../services/referralService";

const initialPagination = {
  page: 1,
  limit: 10,
  total: 0,
};

const ReferPage = () => {
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [isSubmittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const referralLink = overview?.referralLink;
  const referralCode = overview?.referralCode;

  const clientOrigin = useMemo(() => {
    const envOrigin = import.meta?.env?.VITE_CLIENT_ORIGIN;
    if (typeof envOrigin === "string" && envOrigin.trim()) {
      return envOrigin.trim().replace(/\/$/, "");
    }
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin.replace(/\/$/, "");
    }
    return "https://www.qrfolio.net";
  }, []);

  const effectiveReferralLink = useMemo(() => {
    if (referralLink) return referralLink;
    if (referralCode) {
      return `${clientOrigin}/signup?ref=${referralCode}`;
    }
    return null;
  }, [clientOrigin, referralLink, referralCode]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const { data } = await getReferralOverview();
        if (data?.success) {
          setOverview(data.data);
        }
      } catch (error) {
        toast.error("Unable to load referral data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  useEffect(() => {
    if (!effectiveReferralLink) {
      setQrDataUrl(null);
      return;
    }
    const generateQr = async () => {
      try {
        const qr = await QRCode.toDataURL(effectiveReferralLink, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 256,
        });
        setQrDataUrl(qr);
      } catch (error) {
        console.error("Failed to generate referral QR", error);
      }
    };
    generateQr();
  }, [effectiveReferralLink]);

  const loadHistory = async (page = 1) => {
    try {
      setHistoryLoading(true);
      const { data } = await getReferralHistory({
        page,
        limit: pagination.limit,
      });
      if (data?.success) {
        setHistory(data.data?.items || []);
        setPagination({
          page: data.data?.page || 1,
          limit: data.data?.limit || pagination.limit,
          total: data.data?.total || 0,
          totalPages: data.data?.totalPages || 1,
        });
      }
    } catch (error) {
      toast.error("Unable to load history");
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaderboardEntries = useMemo(() => {
    if (!overview?.recentHistory) return [];
    const aggregate = overview.recentHistory.reduce((acc, item) => {
      const key = item.referrerId?.toString() || "self";
      if (!acc[key]) {
        acc[key] = {
          id: key,
          email: overview.referralCode,
          totalReferrals: 0,
          totalRewards: 0,
        };
      }
      acc[key].totalReferrals += 1;
      if (["completed", "rewarded"].includes(item.status)) {
        acc[key].totalRewards += item.rewardAmount || 0;
      }
      return acc;
    }, {});
    return Object.values(aggregate)
      .sort((a, b) => b.totalRewards - a.totalRewards)
      .slice(0, 10);
  }, [overview?.recentHistory, overview?.referralCode]);

  const handleCopyLink = async () => {
    if (!effectiveReferralLink) return;
    try {
      await navigator.clipboard.writeText(effectiveReferralLink);
      toast.success("Referral link copied");
    } catch (error) {
      toast.error("Unable to copy referral link");
    }
  };

  const handleShare = () => setInviteOpen(true);

  const minWithdrawal = useMemo(
    () => Number(import.meta.env?.VITE_REF_MIN_WITHDRAWAL) || 200,
    []
  );

  const handleWithdrawal = () => {
    if (!overview) return;
    if (overview.walletBalance < minWithdrawal) {
      toast.error(`You need at least ₹${minWithdrawal} to withdraw`);
      return;
    }
    setWithdrawOpen(true);
  };

  const handleWithdrawalSubmit = async ({
    amount,
    payoutMethod,
    payoutDetails,
    note,
  }) => {
    try {
      setSubmittingWithdrawal(true);
      await submitWithdrawal({ amount, payoutMethod, payoutDetails, note });
      toast.success("Withdrawal request submitted");
      setWithdrawOpen(false);
      loadHistory(pagination.page);
      const refreshed = await getReferralOverview();
      if (refreshed?.data?.success) {
        setOverview(refreshed.data.data);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to submit withdrawal";
      toast.error(message);
      console.error(error);
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleResendInvite = (entry) => {
    toast.success(`Reminder email queued for ${entry.referredUserEmail}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <ReferralCard
            referralCode={referralCode}
            referralLink={effectiveReferralLink}
            qrCodeDataUrl={qrDataUrl}
            onCopy={handleCopyLink}
            onShare={handleShare}
          />

          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Reward summary
                </h3>
                <p className="text-sm text-slate-500">
                  Track total invites, completed referrals, and your
                  withdrawable wallet balance.
                </p>
              </div>
              <button
                type="button"
                onClick={handleWithdrawal}
                disabled={isSubmittingWithdrawal}
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 disabled:opacity-50"
              >
                Withdraw
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Total invites
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {overview?.totalReferrals ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">
                  Completed
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">
                  {overview?.completedReferrals ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-500">
                  Pending
                </p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">
                  {overview?.pendingReferrals ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary-500">
                  Wallet balance
                </p>
                <p className="mt-2 text-3xl font-semibold text-primary-600">
                  ₹
                  {Number(overview?.walletBalance || 0).toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs text-primary-500">
                  Pending rewards: ₹
                  {Number(overview?.pendingRewards || 0).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>
            </div>
          </div>

          <ReferralHistoryTable
            entries={history}
            page={pagination.page || 1}
            pageSize={pagination.limit || 10}
            totalItems={pagination.total || 0}
            totalPages={pagination.totalPages || 1}
            onPageChange={loadHistory}
            loading={historyLoading}
            onResendInvite={handleResendInvite}
          />
        </div>

        <div className="space-y-6">
          <LeaderboardCard entries={leaderboardEntries} />
          <RewardRulesCard />
        </div>
      </div>

      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        referralLink={effectiveReferralLink}
        referralCode={referralCode}
      />

      <WithdrawalModal
        isOpen={withdrawOpen}
        onClose={() => {
          if (!isSubmittingWithdrawal) {
            setWithdrawOpen(false);
          }
        }}
        onSubmit={handleWithdrawalSubmit}
        minWithdrawal={minWithdrawal}
        walletBalance={Number(overview?.walletBalance || 0)}
        pendingRewards={Number(overview?.pendingRewards || 0)}
      />
    </div>
  );
};

export default ReferPage;
