import React, { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, useLocation, Route, Routes } from "react-router-dom";
import {
  Menu,
  Users,
  BarChart3,
  FileText,
  Share2,
  Wallet,
  X,
  LogOut,
  ShieldCheck,
  CreditCard,
  Tag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminDashboardPage from "./AdminDashboardPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminExportsPage from "./AdminExportsPage";
import AdminInvoicesPage from "./AdminInvoicesPage";
import AdminReferralsPage from "./AdminReferralsPage";

const AdminLayout = () => {
  const { user, logout } = useAuth();
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

  const requiresSidebarToggle = isInvoiceRoute || isUsersRoute;

  useEffect(() => {
    if (
      requiresSidebarToggle ||
      isReferRoute ||
      isWithdrawalRoute ||
      isNfcRoute
    ) {
      setSidebarOpen(false);
    }
  }, [requiresSidebarToggle, isReferRoute, isWithdrawalRoute, isNfcRoute]);
  const navItems = useMemo(
    () => [
      { to: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/invoices", label: "Invoices", icon: FileText },
      { to: "/admin/refer", label: "Referrals", icon: Share2 },
      { to: "/admin/coupons", label: "Coupons", icon: Tag },
      { to: "/admin/nfc", label: "NFC cards", icon: CreditCard },
      { to: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
      {
        to: "/dashboard",
        label: "User Dashboard",
        icon: BarChart3,
      },
    ],
    []
  );

  const renderNavLink = ({ to, label, icon: Icon, exact }) => (
    <NavLink
      key={to}
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
          isActive
            ? "border border-primary-200 bg-white/90 text-primary-700 shadow"
            : "text-slate-500 hover:border hover:border-white/70 hover:bg-white/70 hover:text-slate-900"
        }`
      }
      onClick={() => setSidebarOpen(false)}
    >
      <Icon className="h-5 w-5" />
      <span className="tracking-wide">{label}</span>
    </NavLink>
  );

  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-white to-slate-200" />

      <header className="border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-xl border border-white/60 bg-white/90 p-2 text-slate-600 shadow-sm transition hover:bg-white ${
                requiresSidebarToggle ? "" : "lg:hidden"
              }`}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-expanded={sidebarOpen}
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg sm:flex">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-slate-900">
                QRfolio Admin Control
              </span>
              <span className="text-xs text-slate-500">
                Monitor revenue, users & billing
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-900">
                {user?.name || "—"}
              </div>
              <div className="text-xs text-slate-500">{user?.email || "—"}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`flex w-full ${
          sidebarOpen || !requiresSidebarToggle ? "gap-6" : "gap-4"
        } px-4 py-6 sm:px-6 lg:px-10`}
      >
        {(!requiresSidebarToggle || sidebarOpen) && (
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-72 flex-shrink-0 transform border-r border-white/60 bg-white/90 px-5 py-6 shadow-2xl backdrop-blur transition-transform duration-200 ease-in-out lg:sticky lg:top-6 lg:h-[calc(100vh-4rem)] lg:w-72 lg:translate-x-0 lg:rounded-3xl lg:border lg:bg-white lg:shadow-xl ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div
              className={`flex items-center justify-between ${
                requiresSidebarToggle ? "" : "lg:hidden"
              }`}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Navigation
              </span>
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 hidden rounded-2xl border border-white/60 bg-white p-4 shadow-sm lg:block">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
                Signed in as
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {user?.name || "—"}
              </p>
              <p className="text-xs text-slate-500">{user?.email || "—"}</p>
            </div>

            <nav className="mt-6 flex flex-col gap-2">
              {navItems.map(renderNavLink)}
            </nav>
          </aside>
        )}

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main
          className={`flex w-full flex-1 flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur ${
            requiresSidebarToggle && !sidebarOpen ? "ml-0" : ""
          }`}
        >
          <div className="flex flex-col gap-3 border-b border-white/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Admin workspace
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                Overview & Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Access dashboards, manage users, and track invoices in one
                place.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl bg-primary-50 px-3 py-2 text-xs font-medium text-primary-600">
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
