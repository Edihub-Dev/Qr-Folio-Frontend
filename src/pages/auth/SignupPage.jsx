import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { firebaseAuth } from "../../firebase";
import { QrCode, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api";
import PageSEO from "../../components/seo/PageSEO";
import toast from "react-hot-toast";
import clsx from "clsx";

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, submitSignupAfterPhoneVerification, verifyOTP, resendOTP } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [phoneOtpStep, setPhoneOtpStep] = useState("idle");
  const [phoneOtpValue, setPhoneOtpValue] = useState("");
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lockedPhoneDigits, setLockedPhoneDigits] = useState(null);
  const [verifiedPhoneDigits, setVerifiedPhoneDigits] = useState(null);
  const [verifiedFirebaseIdToken, setVerifiedFirebaseIdToken] = useState(null);

  const [emailOtpStep, setEmailOtpStep] = useState("idle");
  const [emailOtpValue, setEmailOtpValue] = useState("");
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpResending, setEmailOtpResending] = useState(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);
  const [emailOtpRequiresPayment, setEmailOtpRequiresPayment] = useState(null);

  const confirmationResultRef = useRef(null);
  const recaptchaRef = useRef(null);
  const sendOtpInFlightRef = useRef(false);

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
    phone: "",
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

  const toE164 = useCallback((phoneDigits) => {
    const digits = String(phoneDigits || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    if (String(phoneDigits).trim().startsWith("+")) {
      return String(phoneDigits).trim();
    }
    return `+${digits}`;
  }, []);

  const ensureRecaptcha = useCallback(async () => {
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch {
        // ignore
      }
      recaptchaRef.current = null;
    }

    const container = document.getElementById("recaptcha-container-signup");
    if (!container) {
      throw new Error("reCAPTCHA container not found");
    }

    container.innerHTML = "";
    const child = document.createElement("div");
    container.appendChild(child);

    const verifier = new RecaptchaVerifier(firebaseAuth, child, {
      size: "invisible",
    });

    recaptchaRef.current = verifier;
    await verifier.render();
    return verifier;
  }, []);

  const sendPhoneOtp = useCallback(async (phoneDigitsOverride) => {
    if (sendOtpInFlightRef.current) return;
    if (cooldownSeconds > 0) return;

    const digitsToUse = phoneDigitsOverride || lockedPhoneDigits;
    const e164 = toE164(digitsToUse);
    if (!e164) {
      setPhoneOtpError("Missing phone number");
      return;
    }

    sendOtpInFlightRef.current = true;
    setPhoneOtpLoading(true);
    setPhoneOtpError("");

    try {
      const appVerifier = await ensureRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        e164,
        appVerifier
      );
      confirmationResultRef.current = confirmation;
      setPhoneOtpStep("verify");
      setCooldownSeconds(60);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("sendOtp failed", err);
      const code = err?.code || "";
      if (code === "auth/captcha-check-failed") {
        setPhoneOtpError(
          "reCAPTCHA verification failed. Please wait a few seconds and try Resend OTP."
        );
      } else if (code === "auth/unauthorized-domain") {
        setPhoneOtpError(
          "Unauthorized domain for Firebase Phone Auth. Add this domain to Firebase Auth > Settings > Authorized domains."
        );
      } else if (code === "auth/too-many-requests") {
        setPhoneOtpError("Too many OTP requests. Please wait and try again.");
        setCooldownSeconds(300);
      } else if (code === "auth/internal-error") {
        setPhoneOtpError(
          "Firebase rejected the OTP request. Open DevTools > Network > sendVerificationCode > Response to see the exact reason (often TOO_MANY_ATTEMPTS_TRY_LATER)."
        );
        setCooldownSeconds(600);
      } else {
        const msg = err?.message || "Failed to send OTP";
        setPhoneOtpError(code ? `${code}: ${msg}` : msg);
      }

      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaRef.current = null;
      }
    } finally {
      setPhoneOtpLoading(false);
      sendOtpInFlightRef.current = false;
    }
  }, [cooldownSeconds, ensureRecaptcha, lockedPhoneDigits, toE164]);

  const verifyPhoneOtp = useCallback(
    async (e) => {
      e.preventDefault();

      const code = phoneOtpValue.replace(/\D/g, "").slice(0, 6);
      if (code.length < 6) {
        setPhoneOtpError("Enter the 6-digit OTP");
        return;
      }

      if (!confirmationResultRef.current) {
        setPhoneOtpError("OTP session expired. Please request a new OTP.");
        return;
      }

      setPhoneOtpLoading(true);
      setPhoneOtpError("");

      try {
        const result = await confirmationResultRef.current.confirm(code);
        const idToken = await result.user.getIdToken(true);

        setVerifiedFirebaseIdToken(idToken);
        setVerifiedPhoneDigits(lockedPhoneDigits);
        setPhoneOtpStep("verified");
        setPhoneOtpValue("");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("verifyOtp failed", err);
        const code = err?.code || "";
        const msg = err?.message || "Failed to verify OTP";
        setPhoneOtpError(code ? `${code}: ${msg}` : msg);
      } finally {
        setPhoneOtpLoading(false);
      }
    },
    [
      phoneOtpValue,
      lockedPhoneDigits,
    ]
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "phone") {
      setVerifiedFirebaseIdToken(null);
      setVerifiedPhoneDigits(null);
      setPhoneOtpStep("idle");
      setPhoneOtpValue("");
      setPhoneOtpError("");
      setCooldownSeconds(0);
      setLockedPhoneDigits(null);
      confirmationResultRef.current = null;
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaRef.current = null;
      }
    }
    if (name === "email") {
      setEmailOtpStep("idle");
      setEmailOtpValue("");
      setEmailOtpError("");
      setEmailOtpCountdown(0);
      setEmailOtpRequiresPayment(null);
    }
    if (name === "couponCode") {
      setReferralState((prev) =>
        prev.status === "valid" || prev.status === "invalid"
          ? { status: "idle", info: null, message: "" }
          : prev
      );
    }
  };

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = setInterval(() => {
      setCooldownSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSeconds]);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaRef.current = null;
      }
    };
  }, []);

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

    const phoneDigits = (formData.phone || "").replace(/\D/g, "");
    if (!phoneDigits) {
      newErrors.phone = "Mobile number is required";
    } else if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const password = String(formData.password);
      const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        password
      );
      if (!isValid) {
        newErrors.password =
          "Password must be at least 8 characters long, must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
      }
    }
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    return newErrors;
  };

  const validateEmailOnly = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    return newErrors;
  };

  const checkAvailability = async ({ email, phoneDigits } = {}) => {
    try {
      const payload = {};
      const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
      if (normalizedEmail) payload.email = normalizedEmail;
      if (phoneDigits) payload.phone = String(phoneDigits);
      if (!payload.email && !payload.phone) return { success: true };

      const res = await api.post("/auth/check-availability", payload);
      if (res.data?.success) return { success: true };
      return { success: false, message: res.data?.message || "Not available" };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Unable to check availability",
      };
    }
  };

  const handleSendOtpClick = async () => {
    if (phoneOtpLoading) return;

    const phoneDigits = (formData.phone || "").replace(/\D/g, "");
    if (!phoneDigits) {
      setErrors((prev) => ({ ...prev, phone: "Mobile number is required" }));
      toast.error("Please enter a valid mobile number");
      return;
    }
    if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
      setErrors((prev) => ({
        ...prev,
        phone: "Please enter a valid 10-digit mobile number",
      }));
      toast.error("Please enter a valid mobile number");
      return;
    }

    const availability = await checkAvailability({
      email: formData.email,
      phoneDigits,
    });
    if (!availability.success) {
      const msg = availability.message || "Already registered";
      const normalized = msg.toLowerCase();
      setErrors((prev) => ({
        ...prev,
        ...(normalized.includes("mobile") || normalized.includes("phone") ? { phone: msg } : {}),
        ...(normalized.includes("email") || normalized.includes("user") ? { email: msg } : {}),
      }));
      toast.error(msg);
      return;
    }

    setVerifiedFirebaseIdToken(null);
    setVerifiedPhoneDigits(null);
    setLockedPhoneDigits(phoneDigits);
    setPhoneOtpStep("verify");
    setPhoneOtpValue("");
    setPhoneOtpError("");
    confirmationResultRef.current = null;

    await sendPhoneOtp(phoneDigits);
  };

  const handleSendEmailOtpClick = async () => {
    if (emailOtpLoading || emailOtpResending) return;
    if (!verifiedFirebaseIdToken || !verifiedPhoneDigits) {
      toast.error("Please verify your phone number first");
      return;
    }

    const signupErrors = validateForm();
    if (Object.keys(signupErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...signupErrors }));
      toast.error("Please complete all required fields");
      return;
    }

    const phoneDigits = (formData.phone || "").replace(/\D/g, "");
    const availability = await checkAvailability({
      email: formData.email,
      phoneDigits: phoneDigits || undefined,
    });
    if (!availability.success) {
      const msg = availability.message || "Already registered";
      const normalized = msg.toLowerCase();
      setErrors((prev) => ({
        ...prev,
        ...(normalized.includes("mobile") || normalized.includes("phone") ? { phone: msg } : {}),
        ...(normalized.includes("email") || normalized.includes("user") ? { email: msg } : {}),
      }));
      setEmailOtpError(msg);
      toast.error(msg);
      return;
    }

    setEmailOtpLoading(true);
    setEmailOtpError("");

    try {
      const { name, email, phone, password, confirmPassword, couponCode } =
        formData;
      const verifiedDigits = String(verifiedPhoneDigits || "").replace(/\D/g, "");
      const fallbackDigits = String(phone || "").replace(/\D/g, "");
      const rawDigits = verifiedDigits || fallbackDigits;
      const phoneDigits = rawDigits
        ? rawDigits.length > 10
          ? rawDigits.slice(-10)
          : rawDigits
        : "";

      const stage = await signup({
        name,
        email,
        password,
        confirmPassword,
        phone: phoneDigits || undefined,
        couponCode: couponCode?.trim() || undefined,
      });

      if (!stage.success) {
        setEmailOtpError(stage.error || "Signup failed");
        return;
      }

      const submitResult = await submitSignupAfterPhoneVerification(
        verifiedFirebaseIdToken
      );
      if (!submitResult.success) {
        throw new Error(submitResult.error || "Failed to send email OTP");
      }

      setEmailOtpStep("verify");
      setEmailOtpCountdown(60);
      setEmailOtpValue("");
    } catch (err) {
      setEmailOtpError(err?.message || "Failed to send email OTP");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtpClick = async () => {
    const otp = (emailOtpValue || "").replace(/\D/g, "").slice(0, 6);
    if (!otp || otp.length !== 6) {
      setEmailOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setEmailOtpLoading(true);
    setEmailOtpError("");

    try {
      const result = await verifyOTP(formData.email, otp);
      if (!result.success) {
        setEmailOtpError(result.error || "Invalid OTP. Please try again.");
        return;
      }

      setEmailOtpStep("verified");
      setEmailOtpRequiresPayment(Boolean(result.requiresPayment));
    } catch (err) {
      setEmailOtpError(err?.message || "Failed to verify email OTP");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleResendEmailOtpClick = async () => {
    if (emailOtpCountdown > 0 || emailOtpResending) return;
    setEmailOtpResending(true);
    setEmailOtpError("");
    try {
      const res = await resendOTP();
      if (!res.success) {
        setEmailOtpError(res.error || "Failed to resend OTP");
        return;
      }
      setEmailOtpCountdown(60);
    } catch (err) {
      setEmailOtpError(err?.message || "Failed to resend OTP");
    } finally {
      setEmailOtpResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!verifiedFirebaseIdToken || !verifiedPhoneDigits) {
      toast.error("Please verify your phone number");
      return;
    }

    if (emailOtpStep !== "verified") {
      toast.error("Please verify your email");
      return;
    }

    const requiresPayment = Boolean(emailOtpRequiresPayment);
    navigate(requiresPayment ? "/payment" : "/dashboard");
  };

  useEffect(() => {
    if (emailOtpCountdown <= 0) return;
    const t = setInterval(() => {
      setEmailOtpCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [emailOtpCountdown]);

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
                <span className={clsx('mr-2', 'inline-block', 'h-1.5', 'w-1.5', 'rounded-full', 'bg-primary-400')} />
                <span>Create your QR Folio in minutes</span>
              </div>

              <h1 className={clsx('text-3xl', 'sm:text-4xl', 'lg:text-5xl', 'font-bold', 'tracking-tight', 'leading-normal')}>
                <span className="block">Turn your profile into</span>
                <span className={clsx('mt-1', 'block', 'pb-2', 'bg-gradient-to-r', 'from-primary-400', 'via-emerald-400', 'to-cyan-400', 'bg-clip-text', 'text-transparent')}>
                  a scannable QR identity
                </span>
              </h1>

              <p className={clsx('text-slate-300', 'text-sm', 'sm:text-base', 'max-w-lg', 'mx-auto', 'lg:mx-0')}>
                Share a single smart QR instead of dozens of links. Perfect for
                creators, professionals, and brands.
              </p>

              <div className={clsx('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4', 'text-sm', 'text-slate-200')}>
                <div className={clsx('flex', 'items-start', 'gap-3')}>
                  <div className={clsx('mt-1', 'h-4', 'w-4', 'rounded-full', 'bg-primary-500/20', 'flex', 'items-center', 'justify-center', 'border', 'border-primary-500/40')}>
                    <span className={clsx('h-1.5', 'w-1.5', 'rounded-full', 'bg-primary-400')} />
                  </div>
                  <div>
                    <p className="font-medium">Premium QR portfolio</p>
                    <p className="text-slate-400">
                      Beautiful, responsive profile pages designed to impress.
                    </p>
                  </div>
                </div>

                <div className={clsx('flex', 'items-start', 'gap-3')}>
                  <div className={clsx('mt-1', 'h-4', 'w-4', 'rounded-full', 'bg-emerald-500/20', 'flex', 'items-center', 'justify-center', 'border', 'border-emerald-400/40')}>
                    <span className={clsx('h-1.5', 'w-1.5', 'rounded-full', 'bg-emerald-300')} />
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

              <p className={clsx('text-xs', 'sm:text-sm', 'text-slate-400', 'max-w-md', 'mx-auto', 'lg:mx-0')}>
                Ideal for NFC cards, resumes, portfolios, and social profiles –
                all connected through a single smart QR.
              </p>

              <div className={clsx('mt-4', 'grid', 'grid-cols-2', 'sm:grid-cols-3', 'gap-3', 'text-xs', 'sm:text-sm', 'text-slate-200', 'max-w-lg', 'mx-auto', 'lg:mx-0')}>
                <div className={clsx('rounded-xl', 'border', 'border-white/10', 'bg-white/5', 'px-3', 'py-2', 'text-left')}>
                  <p className={clsx('font-semibold', 'text-white')}>2K+</p>
                  <p className={clsx('text-[11px]', 'sm:text-xs', 'text-slate-400')}>
                    active users
                  </p>
                </div>
                <div className={clsx('rounded-xl', 'border', 'border-white/10', 'bg-white/5', 'px-3', 'py-2', 'text-left')}>
                  <p className={clsx('font-semibold', 'text-white')}>10+</p>
                  <p className={clsx('text-[11px]', 'sm:text-xs', 'text-slate-400')}>
                    industries served
                  </p>
                </div>
                <div className={clsx('rounded-xl', 'border', 'border-white/10', 'bg-white/5', 'px-3', 'py-2', 'text-left', 'col-span-2', 'sm:col-span-1')}>
                  <p className={clsx('font-semibold', 'text-white')}>Live</p>
                  <p className={clsx('text-[11px]', 'sm:text-xs', 'text-slate-400')}>
                    updates anytime
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className={clsx('flex-1', 'max-w-xl', 'w-full', 'space-y-4', 'flex', 'flex-col', 'lg:-mt-12', 'order-1', 'lg:order-2')}
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
                <h2 className={clsx('text-2xl', 'sm:text-3xl', 'font-bold', 'text-white', 'mb-1.5')}>
                  Signup
                </h2>
                <p className={clsx('text-slate-300', 'mb-4')}>to get started</p>

                {referralState.status === "loading" && (
                  <div className={clsx('mb-3', 'rounded-2xl', 'border', 'border-primary-500/40', 'bg-primary-500/10', 'px-4', 'py-3', 'text-sm', 'text-primary-200')}>
                    Validating referral code…
                  </div>
                )}

                {referralState.status === "valid" && referralState.info && (
                  <div className={clsx('mb-3', 'rounded-2xl', 'border', 'border-emerald-400/40', 'bg-emerald-500/10', 'px-4', 'py-3', 'text-sm', 'text-emerald-200')}>
                    <p className={clsx('font-semibold', 'mb-0.5')}>
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
                  <div className={clsx('mb-3', 'rounded-2xl', 'border', 'border-rose-500/40', 'bg-rose-500/10', 'px-4', 'py-3', 'text-sm', 'text-rose-200')}>
                    {referralState.message ||
                      "The referral code provided is invalid or expired."}
                  </div>
                )}

                {errors.submit && (
                  <div className={clsx('mb-4', 'p-4', 'rounded-xl', 'border', 'border-red-500/40', 'bg-red-500/10')}>
                    <p className={clsx('text-red-300', 'text-sm')}>{errors.submit}</p>
                  </div>
                )}

                <div id="recaptcha-container-signup" />

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
                      <p className={clsx('text-sm', 'text-red-400')}>{errors.name}</p>
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
                        className={clsx('absolute', 'inset-y-0', 'right-3', 'flex', 'items-center', 'text-slate-400', 'hover:text-slate-200')}
                        aria-label={
                          showPasswordFields.password
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPasswordFields.password ? (
                          <EyeOff className={clsx('w-5', 'h-5')} />
                        ) : (
                          <Eye className={clsx('w-5', 'h-5')} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className={clsx('text-sm', 'text-red-400')}>{errors.password}</p>
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

                    <div className={clsx('flex', 'gap-3')}>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Mobile Number"
                        className={`flex-1 px-4 py-3 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                          errors.phone
                            ? "border-red-500/60 bg-red-500/10"
                            : "border-slate-700"
                        }`}
                      />

                      {verifiedFirebaseIdToken && verifiedPhoneDigits ? (
                        <button
                          type="button"
                          disabled
                          className={clsx('px-4', 'py-3', 'rounded-xl', 'border', 'border-emerald-400/40', 'bg-emerald-500/10', 'text-emerald-200', 'font-semibold')}
                        >
                          Verified
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtpClick}
                          disabled={phoneOtpLoading || cooldownSeconds > 0}
                          className={clsx('px-4', 'py-3', 'rounded-xl', 'bg-primary-500', 'text-white', 'font-semibold', 'hover:bg-primary-400', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                        >
                          {cooldownSeconds > 0
                            ? `Resend (${cooldownSeconds}s)`
                            : phoneOtpStep === "verify"
                              ? "Resend OTP"
                              : "Send OTP"}
                        </button>
                      )}
                    </div>
                    {errors.phone && (
                      <p className={clsx('text-sm', 'text-red-400')}>{errors.phone}</p>
                    )}

                    {verifiedFirebaseIdToken && verifiedPhoneDigits ? (
                      <div className={clsx('rounded-xl', 'border', 'border-emerald-400/40', 'bg-emerald-500/10', 'px-4', 'py-3')}>
                        <p className={clsx('text-sm', 'text-emerald-200')}>
                          Phone number verified.
                        </p>
                      </div>
                    ) : phoneOtpStep === "verify" ? (
                      <div className={clsx('space-y-3', 'rounded-xl', 'border', 'border-white/10', 'bg-white/5', 'px-4', 'py-4')}>
                        <p className={clsx('text-sm', 'text-slate-200')}>
                          Enter OTP sent to +91{lockedPhoneDigits}
                        </p>

                        {phoneOtpError ? (
                          <p className={clsx('text-sm', 'text-red-300')}>
                            {phoneOtpError}
                          </p>
                        ) : null}

                        <div className={clsx('flex', 'gap-3')}>
                          <input
                            type="text"
                            value={phoneOtpValue}
                            onChange={(e) => setPhoneOtpValue(e.target.value)}
                            inputMode="numeric"
                            placeholder="6-digit OTP"
                            className={clsx('flex-1', 'px-4', 'py-3', 'rounded-xl', 'border', 'bg-slate-900/60', 'text-slate-50', 'placeholder-slate-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'focus:border-transparent', 'transition-all', 'border-slate-700')}
                            maxLength={6}
                          />

                          <button
                            type="button"
                            onClick={(e) => verifyPhoneOtp(e)}
                            disabled={phoneOtpLoading}
                            className={clsx('px-4', 'py-3', 'rounded-xl', 'bg-primary-500', 'text-white', 'font-semibold', 'hover:bg-primary-400', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                          >
                            {phoneOtpLoading ? "Verifying..." : "Verify"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPhoneOtpStep("idle");
                            setLockedPhoneDigits(null);
                            setPhoneOtpValue("");
                            setPhoneOtpError("");
                            setCooldownSeconds(0);
                            confirmationResultRef.current = null;
                            if (recaptchaRef.current) {
                              try {
                                recaptchaRef.current.clear();
                              } catch {
                                // ignore
                              }
                              recaptchaRef.current = null;
                            }
                          }}
                          disabled={phoneOtpLoading}
                          className={clsx('text-slate-300', 'hover:text-white', 'text-sm', 'text-left')}
                        >
                          Change phone number
                        </button>
                      </div>
                    ) : null}

                    


                    <div className={clsx('flex', 'gap-3')}>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        className={`flex-1 px-4 py-3 rounded-xl border bg-slate-900/60 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                          errors.email
                            ? "border-red-500/60 bg-red-500/10"
                            : "border-slate-700"
                        }`}
                      />

                      {emailOtpStep === "verified" ? (
                        <button
                          type="button"
                          disabled
                          className={clsx('px-4', 'py-3', 'rounded-xl', 'border', 'border-emerald-400/40', 'bg-emerald-500/10', 'text-emerald-200', 'font-semibold')}
                        >
                          Verified
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendEmailOtpClick}
                          disabled={
                            emailOtpLoading ||
                            emailOtpResending ||
                            emailOtpCountdown > 0 ||
                            !verifiedFirebaseIdToken
                          }
                          className={clsx('px-4', 'py-3', 'rounded-xl', 'bg-primary-500', 'text-white', 'font-semibold', 'hover:bg-primary-400', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                        >
                          {emailOtpCountdown > 0
                            ? `Resend (${emailOtpCountdown}s)`
                            : emailOtpStep === "verify"
                              ? "Resend OTP"
                              : "Send OTP"}
                        </button>
                      )}
                    </div>
                    {errors.email && (
                      <p className={clsx('text-sm', 'text-red-400')}>{errors.email}</p>
                    )}

                    {emailOtpStep === "verified" ? (
                      <div className={clsx('rounded-xl', 'border', 'border-emerald-400/40', 'bg-emerald-500/10', 'px-4', 'py-3')}>
                        <p className={clsx('text-sm', 'text-emerald-200')}>
                          {formData.email ? `Email ${formData.email} is verified.` : "Email is verified."}
                        </p>
                      </div>
                    ) : emailOtpStep === "verify" ? (
                      <div className={clsx('space-y-3', 'rounded-xl', 'border', 'border-white/10', 'bg-white/5', 'px-4', 'py-4')}>
                        <p className={clsx('text-sm', 'text-slate-200')}>
                          Enter OTP sent to {formData.email || "your email"}
                        </p>

                        {emailOtpError ? (
                          <p className={clsx('text-sm', 'text-red-300')}>
                            {emailOtpError}
                          </p>
                        ) : null}

                        <div className={clsx('flex', 'gap-3')}>
                          <input
                            type="text"
                            value={emailOtpValue}
                            onChange={(e) => setEmailOtpValue(e.target.value)}
                            inputMode="numeric"
                            placeholder="6-digit OTP"
                            className={clsx('flex-1', 'px-4', 'py-3', 'rounded-xl', 'border', 'bg-slate-900/60', 'text-slate-50', 'placeholder-slate-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'focus:border-transparent', 'transition-all', 'border-slate-700')}
                            maxLength={6}
                          />

                          <button
                            type="button"
                            onClick={handleVerifyEmailOtpClick}
                            disabled={emailOtpLoading}
                            className={clsx('px-4', 'py-3', 'rounded-xl', 'bg-primary-500', 'text-white', 'font-semibold', 'hover:bg-primary-400', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                          >
                            {emailOtpLoading ? "Verifying..." : "Verify"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleResendEmailOtpClick}
                          disabled={emailOtpCountdown > 0 || emailOtpResending}
                          className={clsx('text-slate-300', 'hover:text-white', 'text-sm', 'text-left', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                        >
                          {emailOtpCountdown > 0
                            ? `Resend OTP in ${emailOtpCountdown}s`
                            : emailOtpResending
                              ? "Resending..."
                              : "Resend OTP"}
                        </button>
                      </div>
                    ) : null}

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
                        <p className={clsx('mt-1', 'text-sm', 'text-red-400')}>
                          {errors.couponCode}
                        </p>
                      )}
                    </div>




                    <div className={clsx('flex', 'items-start', 'space-x-3')}>
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        className={clsx('mt-1', 'w-4', 'h-4', 'text-primary-500', 'border-slate-600', 'rounded', 'bg-slate-900', 'focus:ring-primary-500')}
                      />
                      <label className={clsx('text-sm', 'text-slate-300')}>
                        Agree to our{" "}
                        <button
                          type="button"
                          onClick={() => window.open("/terms", "_blank")}
                          className={clsx('text-primary-400', 'hover:text-primary-300', 'hover:underline')}
                        >
                          terms and conditions
                        </button>
                      </label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className={clsx('text-sm', 'text-red-400')}>
                        {errors.agreeToTerms}
                      </p>
                    )}
                    

                    <button
                      type="submit"
                      disabled={loading || !verifiedFirebaseIdToken || emailOtpStep !== "verified"}
                      className={clsx('w-full', 'bg-primary-500', 'text-white', 'py-3.5', 'px-6', 'rounded-xl', 'font-semibold', 'shadow-lg', 'shadow-primary-500/40', 'hover:bg-primary-400', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500', 'focus:ring-offset-0', 'transition-all', 'disabled:opacity-50', 'disabled:cursor-not-allowed')}
                    >
                      {loading ? "Registering..." : "Register"}
                    </button>

                </form>

                <p className={clsx('mt-6', 'text-center', 'text-slate-300')}>
                  Already registered?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className={clsx('text-primary-400', 'hover:text-primary-300', 'hover:underline', 'font-medium')}
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
