import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QrCode, ArrowLeft, Eye, EyeOff } from "lucide-react";
import api from "../api";

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const referralCode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("ref") || params.get("coupon") || "";
  }, [location.search]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    couponCode: referralCode,
  });
  const [showPasswordFields, setShowPasswordFields] = useState({
    password: false,
    confirmPassword: false,
  });
  const [referralState, setReferralState] = useState({
    status: referralCode ? "loading" : "idle",
    info: null,
    message: "",
  });
  const lastValidatedRef = useRef("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "couponCode") {
      setReferralState((prev) =>
        prev.status === "valid" || prev.status === "invalid"
          ? { status: "idle", info: null, message: "" }
          : prev
      );
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswordFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateReferral = useCallback(
    async (code, { isAutoPrefill = false } = {}) => {
      const trimmed = (code || "").trim().toUpperCase();
      if (!trimmed) {
        lastValidatedRef.current = "";
        setReferralState({ status: "idle", info: null, message: "" });
        return;
      }

      if (trimmed === lastValidatedRef.current && referralState.status !== "idle") {
        return;
      }

      setReferralState({ status: "loading", info: null, message: "" });
      try {
        const { data } = await api.get(`/auth/referrals/${trimmed}/validate`);
        if (data?.success) {
          lastValidatedRef.current = trimmed;
          setReferralState({
            status: "valid",
            info: data.data,
            message: "",
          });
          if (!formData.couponCode) {
            setFormData((prev) => ({ ...prev, couponCode: trimmed }));
          }
        } else {
          throw new Error(data?.message || "Invalid referral code");
        }
      } catch (error) {
        lastValidatedRef.current = "";
        setReferralState({
          status: "invalid",
          info: null,
          message: error?.response?.data?.message || error.message || "Invalid referral code",
        });
        if (isAutoPrefill) {
          setFormData((prev) => ({ ...prev, couponCode: "" }));
        }
      }
    },
    [formData.couponCode, referralState.status]
  );

  useEffect(() => {
    if (referralCode) {
      setFormData((prev) => ({ ...prev, couponCode: referralCode }));
      validateReferral(referralCode, { isAutoPrefill: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralCode]);

  const handleCouponBlur = () => {
    const current = formData.couponCode;
    if (!current) {
      setReferralState({ status: "idle", info: null, message: "" });
      lastValidatedRef.current = "";
      return;
    }
    validateReferral(current);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const { name, email, password, confirmPassword, couponCode } = formData;
      const result = await signup({
        name,
        email,
        password,
        confirmPassword,
        couponCode: couponCode?.trim() || undefined,
      });

      if (result.success) {
        // Navigate to OTP page
        navigate("/verify-otp", { state: { email, name, couponCode } });
      } else {
        setErrors({ submit: result.error || "Signup failed" });
      }
    } catch (err) {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-1"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">QR Folio</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Signup</h2>
          <p className="text-gray-600 mb-6">to get started</p>

          {referralState.status === "loading" && (
            <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              Validating referral code…
            </div>
          )}

          {referralState.status === "valid" && referralState.info && (
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              You were referred by{" "}
              <span className="font-semibold">
                {referralState.info.referrerName || "a QR Folio member"}
              </span>
              {referralState.info.referralCode && (
                <span>
                  {" "}- referral code {referralState.info.referralCode}
                </span>
              )}
            </div>
          )}

          {referralState.status === "invalid" && (
            <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {referralState.message || "The referral code provided is invalid or expired."}
            </div>
          )}

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.name
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.email
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}

            <div className="relative">
              <input
                type={showPasswordFields.password ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                  errors.password
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("password")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={
                  showPasswordFields.password
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPasswordFields.password ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}

            <div className="relative">
              <input
                type={showPasswordFields.confirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm Password"
                className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                  errors.confirmPassword
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirmPassword")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={
                  showPasswordFields.confirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showPasswordFields.confirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}

            <div>
              <input
                type="text"
                name="couponCode"
                value={formData.couponCode}
                onChange={handleInputChange}
                onBlur={handleCouponBlur}
                placeholder="Coupon Code (optional)"
                className="w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-200 bg-gray-50"
              />
              {errors.couponCode && (
                <p className="mt-1 text-sm text-red-600">{errors.couponCode}</p>
              )}
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-600">
                Agree to our{" "}
                <button
                  type="button"
                  onClick={() => window.open("/terms", "_blank")}
                  className="text-blue-600 hover:underline"
                >
                  terms and conditions
                </button>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Continue"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already registered?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              Login
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
