import api from "../api";

export const getReferralOverview = () => api.get("/refer/me");

export const getPremiumReferralLeaderboard = (params) =>
  api.get("/referrals/leaderboard", { params });

export const getReferralHistory = (params) =>
  api.get("/refer/history", { params });

export const getWithdrawalHistory = (params) =>
  api.get("/refer/withdrawals", { params });

export const submitWithdrawal = (payload) =>
  api.post("/refer/withdraw", payload);

export const adminListReferrals = (params) =>
  api.get("/admin/referrals", { params });

export const adminGetReferralStats = (params) =>
  api.get("/admin/referrals/stats", { params });

export const adminUpdateReferral = (id, payload) =>
  api.patch(`/admin/referrals/${id}`, payload);

export const adminExportReferrals = (params) =>
  api.get("/admin/referrals/export", {
    params,
    responseType: "blob",
  });

export const adminListWithdrawalRequests = (params) =>
  api.get("/admin/withdrawals", { params });

export const adminUpdateWithdrawalRequest = (id, payload) =>
  api.patch(`/admin/withdrawals/${id}`, payload);
