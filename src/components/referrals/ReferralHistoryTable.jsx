import React from "react";
import { ArrowUpRight, RefreshCcw, AlertTriangle } from "lucide-react";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  completed: "bg-blue-50 text-blue-700 border border-blue-100",
  rewarded: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  rejected: "bg-rose-50 text-rose-700 border border-rose-100",
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
  const renderStatusBadge = (status) => {
    const style = statusStyles[status] || statusStyles.pending;
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${style}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Referral history</h3>
          <p className="text-sm text-slate-500">
            Track each invite and reward status. Resend invites to friends who haven’t finished signing up yet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPageChange?.(page)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">
              <th className="px-6 py-3">Referred user</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Signup date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Reward</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {entries.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  You haven’t invited anyone yet. Share your link to start earning rewards.
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
              const displayEmail = entry.referredUserEmailMasked || entry.referredUserEmail || "—";
              const planLabel = entry.referredUserPlan || "—";

              return (
                <tr key={entry._id}
                  className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{displayName}</div>
                    <div className="text-xs text-slate-500">{displayEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                    {planLabel || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formattedSignup}
                  </td>
                  <td className="px-6 py-4">
                    {renderStatusBadge(entry.status)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    ₹{Number(entry.rewardAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => onResendInvite(entry)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        <ArrowUpRight className="h-4 w-4" /> Resend invite
                      </button>
                    ) : (
                      entry.status === "rejected" && (
                        <div className="flex items-center gap-1 text-xs text-rose-500">
                          <AlertTriangle className="h-4 w-4" />
                          {entry.reason || "Rejected"}
                        </div>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
        <div>
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalItems)} of {totalItems}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-50"
            onClick={() => onPageChange?.(Math.max(page - 1, 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-50"
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
