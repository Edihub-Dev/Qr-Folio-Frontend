import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import ReferralCard from "../../components/referrals/ReferralCard";
import ReferralHistoryTable from "../../components/referrals/ReferralHistoryTable";
import LeaderboardCard from "../../components/referrals/LeaderboardCard";
import RewardRulesCard from "../../components/referrals/RewardRulesCard";
import MyRewardsCard from "../../components/referrals/MyRewardsCard";
import InviteModal from "../../components/referrals/InviteModal";
import WithdrawalModal from "../../components/referrals/WithdrawalModal";
import {
  getReferralOverview,
  getReferralHistory,
  getWithdrawalHistory,
  submitWithdrawal,
} from "../../services/referralService";
import clsx from "clsx";

import { getMyRewards } from "../../services/rewardService";

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
};

const ReferPage = () => {
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [myRewards, setMyRewards] = useState([]);
  const [rewardReferralCount, setRewardReferralCount] = useState(null);
  const [rewardProgress, setRewardProgress] = useState(null);
  const [rewardLevels, setRewardLevels] = useState(null);
  const [rewardCheckpoint, setRewardCheckpoint] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [isSubmittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState("referrals");

  const referralLink = overview?.referralLink;
  const referralCode = overview?.referralCode;
  const minWithdrawal = useMemo(
    () =>
      Number(
        (overview && overview.minWithdrawal) ||
          import.meta.env?.VITE_REF_MIN_WITHDRAWAL ||
          5000
      ),
    [overview]
  );

  const totalWithdrawable = useMemo(() => {
    if (!overview) return 0;
    const balance = Number(overview.walletBalance || 0);
    const pending = Number(overview.pendingRewards || 0);
    return balance + pending;
  }, [overview]);

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
    const fetchRewards = async () => {
      try {
        const { data } = await getMyRewards();
        if (data?.success) {
          setMyRewards(Array.isArray(data.data) ? data.data : data.data?.items || []);
          if (typeof data.data?.referralCount === "number") {
            setRewardReferralCount(data.data.referralCount);
          } else {
            setRewardReferralCount(null);
          }

          if (typeof data.data?.currentProgress === "number") {
            setRewardProgress(data.data.currentProgress);
          } else {
            setRewardProgress(null);
          }

          if (typeof data.data?.referralClaimCheckpoint === "number") {
            setRewardCheckpoint(data.data.referralClaimCheckpoint);
          } else {
            setRewardCheckpoint(null);
          }

          if (Array.isArray(data.data?.levels)) {
            setRewardLevels(data.data.levels);
          } else {
            setRewardLevels(null);
          }
        }
      } catch (error) {
        setMyRewards([]);
        setRewardReferralCount(null);
        setRewardProgress(null);
        setRewardLevels(null);
        setRewardCheckpoint(null);
      }
    };

    fetchRewards();
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

  const isWithdrawalEligible = totalWithdrawable >= minWithdrawal;

  const successfulReferrals = useMemo(() => {
    const fromStats = Number(overview?.referralCount || 0);
    const fromHistory = Number(overview?.completedReferrals || 0);
    return Math.max(fromStats, fromHistory, 0);
  }, [overview?.completedReferrals, overview?.referralCount]);

  const effectiveRewardReferralCount =
    typeof rewardReferralCount === "number" ? rewardReferralCount : successfulReferrals;

  const handleWithdrawal = () => {
    if (!overview) {
      console.warn("withdrawal.click.no-overview");
      return;
    }

    console.debug("withdrawal.click", {
      walletBalance: Number(overview.walletBalance || 0),
      pendingRewards: Number(overview.pendingRewards || 0),
      totalWithdrawable,
      minWithdrawal,
    });

    if (!isWithdrawalEligible) {
      console.debug("withdrawal.disabled", {
        walletBalance: Number(overview.walletBalance || 0),
        pendingRewards: Number(overview.pendingRewards || 0),
        totalWithdrawable,
        minWithdrawal,
      });
      toast.error(
        `You need at least ₹${minWithdrawal} to withdraw (currently ₹${totalWithdrawable.toLocaleString(
          "en-IN"
        )})`
      );
      return;
    }

    console.debug("withdrawal.modal.opening");
    setWithdrawOpen(true);
  };

  const loadWithdrawals = async () => {
    try {
      setWithdrawalsLoading(true);
      const { data } = await getWithdrawalHistory({ limit: 20 });
      if (data?.success) {
        setWithdrawals(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error("Unable to load withdrawal history", error);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  useEffect(() => {
    if (activeHistoryTab === "withdrawals") {
      loadWithdrawals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHistoryTab]);

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
      if (activeHistoryTab === "withdrawals") {
        loadWithdrawals();
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

  if (loading && !overview) {
    return (
      <div className={clsx('space-y-6', 'animate-pulse')}>
        <div className={clsx('grid', 'grid-cols-1', 'gap-6', 'xl:grid-cols-3')}>
          <div className={clsx('space-y-6', 'xl:col-span-2')}>
            <div className={clsx('overflow-hidden', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/90', 'p-6', 'shadow-xl', 'shadow-slate-950/60')}>
              <div className="space-y-4">
                <div className={clsx('h-4', 'w-40', 'rounded', 'bg-slate-800')} />
                <div className={clsx('h-3', 'w-64', 'rounded', 'bg-slate-800')} />
                <div className={clsx('h-3', 'w-52', 'rounded', 'bg-slate-800')} />
                <div className={clsx('mt-4', 'h-10', 'w-full', 'rounded-2xl', 'bg-slate-800')} />
              </div>
            </div>

            <div className={clsx('overflow-hidden', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/90', 'p-6', 'shadow-xl', 'shadow-slate-950/60')}>
              <div className={clsx('flex', 'flex-col', 'gap-4', 'sm:flex-row', 'sm:items-center', 'sm:justify-between')}>
                <div className="space-y-2">
                  <div className={clsx('h-4', 'w-32', 'rounded', 'bg-slate-800')} />
                  <div className={clsx('h-3', 'w-56', 'rounded', 'bg-slate-800')} />
                </div>
                <div className={clsx('h-8', 'w-32', 'rounded-full', 'bg-slate-800')} />
              </div>
              <div className={clsx('mt-6', 'grid', 'grid-cols-1', 'gap-4', 'sm:grid-cols-2', 'lg:grid-cols-4')}>
                <div className={clsx('h-20', 'rounded-2xl', 'bg-slate-800')} />
                <div className={clsx('h-20', 'rounded-2xl', 'bg-slate-800')} />
                <div className={clsx('h-20', 'rounded-2xl', 'bg-slate-800')} />
                <div className={clsx('h-20', 'rounded-2xl', 'bg-slate-800')} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={clsx('h-40', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/90', 'shadow-xl', 'shadow-slate-950/60')} />
            <div className={clsx('h-24', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/90', 'shadow-xl', 'shadow-slate-950/60')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={clsx('grid', 'grid-cols-1', 'gap-6', 'xl:grid-cols-3')}>
        <div className={clsx('space-y-6', 'xl:col-span-2')}>
          <ReferralCard
            referralCode={referralCode}
            referralLink={effectiveReferralLink}
            qrCodeDataUrl={qrDataUrl}
            qrValue={effectiveReferralLink}
            onCopy={handleCopyLink}
            onShare={handleShare}
          />

          <div className={clsx('overflow-hidden', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'shadow-xl', 'shadow-slate-950/50', 'backdrop-blur')}>
            <div className={clsx('flex', 'items-center', 'justify-between', 'gap-4', 'border-b', 'border-white/10', 'px-6', 'py-5')}>
              <div>
                <h3 className={clsx('text-lg', 'font-semibold', 'text-white')}>
                  Reward summary
                </h3>
                <p className={clsx('text-sm', 'text-slate-300')}>
                  Track total invites, completed referrals, and your
                  withdrawable wallet balance.
                </p>
              </div>
              {/* <div className={clsx('flex', 'flex-col', 'items-end', 'gap-1')}>
                <button
                  type="button"
                  onClick={handleWithdrawal}
                  disabled={isSubmittingWithdrawal || !isWithdrawalEligible}
                  title={
                    !isWithdrawalEligible
                      ? `You need at least ₹${minWithdrawal.toLocaleString(
                          "en-IN"
                        )} to withdraw`
                      : undefined
                  }
                  className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-full', 'bg-primary-500', 'px-4', 'py-2', 'text-sm', 'font-medium', 'text-white', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'disabled:cursor-not-allowed', 'disabled:bg-primary-300', 'disabled:text-primary-50')}
                >
                  Withdraw
                </button>
                {!isWithdrawalEligible && (
                  <p className={clsx('text-xs', 'text-slate-400', 'text-right')}>
                    Minimum ₹ {minWithdrawal.toLocaleString("en-IN")} required.
                    Currently ₹{totalWithdrawable.toLocaleString("en-IN")}.
                  </p>
                )}
              </div> */}
            </div>

            <div className={clsx('grid', 'grid-cols-1', 'gap-4', 'px-6', 'py-6', 'sm:grid-cols-2', 'lg:grid-cols-3')}>
              <div className={clsx('rounded-2xl', 'border', 'border-slate-700', 'bg-slate-900/70', 'p-4')}>
                <p className={clsx('text-xs', 'uppercase', 'tracking-[0.3em]', 'text-slate-400')}>
                  Total invites
                </p>
                <p className={clsx('mt-2', 'text-3xl', 'font-semibold', 'text-slate-100')}>
                  {overview?.totalReferrals ?? "—"}
                </p>
              </div>
              <div className={clsx('rounded-2xl', 'border', 'border-emerald-500/40', 'bg-emerald-500/10', 'p-4')}>
                <p className={clsx('text-xs', 'uppercase', 'tracking-[0.3em]', 'text-emerald-300')}>
                  Completed
                </p>
                <p className={clsx('mt-2', 'text-3xl', 'font-semibold', 'text-emerald-300')}>
                  {overview?.completedReferrals ?? "—"}
                </p>
              </div>
              <div className={clsx('rounded-2xl', 'border', 'border-amber-500/40', 'bg-amber-500/10', 'p-4')}>
                <p className={clsx('text-xs', 'uppercase', 'tracking-[0.3em]', 'text-amber-300')}>
                  Pending
                </p>
                <p className={clsx('mt-2', 'text-3xl', 'font-semibold', 'text-amber-300')}>
                  {overview?.pendingReferrals ?? "—"}
                </p>
              </div>
              {/* <div className={clsx('rounded-2xl', 'border', 'border-primary-500/40', 'bg-primary-500/10', 'p-4')}>
                <p className={clsx('text-xs', 'uppercase', 'tracking-[0.3em]', 'text-primary-200')}>
                  Wallet balance
                </p>
                <p className={clsx('mt-2', 'text-3xl', 'font-semibold', 'text-primary-200')}>
                  ₹
                  {Number(overview?.walletBalance || 0).toLocaleString("en-IN")}
                </p>
                <p className={clsx('mt-1', 'text-xs', 'text-primary-100')}>
                  Pending rewards: ₹
                  {Number(overview?.pendingRewards || 0).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div> */}
            </div>
          </div>

          <MyRewardsCard
            referralCount={effectiveRewardReferralCount}
            rewards={myRewards}
            currentProgress={rewardProgress}
            referralClaimCheckpoint={rewardCheckpoint}
            levels={rewardLevels}
          />

          <div className="space-y-4">
            <div className={clsx('flex', 'items-center', 'justify-between')}>
              <div>
                <h3 className={clsx('text-lg', 'font-semibold', 'text-white')}>
                  Activity history
                </h3>
                <p className={clsx('text-sm', 'text-slate-300')}>
                  Quickly review your referral rewards or past withdrawal
                  requests.
                </p>
              </div>
              <div className={clsx('inline-flex', 'items-center', 'rounded-full', 'bg-slate-900/80', 'p-1', 'text-xs', 'font-medium', 'text-slate-300')}>
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab("referrals")}
                  className={`px-3 py-1 rounded-full transition-all duration-150 ${
                    activeHistoryTab === "referrals"
                      ? "bg-slate-800 shadow text-slate-50"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  Referral history
                </button>
                {/* <button
                  type="button"
                  onClick={() => setActiveHistoryTab("withdrawals")}
                  className={`ml-1 px-3 py-1 rounded-full transition-all duration-150 ${
                    activeHistoryTab === "withdrawals"
                      ? "bg-slate-800 shadow text-slate-50"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  Withdraw history
                </button> */}
              </div>
            </div>

            {activeHistoryTab === "referrals" && (
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
            )}

            {activeHistoryTab === "withdrawals" && (
              <div className={clsx('overflow-hidden', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'shadow-xl', 'shadow-slate-950/50', 'backdrop-blur')}>
                <div className={clsx('flex', 'items-center', 'justify-between', 'border-b', 'border-white/10', 'px-6', 'py-5')}>
                  <div>
                    <h3 className={clsx('text-lg', 'font-semibold', 'text-white')}>
                      Withdrawal history
                    </h3>
                    <p className={clsx('text-sm', 'text-slate-300')}>
                      Review your recent payout requests and their status.
                    </p>
                  </div>
                  <span className={clsx('text-xs', 'text-slate-400')}>
                    Showing up to 20 latest entries
                  </span>
                </div>
                <div className={clsx('max-h-80', 'overflow-y-auto')}>
                  {withdrawalsLoading ? (
                    <div className={clsx('px-6', 'py-8', 'text-center', 'text-sm', 'text-slate-400')}>
                      Loading withdrawal history…
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <div className={clsx('px-6', 'py-8', 'text-center', 'text-sm', 'text-slate-400')}>
                      No withdrawal requests yet.
                    </div>
                  ) : (
                    <table className={clsx('min-w-full', 'text-sm', 'text-slate-100')}>
                      <thead>
                        <tr className={clsx('bg-slate-50', 'text-xs', 'font-semibold', 'uppercase', 'tracking-wide', 'text-slate-500')}>
                          <th className={clsx('px-6', 'py-3', 'text-left')}>Date</th>
                          <th className={clsx('px-6', 'py-3', 'text-right')}>Amount</th>
                          <th className={clsx('px-6', 'py-3', 'text-left')}>Status</th>
                          <th className={clsx('px-6', 'py-3', 'text-left')}>Note</th>
                        </tr>
                      </thead>
                      <tbody className={clsx('divide-y', 'divide-slate-100')}>
                        {withdrawals.map((entry) => {
                          const created = entry.createdAt
                            ? new Date(entry.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—";
                          const statusLabel = entry.status || "pending";
                          const key =
                            entry.id || `${entry.createdAt}-${entry.amount}`;
                          return (
                            <tr key={key} className="hover:bg-slate-50/70">
                              <td className={clsx('px-6', 'py-3')}>{created}</td>
                              <td className={clsx('px-6', 'py-3', 'text-right')}>
                                ₹
                                {Number(entry.amount || 0).toLocaleString(
                                  "en-IN"
                                )}
                              </td>
                              <td className={clsx('px-6', 'py-3', 'capitalize')}>
                                {statusLabel}
                              </td>
                              <td className={clsx('px-6', 'py-3', 'truncate', 'max-w-[220px]')}>
                                {entry.note ||
                                  entry.metadata?.payoutDetails?.method ||
                                  "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
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
        totalWithdrawable={totalWithdrawable}
        isEligible={isWithdrawalEligible}
      />
    </div>
  );
};

export default ReferPage;
