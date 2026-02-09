import { normalizeRole, ROLES, PERMISSIONS } from "../config/permissions";

export const getPermissionsForUser = (user) => {
  const perms = Array.isArray(user?.permissions) ? user.permissions : [];
  return perms.map((p) => String(p || "").trim()).filter(Boolean);
};

export const canUser = (user, permission) => {
  if (!permission) return true;

  const role = normalizeRole(user?.role);
  if (role === ROLES.ADMIN) {
    return true;
  }

  const perms = getPermissionsForUser(user);
  return perms.includes(permission);
};

export { ROLES, PERMISSIONS };
