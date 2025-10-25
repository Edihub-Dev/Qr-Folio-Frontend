import api from "../api";

export const getReferralOverview = () => api.get("/refer/me");

export const getReferralHistory = (params) =>
  api.get("/refer/history", { params });

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
