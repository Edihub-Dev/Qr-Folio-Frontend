import React, { useEffect, useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../config/permissions";

const RouteGuard = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  redirectTo = "/dashboard",
  allowIfUnauthenticated = false,
}) => {
  const { user, loading, can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = `${location.pathname}${location.search}`;

  const redirectPath = useMemo(() => {
    if (loading) return null;

    if (!user) {
      if (allowIfUnauthenticated) return null;
      return `/login?returnTo=${encodeURIComponent(currentPath)}`;
    }

    if (!user.isVerified) {
      return "/login";
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      const role = normalizeRole(user.role);
      const allowed = allowedRoles.map(normalizeRole);
      if (!allowed.includes(role)) {
        return redirectTo;
      }
    }

    if (Array.isArray(requiredPermissions) && requiredPermissions.length > 0) {
      const ok = requiredPermissions.every((p) => can(p));
      if (!ok) {
        return redirectTo;
      }
    }

    return null;
  }, [loading, user, allowedRoles, requiredPermissions, can, redirectTo, currentPath, allowIfUnauthenticated]);

  useEffect(() => {
    if (!loading && redirectPath && redirectPath !== currentPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [loading, redirectPath, currentPath, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (redirectPath && redirectPath !== currentPath) {
    return null;
  }

  return children;
};

export default RouteGuard;
