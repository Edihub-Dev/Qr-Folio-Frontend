import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import EditProfile from "../components/EditProfile";
import CompanyDetails from "../components/CompanyDetails";
import MyQRCode from "../components/MyQRCode";

const DashboardLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "");
    if (path.endsWith("/dashboard") || path.endsWith("/dashboard/")) setActiveTab("dashboard");
    else if (path.includes("/dashboard/profile")) setActiveTab("profile");
    else if (path.includes("/dashboard/company")) setActiveTab("company");
    else if (path.includes("/dashboard/qrcode")) setActiveTab("qrcode");
  }, [location.pathname]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "profile":
        return <EditProfile />;
      case "company":
        return <CompanyDetails />;
      case "qrcode":
        return <MyQRCode />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
      />

      <motion.main
        animate={{
          marginLeft: isMobile ? 0 : isCollapsed ? 80 : 280,
        }}
        className="transition-all duration-300 p-4 lg:p-6"
      >
        <div className={`${isMobile ? "pt-16" : ""}`}>
          <div className="text-sm text-gray-500 flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="hover:text-gray-700"
            >
              QR folio Dashboard
            </button>

            {activeTab !== "dashboard" && (
              <>
                <span className="text-gray-400">›</span>
                {activeTab === "profile" && (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/profile")}
                    className="text-primary-600 hover:underline"
                  >
                    Edit Profile
                  </button>
                )}
                {activeTab === "company" && (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/company")}
                    className="text-primary-600 hover:underline"
                  >
                    Company details
                  </button>
                )}
                {activeTab === "qrcode" && (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/qrcode")}
                    className="text-primary-600 hover:underline"
                  >
                    My QR Code
                  </button>
                )}
              </>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route index element={renderContent()} />
                <Route path="profile" element={<EditProfile />} />
                <Route path="company" element={<CompanyDetails />} />
                <Route path="qrcode" element={<MyQRCode />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-100 to-transparent rounded-full opacity-30 animate-bounce-subtle"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-100 to-transparent rounded-full opacity-30 animate-bounce-subtle"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>
    </div>
  );
};

export default DashboardLayout;
