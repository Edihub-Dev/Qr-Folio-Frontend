import React from "react";
import { useAuth } from "../../context/AuthContext";

const PermissionWrapper = ({ permission, permissions, children, fallback = null }) => {
  const { can } = useAuth();

  const required = Array.isArray(permissions)
    ? permissions
    : permission
      ? [permission]
      : [];

  const ok = required.length === 0 ? true : required.every((p) => can(p));
  if (!ok) {
    return fallback;
  }

  return children;
};

export default PermissionWrapper;
