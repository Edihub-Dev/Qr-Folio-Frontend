export const ROLES = Object.freeze({
  USER: "USER",
  SUBADMIN: "SUBADMIN",
  ADMIN: "ADMIN",
});

export const PERMISSIONS = Object.freeze({
  ADMIN_ACCESS: "admin:access",

  USERS_VIEW: "users:view",
  USERS_EDIT_LIMITED: "users:edit_limited",
  USERS_DELETE: "users:delete",

  PROFILES_VIEW: "profiles:view",
  PROFILES_MODERATE: "profiles:moderate",

  INVOICES_VIEW: "invoices:view",
  INVOICES_DELETE: "invoices:delete",

  REFERRALS_VIEW: "referrals:view",

  REWARDS_VIEW: "rewards:view",
  REWARDS_APPROVE: "rewards:approve",

  SYSTEM_SETTINGS: "system:settings",
  ADMIN_CREATE: "admin:create",
});

export const normalizeRole = (role) => {
  const raw = String(role || "").trim();
  if (!raw) return ROLES.USER;

  const upper = raw.toUpperCase();
  if (upper === "ADMIN") return ROLES.ADMIN;
  if (upper === "SUBADMIN") return ROLES.SUBADMIN;
  if (upper === "USER") return ROLES.USER;

  if (raw === "admin") return ROLES.ADMIN;
  if (raw === "subadmin") return ROLES.SUBADMIN;
  if (raw === "user") return ROLES.USER;

  return ROLES.USER;
};
