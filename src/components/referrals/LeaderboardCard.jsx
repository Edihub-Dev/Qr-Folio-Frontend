import React from "react";

const clsx = (...classes) => classes.filter(Boolean).join(" ");

const LeaderboardCard = ({ entries = [] }) => {
  const topThree = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <div className={clsx('overflow-hidden', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-6', 'shadow-xl', 'shadow-slate-950/50', 'backdrop-blur')}>
      <div className={clsx('border-b', 'border-white/10', 'pb-4')}>
        <h3 className={clsx('text-lg', 'font-semibold', 'text-white')}>
          Top referrers this month
        </h3>
        <p className={clsx('mt-1', 'text-sm', 'text-slate-300')}>
          Highlighting the champions who shared QrFolio the most and unlocked
          maximum rewards.
        </p>
      </div>

      <div className={clsx('mt-5', 'space-y-4')}>
        <div className={clsx('grid', 'grid-cols-1', 'gap-3', 'md:grid-cols-3')}>
          {topThree.map((entry, idx) => (
            <div
              key={entry.id || idx}
              className={clsx('relative', 'rounded-2xl', 'border', 'border-primary-500/40', 'bg-primary-500/10', 'px-4', 'py-5', 'text-center', 'shadow-md', 'shadow-primary-500/30')}
            >
              <div className={clsx('absolute', '-top-3', 'left-1/2', '-translate-x-1/2')}>
                <span className={clsx('inline-flex', 'h-7', 'min-w-[2.5rem]', 'items-center', 'justify-center', 'rounded-full', 'bg-primary-500', 'text-xs', 'font-semibold', 'uppercase', 'tracking-wider', 'text-white', 'shadow-md', 'shadow-primary-500/40')}>
                  #{idx + 1}
                </span>
              </div>
              <p className={clsx('mt-4', 'truncate', 'text-sm', 'font-medium', 'text-primary-100')}>
                {entry.name || entry.email || "Anonymous"}
              </p>
              <p className={clsx('mt-2', 'text-xs', 'uppercase', 'tracking-wider', 'text-primary-200')}>
                {entry.totalReferrals} referrals
              </p>
              <p className={clsx('mt-1', 'text-sm', 'font-semibold', 'text-primary-50')}>
                ₹{Number(entry.totalRewards || 0).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        {others.length > 0 && (
          <div className={clsx('divide-y', 'divide-slate-800', 'rounded-2xl', 'border', 'border-slate-800', 'bg-slate-900/80')}>
            {others.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className={clsx('flex', 'items-center', 'justify-between', 'px-4', 'py-3')}
              >
                <div className={clsx('flex', 'items-center', 'gap-3')}>
                  <span className={clsx('inline-flex', 'h-6', 'w-6', 'items-center', 'justify-center', 'rounded-full', 'bg-slate-800', 'text-xs', 'font-semibold', 'text-slate-200')}>
                    #{idx + 4}
                  </span>
                  <div>
                    <p className={clsx('text-sm', 'font-medium', 'text-slate-100')}>
                      {entry.name || entry.email || "Anonymous"}
                    </p>
                    <p className={clsx('text-xs', 'text-slate-400')}>
                      {entry.totalReferrals} referrals • ₹
                      {Number(entry.totalRewards || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardCard;
