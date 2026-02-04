import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
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

const formatCount = (value = 0) => {
  const count = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(count);
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
  <div className={clsx('relative', 'min-h-[168px]', 'overflow-hidden', 'rounded-3xl', 'border', 'border-gray-200', 'bg-white', 'p-5', 'shadow-sm', 'transition', 'hover:shadow-md')}>
    <div
      className={`absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-10 ${accent}`}
    ></div>
    <div className={clsx('flex', 'h-full', 'items-center', 'justify-between')}>
      <div className={clsx('w-full', 'max-w-[70%]')}>
        <p className={clsx('text-xs', 'font-semibold', 'uppercase', 'tracking-[0.2em]', 'text-gray-400')}>
          {title}
        </p>
        {isLoading ? (
          <div className={clsx('mt-4', 'space-y-2')}>
            <div className={clsx('h-6', 'w-32', 'rounded-md', 'bg-gray-100', 'animate-pulse')} />
            {subtitle && (
              <div className={clsx('h-4', 'w-40', 'rounded-md', 'bg-gray-100', 'animate-pulse')} />
            )}
          </div>
        ) : (
          <>
            <p className={clsx('mt-3', 'text-2xl', 'font-semibold', 'text-gray-900')}>{value}</p>
            {subtitle && (
              <p className={clsx('mt-1', 'text-sm', 'text-gray-500')}>{subtitle}</p>
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

const RevenueAnalyticsBoard = ({
  periods = [],
  showRecurring = true,
  showOneTime = true,
  currencyLabel = "INR",
  showRevenueSeries = true,
}) => {
  const width = 720;
  const height = 240;
  const paddingLeft = 56;
  const paddingRight = 52;
  const paddingTop = 18;
  const paddingBottom = 52;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const count = Array.isArray(periods) ? periods.length : 0;

  const barValues = useMemo(() => {
    if (!Array.isArray(periods) || !showRevenueSeries) return [];
    return periods.map((p) => {
      const recurring = showRecurring ? Number(p?.recurring || 0) : 0;
      const oneTime = showOneTime ? Number(p?.oneTime || 0) : 0;
      const total = recurring + oneTime;
      return Number.isFinite(total) ? total : 0;
    });
  }, [periods, showRecurring, showOneTime, showRevenueSeries]);

  const lineValues = useMemo(() => {
    if (!Array.isArray(periods)) return [];
    return periods.map((p) => {
      const users = Number(p?.uniqueUsers || 0);
      return Number.isFinite(users) ? users : 0;
    });
  }, [periods]);

  const maxBarValue = barValues.length ? Math.max(...barValues, 0) : 0;
  const maxLineValue = lineValues.length ? Math.max(...lineValues, 0) : 0;

  if (!count || (showRevenueSeries && !showRecurring && !showOneTime)) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={clsx('h-56', 'w-full')}>
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="12"
        >
          No data
        </text>
      </svg>
    );
  }

  const barMax = maxBarValue > 0 ? maxBarValue : 1;
  const lineMax = maxLineValue > 0 ? maxLineValue : 1;

  const yLeft = (value) => {
    const ratio = Math.min(Math.max(value / barMax, 0), 1);
    return paddingTop + innerHeight * (1 - ratio);
  };

  const yRight = (value) => {
    const ratio = Math.min(Math.max(value / lineMax, 0), 1);
    return paddingTop + innerHeight * (1 - ratio);
  };

  const getBarSlot = (index) => {
    const slotWidth = innerWidth / Math.max(count, 1);
    const x = paddingLeft + slotWidth * index;
    return { x, slotWidth };
  };

  const formatterCompact = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    notation: "compact",
  });

  const leftTicks = (() => {
    if (!showRevenueSeries) return [];
    const ticks = [];
    const steps = 4;
    for (let i = 0; i <= steps; i += 1) {
      const ratio = i / steps;
      const value = barMax * (1 - ratio);
      ticks.push({
        y: paddingTop + innerHeight * ratio,
        label: formatterCompact.format(value),
      });
    }
    return ticks;
  })();

  const rightTicks = (() => {
    const ticks = [];
    const steps = 4;
    for (let i = 0; i <= steps; i += 1) {
      const ratio = i / steps;
      const value = lineMax * (1 - ratio);
      ticks.push({
        y: paddingTop + innerHeight * ratio,
        label: formatterCompact.format(value),
      });
    }
    return ticks;
  })();

  const linePoints = lineValues
    .map((value, index) => {
      const { x, slotWidth } = getBarSlot(index);
      const cx = x + slotWidth / 2;
      const cy = yRight(value);
      return { cx, cy };
    })
    .filter(Boolean);

  const linePointsString = linePoints.map((p) => `${p.cx},${p.cy}`).join(" ");
  const xAxisY = paddingTop + innerHeight;

  const xLabelStep = (() => {
    if (!count) return 1;
    const desiredLabels = 12;
    return Math.max(1, Math.ceil(count / desiredLabels));
  })();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={clsx('h-56', 'w-full')}>
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
      {(showRevenueSeries ? leftTicks : rightTicks).map((tick, index) => (
        <g key={`grid-${index}`}>
          <line
            x1={paddingLeft}
            y1={tick.y}
            x2={paddingLeft + innerWidth}
            y2={tick.y}
            stroke="#e5e7eb"
            strokeWidth="1"
            opacity="0.6"
          />
        </g>
      ))}

      {showRevenueSeries ? (
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={xAxisY}
          stroke="#cbd5e1"
          strokeWidth="1"
        />
      ) : null}
      <line
        x1={paddingLeft + innerWidth}
        y1={paddingTop}
        x2={paddingLeft + innerWidth}
        y2={xAxisY}
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      <line
        x1={paddingLeft}
        y1={xAxisY}
        x2={paddingLeft + innerWidth}
        y2={xAxisY}
        stroke="#cbd5e1"
        strokeWidth="1"
      />

      {showRevenueSeries
        ? leftTicks.map((tick, index) => (
            <text
              key={`left-${index}`}
              x={paddingLeft - 10}
              y={tick.y + 4}
              textAnchor="end"
              fill="#64748b"
              fontSize="10"
            >
              {tick.label}
            </text>
          ))
        : null}

      {rightTicks.map((tick, index) => (
        <text
          key={`right-${index}`}
          x={paddingLeft + innerWidth + 10}
          y={tick.y + 4}
          textAnchor="start"
          fill="#64748b"
          fontSize="10"
        >
          {tick.label}
        </text>
      ))}

      {showRevenueSeries
        ? barValues.map((value, index) => {
            const { x, slotWidth } = getBarSlot(index);
            const barWidth = Math.max(12, slotWidth * 0.62);
            const cx = x + slotWidth / 2;
            const left = cx - barWidth / 2;
            const top = yLeft(value);
            const barHeight = xAxisY - top;
            return (
              <rect
                key={`bar-${index}`}
                x={left}
                y={top}
                width={barWidth}
                height={barHeight}
                rx="0"
                fill="#3b82f6"
                opacity="0.85"
              />
            );
          })
        : null}

      {linePointsString ? (
        <polyline
          points={linePointsString}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {linePoints.map((point, index) => (
        <circle
          key={`dot-${index}`}
          cx={point.cx}
          cy={point.cy}
          r="5"
          fill="#ffffff"
          stroke="#10b981"
          strokeWidth="3"
        />
      ))}

      {periods.map((period, index) => {
        const { x, slotWidth } = getBarSlot(index);
        const cx = x + slotWidth / 2;
        const label = (period?.label || period?.period || "").toString();
        if (!label) return null;

        const shouldShow =
          index === 0 ||
          index === count - 1 ||
          index % xLabelStep === 0;

        if (!shouldShow) return null;
        return (
          <text
            key={`x-${index}`}
            x={cx}
            y={xAxisY + 18}
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
          >
            {label}
          </text>
        );
      })}

      {showRevenueSeries ? (
        <text
          x={paddingLeft}
          y={paddingTop - 6}
          textAnchor="start"
          fill="#64748b"
          fontSize="10"
        >
          Revenue ({currencyLabel})
        </text>
      ) : null}
      <text
        x={paddingLeft + innerWidth}
        y={paddingTop - 6}
        textAnchor="end"
        fill="#64748b"
        fontSize="10"
      >
        Users
      </text>

      <g transform={`translate(${paddingLeft + 8}, ${height - 16})`}>
        {showRevenueSeries ? (
          <>
            <circle cx="0" cy="0" r="5" fill="#3b82f6" />
            <text x="10" y="4" fill="#334155" fontSize="10">
              Revenue
            </text>
          </>
        ) : null}
        <circle cx={showRevenueSeries ? 76 : 0} cy="0" r="5" fill="#10b981" />
        <text x={showRevenueSeries ? 86 : 10} y="4" fill="#334155" fontSize="10">
          Users
        </text>
      </g>
    </svg>
  );
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueOverview, setRevenueOverview] = useState(null);
  const [revenueGranularity, setRevenueGranularity] = useState("monthly");
  const [revenueGateway, setRevenueGateway] = useState("chainpay");
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState(null);
  const [showRecurring, setShowRecurring] = useState(true);
  const [showOneTime, setShowOneTime] = useState(true);
  const [revenueWindowMonths, setRevenueWindowMonths] = useState(3);
  const [revenueWindowQuarters, setRevenueWindowQuarters] = useState(12);
  const [revenueWindowYears, setRevenueWindowYears] = useState(1);

  const isOtherGateway = revenueGateway === "other";

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
      const requestGranularity =
        revenueGranularity === "monthly"
          ? "daily"
          : revenueGranularity === "yearly"
            ? "yearly"
            : "monthly";

      const windowParams =
        revenueGranularity === "yearly"
          ? { years: revenueWindowYears }
          : revenueGranularity === "quarterly"
            ? { months: revenueWindowQuarters }
            : { months: revenueWindowMonths };

      const response = await fetchAdminRevenueOverview({
        granularity: requestGranularity,
        rangeMode: "rolling",
        labelMode: requestGranularity === "monthly" ? "compact" : "",
        ...windowParams,
      });
      const payload = response?.data || null;
      const meta = response?.meta || null;
      setRevenueOverview(payload ? { ...payload, _meta: meta } : null);
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
  }, [revenueGranularity, revenueWindowMonths, revenueWindowQuarters, revenueWindowYears]);

  const rangeLengthOptions = useMemo(() => {
    if (revenueGranularity === "yearly") {
      return [
        { value: 1, label: "Last 1 year" },
        { value: 2, label: "Last 2 years" },
        { value: 3, label: "Last 3 years" },
        { value: 5, label: "Last 5 years" },
      ];
    }
    if (revenueGranularity === "quarterly") {
      return [{ value: 12, label: "Last 12 months" }];
    }
    return [
      { value: 1, label: "Last 1 month" },
      { value: 3, label: "Last 3 months" },
      { value: 6, label: "Last 6 months" },
      { value: 12, label: "Last 12 months" },
    ];
  }, [revenueGranularity]);

  const selectedRangeLength = useMemo(() => {
    if (revenueGranularity === "yearly") return revenueWindowYears;
    if (revenueGranularity === "quarterly") return revenueWindowQuarters;
    return revenueWindowMonths;
  }, [revenueGranularity, revenueWindowMonths, revenueWindowQuarters, revenueWindowYears]);

  const handleRangeLengthChange = useCallback(
    (nextValue) => {
      if (revenueGranularity === "yearly") {
        setRevenueWindowYears(nextValue);
        return;
      }
      if (revenueGranularity === "quarterly") {
        setRevenueWindowQuarters(nextValue);
        return;
      }
      setRevenueWindowMonths(nextValue);
    },
    [revenueGranularity],
  );

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

  const phonepeRangeSummary = useMemo(() => {
    return revenueOverview?.gateways?.phonepe?.summary || null;
  }, [revenueOverview]);

  const chainpayRangeSummary = useMemo(() => {
    return revenueOverview?.gateways?.chainpay?.summary || null;
  }, [revenueOverview]);

  const otherRangeSummary = useMemo(() => {
    return revenueOverview?.gateways?.other?.summary || null;
  }, [revenueOverview]);

  const selectedRangeLabel = useMemo(() => {
    const start = revenueOverview?._meta?.range?.startDate;
    const end = revenueOverview?._meta?.range?.endDate;
    if (!start || !end) {
      return "";
    }
    const startLabel = new Date(start).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const endLabel = new Date(end).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${startLabel} - ${endLabel}`;
  }, [revenueOverview]);

  const activeRevenueOverview = useMemo(() => {
    const gateways = revenueOverview?.gateways || {};
    if (revenueGateway === "chainpay") {
      return gateways.chainpay || null;
    }
    if (revenueGateway === "other") {
      return gateways.other || null;
    }
    return gateways.phonepe || null;
  }, [revenueOverview, revenueGateway]);

  const visiblePeriods = useMemo(() => {
    const periods = activeRevenueOverview?.periods || revenueOverview?.periods || [];
    if (!Array.isArray(periods) || periods.length === 0) {
      return [];
    }

    return periods;
  }, [activeRevenueOverview, revenueOverview, revenueGranularity]);

  const { revenueGrowth, revenueTrendDescription } = useMemo(() => {
    const periods = activeRevenueOverview?.periods || revenueOverview?.periods || [];
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
      windowSize = 1;
      windowUnit = "years";
    } else if (revenueGranularity === "quarterly") {
      windowSize = 3;
      windowUnit = "months";
    } else {
      windowSize = 7;
      windowUnit = "days";
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
  }, [activeRevenueOverview, revenueOverview, revenueGranularity]);

  const statCards = useMemo(
    () => [
      {
        title: "Lifetime PhonePe Revenue",
        value: formatCurrency(stats.phonepeRevenue ?? stats.totalRevenue),
        subtitle: "Revenue collected via PhonePe (lifetime)",
        icon: IndianRupee,
        accent: "bg-cyan-500",
      },
      {
        title: "Lifetime ChainPay Revenue",
        value: formatMSTC(stats.chainpayRevenue || 0),
        subtitle: "Revenue collected via ChainPay (lifetime)",
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
        title: "PhonePe Users",
        value: formatCount(stats.gatewayUserCounts?.phonepe || 0),
        subtitle: "Users who joined via PhonePe",
        icon: Users,
        accent: "bg-sky-500",
      },
      {
        title: "ChainPay Users",
        value: formatCount(stats.gatewayUserCounts?.chainpay || 0),
        subtitle: "Users who joined via ChainPay",
        icon: Users,
        accent: "bg-orange-500",
      },
      {
        title: "Other Users",
        value: formatCount(stats.gatewayUserCounts?.other || 0),
        subtitle: "Freemium / manual / ₹0 / other gateways",
        icon: Users,
        accent: "bg-slate-500",
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
      <div className={clsx('flex', 'flex-col', 'gap-4', 'rounded-3xl', 'border', 'border-gray-200', 'bg-gradient-to-br', 'from-white', 'via-white', 'to-slate-100', 'p-6', 'shadow-sm', 'sm:flex-row', 'sm:items-center', 'sm:justify-between')}>
        <div>
          <h1 className={clsx('text-3xl', 'font-semibold', 'text-gray-900')}>Dashboard</h1>
          <p className={clsx('mt-2', 'text-sm', 'text-gray-500')}>
            Monitor platform performance and billing insights in real time.
          </p>
        </div>
        <div className={clsx('flex', 'flex-wrap', 'items-center', 'gap-3')}>
          <button
            type="button"
            onClick={() => {
              loadStats();
              loadRevenueOverview();
            }}
            disabled={loading || revenueLoading}
            className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-2xl', 'border', 'border-gray-200', 'px-4', 'py-2', 'text-sm', 'font-medium', 'text-gray-600', 'transition', 'hover:bg-gray-100', 'disabled:cursor-not-allowed', 'disabled:opacity-70')}
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
            className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-2xl', 'bg-primary-600', 'px-5', 'py-2', 'text-sm', 'font-semibold', 'text-white', 'shadow-lg', 'shadow-primary-500/30', 'transition', 'hover:bg-primary-700')}
          >
            <ArrowUpRight className={clsx('h-4', 'w-4')} />
            <Link to="/admin/users">View reports</Link>
          </button>
        </div>
      </div>

      {error && (
        <div className={clsx('flex', 'items-center', 'gap-3', 'rounded-2xl', 'border', 'border-red-200', 'bg-red-50', 'p-4', 'text-sm', 'text-red-600')}>
          <AlertCircle className={clsx('h-4', 'w-4')} />
          <span>{error}</span>
        </div>
      )}

      <div className={clsx('grid', 'gap-4', 'sm:grid-cols-2', 'xl:grid-cols-4')}>
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} isLoading={loading} />
        ))}
      </div>

      <div className={clsx('grid', 'gap-6', 'lg:grid-cols-3')}>
        <section className={clsx('relative', 'min-h-[420px]', 'overflow-hidden', 'rounded-3xl', 'border', 'border-gray-200', 'bg-white', 'p-6', 'shadow-sm', 'lg:col-span-2')}>
          <div className={clsx('flex', 'flex-wrap', 'items-center', 'justify-between', 'gap-3')}>
            <div>
              <p className={clsx('text-xs', 'font-semibold', 'uppercase', 'tracking-[0.2em]', 'text-gray-400')}>
                Revenue overview
              </p>
              {selectedRangeLabel ? (
                <p className={clsx('mt-2', 'text-xs', 'font-medium', 'text-slate-500')}>
                  {revenueGranularity ? `${revenueGranularity} range:` : "Selected range:"}{" "}
                  {selectedRangeLabel}
                </p>
              ) : null}
              {isOtherGateway ? (
                <div className={clsx('mt-2')}>
                  <p className={clsx('text-[11px]', 'font-semibold', 'uppercase', 'tracking-[0.18em]', 'text-slate-400')}>
                    Other users (selected range)
                  </p>
                  <h2 className={clsx('mt-1', 'text-2xl', 'font-semibold', 'text-gray-900')}>
                    {formatCount(revenueOverview?.userCounts?.other ?? otherRangeSummary?.uniqueUsers ?? 0)}
                  </h2>
                  <p className={clsx('mt-2', 'text-sm', 'text-gray-500')}>
                    User activity analytics for the selected period.
                  </p>
                </div>
              ) : (
                <>
                  <div className={clsx('mt-2', 'grid', 'gap-2', 'sm:grid-cols-2')}>
                    <div>
                      <p className={clsx('text-[11px]', 'font-semibold', 'uppercase', 'tracking-[0.18em]', 'text-slate-400')}>
                        PhonePe (selected range)
                      </p>
                      <h2 className={clsx('mt-1', 'text-2xl', 'font-semibold', 'text-gray-900')}>
                        {formatCurrency(phonepeRangeSummary?.total || 0)}
                      </h2>
                    </div>
                    <div>
                      <p className={clsx('text-[11px]', 'font-semibold', 'uppercase', 'tracking-[0.18em]', 'text-slate-400')}>
                        ChainPay (selected range)
                      </p>
                      <h2 className={clsx('mt-1', 'text-2xl', 'font-semibold', 'text-gray-900')}>
                        {formatMSTC(chainpayRangeSummary?.total || 0)}
                      </h2>
                    </div>
                    <div>
                      <p className={clsx('text-[11px]', 'font-semibold', 'uppercase', 'tracking-[0.18em]', 'text-slate-400')}>
                        Other (selected range)
                      </p>
                      <h2 className={clsx('mt-1', 'text-2xl', 'font-semibold', 'text-gray-900')}>
                        {formatCurrency(otherRangeSummary?.total || 0)}
                      </h2>
                    </div>
                  </div>
                  <p className={clsx('mt-2', 'text-sm', 'text-gray-500')}>
                    Gateway-wise invoice analytics for the selected period.
                  </p>
                </>
              )}
            </div>
            <div className={clsx('flex', 'items-center', 'gap-2', 'rounded-full', 'bg-cyan-50', 'px-3', 'py-1', 'text-xs', 'font-medium', 'text-cyan-700')}>
              <LineChart className={clsx('h-4', 'w-4')} />
              {revenueGateway === "chainpay"
                ? "ChainPay revenue trend"
                : revenueGateway === "other"
                  ? "Other users trend"
                  : "PhonePe revenue trend"}
            </div>
          </div>

          <div className={clsx('mt-6', 'rounded-2xl', 'border', 'border-dashed', 'border-gray-200', 'bg-gradient-to-b', 'from-white', 'to-cyan-50', 'p-4')}>
            <div className={clsx('flex', 'flex-wrap', 'items-center', 'gap-3', 'text-xs', 'font-medium', 'text-gray-500')}>
              <div className={clsx('inline-flex', 'items-center', 'gap-1', 'rounded-full', 'border', 'border-gray-200', 'bg-white', 'px-2', 'py-1')}>
                <button
                  type="button"
                  onClick={() => setRevenueGateway("phonepe")}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    revenueGateway === "phonepe"
                      ? "bg-primary-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  PhonePe
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueGateway("chainpay")}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    revenueGateway === "chainpay"
                      ? "bg-primary-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  ChainPay
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueGateway("other")}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    revenueGateway === "other"
                      ? "bg-primary-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  Other
                </button>
              </div>
              {!isOtherGateway ? (
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
              ) : null}
              {!isOtherGateway ? (
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
              ) : null}
              <div className={clsx('ml-auto', 'flex', 'items-center', 'gap-2', 'rounded-full', 'border', 'border-gray-200', 'px-3', 'py-1', 'text-gray-600')}>
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

                <div className={clsx('h-5', 'w-px', 'bg-gray-200')} />

                <label className={clsx('sr-only')} htmlFor="revenue-range-length">
                  Range length
                </label>
                <select
                  id="revenue-range-length"
                  value={selectedRangeLength}
                  onChange={(e) => handleRangeLengthChange(Number(e.target.value) || 1)}
                  className={clsx(
                    'rounded-full',
                    'border',
                    'border-gray-200',
                    'bg-white',
                    'px-2',
                    'py-0.5',
                    'text-xs',
                    'font-semibold',
                    'text-gray-600',
                    'outline-none',
                  )}
                >
                  {rangeLengthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {revenueError && (
              <p className={clsx('mt-3', 'text-xs', 'text-red-500')}>{revenueError}</p>
            )}
            <div className="mt-4">
              {revenueLoading ? (
                <div className={clsx('h-40', 'w-full', 'animate-pulse', 'rounded-2xl', 'bg-white/60')} />
              ) : (
                <RevenueAnalyticsBoard
                  periods={visiblePeriods}
                  showRecurring={showRecurring}
                  showOneTime={showOneTime}
                  currencyLabel={revenueGateway === "chainpay" ? "MSTC" : "INR"}
                  showRevenueSeries={revenueGateway !== "other"}
                />
              )}
            </div>
          </div>

          {!isOtherGateway ? (
            <div className={clsx('mt-6', 'grid', 'gap-4', 'sm:grid-cols-2', 'lg:grid-cols-3')}>
              <div className={clsx('rounded-2xl', 'bg-slate-50', 'p-4')}>
                <p className={clsx('text-xs', 'font-semibold', 'uppercase', 'tracking-widest', 'text-slate-400')}>
                  Monthly growth
                </p>
                <p className={clsx('mt-2', 'text-lg', 'font-semibold', 'text-slate-900')}>
                  {revenueLoading ? "+0.0%" : revenueGrowth}
                </p>
                <p className={clsx('mt-1', 'text-sm', 'text-slate-500')}>
                  {revenueLoading
                    ? "Waiting for revenue data..."
                    : revenueTrendDescription}
                </p>
              </div>
              <div className={clsx('rounded-2xl', 'bg-slate-50', 'p-4')}>
                <p className={clsx('text-xs', 'font-semibold', 'uppercase', 'tracking-widest', 'text-slate-400')}>
                  PhonePe avg invoice
                </p>
                <p className={clsx('mt-2', 'text-lg', 'font-semibold', 'text-slate-900')}>
                  {formatCurrency(phonepeRangeSummary?.avgInvoiceValue || 0)}
                </p>
                <p className={clsx('mt-1', 'text-sm', 'text-slate-500')}>
                  Average invoice value for PhonePe in the selected period.
                </p>
              </div>
              <div className={clsx('rounded-2xl', 'bg-slate-50', 'p-4')}>
                <p className={clsx('text-xs', 'font-semibold', 'uppercase', 'tracking-widest', 'text-slate-400')}>
                  ChainPay avg invoice
                </p>
                <p className={clsx('mt-2', 'text-lg', 'font-semibold', 'text-slate-900')}>
                  {formatMSTC(chainpayRangeSummary?.avgInvoiceValue || 0)}
                </p>
                <p className={clsx('mt-1', 'text-sm', 'text-slate-500')}>
                  Average invoice value for ChainPay in the selected period.
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <section className={clsx('flex', 'min-h-[420px]', 'flex-col', 'gap-4', 'rounded-3xl', 'border', 'border-gray-200', 'bg-white', 'p-6', 'shadow-sm')}>
          <div className={clsx('flex', 'items-center', 'justify-between')}>
            <div>
              <p className={clsx('text-xs', 'font-semibold', 'uppercase', 'tracking-[0.2em]', 'text-gray-400')}>
                Quick stats
              </p>
              <h3 className={clsx('mt-2', 'text-lg', 'font-semibold', 'text-gray-900')}>
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
                label: "PhonePe revenue per user",
                value: phonepeRangeSummary?.uniqueUsers
                  ? formatCurrency(
                      (phonepeRangeSummary?.total || 0) /
                        (phonepeRangeSummary?.uniqueUsers || 1)
                    )
                  : formatCurrency(0),
                iconBg: "bg-cyan-100 text-cyan-600",
                icon: IndianRupee,
              },
              {
                label: "ChainPay revenue per user",
                value: chainpayRangeSummary?.uniqueUsers
                  ? formatMSTC(
                      (chainpayRangeSummary?.total || 0) /
                        (chainpayRangeSummary?.uniqueUsers || 1)
                    )
                  : formatMSTC(0),
                iconBg: "bg-amber-100 text-amber-600",
                icon: MSTCIcon,
              },
              {
                label: "PhonePe users (selected range)",
                value: formatCount(revenueOverview?.userCounts?.phonepe ?? phonepeRangeSummary?.uniqueUsers ?? 0),
                iconBg: "bg-sky-100 text-sky-600",
                icon: Users,
              },
              {
                label: "ChainPay users (selected range)",
                value: formatCount(revenueOverview?.userCounts?.chainpay ?? chainpayRangeSummary?.uniqueUsers ?? 0),
                iconBg: "bg-orange-100 text-orange-600",
                icon: Users,
              },
              {
                label: "Other users (selected range)",
                value: formatCount(revenueOverview?.userCounts?.other ?? otherRangeSummary?.uniqueUsers ?? 0),
                iconBg: "bg-slate-100 text-slate-600",
                icon: Users,
              },
            ].map(({ label, value, iconBg, icon: Icon }) => (
              <div
                key={label}
                className={clsx('flex', 'items-start', 'justify-between', 'rounded-2xl', 'bg-slate-50', 'p-4')}
              >
                <div className={clsx('w-full', 'max-w-[70%]')}>
                  <p className={clsx('text-sm', 'font-medium', 'text-gray-600')}>{label}</p>
                  {loading ? (
                    <div className={clsx('mt-3', 'h-6', 'w-24', 'animate-pulse', 'rounded-md', 'bg-gray-200')} />
                  ) : (
                    <p className={clsx('mt-1', 'text-2xl', 'font-semibold', 'text-gray-900')}>
                      {value}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}
                >
                  <Icon className={clsx('h-5', 'w-5')} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {loading && (
        <div className={clsx('rounded-3xl', 'border', 'border-dashed', 'border-gray-200', 'bg-white', 'p-8', 'text-center', 'text-gray-500')}>
          Loading metrics...
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
