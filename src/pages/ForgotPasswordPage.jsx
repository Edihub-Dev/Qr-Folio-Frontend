// frontend/src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, ArrowLeft, Eye, EyeOff } from "lucide-react";
import api from "../api";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [showPasswordFields, setShowPasswordFields] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data?.success || res.status === 200) {
        setStep(2);
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
      const res = await api.post("/auth/verify-reset-otp", { email, otp: otpString });
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
    if (!newPassword || newPassword.length < 6) {
      setErrors({ newPassword: "Password must be at least 6 characters long" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { email, otp: otp.trim(), newPassword });
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">QR Folio</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h2>
          <p className="text-gray-600 mb-6">{step === 1 ? "Enter your email to receive an OTP" : step === 2 ? "Enter the OTP sent to your email" : "Set your new password"}</p>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.email ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                }`}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Enter the 6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className={`w-full px-4 py-4 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                    errors.otp ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                  }`}
                />
                {errors.otp && <p className="mt-2 text-center text-sm text-red-600">{errors.otp}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="relative">
                <input
                  type={showPasswordFields.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="New Password"
                  className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                    errors.newPassword ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPasswordFields.newPassword ? "Hide new password" : "Show new password"}
                >
                  {showPasswordFields.newPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword}</p>}

              <div className="relative">
                <input
                  type={showPasswordFields.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm Password"
                  className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                    errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPasswordFields.confirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showPasswordFields.confirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
