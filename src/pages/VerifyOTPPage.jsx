import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QrCode, ArrowLeft, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import PageSEO from "../components/PageSEO";

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP, signupData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});
  const [otp, setOTP] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [couponNotice, setCouponNotice] = useState(null);

  const email = location.state?.email || signupData?.email;
  const name = location.state?.name || signupData?.name;

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOTP(value);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    setLoading(true);
    setErrors({});
    setCouponNotice(null);

    try {
      const result = await verifyOTP(email, otp);

      if (result.success) {
        if (result.couponApplied) {
          setCouponNotice({
            type: "success",
            message: "Coupon applied successfully! You now have full access.",
          });
        } else if (result.couponError) {
          setCouponNotice({
            type: "error",
            message: result.couponError,
          });
        }
        if (result.requiresPayment) {
          navigate("/payment");
        } else {
          navigate("/dashboard");
        }
      } else {
        setErrors({
          otp: result.error || "Invalid OTP. Please try again.",
        });
      }
    } catch (err) {
      setErrors({
        otp: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResending(true);
    setErrors({});

    try {
      const result = await resendOTP();

      if (result.success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrors({ submit: result.error || "Failed to resend OTP" });
      }
    } catch (err) {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <PageSEO
        title="Verify email"
        description="Verify your email to activate your QR Folio digital business card account using a 6-digit OTP."
        canonicalPath="/verify-otp"
      />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center py-10 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="relative w-full max-w-md mx-auto">
          <div className="pointer-events-none absolute -z-10 inset-0">
            <div className="absolute -top-24 -right-16 h-52 w-52 rounded-full bg-primary-500/25 blur-3xl" />
            <div className="absolute bottom-0 -left-20 h-52 w-52 rounded-full bg-emerald-500/20 blur-3xl" />
          </div>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="flex items-center space-x-2 text-slate-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to signup</span>
          </button>

          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/40">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">QR Folio</span>
            </div>
            <p className="text-sm text-slate-300">
              We've sent a 6-digit code to
            </p>
            <p className="text-sm font-medium text-primary-300">{email}</p>
          </div>

          <motion.div
            className="mt-1 rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 shadow-xl shadow-slate-950/40 backdrop-blur"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
                Verify Email
              </h2>
              <p className="text-slate-300 text-sm">
                Enter the 6-digit OTP below to continue.
              </p>
            </div>

            {couponNotice && (
              <div
                className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                  couponNotice.type === "success"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-200"
                }`}
              >
                <p>{couponNotice.message}</p>
              </div>
            )}

            {errors.submit && (
              <div className="mb-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10">
                <p className="text-red-300 text-sm">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOTPChange}
                  placeholder="Enter 6-digit OTP"
                  className={`w-full px-4 py-3.5 border rounded-xl text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.otp
                      ? "border-red-500/60 bg-red-500/10 text-red-100"
                      : "border-slate-700 bg-slate-900/60 text-slate-50"
                  }`}
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="mt-2 text-sm text-red-400 text-center">
                    {errors.otp}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary-500 text-white py-3.5 px-6 rounded-xl font-semibold shadow-lg shadow-primary-500/40 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-300 text-sm mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0 || resending}
                className="text-primary-300 hover:text-primary-200 font-medium text-sm disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center space-x-1 mx-auto"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : countdown > 0 ? (
                  <span>Resend in {countdown}s</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend OTP</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
export default VerifyOTPPage;
