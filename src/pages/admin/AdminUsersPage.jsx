import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Download,
  Eye,
  Shield,
  ShieldOff,
  Trash2,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  Bell,
  CalendarClock,
  CalendarPlus,
  History,
} from "lucide-react";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterDropdown from "../../components/admin/AdminFilterDropdown";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminTable from "../../components/admin/AdminTable";
import AdminModal from "../../components/admin/AdminModal";
import {
  fetchAdminUsers,
  fetchAdminUserById,
  blockAdminUser,
  deleteAdminUser,
  downloadUsersCsv,
  refreshAdminUserSubscription,
  renewAdminUserSubscription,
  updateAdminUserSubscriptionExpiry,
  sendAdminUserReminder,
  fetchAdminUserReminderLogs,
} from "../../services/adminApi";

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "phonepe", label: "PhonePe" },
  { value: "chainpay", label: "ChainPay" },
  // { value: "razorpay", label: "Razorpay" },
  // { value: "stripe", label: "Stripe" },
];

const PLAN_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
];

const AdminUsersPage = () => {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalState, setModalState] = useState({
    view: false,
    confirm: false,
    remind: false,
    renew: false,
    logs: false,
    expiry: false,
  });
  const [pendingAction, setPendingAction] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [renewForm, setRenewForm] = useState({
    planName: "",
    paymentMethod: "phonepe",
    durationInMonths: 12,
  });
  const [expiryForm, setExpiryForm] = useState({
    planExpireDate: "",
    notes: "",
  });
  const [reminderLogs, setReminderLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const formatDateTime = useCallback((value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAdminUsers(params);
      setData(response?.data || []);
      setStats(response?.meta?.stats || {});
      setPagination(response?.meta?.pagination || { page: 1, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 60000);
    return () => clearInterval(interval);
  }, [loadUsers]);

  const refresh = useCallback(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCsvDownload = async () => {
    try {
      setCsvLoading(true);
      const response = await downloadUsersCsv(params);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        response.headers["content-disposition"]?.match(
          /filename="(.+)"/
        )?.[1] || "users.csv"
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to download CSV"
      );
    } finally {
      setCsvLoading(false);
    }
  };

  const handleSort = (sortBy, sortDir) => {
    setParams((prev) => ({ ...prev, sortBy, sortDir }));
  };

  const handlePageChange = (page) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const openModal = async (type, userId) => {
    try {
      const response = await fetchAdminUserById(userId);
      setSelectedUser(response?.data || null);
      if (type === "remind") {
        setReminderMessage("");
      }
      if (type === "renew") {
        setRenewForm((prev) => ({
          planName:
            response?.data?.planName || response?.data?.subscriptionPlan || "",
          paymentMethod: response?.data?.paymentMethod || "phonepe",
          durationInMonths: prev?.durationInMonths || 12,
        }));
      }
      if (type === "expiry") {
        const expireValue = response?.data?.planExpireDate
          ? new Date(response.data.planExpireDate).toISOString().slice(0, 16)
          : "";
        setExpiryForm({
          planExpireDate: expireValue,
          notes: "",
        });
      }
      if (type === "logs") {
        await loadReminderLogs(userId);
      }
      setModalState((prev) => ({ ...prev, [type]: true }));
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load user"
      );
    }
  };

  const closeModal = () => {
    setModalState({
      view: false,
      confirm: false,
      remind: false,
      renew: false,
      logs: false,
      expiry: false,
    });
    setSelectedUser(null);
    setPendingAction(null);
    setReminderMessage("");
    setRenewForm({
      planName: "",
      paymentMethod: "phonepe",
      durationInMonths: 12,
    });
    setReminderLogs([]);
    setExpiryForm({ planExpireDate: "", notes: "" });
  };

  const handleRefreshSubscription = async (user) => {
    try {
      setActionLoading(true);
      await refreshAdminUserSubscription(user.id || user._id);
      refresh();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to refresh subscription"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await sendAdminUserReminder(selectedUser.id || selectedUser._id, {
        message: reminderMessage,
      });
      closeModal();
      refresh();
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to send reminder"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewSubscription = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await renewAdminUserSubscription(
        selectedUser.id || selectedUser._id,
        renewForm
      );
      closeModal();
      refresh();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to renew subscription"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateExpiry = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await updateAdminUserSubscriptionExpiry(
        selectedUser.id || selectedUser._id,
        {
          planExpireDate: expiryForm.planExpireDate
            ? new Date(expiryForm.planExpireDate).toISOString()
            : null,
          notes: expiryForm.notes,
        }
      );
      closeModal();
      refresh();
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to update expiry"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const loadReminderLogs = useCallback(async (userId) => {
    try {
      setLogsLoading(true);
      const response = await fetchAdminUserReminderLogs(userId, { limit: 20 });
      setReminderLogs(response?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load reminder logs"
      );
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleBulkAction = async () => {
    if (!selectedUser || !pendingAction) return;
    try {
      if (pendingAction.type === "block") {
        await blockAdminUser(
          selectedUser.id || selectedUser._id,
          pendingAction.value
        );
      } else if (pendingAction.type === "delete") {
        await deleteAdminUser(selectedUser.id || selectedUser._id);
      }
      closeModal();
      refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Action failed");
    }
  };

  const columns = useMemo(
    () => [
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email", sortable: true },

      /* ================= PLAN + METHOD ================= */
      {
        key: "planAndMethod",
        sortable: true,
        sortKey: "subscriptionPlan",
        label: (
          <div className="flex flex-col leading-tight">
            <span>Plan</span>
            <span className="text-gray-400 font-medium">Method</span>
          </div>
        ),
        render: (_, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {row.subscriptionPlan
                ? row.subscriptionPlan.charAt(0).toUpperCase() +
                  row.subscriptionPlan.slice(1)
                : "—"}
            </span>
            <span className="text-xs text-gray-500 uppercase">
              {row.paymentMethod && row.paymentMethod !== "none"
                ? row.paymentMethod
                : "—"}
            </span>
          </div>
        ),
      },

      /* ================= PAYMENT STATUS ================= */
      {
        key: "paymentStatus",
        label: "Payment",
        sortable: true,
        render: (value) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              value === "paid"
                ? "bg-green-100 text-green-700"
                : value === "failed"
                ? "bg-red-100 text-red-600"
                : value === "refunded"
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {value ? value.charAt(0).toUpperCase() + value.slice(1) : "Pending"}
          </span>
        ),
      },

      /* ================= BLOCK STATUS ================= */
      // {
      //   key: "isBlocked",
      //   label: "Status",
      //   render: (value) => (
      //     <span
      //       className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
      //         value
      //           ? "bg-red-100 text-red-600"
      //           : "bg-emerald-100 text-emerald-600"
      //       }`}
      //     >
      //       {value ? "Blocked" : "Active"}
      //     </span>
      //   ),
      // },

      /* ================= JOIN DATE ================= */

      {
        key: "joinedAndStatus",
        sortable: true,
        sortKey: "createdAt",
        label: (
          <div className="flex flex-col leading-tight">
            <span>Plan Joined/</span>
            <span className="text-gray-400 font-medium">Block Status</span>
          </div>
        ),
        render: (_, row) => {
          const joinedDate = row.createdAt
            ? new Date(row.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";

          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">{joinedDate}</span>
              <span
                className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  row.isBlocked
                    ? "bg-red-100 text-red-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {row.isBlocked ? "Blocked" : "Active"}
              </span>
            </div>
          );
        },
      },
      // {
      //   key: "createdAt",
      //   label: "Joined",
      //   sortable: true,
      //   render: (value) =>
      //     value
      //       ? new Date(value).toLocaleDateString("en-IN", {
      //           dateStyle: "medium",
      //         })
      //       : "—",
      // },

      /* ================= EXPIRY + STATUS ================= */
      {
        key: "expiryAndStatus",
        sortable: true,
        sortKey: "planExpireDate",
        label: (
          <div className="flex flex-col leading-tight">
            <span>Plan Expires/</span>
            <span className="text-gray-400 font-medium">Plan Status</span>
          </div>
        ),
        render: (_, row) => {
          const formattedExpire = row.planExpireDate
            ? new Date(row.planExpireDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";

          const statusColor =
            row.planStatus === "expired"
              ? "bg-red-100 text-red-600"
              : row.planStatus === "expiring_soon"
              ? "bg-amber-100 text-amber-600"
              : "bg-emerald-100 text-emerald-600";

          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">{formattedExpire}</span>
              <span
                className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor}`}
              >
                {row.planStatus ? row.planStatus.replace(/_/g, " ") : "unknown"}
              </span>
            </div>
          );
        },
      },
    ],
    []
  );

  const renderActions = (user) => {
    const blockActionLabel = user.isBlocked ? "Unblock user" : "Block user";

    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => openModal("view", user.id || user._id)}
          title="View user details"
          aria-label="View user details"
          className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleRefreshSubscription(user)}
          disabled={actionLoading}
          title="Refresh subscription"
          aria-label="Refresh subscription"
          className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${actionLoading ? "animate-spin" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={() => openModal("remind", user.id || user._id)}
          title="Send reminder"
          aria-label="Send reminder"
          className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => openModal("renew", user.id || user._id)}
          title="Renew subscription"
          aria-label="Renew subscription"
          className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <CalendarClock className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => openModal("expiry", user.id || user._id)}
          title="Set custom expiry"
          aria-label="Set custom expiry"
          className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <CalendarPlus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => openModal("logs", user.id || user._id)}
          title="View reminder history"
          aria-label="View reminder history"
          className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <History className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setPendingAction({ type: "block", value: !user.isBlocked });
            openModal("confirm", user.id || user._id);
          }}
          title={blockActionLabel}
          aria-label={blockActionLabel}
          className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          {user.isBlocked ? (
            <ShieldOff className="h-4 w-4" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setPendingAction({ type: "delete" });
            openModal("confirm", user.id || user._id);
          }}
          title="Delete user"
          aria-label="Delete user"
          className="inline-flex items-center rounded-full border border-red-200 p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-slate-100 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage accounts, plans, and payment activity across the platform.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              refresh();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={handleCsvDownload}
            disabled={csvLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
          >
            <Download className="h-4 w-4" />
            {csvLoading ? "Downloading..." : "Download CSV"}
          </button>
        </div>
      </div>

      {Object.keys(stats).length > 0 && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-gray-400">
                    Total users
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {(stats.totalUsers || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-gray-400">
                    Paid users
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {(stats.paidUsers || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-gray-400">
                    Blocked
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {(stats.blockedUsers || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-gray-400">
                    Conversion
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {stats.totalUsers
                      ? `${Math.round(
                          ((stats.paidUsers || 0) / stats.totalUsers) * 100
                        )}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-3">
            <AdminSearchBar
              value={params.search}
              onChange={(search) =>
                setParams((prev) => ({ ...prev, page: 1, search }))
              }
              placeholder="Search name or email"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <AdminFilterDropdown
                label="Plan"
                value={params.plan || ""}
                onChange={(plan) =>
                  setParams((prev) => ({ ...prev, page: 1, plan }))
                }
                options={PLAN_OPTIONS}
                placeholder="All plans"
              />
              <AdminFilterDropdown
                label="Payment status"
                value={params.paymentStatus || ""}
                onChange={(paymentStatus) =>
                  setParams((prev) => ({ ...prev, page: 1, paymentStatus }))
                }
                options={PAYMENT_STATUS_OPTIONS}
                placeholder="All statuses"
              />
              <AdminFilterDropdown
                label="Payment method"
                value={params.paymentMethod || ""}
                onChange={(paymentMethod) =>
                  setParams((prev) => ({ ...prev, page: 1, paymentMethod }))
                }
                options={PAYMENT_METHOD_OPTIONS}
                placeholder="All methods"
              />
              <AdminFilterDropdown
                label="Blocked"
                value={params.isBlocked || ""}
                onChange={(isBlocked) =>
                  setParams((prev) => ({ ...prev, page: 1, isBlocked }))
                }
                options={[
                  { value: "true", label: "Blocked" },
                  { value: "false", label: "Active" },
                ]}
                placeholder="All users"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Snapshot
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Revenue per user</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalUsers
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format((stats.totalRevenue || 0) / stats.totalUsers)
                    : "₹0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Average plan</span>
                <span className="font-semibold text-gray-900">
                  {(stats.paidUsers || 0) > 0
                    ? `${Math.round(
                        ((stats.paidUsers || 0) / (stats.totalUsers || 1)) * 100
                      )}% paid`
                    : "No paid users"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Blocked ratio</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalUsers
                    ? `${Math.round(
                        ((stats.blockedUsers || 0) / stats.totalUsers) * 100
                      )}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <AdminTable
            columns={columns}
            data={data}
            sortBy={params.sortBy}
            sortDir={params.sortDir}
            onSort={handleSort}
            renderActions={renderActions}
          />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <AdminPagination
            page={pagination.page || 1}
            totalPages={pagination.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </div>

        {loading && (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading users...
          </div>
        )}
      </div>

      <AdminModal
        open={modalState.view}
        title="User details"
        onClose={closeModal}
        footer={
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        }
      >
        {selectedUser ? (
          <div className="grid gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500">Name</p>
              <p className="text-gray-900">{selectedUser.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Email</p>
              <p className="text-gray-900">{selectedUser.email || "—"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-gray-500">Plan</p>
                <p className="text-gray-900">
                  {selectedUser.subscriptionPlan || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Plan status</p>
                <p className="text-gray-900">
                  {selectedUser.planStatus || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Payment status
                </p>
                <p className="text-gray-900">
                  {selectedUser.paymentStatus || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Payment method
                </p>
                <p className="text-gray-900">
                  {selectedUser.paymentMethod || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total paid</p>
                <p className="text-gray-900">
                  ₹{Number(selectedUser.totalAmountPaid || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {(() => {
              const planExpireTime = selectedUser.planExpireDate
                ? new Date(selectedUser.planExpireDate).getTime()
                : null;
              const renewTime = selectedUser.subscriptionRenewsAt
                ? new Date(selectedUser.subscriptionRenewsAt).getTime()
                : null;
              const accessTime = selectedUser.subscriptionExpiresAt
                ? new Date(selectedUser.subscriptionExpiresAt).getTime()
                : null;

              const shouldShowRenew = Boolean(
                selectedUser.subscriptionRenewsAt &&
                  (!planExpireTime || renewTime !== planExpireTime)
              );

              const shouldShowAccess = Boolean(
                selectedUser.subscriptionExpiresAt &&
                  (!planExpireTime || accessTime !== planExpireTime) &&
                  (!shouldShowRenew || accessTime !== renewTime)
              );

              if (
                !selectedUser.planStartDate &&
                !selectedUser.planExpireDate &&
                !shouldShowRenew &&
                !shouldShowAccess
              ) {
                return null;
              }

              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedUser.planStartDate && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Plan start
                      </p>
                      <p className="text-gray-900">
                        {formatDateTime(selectedUser.planStartDate)}
                      </p>
                    </div>
                  )}
                  {selectedUser.planExpireDate && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Plan expiry
                      </p>
                      <p className="text-gray-900">
                        {formatDateTime(selectedUser.planExpireDate)}
                      </p>
                    </div>
                  )}
                  {shouldShowRenew && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Renews on
                      </p>
                      <p className="text-gray-900">
                        {formatDateTime(selectedUser.subscriptionRenewsAt)}
                      </p>
                    </div>
                  )}
                  {shouldShowAccess && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Access until
                      </p>
                      <p className="text-gray-900">
                        {formatDateTime(selectedUser.subscriptionExpiresAt)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Account created
                </p>
                <p className="text-gray-900">
                  {formatDateTime(selectedUser.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Last updated
                </p>
                <p className="text-gray-900">
                  {formatDateTime(selectedUser.updatedAt)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">GST</p>
              <p className="text-gray-900">
                {selectedUser.gstNumber || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Status</p>
              <p className="text-gray-900">
                {selectedUser.isBlocked ? "Blocked" : "Active"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Last reminder</p>
              <p className="text-gray-900">
                {formatDateTime(selectedUser.lastReminderSent)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading user...</div>
        )}
      </AdminModal>

      <AdminModal
        open={modalState.confirm}
        title={
          pendingAction?.type === "delete"
            ? "Delete user"
            : pendingAction?.value
            ? "Block user"
            : "Unblock user"
        }
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkAction}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                pendingAction?.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              {pendingAction?.type === "delete"
                ? "Delete"
                : pendingAction?.value
                ? "Block"
                : "Unblock"}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          {pendingAction?.type === "delete"
            ? "This action is irreversible. The user and their data will be permanently removed."
            : pendingAction?.value
            ? "The user will be blocked and prevented from accessing their account."
            : "The user will regain access to their account."}
        </p>
      </AdminModal>

      <AdminModal
        open={modalState.remind}
        title="Send manual reminder"
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSendReminder}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
            >
              {actionLoading ? "Sending..." : "Send reminder"}
            </button>
          </>
        }
      >
        {selectedUser ? (
          <div className="space-y-4 text-sm">
            <p>
              The reminder email will be sent to{" "}
              <strong>{selectedUser.email}</strong>. Provide an optional note to
              include in the log.
            </p>
            <textarea
              value={reminderMessage}
              onChange={(event) => setReminderMessage(event.target.value)}
              placeholder="Optional note for the reminder log"
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading user...</div>
        )}
      </AdminModal>

      <AdminModal
        open={modalState.renew}
        title="Renew subscription"
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleRenewSubscription}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
            >
              {actionLoading ? "Updating..." : "Renew plan"}
            </button>
          </>
        }
      >
        {selectedUser ? (
          <div className="grid gap-4 text-sm">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span>Plan name</span>
              <input
                type="text"
                value={renewForm.planName}
                onChange={(event) =>
                  setRenewForm((prev) => ({
                    ...prev,
                    planName: event.target.value,
                  }))
                }
                placeholder="e.g. Standard (Gold)"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span>Payment method</span>
              <select
                value={renewForm.paymentMethod}
                onChange={(event) =>
                  setRenewForm((prev) => ({
                    ...prev,
                    paymentMethod: event.target.value,
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="phonepe">PhonePe</option>
                <option value="chainpay">ChainPay</option>
                <option value="manual">Manual</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span>Duration (months)</span>
              <input
                type="number"
                min="1"
                value={renewForm.durationInMonths}
                onChange={(event) =>
                  setRenewForm((prev) => ({
                    ...prev,
                    durationInMonths: Number(event.target.value) || 1,
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading user...</div>
        )}
      </AdminModal>

      <AdminModal
        open={modalState.logs}
        title="Reminder history"
        onClose={closeModal}
        footer={
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        }
      >
        {logsLoading ? (
          <div className="text-sm text-gray-500">Loading reminders...</div>
        ) : reminderLogs.length === 0 ? (
          <div className="text-sm text-gray-500">
            No reminders logged for this user yet.
          </div>
        ) : (
          <ul className="space-y-3 text-sm">
            {reminderLogs.map((log) => (
              <li
                key={log._id || log.id}
                className="rounded-xl border border-gray-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {log.reminderType?.replace(/_/g, " ") || "reminder"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Plan: {log.planName || "—"} (expires{" "}
                  {log.planExpireDate
                    ? new Date(log.planExpireDate).toLocaleDateString()
                    : "—"}
                  )
                </div>
                {log.notes && (
                  <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs text-gray-600">
                    {log.notes}
                  </p>
                )}
                <div className="mt-2 text-xs text-gray-400">
                  Triggered by {log.triggeredBy || "system"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminModal>

      <AdminModal
        open={modalState.expiry}
        title="Set custom expiry"
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading || !expiryForm.planExpireDate}
              onClick={handleUpdateExpiry}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
            >
              {actionLoading ? "Saving..." : "Update expiry"}
            </button>
          </>
        }
      >
        {selectedUser ? (
          <div className="grid gap-4 text-sm">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span>Expiry date & time</span>
              <input
                type="datetime-local"
                value={expiryForm.planExpireDate}
                onChange={(event) =>
                  setExpiryForm((prev) => ({
                    ...prev,
                    planExpireDate: event.target.value,
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span>Notes (optional)</span>
              <textarea
                rows={3}
                value={expiryForm.notes}
                onChange={(event) =>
                  setExpiryForm((prev) => ({
                    ...prev,
                    notes: event.target.value,
                  }))
                }
                placeholder="Add context for the log entry"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              Setting a past date will immediately mark the plan as expired.
              Upcoming dates refresh reminders and set the plan back to active.
            </p>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading user...</div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminUsersPage;
