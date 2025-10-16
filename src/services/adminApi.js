import api from "../api";

export const fetchAdminUsers = async (params = {}) => {
  const response = await api.get("/admin/users", { params });
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
