import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCcw,
  Truck,
} from "lucide-react";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminPagination from "../../components/admin/AdminPagination";
import {
  fetchAdminNfcRequests,
  updateAdminNfcStatus,
} from "../../services/adminApi";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Requested", value: "requested" },
  { label: "In production", value: "in_production" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
];

const statusBadgeClass = (status) => {
  switch (status) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "shipped":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "in_production":
      return "bg-amber-50 text-amber-700 border border-amber-100";
    case "requested":
      return "bg-slate-50 text-slate-700 border border-slate-100";
    default:
      return "bg-gray-50 text-gray-600 border border-gray-100";
  }
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PAGE_LIMIT = 20;

const AdminNfcPage = () => {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    onlyPending: true,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadRequests = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetchAdminNfcRequests({
        page,
        limit: PAGE_LIMIT,
        search: filters.search || undefined,
        status: filters.status || undefined,
        onlyPending: filters.onlyPending ? "true" : undefined,
      });

      if (response?.success) {
        const items = Array.isArray(response.data) ? response.data : [];
        const meta = response.meta?.pagination || {};
        setRecords(items);
        setPagination({
          page: meta.page || page,
          totalPages: meta.totalPages || 1,
          totalItems: meta.totalItems || meta.total || 0,
        });
      } else {
        setRecords([]);
        setPagination((prev) => ({ ...prev, page }));
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to load NFC requests"
      );
      console.error("admin.nfc.load.error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.onlyPending]);

  const handlePageChange = (page) => {
    loadRequests(page);
  };

  const refresh = () => {
    loadRequests(pagination.page || 1);
  };

  const handleUpdateStatus = async (entry, nextStatus) => {
    const userId = entry._id || entry.id;
    if (!userId) return;

    let trackingNumber = entry.nfcTrackingNumber || "";
    if (nextStatus === "shipped") {
      const input = window.prompt("Tracking number (optional)", trackingNumber);
      if (input === null) {
        return;
      }
      trackingNumber = input;
    }

    try {
      setUpdatingId(userId);
      await updateAdminNfcStatus(userId, {
        status: nextStatus,
        trackingNumber: trackingNumber || undefined,
      });
      toast.success("NFC card status updated");
      loadRequests(pagination.page || 1);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to update NFC status";
      toast.error(message);
      console.error("admin.nfc.update.error", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const canMoveToProduction = (status) => status === "requested";
  const canShip = (status) =>
    status === "requested" || status === "in_production";
  const canMarkDelivered = (status) => status === "shipped";

  const statusLabel = (status) => {
    switch (status) {
      case "requested":
        return "Requested";
      case "in_production":
        return "In production";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      default:
        return "Not requested";
    }
  };

  const summaryText = useMemo(() => {
    if (!pagination.totalItems) return "No NFC requests";
    return `Showing ${pagination.totalItems} user${
      pagination.totalItems === 1 ? "" : "s"
    }`;
  }, [pagination.totalItems]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              NFC card fulfilment
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <CreditCard className="h-6 w-6 text-primary-600" /> Physical card
              requests
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Review NFC card requests from paid users, manage production, and
              track shipping with courier information.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Status
              </span>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <input
                type="checkbox"
                checked={filters.onlyPending}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    onlyPending: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Only pending (requested / in production)</span>
            </label>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchBar
            value={filters.search}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, search: value }))
            }
            placeholder="Search by name, email, or phone"
          />
          <div className="text-xs text-slate-500">{summaryText}</div>
        </div>
      </div>

      <div className="flex min-h-[520px] flex-col rounded-3xl border border-slate-100 bg-white/90 shadow">
        <div className="flex-1 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-100 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <th className="px-6 py-3 text-left">Sr. No.</th>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Plan</th>
                <th className="px-6 py-3 text-left">Shipping</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Timestamps</th>
                <th className="px-6 py-3 text-left">Tracking</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    <span className="mt-2 block text-xs uppercase tracking-[0.3em]">
                      Loading NFC requests…
                    </span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <AlertTriangle className="mx-auto h-6 w-6" />
                    <span className="mt-2 block text-xs uppercase tracking-[0.3em]">
                      No NFC requests found.
                    </span>
                  </td>
                </tr>
              ) : (
                records.map((entry, index) => {
                  const status = entry.nfcCardStatus || "not_requested";
                  const isUpdating = updatingId === (entry._id || entry.id);

                  const shippingLine2Parts = [
                    entry.nfcShippingCity,
                    entry.nfcShippingState,
                    entry.nfcShippingPostalCode,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  const base = (pagination.page - 1) * PAGE_LIMIT;
                  const serialNo = base + index + 1;

                  return (
                    <tr
                      key={entry._id || entry.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {serialNo}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {entry.name || "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {entry.email || "—"}
                        </p>
                        {entry.phone && (
                          <p className="text-xs text-slate-400">
                            {entry.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <p className="font-medium">
                          {entry.planName ||
                            entry.subscriptionPlanName ||
                            entry.subscriptionPlan ||
                            "—"}
                        </p>
                        <p className="text-slate-500">
                          {entry.isPaid ? "Paid" : "Unpaid"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {entry.paymentStatus && (
                            <>
                              Status: {entry.paymentStatus}
                              {entry.paymentMethod
                                ? ` • Method: ${entry.paymentMethod.toUpperCase()}`
                                : ""}
                            </>
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {entry.nfcShippingName ||
                        entry.nfcShippingAddressLine1 ? (
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">
                              {entry.nfcShippingName || "—"}
                            </p>
                            {entry.nfcShippingPhone && (
                              <p className="text-slate-600">
                                {entry.nfcShippingPhone}
                              </p>
                            )}
                            <p className="text-slate-600">
                              {entry.nfcShippingAddressLine1}
                              {entry.nfcShippingAddressLine2
                                ? `, ${entry.nfcShippingAddressLine2}`
                                : ""}
                            </p>
                            {shippingLine2Parts && (
                              <p className="text-slate-500">
                                {shippingLine2Parts}
                              </p>
                            )}
                            {entry.nfcShippingCountry && (
                              <p className="text-slate-500">
                                {entry.nfcShippingCountry}
                              </p>
                            )}
                            {entry.nfcShippingNotes && (
                              <p className="text-[11px] text-slate-500">
                                Notes: {entry.nfcShippingNotes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            No shipping details
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                            status
                          )}`}
                        >
                          {status === "shipped" && (
                            <Truck className="h-3.5 w-3.5" />
                          )}
                          {status === "delivered" && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          {statusLabel(status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <p>Requested: {formatDateTime(entry.nfcRequestedAt)}</p>
                        <p>Shipped: {formatDateTime(entry.nfcShippedAt)}</p>
                        <p>Delivered: {formatDateTime(entry.nfcDeliveredAt)}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {entry.nfcTrackingNumber ? (
                          <div>
                            <p className="font-medium text-slate-900">
                              {entry.nfcTrackingNumber}
                            </p>
                            <p className="text-slate-500">
                              Updated: {formatDateTime(entry.updatedAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            No tracking set
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={
                              !canMoveToProduction(status) || isUpdating
                            }
                            onClick={() =>
                              handleUpdateStatus(entry, "in_production")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Move to production
                          </button>
                          <button
                            type="button"
                            disabled={!canShip(status) || isUpdating}
                            onClick={() => handleUpdateStatus(entry, "shipped")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                          >
                            Mark shipped
                          </button>
                          <button
                            type="button"
                            disabled={!canMarkDelivered(status) || isUpdating}
                            onClick={() =>
                              handleUpdateStatus(entry, "delivered")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Mark delivered
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

        <div className="border-t border-slate-100 px-6 py-4">
          <AdminPagination
            page={pagination.page || 1}
            totalPages={pagination.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminNfcPage;
