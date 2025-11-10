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
import { motion } from "framer-motion";
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
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-lg p-2 shadow-lg border border-gray-200"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </motion.button>
      )}

      {isMobile && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        />
      )}

      <motion.div
        initial={false}
        animate={{
          width: isCollapsed ? (isMobile ? 0 : 80) : 280,
          x: isMobile && isCollapsed ? -280 : 0,
        }}
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-xl z-40
          ${isMobile ? "w-80" : ""}
          ${isCollapsed && !isMobile ? "overflow-hidden" : ""}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
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
                </motion.div>
              )}
              {!isMobile && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isCollapsed ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? "bg-primary-50 text-primary-600 border border-primary-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                      ${isCollapsed && !isMobile ? "justify-center px-2" : ""}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-primary-600" : ""
                      }`}
                    />
                    {(!isCollapsed || isMobile) && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {(!isCollapsed || isMobile) && user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-t border-gray-100"
            >
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-full">
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
                      className="w-full h-full rounded-full object-cover border-2 border-white relative z-10"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || "—"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || "—"}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center space-x-3 px-4 py-3 mt-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
