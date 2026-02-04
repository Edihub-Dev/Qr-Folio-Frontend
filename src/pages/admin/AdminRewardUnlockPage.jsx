import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Gift, KeyRound, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  fetchAdminUsers,
  fetchAdminUserById,
  fetchAdminUserRewards,
  unlockAdminReward,
} from "../../services/adminApi";

const REWARD_OPTIONS = [
  { value: "L1", label: "L1" },
  { value: "L2", label: "L2" },
  { value: "L3", label: "L3" },
];

const AdminRewardUnlockPage = () => {
  const [form, setForm] = useState({
    userId: "",
    rewardCode: "L1",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [unlockingCode, setUnlockingCode] = useState(null);

  const canSubmit = useMemo(() => {
    return Boolean(form.userId?.trim()) && Boolean(form.rewardCode);
  }, [form.userId, form.rewardCode]);

  const canLookupUser = useMemo(() => {
    const id = (form.userId || "").trim();
    return /^[a-fA-F0-9]{24}$/.test(id);
  }, [form.userId]);

  const canSearch = useMemo(() => {
    return (search || "").toString().trim().length >= 2;
  }, [search]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const term = (search || "").toString().trim();
      if (!term || term.length < 2) {
        setSearchResults([]);
        setSearchLoading(false);
        setSearchError(null);
        return;
      }

      try {
        setSearchLoading(true);
        setSearchError(null);
        const response = await fetchAdminUsers({
          page: 1,
          limit: 8,
          search: term,
          sortBy: "createdAt",
          sortDir: "desc",
        });

        if (!alive) return;
        const items = Array.isArray(response?.data) ? response.data : [];
        setSearchResults(items);
      } catch (err) {
        if (!alive) return;
        setSearchResults([]);
        setSearchError(
          err?.response?.data?.message || err.message || "Failed to search users"
        );
      } finally {
        if (!alive) return;
        setSearchLoading(false);
      }
    };

    const t = setTimeout(run, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [search]);

  const loadRewardHistory = async (userId) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const response = await fetchAdminUserRewards({
        userId,
        page: 1,
        limit: 50,
        sortBy: "updatedAt",
        sortDir: "desc",
      });

      const items = Array.isArray(response?.data) ? response.data : [];
      const filtered = items.filter((item) => {
        const code = (item?.rewardCode || "").toString().trim().toUpperCase();
        return code === "L1" || code === "L2" || code === "L3";
      });
      setHistory(filtered);
    } catch (err) {
      setHistory([]);
      setHistoryError(
        err?.response?.data?.message || err.message || "Failed to load reward history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePickUser = (user) => {
    const id = user?.id || user?._id;
    if (!id) return;
    setForm((prev) => ({ ...prev, userId: id.toString() }));
    setSearch("");
    setSearchResults([]);
    setSearchError(null);
  };

  const handleUnlockCoupon = async (rewardCode) => {
    const userId = (form.userId || "").trim();
    if (!canLookupUser) {
      toast.error("Enter a valid userId first");
      return;
    }

    const code = (rewardCode || "").toString().trim().toUpperCase();
    if (!code) return;

    try {
      setUnlockingCode(code);
      const response = await unlockAdminReward({ userId, rewardCode: code });
      const payload = response?.data;
      if (payload?.issued) {
        toast.success("Coupon unlocked");
      } else if (payload?.reason === "already_exists") {
        toast("Reward already exists");
      } else {
        toast.error("Unable to unlock coupon");
      }
      await loadRewardHistory(userId);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Failed to unlock coupon"
      );
    } finally {
      setUnlockingCode(null);
    }
  };

  useEffect(() => {
    let alive = true;

    const loadUser = async () => {
      const id = (form.userId || "").trim();
      if (!canLookupUser) {
        setUserInfo(null);
        setUserLoading(false);
        setHistory([]);
        setHistoryLoading(false);
        setHistoryError(null);
        return;
      }

      try {
        setUserLoading(true);
        const response = await fetchAdminUserById(id);
        if (!alive) return;
        setUserInfo(response?.data || null);

        await loadRewardHistory(id);
      } catch (err) {
        if (!alive) return;
        setUserInfo(null);
        setHistory([]);
        setHistoryError(null);
      } finally {
        if (!alive) return;
        setUserLoading(false);
      }
    };

    const t = setTimeout(loadUser, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [canLookupUser, form.userId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);
      const response = await unlockAdminReward({
        userId: form.userId.trim(),
        rewardCode: form.rewardCode,
      });

      const payload = response?.data || null;
      setResult(payload);

      if (payload?.issued) {
        toast.success("Reward unlocked successfully");
      } else if (payload?.reason === "already_exists") {
        toast("Reward already exists for this user");
      } else {
        toast.error("Unable to unlock reward");
      }

      if (canLookupUser) {
        await loadRewardHistory(form.userId.trim());
      }
    } catch (err) {
      setResult(null);
      toast.error(
        err?.response?.data?.message || err.message || "Failed to unlock reward"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const badge = useMemo(() => {
    if (!result) return null;
    if (result.issued) {
      return {
        label: "UNLOCKED",
        className: "bg-emerald-100 text-emerald-700",
        icon: CheckCircle2,
      };
    }
    if (result.reason === "already_exists") {
      return {
        label: "ALREADY EXISTS",
        className: "bg-slate-100 text-slate-700",
        icon: XCircle,
      };
    }
    return {
      label: "NOT ISSUED",
      className: "bg-rose-100 text-rose-700",
      icon: XCircle,
    };
  }, [result]);

  const BadgeIcon = badge?.icon || null;

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN");
  };

  const statusPillClass = (value) => {
    const normalized = (value || "").toString().trim().toUpperCase();
    if (normalized === "UNLOCKED") return "bg-blue-100 text-blue-700";
    if (normalized === "CLAIMED") return "bg-emerald-100 text-emerald-700";
    if (normalized === "EXPIRED") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-slate-100 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Unlock Rewards</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manually unlock L1/L2/L3 for a user (admin-only).
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 md:col-span-3">
            <span>Search user (name/email)</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type at least 2 letters"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <span className="mt-1 text-[11px] text-gray-400">
              {searchLoading
                ? "Searching…"
                : searchError
                ? searchError
                : canSearch
                ? `${searchResults.length} result(s)`
                : ""}
            </span>
          </label>

          {searchResults.length > 0 && (
            <div className="md:col-span-3 rounded-2xl border border-gray-100 bg-slate-50 p-2">
              <div className="max-h-64 overflow-auto">
                {searchResults.map((u) => {
                  const id = u?.id || u?._id;
                  const name = u?.name || "—";
                  const email = u?.email || "";
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handlePickUser(u)}
                      className="flex w-full items-start justify-between gap-4 rounded-xl px-3 py-2 text-left text-sm text-gray-800 transition hover:bg-white"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{name}</p>
                        <p className="truncate text-xs text-gray-500">{email}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-gray-400">
                        {(id || "").toString().slice(0, 8)}…
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 md:col-span-2">
            <span>User ID</span>
            <input
              type="text"
              value={form.userId}
              onChange={(e) => handleChange("userId", e.target.value)}
              placeholder="Mongo ObjectId of user"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <div className="md:col-span-3">
            <div className="rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                User
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {userLoading
                  ? "Loading user…"
                  : userInfo
                  ? userInfo.name || "—"
                  : canLookupUser
                  ? "User not found"
                  : "Enter a valid userId to load name/email"}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {userLoading ? "" : userInfo?.email || ""}
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            <span>Reward Code</span>
            <select
              value={form.rewardCode}
              onChange={(e) => handleChange("rewardCode", e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {REWARD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-3">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4" />
                  Unlock
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Result</h2>
              <p className="mt-1 text-sm text-gray-500">
                Latest unlock attempt for this session.
              </p>
            </div>
            {badge && (
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
              >
                {BadgeIcon && <BadgeIcon className="h-4 w-4" />}
                {badge.label}
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                User ID
              </p>
              <p className="mt-1 break-all font-mono text-sm text-slate-900">
                {form.userId.trim()}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                User
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {userInfo?.name || "—"}
              </p>
              <p className="mt-1 text-sm text-slate-700">{userInfo?.email || ""}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reward
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {form.rewardCode}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {result?.userReward?.status || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Source
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {result?.userReward?.source || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Coupon Code
              </p>
              <p className="mt-1 break-all font-mono text-sm text-slate-900">
                {result?.userReward?.couponCode || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Claim history</h2>
            <p className="mt-1 text-sm text-gray-500">
              Rewards issued and claimed by this user.
            </p>
          </div>

          <button
            type="button"
            disabled={!canLookupUser || historyLoading}
            onClick={() => loadRewardHistory((form.userId || "").trim())}
            className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {historyLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {historyError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {historyError}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Coupon</th>
                <th className="px-4 py-3">Claimed at</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyLoading ? (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={7}>
                    Loading history…
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={7}>
                    {canLookupUser ? "No rewards found." : "Enter a valid userId to view history."}
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id || `${row.rewardCode}-${row.couponCode || ""}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {row.rewardCode || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(
                          row.status
                        )}`}
                      >
                        {(row.status || "LOCKED").toString().toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{row.source || "—"}</td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-800">
                      {row.couponCode || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">{formatDateTime(row.claimedAt)}</td>
                    <td className="px-4 py-4 text-gray-700">{formatDateTime(row.updatedAt)}</td>
                    <td className="px-4 py-4">
                      {((row.status || "").toString().trim().toUpperCase() === "LOCKED") && (
                        <button
                          type="button"
                          disabled={Boolean(unlockingCode)}
                          onClick={() => handleUnlockCoupon(row.rewardCode)}
                          className="inline-flex items-center rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
                        >
                          {unlockingCode === (row.rewardCode || "").toString().trim().toUpperCase()
                            ? "Unlocking…"
                            : "Unlock coupon"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRewardUnlockPage;
