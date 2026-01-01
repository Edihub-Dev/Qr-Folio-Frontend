import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  adminListReferrals,
  adminGetReferralStats,
  adminUpdateReferral,
  adminExportReferrals,
} from "../../services/referralService";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Rewarded", value: "rewarded" },
  { label: "Rejected", value: "rejected" },
];

const FRAUD_BADGE = {
  clean: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  review: "bg-amber-50 text-amber-600 border border-amber-100",
  rejected: "bg-rose-50 text-rose-600 border border-rose-100",
};

const AdminReferralsPage = () => {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    referrerCode: "",
    referredEmail: "",
    from: "",
    to: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const { data } = await adminGetReferralStats(
        filters.status ? { status: filters.status } : {}
      );
      if (data?.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to load referral stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadReferrals = async (page = pagination.page) => {
    try {
      setLoading(true);
      const { data } = await adminListReferrals({
        page,
        limit: pagination.limit,
        status: filters.status || undefined,
        search: filters.search || undefined,
        referrerCode: filters.referrerCode || undefined,
        referredEmail: filters.referredEmail || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      if (data?.success) {
        setReferrals(data.data || []);
        setPagination((prev) => ({
          ...prev,
          page,
          totalPages: data.meta?.pagination?.totalPages || 1,
          totalItems: data.meta?.pagination?.totalItems || 0,
        }));
      }
    } catch (error) {
      toast.error("Unable to load referrals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadReferrals(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fraudSummary = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byStatus || {}).map(([status, entry]) => ({
      status,
      count: entry.count,
      reward: entry.totalReward,
    }));
  }, [stats]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    loadStats();
    loadReferrals(1);
  };

  const resetFilters = () => {
    const defaultFilters = {
      status: "",
      search: "",
      referrerCode: "",
      referredEmail: "",
      from: "",
      to: "",
    };
    setFilters(defaultFilters);
    setTimeout(() => {
      loadStats();
      loadReferrals(1);
    });
  };

  const handleExport = async () => {
    try {
      const { data } = await adminExportReferrals({
        status: filters.status || undefined,
        referrerCode: filters.referrerCode || undefined,
        referredEmail: filters.referredEmail || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `referrals-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Unable to export referrals");
      console.error(error);
    }
  };

  const updateReferral = async (id, updatePayload) => {
    try {
      setUpdatingId(id);
      await adminUpdateReferral(id, updatePayload);
      toast.success("Referral updated");
      loadStats();
      loadReferrals(pagination.page);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update referral";
      toast.error(message);
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderFraudBadge = (referral) => {
    const cls = FRAUD_BADGE[referral.fraudStatus] || FRAUD_BADGE.clean;
    const Icon =
      referral.fraudStatus === "rejected"
        ? ShieldAlert
        : referral.fraudStatus === "review"
        ? AlertTriangle
        : CheckCircle2;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${cls}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {referral.fraudStatus}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Referral oversight
          </h2>
          <p className="text-sm text-slate-500">
            Monitor referrals flagged by fraud rules, review payouts, and keep
            an audit trail of approvals.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => loadReferrals(pagination.page)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Total referrals
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats?.totalReferrals ?? "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Outstanding rewards ₹
            {Number(stats?.outstandingRewards || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Total reward amount
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            ₹{Number(stats?.totalRewardAmount || 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sum of approved and pending payouts
          </p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Fraud signals
          </p>
          {statsLoading ? (
            <Loader2 className="mt-2 h-6 w-6 animate-spin text-slate-400" />
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              {fraudSummary.length === 0 && (
                <p className="text-slate-500">No data.</p>
              )}
              {fraudSummary.map((entry) => (
                <div
                  key={entry.status}
                  className="flex items-center justify-between"
                >
                  <span className="capitalize text-slate-600">
                    {entry.status}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {entry.count} • ₹
                    {Number(entry.reward || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 space-y-4">
        <div className="flex items-center gap-3 text-slate-600">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Filters
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Status
            </span>
            <select
              value={filters.status}
              onChange={(event) =>
                handleFilterChange("status", event.target.value)
              }
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Referrer code
            </span>
            <input
              type="text"
              value={filters.referrerCode}
              onChange={(event) =>
                handleFilterChange(
                  "referrerCode",
                  event.target.value.toUpperCase()
                )
              }
              placeholder="e.g. ABC123"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 uppercase"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Referred email
            </span>
            <input
              type="text"
              value={filters.referredEmail}
              onChange={(event) =>
                handleFilterChange("referredEmail", event.target.value)
              }
              placeholder="user@example.com"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Search (name/email/code)
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                handleFilterChange("search", event.target.value)
              }
              placeholder="name, email, or code"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              From date
            </span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) =>
                handleFilterChange("from", event.target.value)
              }
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              To date
            </span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => handleFilterChange("to", event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 text-left">Referrer</th>
                <th className="px-6 py-3 text-left">Referred user</th>
                <th className="px-6 py-3 text-left">Plan</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Fraud</th>
                <th className="px-6 py-3 text-left">Risk score</th>
                <th className="px-6 py-3 text-left">Reward (₹)</th>
                <th className="px-6 py-3 text-left">Created</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    <Loader2 className="h-5 w-5 animate-spin inline-block" />{" "}
                    Loading referrals…
                  </td>
                </tr>
              )}
              {!loading && referrals.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No referrals found for the selected filters.
                  </td>
                </tr>
              )}
              {referrals.map((referral) => {
                const createdAt = referral.createdAt
                  ? new Date(referral.createdAt)
                  : null;
                const formattedDate = createdAt
                  ? createdAt.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";
                const signals = referral.riskSignals || [];

                const referrerName = referral.referrerName || "—";
                const referrerCode = referral.referrerCode || "—";
                const referredName = referral.referredUserName || "—";
                const referredCode = referral.referredUserCode || "—";
                const referredEmail =
                  referral.referredUserEmailMasked ||
                  referral.referredUserEmail ||
                  "—";
                const planLabel = referral.referredUserPlan || "—";
                const signupLabel = referral.referredUserSignupAt
                  ? new Date(referral.referredUserSignupAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : null;

                return (
                  <tr key={referral._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {referrerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        Code: {referrerCode}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {referredName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {referredEmail}
                      </div>
                      <div className="text-xs text-slate-500">
                        Code: {referredCode}
                      </div>

                      {referral.reason && (
                        <div className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {referral.reason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="capitalize">{planLabel}</div>
                      {signupLabel && (
                        <div className="text-xs text-slate-500">
                          Signed up: {signupLabel}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">
                      {referral.status}
                    </td>
                    <td className="px-6 py-4">{renderFraudBadge(referral)}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {referral.riskScore ?? 0}
                      </div>
                      {signals.length > 0 && (
                        <div className="mt-1 text-xs text-slate-500 space-y-1">
                          {signals.map((signal) => (
                            <div
                              key={signal}
                              className="flex items-center gap-1"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              <span>{signal}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ₹
                      {Number(referral.rewardAmount || 0).toLocaleString(
                        "en-IN"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formattedDate}
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <button
                        type="button"
                        disabled={updatingId === referral._id}
                        onClick={() =>
                          updateReferral(referral._id, { status: "rewarded" })
                        }
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve reward
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === referral._id}
                        onClick={() =>
                          updateReferral(referral._id, { status: "completed" })
                        }
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Mark completed
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === referral._id}
                        onClick={() => {
                          const reason = window.prompt(
                            "Reason for rejection",
                            referral.reason || "Suspicious activity"
                          );
                          if (reason) {
                            updateReferral(referral._id, {
                              status: "rejected",
                              reason,
                              fraudStatus: "rejected",
                            });
                          }
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(
              pagination.page * pagination.limit,
              pagination.totalItems || 0
            )}{" "}
            of {pagination.totalItems || 0}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-3 py-1 disabled:opacity-50"
              onClick={() => loadReferrals(Math.max(pagination.page - 1, 1))}
              disabled={pagination.page <= 1 || loading}
            >
              Prev
            </button>
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-3 py-1 disabled:opacity-50"
              onClick={() =>
                loadReferrals(
                  Math.min(pagination.page + 1, pagination.totalPages)
                )
              }
              disabled={pagination.page >= pagination.totalPages || loading}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReferralsPage;
