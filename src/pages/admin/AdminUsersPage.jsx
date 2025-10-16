import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Download,
  Eye,
  PenLine,
  Shield,
  ShieldOff,
  Trash2,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterDropdown from "../../components/admin/AdminFilterDropdown";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminTable from "../../components/admin/AdminTable";
import AdminModal from "../../components/admin/AdminModal";
import {
  fetchAdminUsers,
  fetchAdminUserById,
  updateAdminUser,
  blockAdminUser,
  deleteAdminUser,
  downloadUsersCsv,
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
    edit: false,
    confirm: false,
  });
  const [pendingAction, setPendingAction] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

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
      setModalState((prev) => ({ ...prev, [type]: true }));
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load user"
      );
    }
  };

  const closeModal = () => {
    setModalState({ view: false, edit: false, confirm: false });
    setSelectedUser(null);
    setPendingAction(null);
  };

  const handleUpdateUser = async (updates) => {
    if (!selectedUser) return;
    try {
      await updateAdminUser(selectedUser.id || selectedUser._id, updates);
      closeModal();
      refresh();
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to update user"
      );
    }
  };

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
      {
        key: "subscriptionPlan",
        label: "Plan",
        sortable: true,
        render: (value) =>
          value ? value.charAt(0).toUpperCase() + value.slice(1) : "—",
      },
      {
        key: "paymentStatus",
        label: "Payment Status",
        sortable: true,
        render: (value) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
      {
        key: "paymentMethod",
        label: "Method",
        sortable: true,
        render: (value) =>
          value && value !== "none" ? value.toUpperCase() : "—",
      },
      {
        key: "isBlocked",
        label: "Status",
        render: (value) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              value
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {value ? "Blocked" : "Active"}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Joined",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleDateString() : "—"),
      },
    ],
    []
  );

  const renderActions = (user) => (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => openModal("view", user.id || user._id)}
        className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => openModal("edit", user.id || user._id)}
        className="inline-flex items-center rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <PenLine className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          setPendingAction({ type: "block", value: !user.isBlocked });
          openModal("confirm", user.id || user._id);
        }}
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
        className="inline-flex items-center rounded-full border border-red-200 p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

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
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-gray-500">Created</p>
                <p className="text-gray-900">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Updated</p>
                <p className="text-gray-900">
                  {selectedUser.updatedAt
                    ? new Date(selectedUser.updatedAt).toLocaleString()
                    : "—"}
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
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading user...</div>
        )}
      </AdminModal>

      <AdminModal
        open={modalState.edit}
        title="Edit user"
        onClose={closeModal}
        footer={
          selectedUser && (
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
                onClick={() =>
                  handleUpdateUser({
                    subscriptionPlan: selectedUser.subscriptionPlan,
                    paymentStatus: selectedUser.paymentStatus,
                    paymentMethod: selectedUser.paymentMethod,
                    isBlocked: selectedUser.isBlocked,
                  })
                }
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Save changes
              </button>
            </>
          )
        }
      >
        {selectedUser ? (
          <div className="grid gap-4 text-sm">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span>Payment method</span>
              <select
                value={selectedUser.paymentMethod || "none"}
                onChange={(event) =>
                  setSelectedUser((prev) => ({
                    ...prev,
                    paymentMethod: event.target.value,
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="none">None</option>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span>Status</span>
              <select
                value={selectedUser.isBlocked ? "true" : "false"}
                onChange={(event) =>
                  setSelectedUser((prev) => ({
                    ...prev,
                    isBlocked: event.target.value === "true",
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="true">Blocked</option>
              </select>
            </label>
            {/* 
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span>GST number</span>
              <input
                type="text"
                value={selectedUser.gstNumber || ""}
                onChange={(event) =>
                  setSelectedUser((prev) => ({
                    ...prev,
                    gstNumber: event.target.value,
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </label> */}
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
    </div>
  );
};

export default AdminUsersPage;
