import api from "../api";

export const fetchAdminUsers = async (params = {}) => {
  const response = await api.get("/admin/users", { params });
  return response.data;
};

export const fetchAdminPublicProfiles = async (params = {}) => {
  const response = await api.get("/admin/public-profiles", { params });
  return response.data;
};

export const fetchAdminUserById = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const updateAdminUser = async (userId, payload) => {
  const response = await api.put(`/admin/users/${userId}`, payload);
  return response.data;
};

export const blockAdminUser = async (userId, block = true) => {
  const response = await api.patch(`/admin/users/block/${userId}`, { block });
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const downloadUsersCsv = async (params = {}) => {
  const response = await api.get("/admin/users/export", {
    params,
    responseType: "blob",
  });
  return response;
};

export const refreshAdminUserSubscription = async (userId) => {
  const response = await api.post(`/admin/users/${userId}/subscription/refresh`);
  return response.data;
};

export const renewAdminUserSubscription = async (userId, payload = {}) => {
  const response = await api.post(`/admin/users/${userId}/subscription/renew`, payload);
  return response.data;
};

export const updateAdminUserSubscriptionExpiry = async (userId, payload = {}) => {
  const response = await api.post(`/admin/users/${userId}/subscription/expiry`, payload);
  return response.data;
};

export const sendAdminUserReminder = async (userId, payload = {}) => {
  const response = await api.post(`/admin/users/${userId}/subscription/remind`, payload);
  return response.data;
};

export const fetchAdminUserReminderLogs = async (userId, params = {}) => {
  const response = await api.get(`/admin/users/${userId}/subscription/logs`, {
    params,
  });
  return response.data;
};

export const runAdminSubscriptionAudit = async () => {
  const response = await api.post(`/admin/subscriptions/audit`);
  return response.data;
};

export const fetchAdminSubscriptionAnalytics = async () => {
  const response = await api.get(`/admin/subscriptions/analytics`);
  return response.data;
};

export const fetchAdminRevenueOverview = async (params = {}) => {
  const response = await api.get('/admin/revenue/overview', { params });
  return response.data;
};

export const fetchAdminInvoices = async (params = {}) => {
  const response = await api.get("/admin/invoices", { params });
  return response.data;
};

export const downloadInvoicesCsv = async (params = {}) => {
  const response = await api.get("/admin/invoices/export", {
    params,
    responseType: "blob",
  });
  return response;
};

export const downloadInvoicePdf = async (invoiceId) => {
  const response = await api.get(`/admin/invoices/${invoiceId}/pdf`, {
    responseType: "blob",
  });
  return response;
};

export const fetchAdminNfcRequests = async (params = {}) => {
  const response = await api.get("/admin/nfc/requests", { params });
  return response.data;
};

export const updateAdminNfcStatus = async (userId, payload = {}) => {
  const response = await api.patch(`/admin/nfc/${userId}`, payload);
  return response.data;
};

export const fetchAdminCoupons = async (params = {}) => {
  const response = await api.get("/admin/coupons", { params });
  return response.data;
};

export const generateAdminCoupons = async (payload = {}) => {
  const response = await api.post("/admin/coupons/generate", payload);
  return response.data;
};

export const downloadCouponsCsv = async (params = {}) => {
  const response = await api.get("/admin/coupons/export", {
    params,
    responseType: "blob",
  });
  return response;
};
