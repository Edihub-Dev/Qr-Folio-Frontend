import React from "react";

const LeaderboardCard = ({ entries = [] }) => {
  const topThree = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">
          Top referrers this month
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Highlighting the champions who shared QrFolio the most and unlocked maximum rewards.
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topThree.map((entry, idx) => (
            <div
              key={entry.id || idx}
              className="relative rounded-2xl border border-primary-100 bg-primary-50 px-4 py-5 text-center shadow-md"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-full bg-primary-600 text-xs font-semibold uppercase tracking-wider text-white">
                  #{idx + 1}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-primary-700 truncate">
                {entry.name || entry.email || "Anonymous"}
              </p>
              <p className="mt-2 text-xs text-primary-500 uppercase tracking-wider">
                {entry.totalReferrals} referrals
              </p>
              <p className="mt-1 text-sm font-semibold text-primary-800">
                ₹{Number(entry.totalRewards || 0).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        {others.length > 0 && (
          <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100">
            {others.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    #{idx + 4}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {entry.name || entry.email || "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.totalReferrals} referrals • ₹{Number(entry.totalRewards || 0).toLocaleString("en-IN")}
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
