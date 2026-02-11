import React from "react";
import clsx  from "clsx";
import { ArrowUpRight, RefreshCcw, AlertTriangle } from "lucide-react";

const statusStyles = {
  pending: "border border-amber-500/40 bg-amber-500/15 text-amber-100",
  completed: "border border-blue-500/40 bg-blue-500/15 text-blue-100",
  rewarded: "border border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
  rejected: "border border-rose-500/40 bg-rose-500/10 text-rose-100",
};

const ReferralHistoryTable = ({
  entries = [],
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  loading,
  onResendInvite,
}) => {
  const renderStatusBadge = (entry) => {
    const status = entry.status;
    const style = statusStyles[status] || statusStyles.pending;
    const tooltipPieces = [];
    if (entry.reason) tooltipPieces.push(entry.reason);
    if (entry.reasonCode) tooltipPieces.push(`#${entry.reasonCode}`);
    const title = tooltipPieces.length ? tooltipPieces.join(" • ") : undefined;
    return (
      <span
        className={clsx('inline-flex', 'items-center', 'rounded-full', 'px-3', 'py-1', 'text-xs', 'font-medium', 'capitalize', style)}
        title={title}
      >
        {status}
      </span>
    );
  };

  return (
    <div className={clsx('overflow-hidden', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'shadow-xl', 'shadow-slate-950/50', 'backdrop-blur')}>
      <div className={clsx('flex', 'items-center', 'justify-between', 'border-b', 'border-white/10', 'px-6', 'py-5')}>
        <div>
          <h3 className={clsx('text-lg', 'font-semibold', 'text-white')}>Referral history</h3>
          <p className={clsx('text-sm', 'text-slate-300')}>
            Track each invite and reward status. Resend invites to friends who
            haven’t finished signing up yet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPageChange?.(page)}
          disabled={loading}
          className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-full', 'border', 'border-slate-700', 'bg-slate-900/80', 'px-4', 'py-2', 'text-sm', 'font-medium', 'text-slate-100', 'transition', 'hover:bg-slate-800', 'disabled:opacity-50')}
        >
          <RefreshCcw className={clsx('h-4', 'w-4')} /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className={clsx('w-full', 'table-fixed', 'text-xs', 'text-slate-100', 'sm:text-sm')}>
          <thead>
            <tr className={clsx('bg-slate-900/80', 'text-left', 'text-[10px]', 'font-semibold', 'uppercase', 'tracking-wide', 'text-slate-400', 'sm:text-xs')}>
              <th className={clsx('px-4', 'py-3', 'sm:px-6')}>Referred user</th>
              <th className={clsx('px-4', 'py-3', 'sm:px-6')}>Plan</th>
              <th className={clsx('px-4', 'py-3', 'sm:px-6')}>Signup date</th>
              <th className={clsx('px-4', 'py-3', 'sm:px-6')}>Status</th>
              {/* <th className={clsx('px-6', 'py-3')}>Reward</th> */}
              {/* <th className={clsx('px-6', 'py-3')}>Action</th> */}
            </tr>
          </thead>
          <tbody className={clsx('divide-y', 'divide-slate-800', 'text-slate-200')}>
            {entries.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  className={clsx('px-6', 'py-8', 'text-center', 'text-slate-400')}
                >
                  You haven’t invited anyone yet. Share your link to start
                  earning rewards.
                </td>
              </tr>
            )}

            {entries.map((entry) => {
              const canResend = entry.status === "pending" && onResendInvite;
              const signupDate = entry.referredUserSignupAt || entry.createdAt;
              const signupAt = signupDate ? new Date(signupDate) : null;
              const formattedSignup = signupAt
                ? signupAt.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              const displayName = entry.referredUserName || "—";
              const displayEmail =
                entry.referredUserEmailMasked || entry.referredUserEmail || "—";
              const planLabel = entry.referredUserPlan || "—";

              return (
                <tr
                  key={entry._id}
                  className={clsx('transition', 'hover:bg-slate-900/60')}
                >
                  <td className={clsx('px-4', 'py-4', 'sm:px-6')}>
                    <div className={clsx('font-semibold', 'text-slate-100')}>
                      {displayName}
                    </div>
                    <div className={clsx('text-xs', 'break-all', 'whitespace-normal', 'text-slate-400')}>
                      {displayEmail}
                    </div>
                  </td>
                  <td className={clsx('px-4', 'py-4', 'break-words', 'whitespace-normal', 'capitalize', 'text-slate-300', 'sm:px-6')}>
                    {planLabel || "—"}
                  </td>
                  <td className={clsx('px-4', 'py-4', 'text-slate-300', 'sm:px-6')}>
                    {formattedSignup}
                  </td>
                  {/* <td className={clsx('px-6', 'py-4')}>{renderStatusBadge(entry)}</td> */}
                  {/* <td className={clsx('px-6', 'py-4', 'font-semibold', 'text-slate-100')}>
                    ₹{Number(entry.rewardAmount || 0).toLocaleString("en-IN")}
                  </td> */}
                  {/* <td className={clsx('px-6', 'py-4')}>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => onResendInvite(entry)}
                        className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-full', 'border', 'border-slate-700', 'px-3', 'py-1.5', 'text-xs', 'font-medium', 'text-slate-200', 'transition', 'hover:bg-slate-800')}
                      >
                        <ArrowUpRight className={clsx('h-4', 'w-4')} /> Resend invite
                      </button>
                    ) : (
                      entry.status === "rejected" && (
                        <div className={clsx('flex', 'flex-col', 'gap-1', 'text-xs', 'text-rose-300')}>
                          <div className={clsx('flex', 'items-center', 'gap-1')}>
                            <AlertTriangle className={clsx('h-4', 'w-4')} />
                            <span>
                              {entry.reason || "Referral rejected"}
                              {entry.reasonCode
                                ? ` (#${entry.reasonCode})`
                                : ""}
                            </span>
                          </div>
                          {Array.isArray(entry.riskSignals) &&
                            entry.riskSignals.length > 0 && (
                              <div className={clsx('text-[11px]', 'text-rose-300/90')}>
                                Signals: {entry.riskSignals.join(", ")}
                              </div>
                            )}
                        </div>
                      )
                    )}
                  </td> */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={clsx('flex', 'flex-col', 'gap-3', 'border-t', 'border-slate-800', 'px-6', 'py-4', 'text-sm', 'text-slate-300', 'sm:flex-row', 'sm:items-center', 'sm:justify-between')}>
        <div>
          Showing {(page - 1) * pageSize + 1}-
          {Math.min(page * pageSize, totalItems)} of {totalItems}
        </div>
        <div className={clsx('flex', 'items-center', 'gap-2')}>
          <button
            type="button"
            className={clsx('rounded-full', 'border', 'border-slate-700', 'px-3', 'py-1', 'disabled:opacity-50')}
            onClick={() => onPageChange?.(Math.max(page - 1, 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <span className={clsx('text-xs', 'text-slate-400')}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={clsx('rounded-full', 'border', 'border-slate-700', 'px-3', 'py-1', 'disabled:opacity-50')}
            onClick={() => onPageChange?.(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralHistoryTable;
