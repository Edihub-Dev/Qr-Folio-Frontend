import React, { useMemo } from "react";
import {
  LayoutDashboard,
  User,
  Building2,
  QrCode,
  LogOut,
  ChevronLeft,
  Menu,
  Image,
  ShieldCheck,
  Share2,
  Eye,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PLAN_LABELS,
  getPlanRank,
  normalizePlan,
} from "../../utils/subscriptionPlan";

const Sidebar = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobile,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ---------------- MENU ---------------- */
  const menuDefinitions = useMemo(() => {
    const userId = user?.authUserId || user?.id || user?._id;

    const items = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        minPlan: "basic",
      },
      {
        id: "profile",
        label: "Edit Profile",
        icon: User,
        path: "/dashboard/profile",
        minPlan: "basic",
      },
      {
        id: "company",
        label: "Company Details",
        icon: Building2,
        path: "/dashboard/company",
        minPlan: "basic",
      },
      {
        id: "gallery",
        label: "Gallery",
        icon: Image,
        path: "/dashboard/gallery",
        minPlan: "basic",
      },
      {
        id: "qrcode",
        label: "My QR Code",
        icon: QrCode,
        path: "/dashboard/qrcode",
        minPlan: "standard",
      },
      {
        id: "refer",
        label: "Refer & Earn",
        icon: Share2,
        path: "/dashboard/refer",
        minPlan: "basic",
      },
      {
        id: "public-profile",
        label: "Generate QR ID Card",
        icon: Eye,
        path: userId ? `/profile/${userId}` : "/dashboard",
        minPlan: "basic",
      },
    ];

    if (user?.role === "admin") {
      items.unshift({
        id: "admin",
        label: "Admin",
        icon: ShieldCheck,
        path: "/admin",
        minPlan: "basic",
      });
    }

    return items;
  }, [user]);

  const menuItems = useMemo(() => {
    const plan = normalizePlan(user?.subscriptionPlan);
    const rank = getPlanRank(plan);
    return menuDefinitions.filter(
      (item) => rank >= getPlanRank(item.minPlan || "basic")
    );
  }, [menuDefinitions, user?.subscriptionPlan]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const avatarUrl = useMemo(() => {
    if (user?.profilePhoto) return user.profilePhoto;

    return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
      stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/>
      <circle cx='12' cy='7' r='4'/>
    </svg>
  `)}`;
  }, [user?.profilePhoto]);

  /* ---------------- SIDEBAR ---------------- */
  return (
    <>
      {/* MOBILE TOGGLE */}
      {isMobile && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-4 left-4 z-50 rounded-xl bg-slate-900 p-2 lg:hidden"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
      )}

      {/* MOBILE OVERLAY */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className="fixed left-0 top-0 z-40 h-full
                   bg-slate-950 border-r border-white/10
                   overflow-hidden
                   transition-[width,transform] duration-300"
        style={{
          width: isCollapsed ? 88 : 280,
          transform:
            isMobile && isCollapsed ? "translateX(-100%)" : "translateX(0)",
        }}
        /* ✅ HOVER FUNCTIONALITY SAFE */
        onMouseEnter={() => {
          if (!isMobile && isCollapsed) setIsCollapsed(false);
        }}
        onMouseLeave={() => {
          if (!isMobile && !isCollapsed) setIsCollapsed(true);
        }}
      >
        <div className="flex h-full flex-col">
          {/* HEADER */}
          <div className="relative border-b border-white/10 p-6">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">QR Folio</h1>
                  <p className="text-xs text-slate-400">
                    Digital Business Cards
                  </p>
                  {user?.subscriptionPlan && (
                    <span className="text-[11px] uppercase text-primary-300">
                      {PLAN_LABELS[normalizePlan(user.subscriptionPlan)]}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TOGGLE BUTTON */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center
                         rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft
                className={`h-5 w-5 transition-transform ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* MENU */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    navigate(item.path);
                    if (isMobile) setIsCollapsed(true);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition
                    ${
                      isActive
                        ? "bg-primary-500/20 text-primary-100"
                        : "text-slate-300 hover:bg-slate-800"
                    }
                    ${isCollapsed ? "justify-center px-2" : ""}
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* FOOTER */}
          {/* FOOTER */}
          {!isCollapsed && user && (
            <div className="border-t border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">
                <div className="relative h-10 w-10">
                  {user?.profilePhoto ? (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user?.name || "—"}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {user?.email || "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2
                 rounded-xl bg-primary-500 py-3 text-sm font-semibold
                 text-white hover:bg-primary-400"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
