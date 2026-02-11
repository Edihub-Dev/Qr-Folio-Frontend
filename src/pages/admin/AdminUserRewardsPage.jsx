import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Gift, RefreshCw, Pencil } from "lucide-react";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterDropdown from "../../components/admin/AdminFilterDropdown";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminTable from "../../components/admin/AdminTable";
import AdminModal from "../../components/admin/AdminModal";
import { fetchAdminUserRewards, updateAdminUserReward } from "../../services/adminApi";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { ROLES, normalizeRole } from "../../config/permissions";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "LOCKED", label: "LOCKED" },
  { value: "UNLOCKED", label: "UNLOCKED" },
  { value: "CLAIMED", label: "CLAIMED" },
  { value: "EXPIRED", label: "EXPIRED" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All" },
  { value: "legacy", label: "legacy" },
  { value: "referral", label: "referral" },
  { value: "admin", label: "admin" },
  { value: "campaign", label: "campaign" },
  { value: "subadmin", label: "subadmin" },
];

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

const toLocalInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const AdminUserRewardsPage = () => {
  const { user } = useAuth();
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    search: "",
    status: "",
    source: "",
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedReward, setSelectedReward] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    couponCode: "",
    source: "",
    expiresAt: "",
    claimedAt: "",
  });

  const loadRewards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAdminUserRewards(params);
      setData(response?.data || []);
      setPagination(response?.meta?.pagination || { page: 1, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load user rewards"
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const refresh = useCallback(() => {
    loadRewards();
  }, [loadRewards]);

  const handleSort = (sortBy, sortDir) => {
    setParams((prev) => ({ ...prev, sortBy, sortDir }));
  };

  const handlePageChange = (page) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const openEdit = (reward) => {
    setSelectedReward(reward);
    setEditForm({
      status: reward?.status || "",
      couponCode: reward?.couponCode || "",
      source: reward?.source || "",
      expiresAt: toLocalInputValue(reward?.expiresAt),
      claimedAt: toLocalInputValue(reward?.claimedAt),
    });
    setModalOpen(true);
  };

  const closeEdit = () => {
    setModalOpen(false);
    setSelectedReward(null);
  };

  const handleSave = async () => {
    if (!selectedReward?.id) return;

    try {
      setSaving(true);
      const payload = {
        status: editForm.status || undefined,
        source: editForm.source || undefined,
        couponCode:
          editForm.couponCode !== undefined
            ? editForm.couponCode
            : undefined,
        expiresAt: editForm.expiresAt ? new Date(editForm.expiresAt).toISOString() : null,
        claimedAt: editForm.claimedAt ? new Date(editForm.claimedAt).toISOString() : null,
      };

      await updateAdminUserReward(selectedReward.id, payload);
      closeEdit();
      await loadRewards();
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to update reward"
      );
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "serialNo",
        label: "Sr. No.",
        sortable: false,
        render: (_value, _row, rowIndex) => {
          const base = (params.page - 1) * params.limit;
          return base + rowIndex + 1;
        },
      },
      {
        key: "user",
        label: "User",
        sortable: true,
        render: (value) => {
          if (!value) return "—";
          return (
            <div className={clsx('flex', 'flex-col')}>
              <span className={clsx('text-sm', 'font-medium', 'text-gray-800')}>
                {value.name || "—"}
              </span>
              {value.email && (
                <span className={clsx('text-xs', 'text-gray-500', 'break-all')}>
                  {value.email}
                </span>
              )}
            </div>
          );
        },
      },
      { key: "rewardCode", label: "Reward", sortable: true },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (value) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              value === "CLAIMED"
                ? "bg-emerald-100 text-emerald-700"
                : value === "UNLOCKED"
                ? "bg-blue-100 text-blue-700"
                : value === "EXPIRED"
                ? "bg-red-100 text-red-600"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {value || "—"}
          </span>
        ),
      },
      { key: "source", label: "Source", sortable: true },
      {
        key: "couponCode",
        label: "Coupon",
        sortable: true,
        render: (value) => (value ? <span className="font-mono">{value}</span> : "—"),
      },
      {
        key: "expiresAt",
        label: "Expires",
        sortable: true,
        render: (value) => formatDateTime(value),
      },
      {
        key: "claimedAt",
        label: "Claimed",
        sortable: true,
        render: (value) => formatDateTime(value),
      },
      {
        key: "createdAt",
        label: "Created",
        sortable: true,
        render: (value) => formatDateTime(value),
      },
    ],
    [params.page, params.limit]
  );

  const canShowActions = useMemo(
    () => normalizeRole(user?.role) === ROLES.ADMIN,
    [user?.role]
  );

  return (
    <div className="space-y-4">
      <div className={clsx('flex', 'flex-col', 'gap-3', 'rounded-3xl', 'border', 'border-gray-200', 'bg-gradient-to-br', 'from-white', 'via-white', 'to-slate-100', 'p-5', 'shadow-sm', 'sm:flex-row', 'sm:items-center', 'sm:justify-between')}>
        <div className={clsx('flex', 'items-center', 'gap-3')}>
          <div className={clsx('flex', 'h-10', 'w-10', 'items-center', 'justify-center', 'rounded-2xl', 'bg-primary-600', 'text-white', 'shadow-lg')}>
            <Gift className={clsx('h-5', 'w-5')} />
          </div>
          <div>
            <h1 className={clsx('text-2xl', 'font-semibold', 'text-gray-900')}>User Rewards</h1>
            <p className={clsx('mt-1', 'text-sm', 'text-gray-500')}>
              View and update reward status, coupon codes, and expiry.
            </p>
          </div>
        </div>
        <div className={clsx('flex', 'flex-wrap', 'items-center', 'gap-3')}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              refresh();
            }}
            disabled={loading}
            className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-2xl', 'border', 'border-gray-200', 'px-4', 'py-2', 'text-sm', 'font-medium', 'text-gray-600', 'transition', 'hover:bg-gray-100', 'disabled:cursor-not-allowed', 'disabled:opacity-60')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className={clsx('rounded-3xl', 'border', 'border-gray-200', 'bg-white', 'p-5', 'shadow-sm')}>
        <div className={clsx('grid', 'gap-4', 'lg:grid-cols-[2fr_1fr_1fr]')}>
          <div className="space-y-3">
            <AdminSearchBar
              value={params.search}
              onChange={(search) =>
                setParams((prev) => ({ ...prev, page: 1, search }))
              }
              placeholder="Search by user name/email, reward code, coupon"
            />
          </div>
          <div>
            <AdminFilterDropdown
              label="Status"
              value={params.status || ""}
              onChange={(status) =>
                setParams((prev) => ({ ...prev, page: 1, status }))
              }
              options={STATUS_OPTIONS}
              placeholder="All statuses"
            />
          </div>
          <div>
            <AdminFilterDropdown
              label="Source"
              value={params.source || ""}
              onChange={(source) =>
                setParams((prev) => ({ ...prev, page: 1, source }))
              }
              options={SOURCE_OPTIONS}
              placeholder="All sources"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <div className={clsx('rounded-3xl', 'border', 'border-red-200', 'bg-red-50', 'p-4', 'text-sm', 'text-red-600')}>
            {error}
          </div>
        )}

        <div className={clsx('rounded-3xl', 'border', 'border-gray-200', 'bg-white', 'p-4', 'shadow-sm')}>
          <div className={clsx('max-h-[calc(100vh-26rem)]', 'overflow-auto')}>
            <AdminTable
              columns={columns}
              data={data}
              sortBy={params.sortBy}
              sortDir={params.sortDir}
              onSort={handleSort}
              renderActions={
                canShowActions
                  ? (row) => (
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-full', 'border', 'border-gray-200', 'px-3', 'py-1.5', 'text-sm', 'text-gray-600', 'transition-colors', 'hover:bg-gray-100')}
                      >
                        <Pencil className={clsx('h-4', 'w-4')} />
                        Edit
                      </button>
                    )
                  : undefined
              }
            />
          </div>
        </div>

        <div className={clsx('rounded-3xl', 'border', 'border-gray-200', 'bg-white', 'p-4', 'shadow-sm')}>
          <AdminPagination
            page={pagination.page || 1}
            totalPages={pagination.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </div>

        {loading && (
          <div className={clsx('rounded-3xl', 'border', 'border-dashed', 'border-gray-200', 'bg-white', 'p-8', 'text-center', 'text-gray-500')}>
            Loading rewards...
          </div>
        )}
      </div>

      <AdminModal
        open={modalOpen}
        title="Edit reward"
        onClose={closeEdit}
        footer={
          <>
            <button
              type="button"
              onClick={closeEdit}
              className={clsx('rounded-lg', 'border', 'border-gray-200', 'px-4', 'py-2', 'text-sm', 'font-medium', 'text-gray-600', 'hover:bg-gray-100')}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className={clsx('rounded-lg', 'bg-primary-600', 'px-4', 'py-2', 'text-sm', 'font-semibold', 'text-white', 'hover:bg-primary-700', 'disabled:cursor-not-allowed', 'disabled:bg-primary-300')}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        {selectedReward ? (
          <div className={clsx('grid', 'gap-4', 'text-sm')}>
            <div className={clsx('grid', 'gap-3', 'sm:grid-cols-2')}>
              <div>
                <p className={clsx('text-xs', 'font-medium', 'text-gray-500')}>User</p>
                <p className="text-gray-900">
                  {selectedReward.user?.name || "—"}
                </p>
                <p className={clsx('text-xs', 'text-gray-500', 'break-all')}>
                  {selectedReward.user?.email || ""}
                </p>
              </div>
              <div>
                <p className={clsx('text-xs', 'font-medium', 'text-gray-500')}>Reward</p>
                <p className="text-gray-900">{selectedReward.rewardCode || "—"}</p>
              </div>
            </div>

            <label className={clsx('flex', 'flex-col', 'gap-1', 'text-xs', 'font-medium', 'text-gray-500')}>
              <span>Status</span>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className={clsx('w-full', 'rounded-xl', 'border', 'border-gray-200', 'bg-white', 'px-3', 'py-2', 'text-sm', 'text-gray-900', 'focus:border-primary-500', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-100')}
              >
                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={clsx('flex', 'flex-col', 'gap-1', 'text-xs', 'font-medium', 'text-gray-500')}>
              <span>Source</span>
              <select
                value={editForm.source}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, source: e.target.value }))
                }
                className={clsx('w-full', 'rounded-xl', 'border', 'border-gray-200', 'bg-white', 'px-3', 'py-2', 'text-sm', 'text-gray-900', 'focus:border-primary-500', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-100')}
              >
                {SOURCE_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={clsx('flex', 'flex-col', 'gap-1', 'text-xs', 'font-medium', 'text-gray-500')}>
              <span>Coupon code (optional)</span>
              <input
                type="text"
                value={editForm.couponCode}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, couponCode: e.target.value }))
                }
                placeholder="e.g. QR-L1-XXXX..."
                className={clsx('w-full', 'rounded-xl', 'border', 'border-gray-200', 'px-3', 'py-2', 'text-sm', 'text-gray-900', 'focus:border-primary-500', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-100')}
              />
            </label>

            <div className={clsx('grid', 'gap-3', 'sm:grid-cols-2')}>
              <label className={clsx('flex', 'flex-col', 'gap-1', 'text-xs', 'font-medium', 'text-gray-500')}>
                <span>Expires at</span>
                <input
                  type="datetime-local"
                  value={editForm.expiresAt}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, expiresAt: e.target.value }))
                  }
                  className={clsx('w-full', 'rounded-xl', 'border', 'border-gray-200', 'px-3', 'py-2', 'text-sm', 'text-gray-900', 'focus:border-primary-500', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-100')}
                />
              </label>
              <label className={clsx('flex', 'flex-col', 'gap-1', 'text-xs', 'font-medium', 'text-gray-500')}>
                <span>Claimed at</span>
                <input
                  type="datetime-local"
                  value={editForm.claimedAt}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, claimedAt: e.target.value }))
                  }
                  className={clsx('w-full', 'rounded-xl', 'border', 'border-gray-200', 'px-3', 'py-2', 'text-sm', 'text-gray-900', 'focus:border-primary-500', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-100')}
                />
              </label>
            </div>

            <div className={clsx('grid', 'gap-3', 'sm:grid-cols-2')}>
              <div>
                <p className={clsx('text-xs', 'font-medium', 'text-gray-500')}>Created</p>
                <p className="text-gray-900">{formatDateTime(selectedReward.createdAt)}</p>
              </div>
              <div>
                <p className={clsx('text-xs', 'font-medium', 'text-gray-500')}>Updated</p>
                <p className="text-gray-900">{formatDateTime(selectedReward.updatedAt)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={clsx('text-sm', 'text-gray-500')}>Loading...</div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminUserRewardsPage;
