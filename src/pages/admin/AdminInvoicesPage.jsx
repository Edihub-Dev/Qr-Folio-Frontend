import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Eye, FileText, Download } from "lucide-react";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterDropdown from "../../components/admin/AdminFilterDropdown";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminTable from "../../components/admin/AdminTable";
import AdminModal from "../../components/admin/AdminModal";
import {
  fetchAdminInvoices,
  downloadInvoicesCsv,
  downloadInvoicePdf,
} from "../../services/adminApi";

const GATEWAY_OPTIONS = [
  { value: "phonepe", label: "PhonePe" },
  { value: "chainpay", label: "ChainPay" },
];

const PLAN_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

const formatCurrency = (amount = 0, currency = "INR") => {
  if (typeof amount !== "number") {
    amount = Number(amount) || 0;
  }
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${currency}`.trim();
  }
};

const InvoiceStats = ({ stats = {} }) => {
  const cards = [
    {
      key: "totalInvoices",
      label: "Total Invoices",
      value: stats.totalInvoices ?? 0,
      icon: FileText,
    },
    {
      key: "totalCollected",
      label: "Total Collected",
      value: stats.totalCollected ?? 0,
      icon: FileText,
      formatter: (value) => formatCurrency(value),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        const rawValue = card.value;
        const display = card.formatter
          ? card.formatter(rawValue)
          : rawValue.toLocaleString();
        return (
          <div
            key={card.key}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {display}
                </p>
              </div>
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-600">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminInvoicesPage = () => {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "date",
    sortDir: "desc",
  });
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAdminInvoices(params);
      setData(response?.data || []);
      setStats(response?.meta?.stats || {});
      setPagination(response?.meta?.pagination || { page: 1, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadInvoices();
    const interval = setInterval(loadInvoices, 60000);
    return () => clearInterval(interval);
  }, [loadInvoices]);

  const columns = useMemo(
    () => [
      {
        key: "invoiceNumber",
        label: "Invoice",
        sortable: true,
        sortKey: "invoiceNumber",
      },
      {
        key: "invoiceDate",
        label: "Date",
        sortable: true,
        sortKey: "date",
        render: (value) =>
          value
            ? new Date(value).toLocaleDateString("en-IN", {
                dateStyle: "medium",
              })
            : "—",
      },
      {
        key: "gateway",
        label: "Method",
        sortable: true,
        sortKey: "gateway",
        render: (value) => (value ? value.toUpperCase() : "—"),
      },
      {
        key: "planName",
        label: "Plan",
        sortable: false,
        render: (value) => value || "—",
      },
      {
        key: "totalAmount",
        label: "Total",
        sortable: true,
        sortKey: "amount",
        render: (value, row) => formatCurrency(value, row.currency),
      },
      {
        key: "transactionId",
        label: "Transaction",
        sortable: false,
        render: (value, row) => value || row.orderId || "—",
      },
      {
        key: "email",
        label: "Email",
        sortable: false,
      },
    ],
    []
  );

  const handleSort = useCallback(
    (columnKey, direction) => {
      const column = columns.find((col) => col.key === columnKey);
      const sortBy = column?.sortKey || columnKey;
      setParams((prev) => ({ ...prev, sortBy, sortDir: direction }));
    },
    [columns]
  );

  const handlePageChange = (page) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const refresh = (event) => {
    if (event) {
      event.stopPropagation();
    }
    loadInvoices();
  };

  const handleCsvDownload = async (withFilters = true) => {
    try {
      setCsvLoading(true);
      const payload = withFilters ? params : {};
      const response = await downloadInvoicesCsv(payload);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        response.headers["content-disposition"]?.match(
          /filename="(.+)"/
        )?.[1] || "invoices.csv"
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to download invoices"
      );
    } finally {
      setCsvLoading(false);
    }
  };

  const openInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleOpenPdf = useCallback(
    async (invoice) => {
      if (!invoice?._id) return;
      try {
        const response = await downloadInvoicePdf(invoice._id);
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener");
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to open invoice PDF"
        );
      }
    },
    [setError]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review generated invoices, filter by payment method, and inspect
            transaction details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              refresh();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => handleCsvDownload(true)}
            disabled={csvLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
          >
            <Download className="h-4 w-4" />
            {csvLoading ? "Downloading..." : "Download filtered"}
          </button>
          <button
            type="button"
            onClick={() => handleCsvDownload(false)}
            disabled={csvLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Download className="h-4 w-4" />
            {csvLoading ? "Preparing..." : "Download all"}
          </button>
        </div>
      </div>

      <InvoiceStats stats={stats} />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AdminSearchBar
            value={params.search}
            onChange={(search) =>
              setParams((prev) => ({ ...prev, page: 1, search }))
            }
            placeholder="Search invoice number, email, or transaction"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminFilterDropdown
              label="Payment method"
              value={params.gateway || ""}
              onChange={(gateway) =>
                setParams((prev) => ({ ...prev, page: 1, gateway }))
              }
              options={GATEWAY_OPTIONS}
              placeholder="All methods"
            />
            <AdminFilterDropdown
              label="Plan"
              value={params.planKey || ""}
              onChange={(planKey) =>
                setParams((prev) => ({ ...prev, page: 1, planKey }))
              }
              options={PLAN_OPTIONS}
              placeholder="All plans"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <AdminTable
        columns={columns}
        data={data}
        sortBy={params.sortBy}
        sortDir={params.sortDir}
        onSort={handleSort}
        renderActions={(invoice) => (
          <button
            type="button"
            onClick={() => openInvoiceModal(invoice)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
        )}
      />

      <AdminPagination
        page={pagination.page || 1}
        totalPages={pagination.totalPages || 1}
        onPageChange={handlePageChange}
      />

      {loading && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading invoices...
        </div>
      )}

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title="Invoice details"
        footer={
          selectedInvoice && (
            <button
              type="button"
              onClick={() => handleOpenPdf(selectedInvoice)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Open PDF
            </button>
          )
        }
      >
        {selectedInvoice && (
          <div className="space-y-6 text-sm text-gray-700">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Invoice
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedInvoice.invoiceNumber}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Date
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedInvoice.invoiceDate
                    ? new Date(selectedInvoice.invoiceDate).toLocaleString(
                        "en-IN"
                      )
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Payment method
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedInvoice.gateway
                    ? selectedInvoice.gateway.toUpperCase()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Total Amount
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatCurrency(
                    selectedInvoice.totalAmount,
                    selectedInvoice.currency
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Transaction ID
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedInvoice.transactionId ||
                    selectedInvoice.orderId ||
                    "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  User Email
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedInvoice.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Plan
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedInvoice.planName || "—"}
                </p>
                <p className="text-xs text-gray-500">
                  Key: {selectedInvoice.planKey || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  User ID
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedInvoice.userId || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Invoice Preview
              </p>
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                {selectedInvoice.invoiceHtml ? (
                  <div
                    className="invoice-preview max-h-[400px] overflow-auto rounded-lg bg-white p-4 shadow-inner"
                    dangerouslySetInnerHTML={{
                      __html: selectedInvoice.invoiceHtml,
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    No invoice HTML stored for this record.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminInvoicesPage;
