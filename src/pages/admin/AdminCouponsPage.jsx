import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tag, RefreshCw, Download } from "lucide-react";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterDropdown from "../../components/admin/AdminFilterDropdown";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminTable from "../../components/admin/AdminTable";
import {
  fetchAdminCoupons,
  generateAdminCoupons,
  downloadCouponsCsv,
} from "../../services/adminApi";

const USED_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "true", label: "Used" },
  { value: "false", label: "Unused" },
];

const AdminCouponsPage = () => {
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    search: "",
    used: "",
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generateForm, setGenerateForm] = useState({
    count: 25,
    prefix: "",
    expiresInDays: "",
  });
  const [generating, setGenerating] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAdminCoupons(params);
      setData(response?.data || []);
      setPagination(response?.meta?.pagination || { page: 1, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load coupons"
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const refresh = useCallback(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleSort = (sortBy, sortDir) => {
    setParams((prev) => ({ ...prev, sortBy, sortDir }));
  };

  const handlePageChange = (page) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleGenerateChange = (field, value) => {
    setGenerateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateCoupons = async () => {
    const count = Number(generateForm.count) || 25;
    if (!Number.isFinite(count) || count <= 0) {
      // basic guard; UI is admin-only so a simple alert is sufficient
      alert("Please enter a valid count greater than 0.");
      return;
    }

    try {
      setGenerating(true);
      const payload = {
        count,
        prefix: generateForm.prefix?.trim() || undefined,
      };

      const days = Number(generateForm.expiresInDays);
      if (Number.isFinite(days) && days > 0) {
        payload.expiresInDays = days;
      }

      await generateAdminCoupons(payload);
      await loadCoupons();
    } catch (err) {
      // keep error handling simple for admin tools
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to generate coupons"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCsvDownload = async () => {
    try {
      setCsvLoading(true);
      const response = await downloadCouponsCsv(params);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        response.headers["content-disposition"]?.match(
          /filename="(.+)"/
        )?.[1] || "coupons.csv"
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
        key: "code",
        label: "Code",
        sortable: true,
      },
      {
        key: "used",
        label: "Status",
        sortable: true,
        render: (value) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              value
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {value ? "Used" : "Unused"}
          </span>
        ),
      },
      {
        key: "usedBy",
        label: "Used By",
        render: (value) => {
          if (!value) return "—";
          const name = value.name || "—";
          const email = value.email || "";
          return (
            <div className="flex flex-col">
              <span className="font-medium text-gray-800 text-sm">{name}</span>
              {email && (
                <span className="text-xs text-gray-500 break-all">{email}</span>
              )}
            </div>
          );
        },
      },
      {
        key: "usedAt",
        label: "Used At",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleString() : "—"),
      },
      {
        key: "expiresAt",
        label: "Expires At",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleString() : "—"),
      },
      {
        key: "createdAt",
        label: "Created At",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleString() : "—"),
      },
    ],
    [params.page, params.limit]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-slate-100 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
            <p className="mt-1 text-sm text-gray-500">
              View generated coupon codes and their usage status.
            </p>
          </div>
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

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <AdminSearchBar
              value={params.search}
              onChange={(search) =>
                setParams((prev) => ({ ...prev, page: 1, search }))
              }
              placeholder="Search by code"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFilterDropdown
              label="Status"
              value={params.used || ""}
              onChange={(used) =>
                setParams((prev) => ({ ...prev, page: 1, used }))
              }
              options={USED_FILTER_OPTIONS}
              placeholder="All statuses"
            />
          </div>
        </div>
      </div>

      {/* <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Generate coupons
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Quickly create new coupon codes for campaigns and internal use.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Count
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={generateForm.count}
                onChange={(e) => handleGenerateChange("count", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Prefix (optional)
              </label>
              <input
                type="text"
                value={generateForm.prefix}
                onChange={(e) => handleGenerateChange("prefix", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Expires in (days)
              </label>
              <input
                type="number"
                min={1}
                value={generateForm.expiresInDays}
                onChange={(e) =>
                  handleGenerateChange("expiresInDays", e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleGenerateCoupons}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {generating ? "Generating..." : "Generate coupons"}
          </button>
        </div>
      </div> */}

      <div className="space-y-4">
        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
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
            Loading coupons...
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCouponsPage;
