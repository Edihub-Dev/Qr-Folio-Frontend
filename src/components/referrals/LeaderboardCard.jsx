import React, { useEffect, useMemo, useState } from "react";
import { getPremiumReferralLeaderboard } from "../../services/referralService";

const clsx = (...classes) => classes.filter(Boolean).join(" ");

const RANGE_OPTIONS = [
  { value: "all", label: "All-time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const trophyForRank = (rank) => {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

const badgeStyles = (badge) => {
  if (badge === "L3 Champion") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (badge === "L2 Achiever") return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  if (badge === "L1 Starter") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-slate-800/70 text-slate-300 border-slate-700";
};

const LeaderboardCard = () => {
  const [range, setRange] = useState("weekly");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [me, setMe] = useState({ rank: null, referrals: 0, badge: "Getting Started" });
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const limit = 5;

  const title = useMemo(() => {
    if (range === "weekly") return "Top referrers (last 7 days)";
    if (range === "monthly") return "Top referrers (last 30 days)";
    return "Top referrers (all-time)";
  }, [range]);

  const fetchPage = async ({ nextPage, reset }) => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      const { data } = await getPremiumReferralLeaderboard({
        range,
        page: nextPage,
        limit,
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load leaderboard");
      }

      const newResults = Array.isArray(data.results) ? data.results : [];

      setItems((prev) => (reset ? newResults : [...prev, ...newResults]));
      setHasMore(Boolean(data.hasMore));
      if (data.me) {
        setMe({
          rank: data.me.rank ?? null,
          referrals: Number(data.me.referrals || 0),
          badge: data.me.badge || "Getting Started",
        });
      }
      setPage(nextPage);
    } catch (e) {
      setError(e?.message || "Unable to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setHasMore(true);
    setPage(1);
    fetchPage({ nextPage: 1, reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const handleLoadMore = () => {
    if (loading) return;
    if (!hasMore) return;
    fetchPage({ nextPage: page + 1, reset: false });
  };

  return (
    <div className={clsx('overflow-hidden', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-6', 'shadow-xl', 'shadow-slate-950/50', 'backdrop-blur')}>
      <div className={clsx('flex', 'items-start', 'justify-between', 'gap-4', 'border-b', 'border-white/10', 'pb-4')}>
        <div>
          <h3 className={clsx('text-lg', 'font-semibold', 'text-white')}>
            {title}
          </h3>
          <p className={clsx('mt-1', 'text-sm', 'text-slate-300')}>
            Only successful referrals are counted.
          </p>
        </div>

        <div className={clsx('shrink-0')}>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className={clsx(
              'rounded-full',
              'border',
              'border-white/10',
              'bg-slate-900/80',
              'px-3',
              'py-2',
              'text-sm',
              'text-slate-100',
              'outline-none'
            )}
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={clsx('mt-5')}>
        {error ? (
          <div className={clsx('rounded-2xl', 'border', 'border-red-500/30', 'bg-red-500/10', 'px-4', 'py-4', 'text-sm', 'text-red-200')}>
            {error}
          </div>
        ) : null}

        <div className={clsx('divide-y', 'divide-slate-800', 'overflow-hidden', 'rounded-2xl', 'border', 'border-slate-800', 'bg-slate-900/80')}>
          {items.length === 0 && !loading ? (
            <div className={clsx('px-4', 'py-6', 'text-center', 'text-sm', 'text-slate-400')}>
              No leaderboard data yet.
            </div>
          ) : (
            items.map((row) => {
              const trophy = trophyForRank(row.rank);
              return (
                <div key={`${row.rank}-${row.name}`} className={clsx('flex', 'items-center', 'justify-between', 'gap-4', 'px-4', 'py-3')}>
                  <div className={clsx('flex', 'items-center', 'gap-3', 'min-w-0')}>
                    <div className={clsx('flex', 'items-center', 'gap-2')}>
                      <span className={clsx('inline-flex', 'w-10', 'justify-start', 'text-slate-200', 'font-semibold')}>
                        #{row.rank}
                      </span>
                      {trophy ? (
                        <span className={clsx('text-lg')} aria-label="trophy">
                          {trophy}
                        </span>
                      ) : null}
                    </div>

                    <div className={clsx('min-w-0')}>
                      <p className={clsx('truncate', 'text-sm', 'font-medium', 'text-slate-100')}>
                        {row.name}
                      </p>
                      <div className={clsx('mt-1', 'flex', 'flex-wrap', 'items-center', 'gap-2')}>
                        <span className={clsx('text-xs', 'text-slate-400')}>
                          {row.referrals} referrals
                        </span>
                        <span className={clsx('inline-flex', 'items-center', 'rounded-full', 'border', 'px-2', 'py-0.5', 'text-[11px]', badgeStyles(row.badge))}>
                          {row.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={clsx('text-right')}>
                    <span className={clsx('text-sm', 'font-semibold', 'text-slate-100')}>
                      {row.referrals}
                    </span>
                    <p className={clsx('text-xs', 'text-slate-400')}>Referrals</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={clsx('mt-4', 'flex', 'items-center', 'justify-center')}>
          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className={clsx(
                'inline-flex',
                'items-center',
                'justify-center',
                'rounded-full',
                'border',
                'border-white/10',
                'bg-slate-900/80',
                'px-5',
                'py-2',
                'text-sm',
                'font-medium',
                'text-slate-100',
                'hover:bg-slate-800/80',
                'disabled:cursor-not-allowed',
                'disabled:opacity-70'
              )}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          ) : items.length > 0 ? (
            <div className={clsx('text-center', 'text-xs', 'text-slate-500')}>
              End of leaderboard
            </div>
          ) : null}
        </div>

        <div className={clsx('mt-5', 'rounded-2xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-4')}>
          <div className={clsx('flex', 'items-start', 'justify-between', 'gap-4')}>
            <div>
              <p className={clsx('text-xs', 'uppercase', 'tracking-[0.3em]', 'text-slate-400')}>
                Your Rank
              </p>
              <p className={clsx('mt-2', 'text-2xl', 'font-semibold', 'text-slate-100')}>
                {typeof me.rank === 'number' ? `#${me.rank}` : '—'}
              </p>
              <p className={clsx('mt-1', 'text-sm', 'text-slate-300')}>
                {me.referrals} successful referrals
              </p>
            </div>
            <span className={clsx('inline-flex', 'items-center', 'rounded-full', 'border', 'px-3', 'py-1', 'text-xs', badgeStyles(me.badge))}>
              {me.badge}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardCard;
