import React, { useMemo } from "react";
import toast from "react-hot-toast";
import clsx from "clsx";

const statusStyles = {
  LOCKED: "border border-slate-700 bg-slate-900/70 text-slate-200",
  UNLOCKED: "border border-blue-500/40 bg-blue-500/15 text-blue-100",
  CLAIMED: "border border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
  EXPIRED: "border border-amber-500/40 bg-amber-500/10 text-amber-100",
};

const DEFAULT_LEVELS = [
  {
    level: "Level 1",
    code: "L1",
    requiredReferrals: 2,
    rewardLabel: "MST Key Ring+Pen",
    productId: "6973092852bb0bf380715700",
  },
  {
    level: "Level 2",
    code: "L2",
    requiredReferrals: 5,
    rewardLabel: "MST Key Ring+Pen+Diary",
    productId: "69733615d16fef4157fd76b7",
  },
  {
    level: "Level 3",
    code: "L3",
    requiredReferrals: 10,
    rewardLabel: "MST Combo Pack",
    productId: "695222aa79763e5b5af59d35",
  },
];

const normalizeRewardCode = (value) => (value || "").toString().trim().toUpperCase();

const safeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatDate = (value) => {
  const d = safeDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const buildRewardsView = ({ referralCount, apiRewards, currentProgress, apiLevels }) => {
  if (Array.isArray(apiLevels) && apiLevels.length > 0) {
    const levelByCode = new Map(
      apiLevels.map((l) => [normalizeRewardCode(l.rewardCode || l.code), l])
    );

    return DEFAULT_LEVELS.map((level) => {
      const code = normalizeRewardCode(level.code);
      const api = levelByCode.get(code) || null;
      const status = normalizeRewardCode(api?.status) || "LOCKED";

      return {
        ...level,
        status,
        couponCode: api?.couponCode || null,
        expiresAt: api?.expiresAt || null,
        claimedAt: api?.claimedAt || null,
        currentProgress: typeof currentProgress === "number" ? currentProgress : null,
      };
    });
  }

  const byCode = new Map(
    (Array.isArray(apiRewards) ? apiRewards : []).map((r) => [normalizeRewardCode(r.rewardCode), r])
  );

  const rows = [];
  let previousGateOpen = true;

  for (const level of DEFAULT_LEVELS) {
    const code = normalizeRewardCode(level.code);
    const api = byCode.get(code) || null;

    const apiStatus = normalizeRewardCode(api?.status);
    const derivedStatus =
      previousGateOpen && referralCount >= level.requiredReferrals ? "UNLOCKED" : "LOCKED";

    const status = apiStatus || derivedStatus;

    rows.push({
      ...level,
      status,
      couponCode: api?.couponCode || null,
      expiresAt: api?.expiresAt || null,
      claimedAt: api?.claimedAt || null,
      currentProgress: null,
    });

    previousGateOpen = status !== "LOCKED";
  }

  return rows;
};

const isClaimEnabled = (row) =>
  row.status === "UNLOCKED" && typeof row.couponCode === "string" && row.couponCode.trim();

const getShopUrl = (row) => {
  const base = "https://shop.p2pdeal.net/checkout/order";
  const coupon = typeof row.couponCode === "string" ? row.couponCode.trim() : "";
  if (!coupon) return base;

  const url = new URL(base);
  url.searchParams.set("coupon", coupon);
  if (row.productId) {
    url.searchParams.set("productId", row.productId);
  }
  return url.toString();
};

const MyRewardsCard = ({
  referralCount = 0,
  rewards = [],
  currentProgress = null,
  referralClaimCheckpoint = null,
  levels = null,
}) => {
  const rows = useMemo(
    () =>
      buildRewardsView({
        referralCount: Number(referralCount || 0),
        apiRewards: rewards,
        currentProgress: typeof currentProgress === "number" ? currentProgress : null,
        apiLevels: levels,
      }),
    [referralCount, rewards, currentProgress, levels]
  );

  const handleClaim = async (row) => {
    if (!isClaimEnabled(row)) return;

    try {
      await navigator.clipboard.writeText(row.couponCode);
      toast.success("Coupon copied. Opening shop…");
      window.open(getShopUrl(row), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Unable to open claim link");
      console.error(error);
    }
  };

  const renderStatusBadge = (status) => {
    const normalized = normalizeRewardCode(status);
    const style = statusStyles[normalized] || statusStyles.LOCKED;
    const label = normalized ? normalized.toLowerCase() : "locked";
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className={clsx('overflow-hidden', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'shadow-xl', 'shadow-slate-950/50', 'backdrop-blur')}>
      <div className={clsx('flex', 'items-center', 'justify-between', 'border-b', 'border-white/10', 'px-6', 'py-5')}>
        <div>
          <h3 className={clsx('text-lg', 'font-semibold', 'text-white')}>My Rewards</h3>
          <p className={clsx('text-sm', 'text-slate-300')}>
            Earn rewards by making successful referrals on QrFolio.
          </p>
        </div>
        <div className={clsx('text-xs', 'text-slate-400')}>
          {typeof currentProgress === "number" ? (
            <span>
              {currentProgress}/10 progress
              {typeof referralClaimCheckpoint === "number" ? ` (checkpoint: ${referralClaimCheckpoint})` : ""}
            </span>
          ) : (
            <span>{referralCount}/10 referrals</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={clsx('min-w-full', 'text-sm', 'text-slate-100')}>
          <thead>
            <tr className={clsx('bg-slate-900/80', 'text-left', 'text-xs', 'font-semibold', 'uppercase', 'tracking-wide', 'text-slate-400')}>
              <th className={clsx('px-6', 'py-3')}>Level</th>
              <th className={clsx('px-6', 'py-3')}>No. of referrals</th>
              <th className={clsx('px-6', 'py-3')}>Coupon</th>
              <th className={clsx('px-6', 'py-3')}>Status</th>
              <th className={clsx('px-6', 'py-3')}>Reward</th>
              <th className={clsx('px-6', 'py-3')}>Link</th>
            </tr>
          </thead>
          <tbody className={clsx('divide-y', 'divide-slate-800', 'text-sm', 'text-slate-200')}>
            {rows.map((row) => {
              const normalizedStatus = normalizeRewardCode(row.status);
              const effectiveCountRaw =
                typeof row.currentProgress === "number" ? row.currentProgress : Number(referralCount || 0);
              const effectiveCount =
                normalizedStatus === "CLAIMED" ? Number(row.requiredReferrals || 0) : effectiveCountRaw;
              const progress = `${Math.min(effectiveCount, row.requiredReferrals)}/${row.requiredReferrals}`;
              const claimEnabled = isClaimEnabled(row);
              const coupon = row.couponCode || "—";

              return (
                <tr key={row.code}>
                  <td className={clsx('px-6', 'py-4', 'font-medium', 'text-slate-100')}>{row.level}</td>
                  <td className={clsx('px-6', 'py-4', 'text-slate-200')}>{progress}</td>
                  <td className={clsx('px-6', 'py-4')}>
                    <div className={clsx('font-semibold', 'text-slate-100')}>{coupon}</div>
                    <div className={clsx('mt-1', 'text-xs', 'text-slate-400')}>
                      Exp: {row.expiresAt ? formatDate(row.expiresAt) : "—"}
                    </div>
                  </td>
                  <td className={clsx('px-6', 'py-4')}>{renderStatusBadge(row.status)}</td>
                  <td className={clsx('px-6', 'py-4', 'text-slate-200')}>{row.rewardLabel}</td>
                  <td className={clsx('px-6', 'py-4')}>
                    <button
                      type="button"
                      onClick={() => handleClaim(row)}
                      disabled={!claimEnabled}
                      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold tracking-wide shadow transition ${
                        claimEnabled
                          ? "bg-primary-500 text-white shadow-primary-500/40 hover:bg-primary-400"
                          : "cursor-not-allowed bg-slate-800 text-slate-400"
                      }`}
                    >
                      CLAIM
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyRewardsCard;
