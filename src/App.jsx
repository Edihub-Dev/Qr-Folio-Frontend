import React, { Suspense, lazy, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { setupConsoleFilter } from "./utils/consoleFilter";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import PaymentPage from "./pages/payment/PaymentPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const PublicProfilePage = lazy(() => import("./pages/public/PublicProfilePage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage")
);
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminExportsPage = lazy(() => import("./pages/admin/AdminExportsPage"));
const AdminInvoicesPage = lazy(() => import("./pages/admin/AdminInvoicesPage"));
const AdminReferralsPage = lazy(() =>
  import("./pages/admin/AdminReferralsPage")
);
const AdminWithdrawalsPage = lazy(() =>
  import("./pages/admin/AdminWithdrawalsPage")
);
const AdminCouponsPage = lazy(() => import("./pages/admin/AdminCouponsPage"));
const AdminUserRewardsPage = lazy(() =>
  import("./pages/admin/AdminUserRewardsPage")
);
const AdminRewardUnlockPage = lazy(() =>
  import("./pages/admin/AdminRewardUnlockPage")
);
const AdminNfcPage = lazy(() => import("./pages/admin/AdminNfcPage"));
const AdminPublicProfilesPage = lazy(() =>
  import("./pages/admin/AdminPublicProfilesPage")
);
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsConditions from "./pages/legal/TermsConditions";
import RefundPolicy from "./pages/legal/RefundPolicy";
// import PhonePeDemoPage from "./pages/PhonePeDemoPage";
import PaymentStatusPage from "./pages/payment/PaymentStatusPage";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFailure from "./pages/payment/PaymentFailure";
import ChainpayCheckout from "./pages/payment/ChainpayCheckout";
import MaintenancePage from "./pages/misc/MaintenancePage";
// import MatrimonialLoginPage from "./pages/MatrimonialLoginPage";
// import MatrimonialProfileForm from "./pages/MatrimonialProfileForm";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = `${location.pathname}${location.search}`;

  const redirectPath = useMemo(() => {
    if (loading) {
      return null;
    }
    if (!user) {
      if (location.pathname.startsWith("/login")) {
        return null;
      }
      return `/login?returnTo=${encodeURIComponent(currentPath)}`;
    }
    if (!user.isVerified) {
      if (location.pathname.startsWith("/login")) {
        return null;
      }
      return "/login";
    }
    if (requireAdmin) {
      if (user.role !== "admin") {
        return "/";
      }
    }

    const requiresRenewal =
      Boolean(user.requiresRenewal) || Boolean(user.planExpired);

    if ((requiresRenewal || !user.isPaid) && !requireAdmin) {
      if (location.pathname === "/payment") {
        return null;
      }
      return "/payment";
    }
    return null;
  }, [loading, user, currentPath, location.pathname, requireAdmin]);

  useEffect(() => {
    if (!loading && redirectPath && currentPath !== redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [loading, redirectPath, currentPath, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (redirectPath && currentPath !== redirectPath) {
    return null;
  }

  return children;
};

const PublicRoute = ({ children, authPage = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !authPage || !user || !user.isVerified) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get("returnTo");
    const hasValidReturn = returnTo && returnTo.startsWith("/");

    const requiresRenewal =
      Boolean(user.requiresRenewal) || Boolean(user.planExpired);
    const targetPath =
      !requiresRenewal && user.isPaid
        ? hasValidReturn
          ? returnTo
          : "/dashboard"
        : "/payment";

    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [loading, authPage, user, location.pathname, location.search, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (authPage && user && user.isVerified) {
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get("returnTo");
    const hasValidReturn = returnTo && returnTo.startsWith("/");
    const targetPath = user.isPaid
      ? hasValidReturn
        ? returnTo
        : "/dashboard"
      : "/payment";

    if (location.pathname !== targetPath) {
      return null;
    }
  }

  return children;
};

const SetupRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const isUpgradeFlow = params.has("upgrade");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} />;
  }

  const requiresRenewal =
    Boolean(user.requiresRenewal) || Boolean(user.planExpired);
  const hasSatisfiedPayment = user.isPaid && !requiresRenewal;

  if (hasSatisfiedPayment && !isUpgradeFlow) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  useEffect(() => {
    const cleanup = setupConsoleFilter();
    return cleanup;
  }, []);

  const maintenanceMode =
    (import.meta.env?.VITE_MAINTENANCE_MODE ?? "false")
      .toString()
      .toLowerCase() === "true";

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
              </div>
            }
          >
            {maintenanceMode ? (
              <Routes>
                <Route path="*" element={<MaintenancePage />} />
              </Routes>
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <LandingPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicRoute authPage>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <SignupPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/payment"
                  element={
                    <SetupRoute>
                      <PaymentPage />
                    </SetupRoute>
                  }
                />
                {/* <Route path="/phonepe-demo" element={<PhonePeDemoPage />} /> */}
                <Route path="/payment-status" element={<PaymentStatusPage />} />
                <Route path="/success" element={<PaymentSuccess />} />
                <Route path="/failure" element={<PaymentFailure />} />
                <Route
                  path="/checkout/chainpay/:orderId"
                  element={<ChainpayCheckout />}
                />
                <Route path="/verify-otp" element={<VerifyOTPPage />} />
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                <Route path="/RefundPolicy" element={<RefundPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />

                {/* <Route path="/matrimonial-login" element={<MatrimonialLoginPage />} />
                <Route path="/create-matrimonial-profile" element={<MatrimonialProfileForm />} /> */}

                <Route path="/profile/:id" element={<PublicProfilePage />} />

                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route
                    path="public-profiles"
                    element={<AdminPublicProfilesPage />}
                  />
                  <Route path="exports" element={<AdminExportsPage />} />
                  <Route path="invoices" element={<AdminInvoicesPage />} />
                  <Route path="refer" element={<AdminReferralsPage />} />
                  <Route path="nfc" element={<AdminNfcPage />} />
                  <Route path="coupons" element={<AdminCouponsPage />} />
                  <Route path="user-rewards" element={<AdminUserRewardsPage />} />
                  <Route path="reward-unlock" element={<AdminRewardUnlockPage />} />
                  <Route
                    path="withdrawals"
                    element={<AdminWithdrawalsPage />}
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            )}
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
