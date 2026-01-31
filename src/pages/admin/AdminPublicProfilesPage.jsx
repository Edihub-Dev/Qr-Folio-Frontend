import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, RefreshCw, Users } from "lucide-react";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminTable from "../../components/admin/AdminTable";
import { fetchAdminPublicProfiles } from "../../services/adminApi";

const AdminPublicProfilesPage = () => {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAdminPublicProfiles(params);
      setData(response?.data || []);
      setPagination(response?.meta?.pagination || { page: 1, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load public profiles"
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const refresh = useCallback(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSort = (sortBy, sortDir) => {
    setParams((prev) => ({ ...prev, sortBy, sortDir }));
  };

  const handlePageChange = (page) => {
    setParams((prev) => ({ ...prev, page }));
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
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email", sortable: true },
      {
        key: "publicProfile",
        label: "Public profile",
        sortable: false,
        render: (_value, row) => {
          const userId = row?.id || row?._id;
          if (!userId) return "—";
          const href = `/profile/${userId}`;

          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Link2 className="h-3.5 w-3.5" />
              Open
            </a>
          );
        },
      },
    ],
    [params.page, params.limit]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-slate-100 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Public Profiles
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Search users and open their public QRfolio profile.
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
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchBar
            value={params.search}
            onChange={(search) =>
              setParams((prev) => ({ ...prev, page: 1, search }))
            }
            placeholder="Search name, email, phone, or user id"
          />
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{(pagination.totalItems || data.length || 0).toLocaleString()} records</span>
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
            Loading profiles...
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPublicProfilesPage;
