import React, { lazy, Suspense, useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/layout/Sidebar";
import {
  PLAN_LABELS,
  getPlanRank,
  normalizePlan,
} from "../../utils/subscriptionPlan";

const Dashboard = lazy(() => import("../../components/dashboard/Dashboard"));
const EditProfile = lazy(() => import("../../components/profile/EditProfile"));
const CompanyDetails = lazy(() => import("../../components/profile/CompanyDetails"));
const MyQRCode = lazy(() => import("../../components/qr/MyQRCode"));
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
    () => normalizePlan(user?.subscriptionPlan),
    [user?.subscriptionPlan]
  );
  const planLabel = PLAN_LABELS[plan] || PLAN_LABELS.basic;
  const planRank = getPlanRank(plan);
  const canUseGallery = planRank >= getPlanRank("basic");
  const canUseQRCode = planRank >= getPlanRank("standard");

  const renderRestrictedFeature = (featureName, requiredPlan = "standard") => {
    const requiredPlanLabel =
      PLAN_LABELS[requiredPlan] || PLAN_LABELS.standard || "Standard";

    return (
      <div className="max-w-3x1 mx-auto mt-16 rounded-3xl border border-white/10 bg-slate-900/70 p-10 text-center shadow-xl shadow-slate-950/50 backdrop-blur">
        <div className="text-2xl font-semibold text-white">
          Upgrade to access {featureName}
        </div>
        <p className="mt-4 text-slate-300">
          Your current plan (
          <span className="font-medium text-primary-300">{planLabel}</span>)
          includes Dashboard, Edit Profile, and Company Details. To unlock the{" "}
          {featureName} feature, upgrade to at least the{" "}
          <span className="font-medium text-slate-50">{requiredPlanLabel}</span>{" "}
          plan.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-center sm:items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-5 py-3 rounded-full border border-white/15 bg-slate-900/60 text-slate-200 transition hover:bg-slate-800/90"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate("/payment")}
            className="px-6 py-3 rounded-full bg-primary-500 text-white font-semibold shadow-lg shadow-primary-500/40 transition hover:bg-primary-400"
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
    return () =>
      window.removeEventListener("resize", checkMobile, { passive: true });
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
        <div className="py-10 text-center text-sm text-gray-500">
          Loading...
        </div>
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
        return canUseGallery
          ? renderWithFallback(<GalleryPage />)
          : renderRestrictedFeature("Gallery", "basic");
      case "qrcode":
        return canUseQRCode
          ? renderWithFallback(<MyQRCode />)
          : renderRestrictedFeature("My QR Code");
      case "refer":
        return renderWithFallback(<ReferPage />);
      default:
        return renderWithFallback(<Dashboard />);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-primary-500/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>
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
        className="relative z-10 p-4 transition-all duration-300 lg:p-6"
      >
        <div className={`${isMobile ? "pt-16" : ""}`}>
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="hover:text-slate-200"
            >
              QR folio Dashboard
            </button>

            {activeTab !== "dashboard" && (
              <>
                <span className="text-slate-600">›</span>
                {activeTab === "profile" && (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/profile")}
                    className="text-primary-300 hover:underline"
                  >
                    Edit Profile
                  </button>
                )}
                {activeTab === "company" && (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/company")}
                    className="text-primary-300 hover:underline"
                  >
                    Company details
                  </button>
                )}
                {activeTab === "qrcode" && (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/qrcode")}
                    className="text-primary-300 hover:underline"
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
              <Route
                path="profile"
                element={renderWithFallback(<EditProfile />)}
              />
              <Route
                path="company"
                element={renderWithFallback(<CompanyDetails />)}
              />
              <Route
                path="gallery"
                element={
                  canUseGallery
                    ? renderWithFallback(<GalleryPage />)
                    : renderRestrictedFeature("Gallery", "basic")
                }
              />
              <Route
                path="qrcode"
                element={
                  canUseQRCode
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
    </div>
  );
};

export default DashboardLayout;
