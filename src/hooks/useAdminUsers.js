import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminUsers,
  fetchAdminUserById,
  updateAdminUser,
  blockAdminUser,
  deleteAdminUser,
  downloadUsersCsv,
} from "../services/adminApi";

const defaultParams = {
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortDir: "desc",
  search: "",
  plan: "",
  paymentStatus: "",
  paymentMethod: "",
  isBlocked: "",
};

const useAdminUsers = () => {
  const [params, setParams] = useState(defaultParams);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalState, setModalState] = useState({ view: false, edit: false, confirm: false });
  const [pendingAction, setPendingAction] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAdminUsers(params);
      setData(response?.data || []);
      setStats(response?.meta?.stats || {});
      setPagination(response?.meta?.pagination || { page: 1, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const refresh = useCallback(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCsvDownload = useCallback(async () => {
    try {
      setCsvLoading(true);
      const response = await downloadUsersCsv(params);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filenameMatch = response.headers["content-disposition"]?.match(/filename="(.+)"/);
      link.setAttribute("download", filenameMatch?.[1] || "users.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to download CSV");
    } finally {
      setCsvLoading(false);
    }
  }, [params]);

  const handleSort = useCallback((sortBy, sortDir) => {
    setParams((prev) => ({ ...prev, sortBy, sortDir }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const openModal = useCallback(async (type, userId) => {
    try {
      const response = await fetchAdminUserById(userId);
      setSelectedUser(response?.data || null);
      setModalState((prev) => ({ ...prev, [type]: true }));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load user");
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ view: false, edit: false, confirm: false });
    setSelectedUser(null);
    setPendingAction(null);
  }, []);

  const handleUpdateUser = useCallback(async (updates) => {
    if (!selectedUser) return;
    try {
      await updateAdminUser(selectedUser.id || selectedUser._id, updates);
      closeModal();
      refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update user");
    }
  }, [closeModal, refresh, selectedUser]);

  const handleBulkAction = useCallback(async () => {
    if (!selectedUser || !pendingAction) return;
    try {
      if (pendingAction.type === "block") {
        await blockAdminUser(selectedUser.id || selectedUser._id, pendingAction.value);
      } else if (pendingAction.type === "delete") {
        await deleteAdminUser(selectedUser.id || selectedUser._id);
      }
      closeModal();
      refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Action failed");
    }
  }, [closeModal, pendingAction, refresh, selectedUser]);

  const setFilter = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, page: 1, [key]: value }));
  }, []);

  return {
    params,
    setParams,
    data,
    stats,
    pagination,
    loading,
    error,
    selectedUser,
    modalState,
    pendingAction,
    csvLoading,
    setSelectedUser,
    setModalState,
    setPendingAction,
    loadUsers,
    refresh,
    handleCsvDownload,
    handleSort,
    handlePageChange,
    openModal,
    closeModal,
    handleUpdateUser,
    handleBulkAction,
    setFilter,
  };
};

export default useAdminUsers;
