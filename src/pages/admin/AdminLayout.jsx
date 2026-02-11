import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx"
import { Outlet, NavLink, useLocation, Route, Routes } from "react-router-dom";
import {
  Menu,
  Users,
  Link2,
  BarChart3,
  FileText,
  Share2,
  Wallet,
  X,
  LogOut,
  ShieldCheck,
  CreditCard,
  Tag,
  Gift,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS, ROLES, normalizeRole } from "../../config/permissions";
import AdminDashboardPage from "./AdminDashboardPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminExportsPage from "./AdminExportsPage";
import AdminInvoicesPage from "./AdminInvoicesPage";
import AdminReferralsPage from "./AdminReferralsPage";

const AdminLayout = () => {
  const { user, logout, can } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isInvoiceRoute = useMemo(
    () => location.pathname.startsWith("/admin/invoices"),
    [location.pathname]
  );
  const isUsersRoute = useMemo(
    () => location.pathname.startsWith("/admin/users"),
    [location.pathname]
  );
  const isUserRewardsRoute = useMemo(
    () => location.pathname.startsWith("/admin/user-rewards"),
    [location.pathname]
  );
  const isReferRoute = useMemo(
    () => location.pathname.startsWith("/admin/refer"),
    [location.pathname]
  );
  const isWithdrawalRoute = useMemo(
    () => location.pathname.startsWith("/admin/withdrawals"),
    [location.pathname]
  );
  const isNfcRoute = useMemo(
    () => location.pathname.startsWith("/admin/nfc"),
    [location.pathname]
  );

  const isPublicProfilesRoute = useMemo(
    () => location.pathname.startsWith("/admin/public-profiles"),
    [location.pathname]
  );

  const isCouponsRoute = useMemo(
    () => location.pathname.startsWith("/admin/coupons"),
    [location.pathname]
  );

  const isRewardUnlockRoute = useMemo(
    () => location.pathname.startsWith("/admin/reward-unlock"),
    [location.pathname]
  );

  const isDashboardRoute = useMemo(
    () => location.pathname === "/admin" || location.pathname === "/admin/",
    [location.pathname]
  );

  const requiresSidebarToggle = isInvoiceRoute || isUsersRoute || isUserRewardsRoute;

  const hideSidebarForRoute =
    isDashboardRoute ||
    isPublicProfilesRoute ||
    isReferRoute ||
    isCouponsRoute ||
    isRewardUnlockRoute ||
    isNfcRoute ||
    isWithdrawalRoute;

  useEffect(() => {
    if (
      requiresSidebarToggle ||
      isReferRoute ||
      isWithdrawalRoute ||
      isNfcRoute ||
      isRewardUnlockRoute
    ) {
      setSidebarOpen(false);
    }
  }, [requiresSidebarToggle, isReferRoute, isWithdrawalRoute, isNfcRoute, isRewardUnlockRoute]);
  const navItems = useMemo(
    () => {
      const items = [
        { to: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
        {
          to: "/admin/users",
          label: "Users",
          icon: Users,
          permission: PERMISSIONS.USERS_VIEW,
        },
        {
          to: "/admin/public-profiles",
          label: "Public Profiles",
          icon: Link2,
          permission: PERMISSIONS.PROFILES_VIEW,
        },
        {
          to: "/admin/invoices",
          label: "Invoices",
          icon: FileText,
          permission: PERMISSIONS.INVOICES_VIEW,
        },
        {
          to: "/admin/refer",
          label: "Referrals",
          icon: Share2,
          permission: PERMISSIONS.REFERRALS_VIEW,
        },
        {
          to: "/admin/coupons",
          label: "Coupons",
          icon: Tag,
          permission: PERMISSIONS.SYSTEM_SETTINGS,
        },
        {
          to: "/admin/user-rewards",
          label: "User Rewards",
          icon: Gift,
          permission: PERMISSIONS.REWARDS_VIEW,
        },
        {
          to: "/admin/reward-unlock",
          label: "Unlock Rewards",
          icon: KeyRound,
          permission: PERMISSIONS.REWARDS_APPROVE,
        },
        {
          to: "/admin/subadmins",
          label: "Subadmins",
          icon: Users,
          permission: PERMISSIONS.ADMIN_CREATE,
        },
        {
          to: "/admin/nfc",
          label: "NFC cards",
          icon: CreditCard,
          permission: PERMISSIONS.SYSTEM_SETTINGS,
        },
        {
          to: "/admin/withdrawals",
          label: "Withdrawals",
          icon: Wallet,
          permission: PERMISSIONS.SYSTEM_SETTINGS,
        },
        {
          to: "/dashboard",
          label: "User Dashboard",
          icon: BarChart3,
        },
      ];

      return items.filter((item) => {
        if (item.to === "/admin") {
          return normalizeRole(user?.role) === ROLES.ADMIN;
        }
        if (item.to === "/admin/reward-unlock") {
          return normalizeRole(user?.role) === ROLES.ADMIN;
        }
        if (!item.permission) return true;
        return can(item.permission);
      });
    },
    [can, user?.role]
  );

  const renderNavLink = ({ to, label, icon: Icon, exact }) => (
    <NavLink
      key={to}
      to={to}
      end={exact}
      className={({ isActive }) =>
        `group flex w-full items-center justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:px-4 lg:justify-start ${
          isActive
            ? "bg-primary-50 text-primary-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
      onClick={() => setSidebarOpen(false)}
    >
      <Icon className={clsx('h-5', 'w-5')} />
      <span className={clsx('tracking-wide', 'lg:hidden', 'lg:group-hover:inline')}>{label}</span>
    </NavLink>
  );

  return (
    <div className={clsx('relative', 'h-screen', 'overflow-hidden', 'bg-slate-50')}>
      <div className={clsx('absolute', 'inset-0', '-z-10', 'bg-gradient-to-br', 'from-slate-100', 'via-white', 'to-slate-200')} />

      <div className={clsx('flex', 'h-full', 'min-h-0', 'w-full')}>
        <aside
          className={`group fixed inset-y-0 left-0 z-40 w-72 flex-shrink-0 transform overflow-y-auto hide-scrollbar border-r border-slate-200 bg-white px-5 py-6 shadow-2xl transition-all duration-200 ease-in-out lg:static lg:translate-x-0 lg:shadow-none lg:w-20 lg:hover:w-72 lg:px-3 lg:hover:px-5 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className={clsx('flex', 'items-center', 'justify-start', 'gap-3', 'px-2', 'pb-5', 'lg:justify-start')}>
            <div className={clsx('flex', 'h-11', 'w-11', 'items-center', 'justify-center', 'rounded-2xl', 'bg-primary-600', 'text-white')}>
              <ShieldCheck className={clsx('h-5', 'w-5')} />
            </div>
            <div className={clsx('hidden', 'flex-col', 'leading-tight', 'lg:group-hover:flex')}>
              <span className={clsx('text-sm', 'font-semibold', 'text-slate-900')}>Admin</span>
              <span className={clsx('text-xs', 'text-slate-500')}>QRfolio</span>
            </div>
          </div>

          <div className={clsx('flex', 'items-center', 'justify-between', 'lg:hidden')}>
            <span className={clsx('text-sm', 'font-semibold', 'uppercase', 'tracking-[0.3em]', 'text-slate-500')}>
              Navigation
            </span>
            <button
              type="button"
              className={clsx('rounded-lg', 'border', 'border-slate-200', 'p-2', 'text-slate-600', 'transition', 'hover:bg-slate-100')}
              onClick={() => setSidebarOpen(false)}
            >
              <X className={clsx('h-4', 'w-4')} />
            </button>
          </div>

          <nav className={clsx('mt-6', 'flex', 'flex-col', 'gap-2')}>
            {navItems.map(renderNavLink)}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className={clsx('fixed', 'inset-0', 'z-30', 'bg-black/40', 'backdrop-blur-sm', 'lg:hidden')}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={clsx('flex', 'min-w-0', 'flex-1', 'flex-col')}>
          <header className={clsx('border-b', 'border-white/70', 'bg-white/80', 'backdrop-blur')}>
            <div className={clsx('flex', 'h-16', 'w-full', 'items-center', 'justify-between', 'px-4', 'sm:px-6', 'lg:px-8')}>
              <div className={clsx('flex', 'items-center', 'gap-3')}>
                <button
                  type="button"
                  className={clsx('inline-flex', 'items-center', 'justify-center', 'rounded-xl', 'border', 'border-white/60', 'bg-white/90', 'p-2', 'text-slate-600', 'shadow-sm', 'transition', 'hover:bg-white', 'lg:hidden')}
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  aria-expanded={sidebarOpen}
                  aria-label="Toggle navigation"
                >
                  <Menu className={clsx('h-5', 'w-5')} />
                </button>
                <div className={clsx('flex', 'flex-col')}>
                  <span className={clsx('text-lg', 'font-semibold', 'text-slate-900')}>
                    QRfolio Admin Control
                  </span>
                  <span className={clsx('text-xs', 'text-slate-500')}>
                    Monitor revenue, users & billing
                  </span>
                </div>
              </div>
              <div className={clsx('flex', 'items-center', 'gap-4')}>
                <div className={clsx('hidden', 'text-right', 'sm:block')}>
                  <div className={clsx('text-sm', 'font-semibold', 'text-slate-900')}>
                    {user?.name || "—"}
                  </div>
                  <div className={clsx('text-xs', 'text-slate-500')}>{user?.email || "—"}</div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-xl', 'border', 'border-red-100', 'px-3', 'py-2', 'text-sm', 'font-medium', 'text-red-600', 'transition', 'hover:bg-red-50')}
                >
                  <LogOut className={clsx('h-4', 'w-4')} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </header>

          <main className={clsx('flex', 'min-h-0', 'flex-1', 'flex-col', 'gap-4', 'overflow-auto', 'hide-scrollbar', 'p-4', 'sm:p-6', 'lg:p-8')}>
            <div className={clsx('flex', 'flex-col', 'gap-3', 'border-b', 'border-white/70', 'pb-4', 'sm:flex-row', 'sm:items-center', 'sm:justify-between')}>
              <div>
                <p className={clsx('text-xs', 'font-semibold', 'uppercase', 'tracking-[0.3em]', 'text-slate-400')}>
                  Admin workspace
                </p>
                <h1 className={clsx('mt-1', 'text-2xl', 'font-semibold', 'text-slate-900')}>
                  Overview & Management
                </h1>
                <p className={clsx('mt-1', 'text-sm', 'text-slate-500')}>
                  Access dashboards, manage users, and track invoices in one
                  place.
                </p>
              </div>
              <div className={clsx('flex', 'gap-3')}>
                <div className={clsx('rounded-2xl', 'bg-primary-50', 'px-3', 'py-2', 'text-xs', 'font-medium', 'text-primary-600')}>
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className={clsx('flex-1', 'min-h-0')}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
