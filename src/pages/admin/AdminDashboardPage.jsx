import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  LineChart,
  RefreshCw,
  IndianRupee,
  Users,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { fetchAdminUsers } from "../../services/adminApi";

const formatCurrency = (value = 0) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatMSTC = (value = 0) => {
  const amount = Number(value) || 0;
  return `${amount.toFixed(2)} MSTC`;
};

const MSTCIcon = ({ className = "" }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full border border-current px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.18em] uppercase ${className}`}
  >
    MSTC
  </span>
);

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  isLoading,
}) => (
  <div className="relative min-h-[168px] overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div
      className={`absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-10 ${accent}`}
    ></div>
    <div className="flex h-full items-center justify-between">
      <div className="w-full max-w-[70%]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          {title}
        </p>
        {isLoading ? (
          <div className="mt-4 space-y-2">
            <div className="h-6 w-32 rounded-md bg-gray-100 animate-pulse" />
            {subtitle && (
              <div className="h-4 w-40 rounded-md bg-gray-100 animate-pulse" />
            )}
          </div>
        ) : (
          <>
            <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </>
        )}
      </div>
      {Icon && (
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent.replace(
            "bg-",
            "bg-opacity-20 "
          )}`}
        >
          <Icon className={`h-6 w-6 ${accent.replace("bg-", "text-")}`} />
        </div>
      )}
    </div>
  </div>
);

const RevenueSparkline = () => (
  <svg viewBox="0 0 400 120" className="h-40 w-full">
    <defs>
      <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0 95 C 60 80, 120 70, 180 75 C 240 80, 300 60, 360 40 L 360 120 L 0 120 Z"
      fill="url(#revenueGradient)"
    />
    <path
      d="M0 95 C 60 80, 120 70, 180 75 C 240 80, 300 60, 360 40"
      stroke="rgb(14 165 233)"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="300" cy="60" r="6" fill="rgb(14 165 233)" />
  </svg>
);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAdminUsers({ limit: 1 });
      setStats(response?.meta?.stats || {});
      setError(null);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load stats"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const conversionRate = useMemo(() => {
    const total = Number(stats.totalUsers || 0);
    const paid = Number(stats.paidUsers || 0);
    if (!total) return "0%";
    return `${Math.round((paid / total) * 100)}%`;
  }, [stats.totalUsers, stats.paidUsers]);

  const combinedRevenue = useMemo(() => {
    const phonepe = Number(stats.phonepeRevenue ?? stats.totalRevenue ?? 0);
    const chainpay = Number(stats.chainpayRevenue ?? 0);
    return phonepe + chainpay;
  }, [stats.phonepeRevenue, stats.totalRevenue, stats.chainpayRevenue]);

  const statCards = useMemo(
    () => [
      {
        title: "Total Phonepe Revenue",
        value: formatCurrency(stats.phonepeRevenue ?? stats.totalRevenue),
        subtitle: "Revenue collected via PhonePe",
        icon: IndianRupee,
        accent: "bg-cyan-500",
      },
      {
        title: "Total ChainPay Revenue",
        value: formatMSTC(stats.chainpayRevenue || 0),
        subtitle: "Revenue collected via ChainPay",
        icon: MSTCIcon,
        accent: "bg-amber-500",
      },
      {
        title: "Active Users",
        value: (stats.totalUsers || 0).toLocaleString(),
        subtitle: "Total accounts in the system",
        icon: Users,
        accent: "bg-emerald-500",
      },
      {
        title: "Paid Subscribers",
        value: (stats.paidUsers || 0).toLocaleString(),
        subtitle: `${conversionRate} conversion rate`,
        icon: ShieldCheck,
        accent: "bg-indigo-500",
      },
      {
        title: "Blocked Accounts",
        value: (stats.blockedUsers || 0).toLocaleString(),
        subtitle: "Accounts currently restricted",
        icon: BarChart3,
        accent: "bg-rose-500",
      },
    ],
    [stats, conversionRate]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-slate-100 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor platform performance and billing insights in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-700"
          >
            <ArrowUpRight className="h-4 w-4" />
            <Link to="/admin/users">View reports</Link>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} isLoading={loading} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="relative min-h-[420px] overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Revenue overview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                {formatCurrency(combinedRevenue || 0)}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Combined invoice revenue from all payment gateways.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
              <LineChart className="h-4 w-4" />
              Recurring revenue trend
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-white to-cyan-50 p-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-cyan-700">
                <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                Recurring
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                One-time
              </span>
              <div className="ml-auto flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-gray-600">
                <button className="rounded-full bg-primary-600 px-2 py-0.5 text-white">
                  Monthly
                </button>
                <button className="px-2 py-0.5">Quarterly</button>
                <button className="px-2 py-0.5">Yearly</button>
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-40 w-full animate-pulse rounded-2xl bg-white/60" />
              ) : (
                <RevenueSparkline />
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Monthly growth
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                +12.4%
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Based on last billing period compared to previous month.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Average invoice value
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {stats.totalUsers
                  ? formatCurrency((combinedRevenue || 0) / stats.totalUsers)
                  : formatCurrency(0)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Revenue divided by total users in the system.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[420px] flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Quick stats
              </p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Platform health
              </h3>
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "Paid conversion",
                value: conversionRate,
                iconBg: "bg-emerald-100 text-emerald-600",
                icon: TrendingUp,
              },
              {
                label: "Blocked ratio",
                value: stats.totalUsers
                  ? `${Math.round(
                      ((stats.blockedUsers || 0) / stats.totalUsers) * 100
                    )}%`
                  : "0%",
                iconBg: "bg-rose-100 text-rose-600",
                icon: ShieldCheck,
              },
              {
                label: "Revenue per user",
                value: stats.totalUsers
                  ? formatCurrency((combinedRevenue || 0) / stats.totalUsers)
                  : formatCurrency(0),
                iconBg: "bg-cyan-100 text-cyan-600",
                icon: IndianRupee,
              },
            ].map(({ label, value, iconBg, icon: Icon }) => (
              <div
                key={label}
                className="flex items-start justify-between rounded-2xl bg-slate-50 p-4"
              >
                <div className="w-full max-w-[70%]">
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  {loading ? (
                    <div className="mt-3 h-6 w-24 animate-pulse rounded-md bg-gray-200" />
                  ) : (
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {value}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {loading && (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading metrics...
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
