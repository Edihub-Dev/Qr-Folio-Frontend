import React, { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Plus, RefreshCw, Users } from "lucide-react";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminTable from "../../components/admin/AdminTable";
import AdminModal from "../../components/admin/AdminModal";
import PermissionWrapper from "../../components/subAdmin/PermissionWrapper";
import { PERMISSIONS } from "../../config/permissions";
import { fetchAdminSubadmins, createAdminSubadmin } from "../../services/adminApi";

const AdminSubadminsPage = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: "" });
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminSubadmins(params);
      setData(res?.data || []);
      setPagination(res?.meta?.pagination || { page: 1, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load subadmins");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(
    () => [
      {
        key: "serialNo",
        label: "Sr. No.",
        sortable: false,
        render: (_v, _row, idx) => (params.page - 1) * params.limit + idx + 1,
      },
      { key: "name", label: "Name", sortable: false },
      { key: "email", label: "Email", sortable: false },
      {
        key: "isBlocked",
        label: "Status",
        sortable: false,
        render: (v) => (
          <span
            className={clsx(
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
              v ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            )}
          >
            {v ? "Blocked" : "Active"}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Created",
        sortable: false,
        render: (v) => (v ? new Date(v).toLocaleString() : "—"),
      },
    ],
    [params.page, params.limit]
  );

  const handleCreate = async () => {
    try {
      setSaving(true);
      const res = await createAdminSubadmin(form);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to create subadmin");
      }
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "" });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create subadmin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Subadmins</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage subadmin accounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <PermissionWrapper permission={PERMISSIONS.ADMIN_CREATE}>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create subadmin
            </button>
          </PermissionWrapper>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <AdminSearchBar
          value={params.search}
          onChange={(search) => setParams((p) => ({ ...p, page: 1, search }))}
          placeholder="Search name or email"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <AdminTable columns={columns} data={data} />

      <AdminPagination
        page={pagination.page || 1}
        totalPages={pagination.totalPages || 1}
        onPageChange={(page) => setParams((p) => ({ ...p, page }))}
      />

      {loading && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading subadmins...
        </div>
      )}

      <AdminModal
        open={createOpen}
        title="Create subadmin"
        onClose={() => {
          if (!saving) setCreateOpen(false);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 text-sm">
          <label className="grid gap-2">
            <span className="text-xs font-medium text-gray-500">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-gray-200 px-4 py-2"
              placeholder="Subadmin name"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-medium text-gray-500">Email</span>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-xl border border-gray-200 px-4 py-2"
              placeholder="subadmin@example.com"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-medium text-gray-500">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="rounded-xl border border-gray-200 px-4 py-2"
              placeholder="Set a strong password"
            />
          </label>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminSubadminsPage;
