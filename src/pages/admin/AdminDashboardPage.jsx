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
import {
  fetchAdminUsers,
  fetchAdminRevenueOverview,
} from "../../services/adminApi";

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

const RevenueSparkline = ({
  periods = [],
  showRecurring = true,
  showOneTime = true,
}) => {
  const width = 400;
  const height = 120;
  const paddingX = 24;
  const paddingY = 16;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const values = [];
  if (showRecurring) {
    values.push(...periods.map((p) => Number(p.recurring || 0)));
  }
  if (showOneTime) {
    values.push(...periods.map((p) => Number(p.oneTime || 0)));
  }
  const maxValue = values.length ? Math.max(...values, 0) : 0;
  const count = periods.length;

  if (!count || maxValue <= 0 || (!showRecurring && !showOneTime)) {
    return (
      <svg viewBox="0 0 400 120" className="h-40 w-full">
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="12"
        >
          No revenue data
        </text>
      </svg>
    );
  }

  const getXPosition = (index) => {
    if (count === 1) {
      return paddingX + innerWidth / 2;
    }
    return paddingX + (innerWidth * index) / (count - 1);
  };

  const getPoints = (key) => {
    if (!count) {
      return "";
    }
    if (count === 1) {
      const value = Number(periods[0][key] || 0);
      const ratio = maxValue ? value / maxValue : 0;
      const x = getXPosition(0);
      const y = paddingY + innerHeight * (1 - ratio);
      return `${x},${y}`;
    }
    return periods
      .map((period, index) => {
        const value = Number(period[key] || 0);
        const ratio = maxValue ? value / maxValue : 0;
        const x = getXPosition(index);
        const y = paddingY + innerHeight * (1 - ratio);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const recurringPoints = showRecurring ? getPoints("recurring") : "";
  const oneTimePoints = showOneTime ? getPoints("oneTime") : "";

  const xAxisY = paddingY + innerHeight;
  const yAxisX = paddingX;

  const yTicks = (() => {
    const ticks = [];
    const steps = 4;
    if (!maxValue) return ticks;

    const formatter = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 1,
      notation: "compact",
    });

    for (let i = 0; i <= steps; i += 1) {
      const ratio = i / steps;
      const y = paddingY + innerHeight * ratio;
      const value = maxValue * (1 - ratio);
      ticks.push({
        y,
        label: formatter.format(value),
      });
    }

    return ticks;
  })();

  return (
    <svg viewBox="0 0 400 120" className="h-40 w-full">
      <line
        x1={yAxisX}
        y1={paddingY}
        x2={yAxisX}
        y2={xAxisY}
        stroke="#e5e7eb"
        strokeWidth="1"
      />
      <line
        x1={yAxisX}
        y1={xAxisY}
        x2={paddingX + innerWidth}
        y2={xAxisY}
        stroke="#e5e7eb"
        strokeWidth="1"
      />

      {yTicks.map((tick, index) => (
        <g key={`y-${index}`}>
          <line
            x1={yAxisX}
            y1={tick.y}
            x2={paddingX + innerWidth}
            y2={tick.y}
            stroke="#f1f5f9"
            strokeWidth="0.5"
          />
          <text
            x={yAxisX - 6}
            y={tick.y + 3}
            textAnchor="end"
            fill="#9ca3af"
            fontSize="8"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {periods.map((period, index) => {
        const x = getXPosition(index);
        return (
          <g key={period.period || period.label || index}>
            <line
              x1={x}
              y1={paddingY}
              x2={x}
              y2={xAxisY}
              stroke="#f1f5f9"
              strokeWidth="0.5"
            />
            <text
              x={x}
              y={xAxisY + 10}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize="8"
            >
              {(period.label || period.period || "").toString()}
            </text>
          </g>
        );
      })}

      {showRecurring && recurringPoints && (
        <polyline
          points={recurringPoints}
          fill="none"
          stroke="rgb(14 165 233)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {showOneTime && oneTimePoints && (
        <polyline
          points={oneTimePoints}
          fill="none"
          stroke="rgb(148 163 184)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueOverview, setRevenueOverview] = useState(null);
  const [revenueGranularity, setRevenueGranularity] = useState("monthly");
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState(null);
  const [showRecurring, setShowRecurring] = useState(true);
  const [showOneTime, setShowOneTime] = useState(true);

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

  const loadRevenueOverview = useCallback(async () => {
    try {
      setRevenueLoading(true);
      const response = await fetchAdminRevenueOverview({
        granularity: revenueGranularity,
      });
      setRevenueOverview(response?.data || null);
      setRevenueError(null);
    } catch (err) {
      setRevenueError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load revenue overview"
      );
    } finally {
      setRevenueLoading(false);
    }
  }, [revenueGranularity]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  useEffect(() => {
    loadRevenueOverview();
  }, [loadRevenueOverview]);

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

  const visiblePeriods = useMemo(() => {
    const periods = revenueOverview?.periods || [];
    if (!Array.isArray(periods) || periods.length === 0) {
      return [];
    }

    let maxPoints;
    if (revenueGranularity === "yearly") {
      maxPoints = 5;
    } else if (revenueGranularity === "quarterly") {
      maxPoints = 6;
    } else {
      maxPoints = 6;
    }

    if (periods.length <= maxPoints) {
      return periods;
    }

    return periods.slice(periods.length - maxPoints);
  }, [revenueOverview, revenueGranularity]);

  const { revenueGrowth, revenueTrendDescription } = useMemo(() => {
    const periods = revenueOverview?.periods || [];
    if (!Array.isArray(periods) || periods.length === 0) {
      return {
        revenueGrowth: "+0.0%",
        revenueTrendDescription:
          "Waiting for enough billing data to detect a revenue trend.",
      };
    }

    let windowSize;
    let windowUnit;
    if (revenueGranularity === "yearly") {
      windowSize = 2;
      windowUnit = "years";
    } else if (revenueGranularity === "quarterly") {
      windowSize = 2;
      windowUnit = "quarters";
    } else {
      windowSize = 3;
      windowUnit = "months";
    }

    const count = periods.length;
    const hasWindowComparison = count >= windowSize * 2;

    let latestTotal;
    let previousTotal;
    let comparisonLabel;

    if (hasWindowComparison) {
      const latestSlice = periods.slice(count - windowSize, count);
      const prevSlice = periods.slice(
        count - windowSize * 2,
        count - windowSize
      );
      latestTotal = latestSlice.reduce(
        (sum, period) => sum + Number(period.total || 0),
        0
      );
      previousTotal = prevSlice.reduce(
        (sum, period) => sum + Number(period.total || 0),
        0
      );
      comparisonLabel = `last ${windowSize} ${windowUnit} vs previous ${windowSize} ${windowUnit}`;
    } else if (count >= 2) {
      latestTotal = Number(periods[count - 1]?.total || 0);
      previousTotal = Number(periods[count - 2]?.total || 0);
      comparisonLabel = "latest period vs previous period";
    } else {
      latestTotal = Number(periods[0]?.total || 0);
      previousTotal = 0;
      comparisonLabel = "latest period (no previous data)";
    }

    let growthLabel = "+0.0%";
    let trendDescription = "Trend appears stable based on available data.";

    if (!previousTotal || previousTotal <= 0) {
      if (!latestTotal || latestTotal <= 0) {
        growthLabel = "+0.0%";
        trendDescription = "No recent revenue activity detected yet.";
      } else {
        growthLabel = "+100.0%";
        trendDescription = `Strong upward trend (${comparisonLabel}).`;
      }
    } else {
      const change = ((latestTotal - previousTotal) / previousTotal) * 100;
      const rounded = Math.round(change * 10) / 10;
      const sign = rounded > 0 ? "+" : "";
      growthLabel = `${sign}${rounded.toFixed(1)}%`;

      if (rounded > 2) {
        trendDescription = `Upward trend (${comparisonLabel}).`;
      } else if (rounded < -2) {
        trendDescription = `Downward trend (${comparisonLabel}).`;
      } else {
        trendDescription = `Stable trend (${comparisonLabel}).`;
      }
    }

    return {
      revenueGrowth: growthLabel,
      revenueTrendDescription: trendDescription,
    };
  }, [revenueOverview, revenueGranularity]);

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
            onClick={() => {
              loadStats();
              loadRevenueOverview();
            }}
            disabled={loading || revenueLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading || revenueLoading ? "animate-spin" : ""
              }`}
            />
            {loading || revenueLoading ? "Refreshing..." : "Refresh"}
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
              <button
                type="button"
                onClick={() => setShowRecurring((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  showRecurring
                    ? "bg-cyan-100 text-cyan-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    showRecurring ? "bg-cyan-500" : "bg-gray-300"
                  }`}
                ></span>
                Recurring
              </button>
              <button
                type="button"
                onClick={() => setShowOneTime((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  showOneTime
                    ? "bg-gray-100 text-gray-600"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    showOneTime ? "bg-gray-400" : "bg-gray-300"
                  }`}
                ></span>
                One-time
              </button>
              <div className="ml-auto flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-gray-600">
                <button
                  type="button"
                  onClick={() => setRevenueGranularity("monthly")}
                  className={`rounded-full px-2 py-0.5 ${
                    revenueGranularity === "monthly"
                      ? "bg-primary-600 text-white"
                      : ""
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueGranularity("quarterly")}
                  className={`px-2 py-0.5 ${
                    revenueGranularity === "quarterly"
                      ? "rounded-full bg-primary-600 text-white"
                      : ""
                  }`}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueGranularity("yearly")}
                  className={`px-2 py-0.5 ${
                    revenueGranularity === "yearly"
                      ? "rounded-full bg-primary-600 text-white"
                      : ""
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
            {revenueError && (
              <p className="mt-3 text-xs text-red-500">{revenueError}</p>
            )}
            <div className="mt-4">
              {revenueLoading ? (
                <div className="h-40 w-full animate-pulse rounded-2xl bg-white/60" />
              ) : (
                <RevenueSparkline
                  periods={visiblePeriods}
                  showRecurring={showRecurring}
                  showOneTime={showOneTime}
                />
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Monthly growth
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {revenueLoading ? "+0.0%" : revenueGrowth}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {revenueLoading
                  ? "Waiting for revenue data..."
                  : revenueTrendDescription}
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
