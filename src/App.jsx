import React, { useEffect, useMemo } from "react";
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
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PaymentPage from "./pages/PaymentPage";
import VerifyOTPPage from "./pages/VerifyOTPPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardLayout from "./pages/DashboardLayout";
import PublicProfilePage from "./pages/PublicProfilePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import PhonePeDemoPage from "./pages/PhonePeDemoPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";

const ProtectedRoute = ({ children }) => {
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
    if (!user.isPaid) {
      if (location.pathname === "/payment") {
        return null;
      }
      return "/payment";
    }
    return null;
  }, [loading, user, currentPath, location.pathname]);

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

    const targetPath = user.isPaid
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

  if (!user) return <Navigate to="/login" />;
  if ((user.hasCompletedSetup || user.isPaid) && !isUpgradeFlow)
    return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  useEffect(() => {
    const cleanup = setupConsoleFilter();
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
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
                <PublicRoute authPage>
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
            <Route path="/phonepe-demo" element={<PhonePeDemoPage />} />
            <Route path="/payment-status" element={<PaymentStatusPage />} />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/failure" element={<PaymentFailure />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/RefundPolicy" element={<RefundPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />

            <Route path="/profile/:id" element={<PublicProfilePage />} />

            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
