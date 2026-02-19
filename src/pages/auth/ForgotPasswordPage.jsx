// frontend/src/pages/auth/ForgotPasswordPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api";
import PageSEO from "../../components/seo/PageSEO";
import clsx from "clsx";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordFields, setShowPasswordFields] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const isEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || "").trim());

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    const raw = identifier.trim();
    if (!raw) {
      setErrors({ identifier: "Email is required" });
      return;
    }
    if (!isEmail(raw)) {
      setErrors({ identifier: "Email is invalid" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: raw });
      if (res.data?.success || res.status === 200) {
        setStep(2);
        setResendCountdown(60);
      } else {
        setErrors({ submit: res.data?.message || "Failed to send OTP" });
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswordFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  useEffect(() => {
    if (step !== 2) return;
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown, step]);

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    setErrors({});
    try {
      const raw = identifier.trim();
      const res = await api.post("/auth/forgot-password", { email: raw });
      if (res.data?.success || res.status === 200) {
        setResendCountdown(60);
      } else {
        setErrors({ submit: res.data?.message || "Failed to resend OTP" });
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || err.message });
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    const otpString = otp.trim();
    if (otpString.length !== 6) {
      setErrors({ otp: "Please enter all 6 digits." });
      return;
    }
    setLoading(true);
    try {
      const raw = identifier.trim();
      const res = await api.post("/auth/verify-reset-otp", {
        email: raw,
        otp: otpString,
      });
      if (res.data?.success) {
        setStep(3);
      } else {
        setErrors({ otp: res.data?.message || "Invalid OTP" });
      }
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    const { newPassword, confirmPassword } = passwords;
    if (!newPassword || newPassword.length < 8) {
      setErrors({ newPassword: "Password must be at least 8 characters long" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });
      if (res.data?.success) {
        navigate("/login");
      } else {
        setErrors({ submit: res.data?.message || "Failed to reset password" });
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setOtp(sanitized);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
  };

  return (
    <>
      <PageSEO
        title="Forgot password"
        description="Reset your QR Folio account password securely using email and a one-time passcode (OTP)."
        canonicalPath="/forgot-password"
      />
      <motion.div
        className={clsx('min-h-screen', 'overflow-x-hidden', 'bg-gradient-to-br', 'from-slate-950', 'via-slate-900', 'to-slate-950', 'text-white', 'flex', 'items-center', 'py-10', 'px-4', 'sm:px-6', 'lg:px-8')}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className={clsx('relative', 'w-full', 'max-w-md', 'mx-auto')}>
          <div className={clsx('pointer-events-none', 'absolute', '-z-10', 'inset-0')}>
            <div className={clsx('absolute', '-top-24', '-right-16', 'h-52', 'w-52', 'rounded-full', 'bg-primary-500/25', 'blur-3xl')} />
            <div className={clsx('absolute', 'bottom-0', '-left-20', 'h-52', 'w-52', 'rounded-full', 'bg-emerald-500/20', 'blur-3xl')} />
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className={clsx('flex', 'items-center', 'space-x-2', 'text-slate-300', 'hover:text-white', 'mb-6', 'transition-colors')}
          >
            <ArrowLeft className={clsx('w-4', 'h-4')} />
            <span>Back to home</span>
          </button>

          <div className={clsx('text-center', 'mb-4')}>
            <div className={clsx('flex', 'items-center', 'justify-center', 'space-x-3', 'mb-3')}>
              <div className={clsx('w-12', 'h-12', 'bg-gradient-to-br', 'from-primary-500', 'to-primary-600', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'shadow-lg', 'shadow-primary-500/40')}>
                <QrCode className={clsx('w-7', 'h-7', 'text-white')} />
              </div>
              <span className={clsx('text-2xl', 'font-bold', 'text-white')}>QR Folio</span>
            </div>
            <p className={clsx('text-sm', 'text-slate-300')}>
              {step === 1
                ? "Enter your email to receive a reset code."
                : step === 2
                ? "Enter the 6-digit code we sent you."
                : "Set a new password for your account."}
            </p>
          </div>

          <motion.div
            className={clsx('mt-1', 'rounded-2xl', 'border', 'border-white/10', 'bg-slate-900/60', 'p-6', 'sm:p-8', 'shadow-xl', 'shadow-slate-950/40', 'backdrop-blur')}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          >
            <h2 className={clsx('text-2xl', 'sm:text-3xl', 'font-bold', 'text-white', 'mb-3')}>
              {step === 1
                ? "Forgot Password"
                : step === 2
                ? "Verify OTP"
                : "Reset Password"}
            </h2>

            {errors.submit && (
              <div className={clsx('mb-4', 'p-4', 'rounded-xl', 'border', 'border-red-500/40', 'bg-red-500/10')}>
                <p className={clsx('text-red-300', 'text-sm')}>{errors.submit}</p>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <input
                    type="text"
                    name="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email"
                    className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.identifier
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-slate-700"
                    }`}
                  />
                  {errors.identifier && (
                    <p className={clsx('mt-1', 'text-sm', 'text-red-400')}>{errors.identifier}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={clsx('w-full', 'bg-primary-500', 'text-white', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className={clsx('block', 'text-xs', 'uppercase', 'tracking-wide', 'text-slate-400', 'mb-2', 'text-center')}>
                    Enter the 6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className={`w-full px-4 py-3.5 text-center text-xl font-mono tracking-[0.4em] rounded-xl border bg-slate-900/60 text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.otp
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-slate-700"
                    }`}
                  />
                  {errors.otp && (
                    <p className={clsx('mt-2', 'text-center', 'text-sm', 'text-red-400')}>
                      {errors.otp}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={clsx('w-full', 'bg-primary-500', 'text-white', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resending || resendCountdown > 0}
                  className={clsx('w-full', 'border', 'border-white/10', 'text-slate-200', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'hover:bg-white/5', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                >
                  {resending
                    ? "Resending OTP..."
                    : resendCountdown > 0
                    ? `Resend OTP in ${resendCountdown}s`
                    : "Resend OTP"}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="relative">
                  <input
                    type={showPasswordFields.newPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    placeholder="New Password"
                    className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12 ${
                      errors.newPassword
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-slate-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("newPassword")}
                    className={clsx('absolute', 'inset-y-0', 'right-3', 'flex', 'items-center', 'text-slate-400', 'hover:text-slate-200')}
                    aria-label={
                      showPasswordFields.newPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showPasswordFields.newPassword ? (
                      <EyeOff className={clsx('w-5', 'h-5')} />
                    ) : (
                      <Eye className={clsx('w-5', 'h-5')} />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className={clsx('text-sm', 'text-red-400')}>{errors.newPassword}</p>
                )}

                <div className="relative">
                  <input
                    type={
                      showPasswordFields.confirmPassword ? "text" : "password"
                    }
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    placeholder="Confirm Password"
                    className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12 ${
                      errors.confirmPassword
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-slate-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    className={clsx('absolute', 'inset-y-0', 'right-3', 'flex', 'items-center', 'text-slate-400', 'hover:text-slate-200')}
                    aria-label={
                      showPasswordFields.confirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showPasswordFields.confirmPassword ? (
                      <EyeOff className={clsx('w-5', 'h-5')} />
                    ) : (
                      <Eye className={clsx('w-5', 'h-5')} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className={clsx('text-sm', 'text-red-400')}>
                    {errors.confirmPassword}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={clsx('w-full', 'bg-primary-500', 'text-white', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
export default ForgotPasswordPage;
