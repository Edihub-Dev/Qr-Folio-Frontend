import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  adminListWithdrawalRequests,
  adminUpdateWithdrawalRequest,
} from "../../services/referralService";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

const statusBadgeClass = (status) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    case "failed":
      return "bg-rose-50 text-rose-600 border border-rose-100";
    default:
      return "bg-amber-50 text-amber-600 border border-amber-100";
  }
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const filters = useMemo(() => ({ status: statusFilter }), [statusFilter]);

  const loadWithdrawals = async (page = pagination.page) => {
    try {
      setLoading(true);
      const { data } = await adminListWithdrawalRequests({
        page,
        limit: pagination.limit,
        status: filters.status || undefined,
      });
      if (data?.success) {
        setWithdrawals(Array.isArray(data.data) ? data.data : []);
        const meta = data.meta?.pagination || {};
        setPagination((prev) => ({
          page: meta.page || page,
          limit: meta.limit || prev.limit,
          totalPages: meta.totalPages || 1,
          totalItems: meta.total || 0,
        }));
      }
    } catch (error) {
      toast.error("Unable to load withdrawal requests");
      console.error("admin.withdrawals.load.error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const refresh = () => loadWithdrawals(pagination.page);

  const handleUpdate = async (withdrawalId, nextStatus) => {
    try {
      let adminNote;
      if (nextStatus === "failed") {
        adminNote = window.prompt("Reason for marking as failed?", "Payment declined");
        if (adminNote === null) {
          return;
        }
      }

      setUpdatingId(withdrawalId);
      await adminUpdateWithdrawalRequest(withdrawalId, {
        status: nextStatus,
        adminNote,
      });
      toast.success(`Withdrawal marked as ${nextStatus}`);
      loadWithdrawals(pagination.page);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to update withdrawal";
      toast.error(message);
      console.error("admin.withdrawals.update.error", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const canAction = (status) => status === "pending";

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Withdrawal operations
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <Wallet className="h-6 w-6 text-primary-600" /> Pending payouts
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Review withdrawal requests submitted by users, verify payout
              information, and record payment completion or failures for an
              accurate audit trail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[520px] flex-col rounded-3xl border border-slate-100 bg-white/90 shadow">
        <div className="flex-1 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-100 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Contact</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-left">Payout details</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Timestamps</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    <span className="mt-2 block text-xs uppercase tracking-[0.3em]">
                      Loading requests…
                    </span>
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <AlertTriangle className="mx-auto h-6 w-6" />
                    <span className="mt-2 block text-xs uppercase tracking-[0.3em]">
                      No withdrawal requests found.
                    </span>
                  </td>
                </tr>
              ) : (
                withdrawals.map((entry) => {
                  const payoutDetails = entry.payoutDetails || entry.metadata?.payoutDetails || {};
                  const methodLabel =
                    entry.payoutMethod || payoutDetails.method || "—";
                  const hasBankDetails =
                    (payoutDetails.method || entry.payoutMethod) === "bank" &&
                    (payoutDetails.accountNumber || payoutDetails.ifsc);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {entry.userName || "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {entry.userId || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <div>{entry.userEmail || "—"}</div>
                        <div>{entry.userPhone || "—"}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        ₹{Number(entry.amount || 0).toLocaleString("en-IN")}
                        <p className="text-xs font-normal text-slate-400">
                          Wallet after: ₹
                          {Number(entry.walletBalance || 0).toLocaleString("en-IN")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <p className="font-semibold capitalize">
                          {methodLabel}
                        </p>
                        {methodLabel === "upi" && payoutDetails.upiId && (
                          <p className="truncate text-slate-500">
                            UPI ID: {payoutDetails.upiId}
                          </p>
                        )}
                        {hasBankDetails && (
                          <div className="text-slate-500">
                            {payoutDetails.bankName && (
                              <p>Bank: {payoutDetails.bankName}</p>
                            )}
                            {payoutDetails.accountHolderName && (
                              <p>Account holder: {payoutDetails.accountHolderName}</p>
                            )}
                            {payoutDetails.accountNumber && (
                              <p>Account: {payoutDetails.accountNumber}</p>
                            )}
                            {payoutDetails.ifsc && <p>IFSC: {payoutDetails.ifsc}</p>}
                          </div>
                        )}
                        {entry.note && (
                          <p className="mt-1 text-slate-400">{entry.note}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                            entry.status
                          )}`}
                        >
                          {entry.status}
                        </span>
                        {entry.metadata?.adminNote && (
                          <p className="mt-1 text-xs text-slate-500">
                            Admin note: {entry.metadata.adminNote}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <p>Requested: {formatDateTime(entry.createdAt)}</p>
                        <p>
                          Processed: {formatDateTime(entry.metadata?.processedAt)}
                        </p>
                        {entry.metadata?.processedBy && (
                          <p>By: {entry.metadata.processedBy}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={!canAction(entry.status) || updatingId === entry.id}
                            onClick={() => handleUpdate(entry.id, "completed")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Mark paid
                          </button>
                          <button
                            type="button"
                            disabled={!canAction(entry.status) || updatingId === entry.id}
                            onClick={() => handleUpdate(entry.id, "failed")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" /> Mark failed
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex min-h-[72px] flex-col gap-3 border-t border-slate-100 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(
              pagination.page * pagination.limit,
              pagination.totalItems || 0
            )} of {pagination.totalItems || 0}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-24 rounded-full border border-slate-200 px-3 py-1 text-center disabled:opacity-50"
              onClick={() => loadWithdrawals(Math.max(pagination.page - 1, 1))}
              disabled={pagination.page <= 1 || loading}
            >
              Previous
            </button>
            <button
              type="button"
              className="w-24 rounded-full border border-slate-200 px-3 py-1 text-center disabled:opacity-50"
              onClick={() =>
                loadWithdrawals(
                  Math.min(pagination.page + 1, pagination.totalPages || 1)
                )
              }
              disabled={
                pagination.page >= (pagination.totalPages || 1) || loading
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawalsPage;
