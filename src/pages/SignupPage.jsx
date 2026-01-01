import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QrCode, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api";
import PageSEO from "../components/PageSEO";

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const referralSource = useMemo(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("ref")) return "ref";
    if (params.get("coupon")) return "coupon";
    return "";
  }, [location.search]);

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
    async (code, { isAutoPrefill = false, source } = {}) => {
      const trimmed = (code || "").trim().toUpperCase();
      if (!trimmed) {
        lastValidatedRef.current = "";
        setReferralState({ status: "idle", info: null, message: "" });
        return;
      }

      if (
        trimmed === lastValidatedRef.current &&
        referralState.status !== "idle"
      ) {
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
        if (source === "ref") {
          setReferralState({
            status: "invalid",
            info: null,
            message:
              error?.response?.data?.message ||
              error.message ||
              "Invalid referral code",
          });
          if (isAutoPrefill) {
            setFormData((prev) => ({ ...prev, couponCode: "" }));
          }
        } else {
          // For coupon-only flows or manual input, treat an invalid referral
          // validation as "no referral" and do not show a referral-specific
          // error message.
          setReferralState({ status: "idle", info: null, message: "" });
        }
      }
    },
    [formData.couponCode, referralState.status]
  );

  useEffect(() => {
    if (referralCode) {
      setFormData((prev) => ({ ...prev, couponCode: referralCode }));
      validateReferral(referralCode, {
        isAutoPrefill: true,
        source: referralSource,
      });
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
    <>
      <PageSEO
        title="Sign up"
        description="Create your QR Folio digital business card in minutes and share a single smart QR across all your profiles."
        keywords={[
          "qr folio signup",
          "create digital business card",
          "qr portfolio signup",
          "online visiting card registration",
        ]}
        canonicalPath="/signup"
      />
      <motion.div
        className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center py-10 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="relative w-full max-w-6xl mx-auto">
          <div className="pointer-events-none absolute -z-10 inset-0">
            <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-primary-500/25 blur-3xl" />
            <div className="absolute bottom-0 -left-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center space-x-2 text-slate-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </button>

          <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-between gap-10 lg:gap-16">
            <motion.div
              className="flex-1 max-w-xl text-center lg:text-left space-y-6 order-2 lg:order-1"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs sm:text-sm text-slate-200">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary-400" />
                <span>Create your QR Folio in minutes</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-normal">
                <span className="block">Turn your profile into</span>
                <span className="mt-1 block pb-2 bg-gradient-to-r from-primary-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  a scannable QR identity
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto lg:mx-0">
                Share a single smart QR instead of dozens of links. Perfect for
                creators, professionals, and brands.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-200">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium">Premium QR portfolio</p>
                    <p className="text-slate-400">
                      Beautiful, responsive profile pages designed to impress.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </div>
                  <div>
                    <p className="font-medium">Smart link management</p>
                    <p className="text-slate-400">
                      Update your links and info anytime without reprinting
                      cards.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto lg:mx-0">
                Ideal for NFC cards, resumes, portfolios, and social profiles –
                all connected through a single smart QR.
              </p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-200 max-w-lg mx-auto lg:mx-0">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left">
                  <p className="font-semibold text-white">2K+</p>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    active users
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left">
                  <p className="font-semibold text-white">10+</p>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    industries served
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left col-span-2 sm:col-span-1">
                  <p className="font-semibold text-white">Live</p>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    updates anytime
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="flex-1 max-w-xl w-full space-y-4 flex flex-col lg:-mt-12 order-1 lg:order-2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/40">
                    <QrCode className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">
                    QR Folio
                  </span>
                </div>
              </div>

              <motion.div
                className="mt-0 flex flex-col max-w-sm sm:max-w-md w-full mx-auto rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-4 shadow-xl shadow-slate-950/40 backdrop-blur"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
                  Signup
                </h2>
                <p className="text-slate-300 mb-4">to get started</p>

                {referralState.status === "loading" && (
                  <div className="mb-3 rounded-2xl border border-primary-500/40 bg-primary-500/10 px-4 py-3 text-sm text-primary-200">
                    Validating referral code…
                  </div>
                )}

                {referralState.status === "valid" && referralState.info && (
                  <div className="mb-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    <p className="font-semibold mb-0.5">
                      Referral code applied successfully.
                    </p>
                    <p>
                      You were referred by{" "}
                      <span className="font-semibold">
                        {referralState.info.referrerName || "a QR Folio member"}
                      </span>
                      {referralState.info.referralCode && (
                        <span>
                          {" "}
                          - referral code {referralState.info.referralCode}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {referralState.status === "invalid" && (
                  <div className="mb-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {referralState.message ||
                      "The referral code provided is invalid or expired."}
                  </div>
                )}

                {errors.submit && (
                  <div className="mb-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10">
                    <p className="text-red-300 text-sm">{errors.submit}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.name
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-slate-700"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400">{errors.name}</p>
                  )}

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.email
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-slate-700"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-400">{errors.email}</p>
                  )}

                  <div className="relative">
                    <input
                      type={showPasswordFields.password ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      placeholder="Password"
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12 ${
                        errors.password
                          ? "border-red-500/60 bg-red-500/10"
                          : "border-slate-700"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("password")}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
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
                    <p className="text-sm text-red-400">{errors.password}</p>
                  )}

                  <div className="relative">
                    <input
                      type={
                        showPasswordFields.confirmPassword ? "text" : "password"
                      }
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      placeholder="Confirm Password"
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12 ${
                        errors.confirmPassword
                          ? "border-red-500/60 bg-red-500/10"
                          : "border-slate-700"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        togglePasswordVisibility("confirmPassword")
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
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
                    <p className="text-sm text-red-400">
                      {errors.confirmPassword}
                    </p>
                  )}

                  <div>
                    <input
                      type="text"
                      name="couponCode"
                      value={formData.couponCode}
                      onChange={handleInputChange}
                      onBlur={handleCouponBlur}
                      placeholder="Coupon Code (optional)"
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.couponCode
                          ? "border-red-500/60 bg-red-500/10"
                          : "border-slate-700"
                      }`}
                    />
                    {errors.couponCode && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.couponCode}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 text-primary-500 border-slate-600 rounded bg-slate-900 focus:ring-primary-500"
                    />
                    <label className="text-sm text-slate-300">
                      Agree to our{" "}
                      <button
                        type="button"
                        onClick={() => window.open("/terms", "_blank")}
                        className="text-primary-400 hover:text-primary-300 hover:underline"
                      >
                        terms and conditions
                      </button>
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <p className="text-sm text-red-400">
                      {errors.agreeToTerms}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-500 text-white py-3.5 px-6 rounded-xl font-semibold shadow-lg shadow-primary-500/40 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Account..." : "Continue"}
                  </button>
                </form>

                <p className="mt-6 text-center text-slate-300">
                  Already registered?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-primary-400 hover:text-primary-300 hover:underline font-medium"
                  >
                    Login
                  </button>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
export default SignupPage;
