import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { QrCode, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { firebaseAuth } from "../../firebase";
import PageSEO from "../../components/seo/PageSEO";
import clsx from "clsx";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, mobileOtpLogin, logout, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const hasLoggedOut = useRef(false);
  const logoutRef = useRef(logout);

  const [activeTab, setActiveTab] = useState("password");
  const [phoneSession, setPhoneSession] = useState(null);
  const [phoneOtp, setPhoneOtp] = useState("");

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    let isMounted = true;

    if (isInitialized || authLoading) {
      return () => {
        isMounted = false;
      };
    }

    const ensureLoggedOut = async () => {
      if (!hasLoggedOut.current) {
        hasLoggedOut.current = true;
        try {
          await logoutRef.current?.();
        } catch (logoutErr) {
          console.warn("Login initialization logout failed", logoutErr);
        }
      }

      if (isMounted) {
        setIsInitialized(true);
      }
    };

    ensureLoggedOut();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, navigate, isInitialized]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (activeTab === "password") {
      if (!formData.identifier.trim()) {
        newErrors.identifier = "Email or mobile number is required";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    } else {
      const digits = String(formData.phone || "").replace(/\D/g, "").slice(-10);
      if (!digits || digits.length !== 10) {
        newErrors.phone = "Enter a valid 10-digit mobile number";
      }
      if (phoneSession && (!phoneOtp || phoneOtp.trim().length !== 6)) {
        newErrors.phoneOtp = "Enter the 6-digit OTP";
      }
    }

    return newErrors;
  };

  const ensureRecaptcha = async () => {
    const container = document.getElementById("recaptcha-container-login");
    if (!container) throw new Error("reCAPTCHA container not found");
    container.innerHTML = "";
    const child = document.createElement("div");
    container.appendChild(child);
    const verifier = new RecaptchaVerifier(firebaseAuth, child, { size: "invisible" });
    await verifier.render();
    return verifier;
  };

  const sendPhoneOtp = async () => {
    setErrors({});
    const digits = String(formData.phone || "").replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setErrors({ phone: "Enter a valid 10-digit mobile number" });
      return;
    }

    setLoading(true);
    try {
      const verifier = await ensureRecaptcha();
      const confirmation = await signInWithPhoneNumber(firebaseAuth, `+91${digits}`, verifier);
      setPhoneSession(confirmation);
    } catch (error) {
      setErrors({ submit: error.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtpAndLogin = async () => {
    setErrors({});
    if (!phoneSession) {
      setErrors({ submit: "Please request an OTP first" });
      return;
    }

    const otpValue = phoneOtp.trim();
    if (otpValue.length !== 6) {
      setErrors({ phoneOtp: "Enter the 6-digit OTP" });
      return;
    }

    setLoading(true);
    try {
      const result = await phoneSession.confirm(otpValue);
      const token = await result.user.getIdToken(true);
      const digits = String(formData.phone || "").replace(/\D/g, "").slice(-10);
      const loginResult = await mobileOtpLogin({ phone: digits, firebaseIdToken: token });
      if (loginResult.success) {
        if (loginResult.requiresPayment) {
          navigate("/payment", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        setErrors({ submit: loginResult.error || "Login failed" });
      }
    } catch (error) {
      setErrors({ submit: error.message || "Invalid OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await login(formData.identifier, formData.password);

      if (result.success) {
        if (result.requiresPayment) {
          navigate("/payment", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        setErrors({
          submit:
            result.error || "Login failed. Please check your credentials.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const isBlocked = searchParams.get("blocked") === "1";

  return (
    <>
      <PageSEO
        title="Login"
        description="Secure login to your QR Folio digital business card dashboard."
        keywords={[
          "qr folio login",
          "digital business card login",
          "qrfolio account",
        ]}
        canonicalPath="/login"
      />
      <motion.div
        className={clsx('min-h-screen', 'overflow-x-hidden', 'bg-gradient-to-br', 'from-slate-950', 'via-slate-900', 'to-slate-950', 'text-white', 'flex', 'items-center', 'py-10', 'px-4', 'sm:px-6', 'lg:px-8')}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className={clsx('relative', 'w-full', 'max-w-6xl', 'mx-auto')}>
          <div className={clsx('pointer-events-none', 'absolute', '-z-10', 'inset-0')}>
            <div className={clsx('absolute', '-top-24', '-right-20', 'h-56', 'w-56', 'rounded-full', 'bg-primary-500/25', 'blur-3xl')} />
            <div className={clsx('absolute', 'bottom-0', '-left-16', 'h-56', 'w-56', 'rounded-full', 'bg-emerald-500/20', 'blur-3xl')} />
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className={clsx('flex', 'items-center', 'space-x-2', 'text-slate-300', 'hover:text-white', 'mb-6', 'transition-colors')}
          >
            <ArrowLeft className={clsx('w-4', 'h-4')} />
            <span>Back to home</span>
          </button>

          <div className={clsx('flex', 'flex-col', 'lg:flex-row', 'items-center', 'lg:items-stretch', 'justify-between', 'gap-10', 'lg:gap-16')}>
            <motion.div
              className={clsx('flex-1', 'max-w-xl', 'text-center', 'lg:text-left', 'space-y-6', 'order-2', 'lg:order-1')}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <div className={clsx('inline-flex', 'items-center', 'rounded-full', 'border', 'border-white/10', 'bg-white/5', 'px-3', 'py-1', 'text-xs', 'sm:text-sm', 'text-slate-200')}>
                <span className={clsx('mr-2', 'inline-block', 'h-1.5', 'w-1.5', 'rounded-full', 'bg-emerald-400')} />
                <span>Secure login to your QR Folio</span>
              </div>

              <h1 className={clsx('text-3xl', 'sm:text-4xl', 'lg:text-5xl', 'font-bold', 'tracking-tight', 'leading-normal')}>
                <span className="block">Welcome back to</span>
                <span className={clsx('mt-1', 'block', 'pb-2', 'bg-gradient-to-r', 'from-primary-400', 'via-emerald-400', 'to-cyan-400', 'bg-clip-text', 'text-transparent')}>
                  your digital QR Identity
                </span>
              </h1>

              <p className={clsx('text-slate-300', 'text-sm', 'sm:text-base', 'max-w-lg', 'mx-auto', 'lg:mx-0')}>
                Manage your smart QR portfolio, update your details in seconds,
                and share your profile with a single scan.
              </p>

              <div className={clsx('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4', 'text-sm', 'text-slate-200')}>
                <div className={clsx('flex', 'items-start', 'gap-3')}>
                  <div className={clsx('mt-1', 'h-4', 'w-4', 'rounded-full', 'bg-primary-500/20', 'flex', 'items-center', 'justify-center', 'border', 'border-primary-500/40')}>
                    <span className={clsx('h-1.5', 'w-1.5', 'rounded-full', 'bg-primary-400')} />
                  </div>
                  <div>
                    <p className="font-medium">Instant QR sharing</p>
                    <p className="text-slate-400">
                      Share your profile anytime with a single scan.
                    </p>
                  </div>
                </div>

                <div className={clsx('flex', 'items-start', 'gap-3')}>
                  <div className={clsx('mt-1', 'h-4', 'w-4', 'rounded-full', 'bg-emerald-500/20', 'flex', 'items-center', 'justify-center', 'border', 'border-emerald-400/40')}>
                    <span className={clsx('h-1.5', 'w-1.5', 'rounded-full', 'bg-emerald-300')} />
                  </div>
                  <div>
                    <p className="font-medium">Live profile updates</p>
                    <p className="text-slate-400">
                      Edit your details without reprinting anything.
                    </p>
                  </div>
                </div>
              </div>

              <p className={clsx('text-xs', 'sm:text-sm', 'text-slate-400', 'max-w-md', 'mx-auto', 'lg:mx-0')}>
                No app install needed - your QR Folio opens instantly in the
                browser on any modern phone, tablet, or laptop.
              </p>
            </motion.div>

            <motion.div
              className={clsx('flex-1', 'max-w-xl', 'w-full', 'space-y-4', 'flex', 'flex-col', 'lg:-mt-14', 'order-1', 'lg:order-2')}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            >
              <div className="text-center">
                <div className={clsx('flex', 'items-center', 'justify-center', 'space-x-3', 'mb-4')}>
                  <div className={clsx('w-12', 'h-12', 'bg-gradient-to-br', 'from-primary-500', 'to-primary-600', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'shadow-lg', 'shadow-primary-500/40')}>
                    <QrCode className={clsx('w-7', 'h-7', 'text-white')} />
                  </div>
                  <span className={clsx('text-2xl', 'font-bold', 'text-white')}>
                    QR Folio
                  </span>
                </div>
              </div>

              <motion.div
                className={clsx('mt-0', 'flex', 'flex-col', 'max-w-sm', 'sm:max-w-md', 'w-full', 'mx-auto', 'rounded-2xl', 'border', 'border-white/10', 'bg-slate-900/60', 'p-4', 'sm:p-4', 'shadow-xl', 'shadow-slate-950/40', 'backdrop-blur')}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
              >
                <div className="mb-8">
                  <h2 className={clsx('text-2xl', 'sm:text-3xl', 'font-bold', 'text-white', 'mb-2')}>
                    Login
                  </h2>
                  <p className="text-slate-300">Welcome back to QR Folio</p>
                </div>

                <div className={clsx('mb-6', 'grid', 'grid-cols-2', 'gap-2', 'rounded-xl', 'border', 'border-white/10', 'bg-white/5', 'p-1')}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("password");
                      setErrors({});
                    }}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === "password"
                        ? "bg-primary-500 text-white shadow"
                        : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    Password Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("otp");
                      setErrors({});
                    }}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === "otp"
                        ? "bg-primary-500 text-white shadow"
                        : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    Phone OTP
                  </button>
                </div>

                {isBlocked && (
                  <div className={clsx('mb-6', 'p-4', 'rounded-xl', 'border', 'border-amber-500/40', 'bg-amber-500/10')}>
                    <p className={clsx('text-amber-200', 'text-sm')}>
                      Your account has been blocked. Please contact support if
                      you believe this is a mistake.
                    </p>
                  </div>
                )}

                {errors.submit && (
                  <div className={clsx('mb-6', 'p-4', 'rounded-xl', 'border', 'border-red-500/40', 'bg-red-500/10')}>
                    <p className={clsx('text-red-300', 'text-sm')}>{errors.submit}</p>
                  </div>
                )}

                {activeTab === "password" ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <input
                        type="text"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleInputChange}
                        placeholder="Email or mobile number"
                        autoComplete="username"
                        className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                          errors.identifier
                            ? "border-red-500/60 bg-red-500/10"
                            : "border-slate-700"
                        }`}
                      />
                      {errors.identifier && (
                        <p className={clsx('mt-1', 'text-sm', 'text-red-400')}>
                          {errors.identifier}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Password"
                          autoComplete="current-password"
                          className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12 ${
                            errors.password
                              ? "border-red-500/60 bg-red-500/10"
                              : "border-slate-700"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className={clsx('absolute', 'inset-y-0', 'right-3', 'flex', 'items-center', 'text-slate-400', 'hover:text-slate-200')}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className={clsx('w-5', 'h-5')} />
                          ) : (
                            <Eye className={clsx('w-5', 'h-5')} />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className={clsx('mt-1', 'text-sm', 'text-red-400')}>
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div className={clsx('flex', 'items-center', 'justify-between')}>
                      <label className={clsx('flex', 'items-center')}>
                        <input
                          type="checkbox"
                          className={clsx('w-4', 'h-4', 'text-primary-500', 'border-slate-600', 'rounded', 'bg-slate-900', 'focus:ring-primary-500')}
                        />
                        <span className={clsx('ml-2', 'text-sm', 'text-slate-300')}>
                          Remember me
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className={clsx('text-sm', 'text-primary-400', 'hover:text-primary-300', 'hover:underline')}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={clsx('w-full', 'bg-primary-500', 'text-white', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'focus:ring-offset-0', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                    >
                      {loading ? (
                        <div className={clsx('flex', 'items-center', 'justify-center', 'space-x-2')}>
                          <div className={clsx('w-5', 'h-5', 'border-2', 'border-white', 'border-t-transparent', 'rounded-full', 'animate-spin')} />
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        "Login"
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Mobile number"
                        inputMode="numeric"
                        className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                          errors.phone
                            ? "border-red-500/60 bg-red-500/10"
                            : "border-slate-700"
                        }`}
                      />
                      {errors.phone && (
                        <p className={clsx('mt-1', 'text-sm', 'text-red-400')}>{errors.phone}</p>
                      )}
                    </div>

                    <div id="recaptcha-container-login" />

                    {!phoneSession ? (
                      <button
                        type="button"
                        onClick={sendPhoneOtp}
                        disabled={loading}
                        className={clsx('w-full', 'bg-primary-500', 'text-white', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                      >
                        {loading ? "Sending OTP..." : "Send OTP"}
                      </button>
                    ) : (
                      <>
                        <div>
                          <input
                            type="text"
                            value={phoneOtp}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setPhoneOtp(v);
                              if (errors.phoneOtp) {
                                setErrors((prev) => ({ ...prev, phoneOtp: "" }));
                              }
                            }}
                            placeholder="Enter 6-digit OTP"
                            inputMode="numeric"
                            maxLength={6}
                            className={`w-full px-4 py-3.5 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                              errors.phoneOtp
                                ? "border-red-500/60 bg-red-500/10"
                                : "border-slate-700"
                            }`}
                          />
                          {errors.phoneOtp && (
                            <p className={clsx('mt-1', 'text-sm', 'text-red-400')}>{errors.phoneOtp}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={verifyPhoneOtpAndLogin}
                          disabled={loading}
                          className={clsx('w-full', 'bg-primary-500', 'text-white', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                        >
                          {loading ? "Verifying..." : "Verify & Login"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPhoneSession(null);
                            setPhoneOtp("");
                            setErrors({});
                          }}
                          disabled={loading}
                          className={clsx('w-full', 'border', 'border-white/10', 'text-slate-200', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'hover:bg-white/5', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                        >
                          Change number
                        </button>
                      </>
                    )}

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className={clsx('text-sm', 'text-primary-400', 'hover:text-primary-300', 'hover:underline')}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                )}

                <div className={clsx('mt-6', 'text-center')}>
                  <p className="text-slate-300">
                    Don't have an account?{" "}
                    <button
                      onClick={() => navigate("/signup")}
                      className={clsx('text-primary-400', 'hover:text-primary-300', 'hover:underline', 'font-medium')}
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
export default LoginPage;
