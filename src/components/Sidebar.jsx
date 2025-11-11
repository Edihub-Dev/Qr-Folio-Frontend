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
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { PLAN_LABELS, getPlanRank } from "../utils/subscriptionPlan";

const Sidebar = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobile,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuDefinitions = useMemo(() => {
    const userId = user?.authUserId || user?.id || user?._id;

    const definitions = [
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
        minPlan: "standard",
      },
      {
        id: "qrcode",
        label: "My QR Code",
        icon: QrCode,
        path: "/dashboard/qrcode",
        minPlan: "standard",
      },
      {
        id: "public-profile",
        label: "Generate QR ID Card",
        icon: Eye,
        path: userId ? `/profile/${userId}` : "/dashboard",
        minPlan: "basic",
        external: true,
      },
      {
        id: "refer",
        label: "Refer & Earn",
        icon: Share2,
        path: "/dashboard/refer",
        minPlan: "basic",
      },
    ];

    if (user?.role === "admin") {
      definitions.unshift({
        id: "admin",
        label: "Admin",
        icon: ShieldCheck,
        path: "/admin",
        minPlan: "basic",
      });
    }

    return definitions;
  }, [user?.role, user?.authUserId, user?.id, user?._id]);

  const menuItems = useMemo(() => {
    const plan = (user?.subscriptionPlan || "basic").toLowerCase();
    const planRank = getPlanRank(plan);
    return menuDefinitions.filter(
      (item) => planRank >= getPlanRank(item.minPlan || "basic")
    );
  }, [menuDefinitions, user?.subscriptionPlan]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const avatarUrl = useMemo(() => {
    if (user?.profilePhoto) return user.profilePhoto;
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
        <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
        <circle cx='12' cy='7' r='4'></circle>
      </svg>
    `)}`;
  }, [user?.profilePhoto, user?.name]);

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`fixed top-4 left-4 z-50 border border-gray-200 bg-white p-2 shadow-lg lg:hidden transition-opacity duration-300 ${
            isMobile ? "opacity-100" : "opacity-0"
          }`}
          aria-label={`${isCollapsed ? "Open" : "Close"} sidebar`}
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      )}

      <div
        role={isMobile ? "presentation" : undefined}
        onClick={() => {
          if (isMobile) setIsCollapsed(true);
        }}
        className={`fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity duration-300 lg:hidden ${
          isMobile && !isCollapsed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed top-0 left-0 z-40 h-full bg-white shadow-xl transition-[transform,width] duration-300 ease-out ${
          isMobile ? "lg:hidden" : ""
        }`}
        style={{
          width: isCollapsed ? (isMobile ? 0 : 88) : 280,
          transform:
            isMobile && isCollapsed ? "translateX(-100%)" : "translateX(0)",
        }}
        onMouseEnter={() => {
          if (!isMobile && isCollapsed) setIsCollapsed(false);
        }}
        onMouseLeave={() => {
          if (!isMobile && !isCollapsed) setIsCollapsed(true);
        }}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      QR Folio
                    </h1>
                    <p className="text-xs text-gray-500">
                      Digital Business Cards
                    </p>
                    {user?.subscriptionPlan && (
                      <span className="mt-1 inline-flex items-center text-[11px] font-medium uppercase tracking-wide text-primary-600">
                        {PLAN_LABELS[user.subscriptionPlan] || "Basic (Silver)"}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 active:scale-95"
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <ChevronLeft
                    className={`h-5 w-5 transition-transform duration-300 ${
                      isCollapsed ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 transition-colors duration-150 ${
                      isActive
                        ? "bg-primary-50 text-primary-600 border border-primary-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } ${isCollapsed && !isMobile ? "justify-center px-2" : ""}`}
                    onClick={() => {
                      if (!item.external) {
                        setActiveTab(item.id);
                        navigate(item.path);
                      } else if (item.path) {
                        if (!item.path.startsWith("http")) {
                          navigate(item.path);
                        } else {
                          window.open(
                            item.path,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }
                      }
                      if (isMobile) setIsCollapsed(true);
                    }}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-primary-600" : ""
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {!isCollapsed && user && (
            <div className="mt-auto space-y-4 border-t border-gray-100 px-6 pb-6 pt-6">
              <div className="flex min-h-[72px] items-center space-x-3 rounded-xl bg-gray-50 p-3">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-500"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  {user?.profilePhoto && (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      className="relative z-10 h-full w-full rounded-full border-2 border-white object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user?.name || "—"}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user?.email || "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition hover:bg-black active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                <span>{isCollapsed ? "" : "Log out"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
