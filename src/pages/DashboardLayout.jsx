import React, { lazy, Suspense, useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { PLAN_LABELS, getPlanRank } from "../utils/subscriptionPlan";

const Dashboard = lazy(() => import("../components/Dashboard"));
const EditProfile = lazy(() => import("../components/EditProfile"));
const CompanyDetails = lazy(() => import("../components/CompanyDetails"));
const MyQRCode = lazy(() => import("../components/MyQRCode"));
const ReferPage = lazy(() => import("./ReferPage"));
const GalleryPage = lazy(() => import("./GalleryPage"));

const DashboardLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const plan = useMemo(
    () => (user?.subscriptionPlan || "basic").toLowerCase(),
    [user?.subscriptionPlan]
  );
  const planLabel = PLAN_LABELS[plan] || PLAN_LABELS.basic;
  const isStandardOrHigher = getPlanRank(plan) >= getPlanRank("standard");

  const renderRestrictedFeature = (featureName, requiredPlan = "standard") => {
    const requiredPlanLabel =
      PLAN_LABELS[requiredPlan] || PLAN_LABELS.standard || "Standard";

    return (
      <div className="max-w-3x1  mx-auto mt-16 p-10 bg-white border border-gray-200 rounded-3xl shadow-lg text-center">
        <div className="text-2xl font-semibold text-gray-900">
          Upgrade to access {featureName}
        </div>
        <p className="mt-4 text-gray-600">
          Your current plan (
          <span className="font-medium text-primary-600">{planLabel}</span>)
          includes Dashboard, Edit Profile, and Company Details. To unlock the{" "}
          {featureName} feature, upgrade to at least the{" "}
          <span className="font-medium">{requiredPlanLabel}</span> plan.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-center sm:items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-5 py-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate("/payment")}
            className="px-6 py-3 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-700 transition shadow"
          >
            View Plans & Upgrade
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile, { passive: true });
  }, []);

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "");
    if (path.endsWith("/dashboard") || path.endsWith("/dashboard/"))
      setActiveTab("dashboard");
    else if (path.includes("/dashboard/profile")) setActiveTab("profile");
    else if (path.includes("/dashboard/company")) setActiveTab("company");
    else if (path.includes("/dashboard/qrcode")) setActiveTab("qrcode");
    else if (path.includes("/dashboard/refer")) setActiveTab("refer");
  }, [location.pathname]);

  const renderWithFallback = (node) => (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm text-gray-500">Loading...</div>
      }
    >
      {node}
    </Suspense>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderWithFallback(<Dashboard />);
      case "profile":
        return renderWithFallback(<EditProfile />);
      case "company":
        return renderWithFallback(<CompanyDetails />);
      case "gallery":
        return isStandardOrHigher ? (
          renderWithFallback(<GalleryPage />)
        ) : (
          renderRestrictedFeature("Gallery")
        );
      case "qrcode":
        return isStandardOrHigher ? (
          renderWithFallback(<MyQRCode />)
        ) : (
          renderRestrictedFeature("My QR Code")
        );
      case "refer":
        return renderWithFallback(<ReferPage />);
      default:
        return renderWithFallback(<Dashboard />);
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

      <main
        style={{
          marginLeft: isMobile ? 0 : isCollapsed ? 80 : 280,
          transition: "margin-left 0.3s ease",
        }}
        className="p-4 transition-all duration-300 lg:p-6"
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

          <div className="transition-opacity duration-200">
            <Routes>
              <Route index element={renderContent()} />
              <Route path="profile" element={renderWithFallback(<EditProfile />)} />
              <Route path="company" element={renderWithFallback(<CompanyDetails />)} />
              <Route
                path="gallery"
                element={
                  isStandardOrHigher
                    ? renderWithFallback(<GalleryPage />)
                    : renderRestrictedFeature("Gallery")
                }
              />
              <Route
                path="qrcode"
                element={
                  isStandardOrHigher
                    ? renderWithFallback(<MyQRCode />)
                    : renderRestrictedFeature("My QR Code")
                }
              />
              <Route path="refer" element={renderWithFallback(<ReferPage />)} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      </main>

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
