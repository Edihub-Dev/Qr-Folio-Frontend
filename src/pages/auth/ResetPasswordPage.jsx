import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api";
import PageSEO from "../../components/seo/PageSEO";
import clsx from "clsx";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = useMemo(() => location.state || {}, [location.state]);
  const identifier = typeof state.identifier === "string" ? state.identifier : "";
  const otp = typeof state.otp === "string" ? state.otp : "";
  const firebaseIdToken = typeof state.firebaseIdToken === "string" ? state.firebaseIdToken : "";

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [showPasswordFields, setShowPasswordFields] = useState({ newPassword: false, confirmPassword: false });

  const togglePasswordVisibility = (field) => {
    setShowPasswordFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!identifier) {
      setErrors({ submit: "Missing reset identifier" });
      return;
    }

    const { newPassword, confirmPassword } = passwords;
    if (!newPassword || newPassword.length < 8) {
      setErrors({ newPassword: "Password must be at least 8 characters long" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    if (!otp && !firebaseIdToken) {
      setErrors({ submit: "Missing OTP verification. Please restart forgot password." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        identifier,
        newPassword,
      };
      if (otp) payload.otp = otp;
      if (firebaseIdToken) payload.firebaseIdToken = firebaseIdToken;

      const res = await api.post("/auth/reset-password", payload);
      if (res.data?.success) {
        navigate("/login", { replace: true });
        return;
      }
      setErrors({ submit: res.data?.message || "Failed to reset password" });
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageSEO
        title="Reset password"
        description="Reset your QR Folio account password securely."
        canonicalPath="/reset-password"
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
            onClick={() => navigate(-1)}
            className={clsx('flex', 'items-center', 'space-x-2', 'text-slate-300', 'hover:text-white', 'mb-6', 'transition-colors')}
          >
            <ArrowLeft className={clsx('w-4', 'h-4')} />
            <span>Back</span>
          </button>

          <div className={clsx('text-center', 'mb-4')}>
            <div className={clsx('flex', 'items-center', 'justify-center', 'space-x-3', 'mb-3')}>
              <div className={clsx('w-12', 'h-12', 'bg-gradient-to-br', 'from-primary-500', 'to-primary-600', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'shadow-lg', 'shadow-primary-500/40')}>
                <QrCode className={clsx('w-7', 'h-7', 'text-white')} />
              </div>
              <span className={clsx('text-2xl', 'font-bold', 'text-white')}>QR Folio</span>
            </div>
            <p className={clsx('text-sm', 'text-slate-300')}>Set a new password for your account.</p>
          </div>

          <motion.div
            className={clsx('mt-1', 'rounded-2xl', 'border', 'border-white/10', 'bg-slate-900/60', 'p-6', 'sm:p-8', 'shadow-xl', 'shadow-slate-950/40', 'backdrop-blur')}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          >
            <h2 className={clsx('text-2xl', 'sm:text-3xl', 'font-bold', 'text-white', 'mb-3')}>Reset Password</h2>

            {errors.submit && (
              <div className={clsx('mb-4', 'p-4', 'rounded-xl', 'border', 'border-red-500/40', 'bg-red-500/10')}>
                <p className={clsx('text-red-300', 'text-sm')}>{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <input
                  type={showPasswordFields.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  autoComplete="new-password"
                  placeholder="New Password"
                  className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12 ${
                    errors.newPassword ? "border-red-500/60 bg-red-500/10" : "border-slate-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  className={clsx('absolute', 'inset-y-0', 'right-3', 'flex', 'items-center', 'text-slate-400', 'hover:text-slate-200')}
                >
                  {showPasswordFields.newPassword ? (
                    <EyeOff className={clsx('w-5', 'h-5')} />
                  ) : (
                    <Eye className={clsx('w-5', 'h-5')} />
                  )}
                </button>
              </div>
              {errors.newPassword && <p className={clsx('text-sm', 'text-red-400')}>{errors.newPassword}</p>}

              <div className="relative">
                <input
                  type={showPasswordFields.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12 ${
                    errors.confirmPassword ? "border-red-500/60 bg-red-500/10" : "border-slate-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className={clsx('absolute', 'inset-y-0', 'right-3', 'flex', 'items-center', 'text-slate-400', 'hover:text-slate-200')}
                >
                  {showPasswordFields.confirmPassword ? (
                    <EyeOff className={clsx('w-5', 'h-5')} />
                  ) : (
                    <Eye className={clsx('w-5', 'h-5')} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className={clsx('text-sm', 'text-red-400')}>{errors.confirmPassword}</p>}

              <button
                type="submit"
                disabled={loading}
                className={clsx('w-full', 'bg-primary-500', 'text-white', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default ResetPasswordPage;
