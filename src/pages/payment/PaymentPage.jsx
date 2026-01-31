import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { Shield, ArrowLeft, CheckCircle, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import {
  normalizePlan,
  getPlanRank,
  PLAN_LABELS,
} from "../../utils/subscriptionPlan";
import PageSEO from "../../components/seo/PageSEO";

const GST_RATE = 0.18;

const formatINR = (amount) =>
  `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const calculateGstBreakdown = (amount) => {
  const gst = Number((amount * GST_RATE).toFixed(2));
  const cgst = Number((amount * (GST_RATE / 2)).toFixed(2));
  const sgst = Number((gst - cgst).toFixed(2));
  const total = Number((amount + gst).toFixed(2));
  return {
    baseAmount: amount,
    gstAmount: gst,
    cgstAmount: cgst,
    sgstAmount: sgst,
    totalAmount: total,
    transactionFee: 0,
  };
};

const PaymentForm = () => {
  const navigate = useNavigate();
  const {
    createPaymentOrder,
    createChainpayPayment,
    verifyPayment,
    user,
    refreshUser,
    logout,
  } = useAuth();
  const location = useLocation();
  const [processingGateway, setProcessingGateway] = useState(null);
  const isProcessing = processingGateway !== null;
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [selectedChainpayPlan, setSelectedChainpayPlan] = useState("growth");
  const [errors, setErrors] = useState({ phonepe: "", chainpay: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [chainpayStatusMessage, setChainpayStatusMessage] = useState("");
  const phonePeScriptRef = useRef({ loaded: false, url: null });
  const hasRestoredChainpaySession = useRef(false);

  const plans = useMemo(
    () => ({
      basic: {
        name: "Basic (Silver)",
        price: 1,
        description: "Perfect for individuals",
        features: [
          "Custom QR Code",
          "Add Contact Details",
          "Add Company Details",
          "Add Basic Profile Details",
          "Share Profile via QR Code",
          "Share Profile via Link",
          "Prices Exclusive of Taxes",
        ],
      },
      professional: {
        name: "Standard (Gold)",
        price: 599,
        description: "Best for professionals",
        features: [
          "Everything in Basic",
          "Add Custom Links",
          "Limited Media Storage",
          "Add Advanced Profile Details",
          "Quick Share to Social Media",
          "Publicly Accessible Profile",
          "Prices Exclusive of Taxes",
        ],
      },
      enterprise: {
        name: "Premium (Platinum)",
        price: 999,
        description: "For large organizations",
        features: [
          "Everything in Standard",
          "Custom Branding",
          "Team Collaboration",
          "Personalized Support",
          "Media Storage up to 10 files of 1GB",
          "Includes an NFC-enabled profile card.",
          "Prices Exclusive of Taxes",
        ],
      },
    }),
    [],
  );

  const CHAINPAY_PLAN_MSTC_DISPLAY = Object.freeze({
    starter: 100,
    growth: 200,
    enterprise: 300,
  });

  const CHAINPAY_NETWORK_MSTC = Object.freeze({
    starter: 9.812,
    growth: 19.624,
    enterprise: 29.436,
  });

  const CHAINPAY_SUCCESS_STATES = new Set([
    "SUCCESS",
    "SUCCESSFUL",
    "COMPLETED",
    "PAID",
    "CONFIRMED",
  ]);

  const CHAINPAY_SESSION_KEY = "qrfolio_chainpay";
  const CHAINPAY_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

  const chainpayPlans = useMemo(
    () => ({
      starter: {
        name: "Basic (Silver)",
        coins: CHAINPAY_PLAN_MSTC_DISPLAY.starter,
        networkCoins: CHAINPAY_NETWORK_MSTC.starter,
        description: "Start accepting crypto payments.",
        features: [
          "Custom QR Code",
          "Add Contact Details",
          "Add Company Details",
          "Add Basic Profile Details",
          "Share Profile via QR Code",
          "Share Profile via Link",
          "Prices Exclusive of Taxes",
        ],
      },
      growth: {
        name: "Standard (Gold)",
        coins: CHAINPAY_PLAN_MSTC_DISPLAY.growth,
        networkCoins: CHAINPAY_NETWORK_MSTC.growth,
        description: "Premium tools with annual billing.",
        features: [
          "Everything in Basic",
          "Add Custom Links",
          "Limited Media Storage",
          "Add Advanced Profile Details",
          "Quick Share to Social Media",
          "Publicly Accessible Profile",
          "Prices Exclusive of Taxes",
        ],
      },
      enterprise: {
        name: "Premium (Platinum)",
        coins: CHAINPAY_PLAN_MSTC_DISPLAY.enterprise,
        networkCoins: CHAINPAY_NETWORK_MSTC.enterprise,
        description: "Enterprise billing.",
        features: [
          "Everything in Standard",
          "Custom Branding",
          "Team Collaboration",
          "Personalized Support",
          "Media Storage up to 10 files of 1GB",
          "Includes an NFC-enabled profile card.",
          "Prices Exclusive of Taxes",
        ],
      },
    }),
    [],
  );

  const rawRequestedUpgrade = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("upgrade");
  }, [location.search]);

  const currentPlan = useMemo(
    () => normalizePlan(user?.subscriptionPlan, user?.planName),
    [user?.subscriptionPlan, user?.planName],
  );
  const currentPlanRank = useMemo(
    () => getPlanRank(currentPlan),
    [currentPlan],
  );

  const requestedUpgradeTier = useMemo(() => {
    if (!rawRequestedUpgrade) return null;
    return normalizePlan(rawRequestedUpgrade);
  }, [rawRequestedUpgrade]);

  const PHONEPE_PLAN_TIERS = useMemo(
    () => ({
      basic: "basic",
      professional: "standard",
      enterprise: "premium",
    }),
    [],
  );

  const CHAINPAY_PLAN_TIERS = useMemo(
    () => ({
      starter: "basic",
      growth: "standard",
      enterprise: "premium",
    }),
    [],
  );

  const applicableUpgradeTier = useMemo(() => {
    if (!requestedUpgradeTier) return null;
    return getPlanRank(requestedUpgradeTier) > currentPlanRank
      ? requestedUpgradeTier
      : null;
  }, [requestedUpgradeTier, currentPlanRank]);

  const isUpgradeExperience = useMemo(() => {
    if (applicableUpgradeTier) {
      return true;
    }

    if (!user) {
      return false;
    }

    const normalizedStatus = (user.planStatus || "active")
      .toString()
      .toLowerCase();
    const isExpired =
      typeof user.planExpired === "boolean"
        ? user.planExpired
        : normalizedStatus === "expired";

    if (isExpired) {
      return false;
    }

    return Boolean(user.isPaid);
  }, [applicableUpgradeTier, user]);

  const getPreferredPlanKey = useCallback(
    (availableKeys, tierMap) => {
      if (!availableKeys?.length) {
        return null;
      }

      if (applicableUpgradeTier) {
        const requestedKey = availableKeys.find(
          (key) => tierMap[key] === applicableUpgradeTier,
        );
        if (requestedKey) {
          return requestedKey;
        }
      }

      return availableKeys[0];
    },
    [applicableUpgradeTier],
  );

  const availablePhonePePlanKeys = useMemo(() => {
    const entries = Object.entries(PHONEPE_PLAN_TIERS);
    const filtered = isUpgradeExperience
      ? entries.filter(([, tier]) => getPlanRank(tier) > currentPlanRank)
      : entries;
    return filtered.map(([key]) => key);
  }, [PHONEPE_PLAN_TIERS, currentPlanRank, isUpgradeExperience]);

  const availableChainpayPlanKeys = useMemo(() => {
    const entries = Object.entries(CHAINPAY_PLAN_TIERS);
    const filtered = isUpgradeExperience
      ? entries.filter(([, tier]) => getPlanRank(tier) > currentPlanRank)
      : entries;
    return filtered.map(([key]) => key);
  }, [CHAINPAY_PLAN_TIERS, currentPlanRank, isUpgradeExperience]);

  useEffect(() => {
    if (availablePhonePePlanKeys.length === 0) {
      setSelectedPlan(null);
      return;
    }

    setSelectedPlan((prev) => {
      if (
        prev &&
        availablePhonePePlanKeys.includes(prev) &&
        (!applicableUpgradeTier ||
          PHONEPE_PLAN_TIERS[prev] === applicableUpgradeTier)
      ) {
        return prev;
      }

      return getPreferredPlanKey(availablePhonePePlanKeys, PHONEPE_PLAN_TIERS);
    });
  }, [
    availablePhonePePlanKeys,
    getPreferredPlanKey,
    applicableUpgradeTier,
    PHONEPE_PLAN_TIERS,
  ]);

  useEffect(() => {
    if (availableChainpayPlanKeys.length === 0) {
      setSelectedChainpayPlan(null);
      return;
    }

    setSelectedChainpayPlan((prev) => {
      if (
        prev &&
        availableChainpayPlanKeys.includes(prev) &&
        (!applicableUpgradeTier ||
          CHAINPAY_PLAN_TIERS[prev] === applicableUpgradeTier)
      ) {
        return prev;
      }

      return getPreferredPlanKey(
        availableChainpayPlanKeys,
        CHAINPAY_PLAN_TIERS,
      );
    });
  }, [
    availableChainpayPlanKeys,
    getPreferredPlanKey,
    applicableUpgradeTier,
    CHAINPAY_PLAN_TIERS,
  ]);

  useEffect(() => {
    if (
      !user ||
      user?.isPaid ||
      isProcessing ||
      hasRestoredChainpaySession.current
    ) {
      return;
    }

    hasRestoredChainpaySession.current = true;

    const resumeChainpayCheckout = async () => {
      let rawSession = null;
      try {
        rawSession = localStorage.getItem(CHAINPAY_SESSION_KEY);
      } catch (storageError) {
        console.warn("Unable to read ChainPay session", storageError);
        return;
      }

      if (!rawSession) {
        return;
      }

      let parsedSession = null;
      try {
        parsedSession = JSON.parse(rawSession);
      } catch (parseError) {
        localStorage.removeItem(CHAINPAY_SESSION_KEY);
        return;
      }

      const { orderId, token, paymentUrl, createdAt } = parsedSession || {};

      if (!orderId || !token) {
        localStorage.removeItem(CHAINPAY_SESSION_KEY);
        return;
      }

      if (
        Number.isFinite(createdAt) &&
        Date.now() - createdAt > CHAINPAY_SESSION_TTL_MS
      ) {
        localStorage.removeItem(CHAINPAY_SESSION_KEY);
        return;
      }

      let shouldResume = true;

      try {
        const res = await api.get(`/chainpay/order/${orderId}`);
        if (res.data?.success && res.data?.order) {
          const status = (res.data.order.status || "").toUpperCase();
          if (CHAINPAY_SUCCESS_STATES.has(status)) {
            shouldResume = false;
            localStorage.removeItem(CHAINPAY_SESSION_KEY);
          }
        }
      } catch (resumeError) {
        console.warn("ChainPay session status check failed", resumeError);
      }

      if (!shouldResume) {
        return;
      }

      navigate(`/checkout/chainpay/${orderId}`, {
        state: { token, paymentUrl },
        replace: true,
      });
    };

    resumeChainpayCheckout();
  }, [user, isProcessing, navigate]);

  const selectedPlanPricing = useMemo(() => {
    if (!selectedPlan) {
      return {
        ...calculateGstBreakdown(0),
        originalBaseAmount: 0,
      };
    }

    const plan = plans[selectedPlan];
    if (!plan) {
      return {
        ...calculateGstBreakdown(0),
        originalBaseAmount: 0,
      };
    }

    const originalBaseAmount = Number(plan.price || 0);
    const breakdown = calculateGstBreakdown(originalBaseAmount);

    return {
      ...breakdown,
      originalBaseAmount,
    };
  }, [plans, selectedPlan]);

  const chainpayPricing = useMemo(() => {
    return Object.fromEntries(
      Object.entries(chainpayPlans).map(([key, plan]) => {
        const mstcCoins = Number(plan.coins || 0);

        return [
          key,
          {
            mstcCoins,
            gstAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            currency: "MSTC",
          },
        ];
      }),
    );
  }, [chainpayPlans]);

  const formatCurrencyDisplay = (amount, currency) => {
    if (typeof amount !== "number") {
      return "-";
    }

    if ((currency || "").toUpperCase() === "INR") {
      return formatINR(amount);
    }

    return `${amount.toFixed(2)} ${currency || ""}`.trim();
  };

  const selectedChainpayPricing = selectedChainpayPlan
    ? chainpayPricing[selectedChainpayPlan]
    : null;

  useEffect(() => {
    if (!user) {
      return;
    }

    const normalizedPlan = normalizePlan(user.subscriptionPlan, user.planName);
    const hasUpgradeOptions =
      getPlanRank(normalizedPlan) < getPlanRank("premium");

    if (user?.hasCompletedSetup && user?.isPaid && !hasUpgradeOptions) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      const message = args[0]?.toString() || "";

      if (
        message.includes("WebGL") ||
        message.includes("svg") ||
        message.includes("phonepe") ||
        message.includes("GroupMarkerNotSet")
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args[0]?.toString() || "";
      if (
        message.includes("WebGL") ||
        message.includes("svg") ||
        message.includes("phonepe") ||
        message.includes("GroupMarkerNotSet")
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const loadPhonePeSdk = useCallback(async (sdkUrl) => {
    if (!sdkUrl) {
      return;
    }

    if (
      phonePeScriptRef.current.loaded &&
      phonePeScriptRef.current.url === sdkUrl
    ) {
      return;
    }

    await new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${sdkUrl}"]`);
      if (existingScript) {
        if (existingScript.getAttribute("data-loaded") === "true") {
          phonePeScriptRef.current = { loaded: true, url: sdkUrl };
          resolve();
        } else {
          existingScript.addEventListener("load", () => {
            existingScript.setAttribute("data-loaded", "true");
            phonePeScriptRef.current = { loaded: true, url: sdkUrl };
            resolve();
          });
          existingScript.addEventListener("error", reject);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = sdkUrl;
      script.async = true;
      script.addEventListener("load", () => {
        script.setAttribute("data-loaded", "true");
        phonePeScriptRef.current = { loaded: true, url: sdkUrl };
        resolve();
      });
      script.addEventListener("error", () => {
        script.remove();
        reject(new Error("Failed to load PhonePe SDK"));
      });
      document.body.appendChild(script);
    });
  }, []);

  const pollPaymentStatus = useCallback(
    async (merchantTransactionId) => {
      const maxAttempts = 15;
      const delayMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const result = await verifyPayment(
          { merchantTransactionId },
          { silent: true, skipRefresh: true },
        );

        if (result.success) {
          return { success: true };
        }

        const lowerMessage = (result.error || "").toLowerCase();
        const paymentPending =
          lowerMessage.includes("not completed") ||
          lowerMessage.includes("pending") ||
          lowerMessage.includes("unable to verify");

        if (!paymentPending) {
          return {
            success: false,
            error: result.error || "Payment verification failed.",
          };
        }

        setStatusMessage(
          `Waiting for payment confirmation... (attempt ${
            attempt + 1
          }/${maxAttempts})`,
        );

        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      return {
        success: false,
        error:
          "Payment is still pending. If you completed the payment, please refresh later or contact support.",
      };
    },
    [verifyPayment],
  );

  const openPhonePeCheckout = useCallback((checkoutPayload = {}) => {
    const redirectUrl =
      checkoutPayload?.redirectInfo?.url ||
      checkoutPayload?.redirectInfo?.redirectUrl;

    if (redirectUrl) {
      const checkoutWindow = window.open(
        redirectUrl,
        "_blank",
        "noopener,noreferrer",
      );
      if (checkoutWindow) {
        checkoutWindow.focus();
      } else {
        window.location.href = redirectUrl;
      }
      return true;
    }

    const payload = checkoutPayload?.payload;
    if (
      payload &&
      window.PhonePe &&
      typeof window.PhonePe.execute === "function"
    ) {
      try {
        window.PhonePe.execute(payload);
        return true;
      } catch (err) {
        console.warn("PhonePe execute failed, falling back to redirect", err);
      }
    }

    return false;
  }, []);

  const startPhonePePayment = useCallback(
    async (overridePlanKey) => {
      if (isProcessing) {
        return;
      }

      if (!user?.name?.trim()) {
        setErrors((prev) => ({
          ...prev,
          phonepe:
            "Please update your name in your profile before making a payment.",
        }));
        return;
      }

      const effectivePlanKey = overridePlanKey || selectedPlan;

      if (!effectivePlanKey || !plans[effectivePlanKey]) {
        setErrors((prev) => ({
          ...prev,
          phonepe: "Please select an upgrade plan to continue.",
        }));
        return;
      }

      const plan = plans[effectivePlanKey];
      const originalBaseAmount = Number(plan.price || 0);
      const breakdown = calculateGstBreakdown(originalBaseAmount);
      const pricing = {
        ...breakdown,
        originalBaseAmount,
      };

      setProcessingGateway("phonepe");
      setErrors((prev) => ({ ...prev, phonepe: "" }));
      setStatusMessage("");
      setChainpayStatusMessage("");

      try {
        const amountPaise = Math.round(pricing.totalAmount * 100);
        const orderRes = await createPaymentOrder({
          amountPaise,
          email: user?.email,
          customerName: user?.name,
          mobileNumber: user?.phone,
          note: `${plan.name} plan purchase (incl. GST)`,
          planKey: effectivePlanKey,
          planName: plan.name,
          pricing,
        });

        if (!orderRes.success) {
          throw new Error(orderRes.error || "Unable to initiate payment.");
        }

        const {
          merchantTransactionId,
          instrumentResponse,
          redirectInfo,
          sdkUrl,
        } = orderRes.data || {};

        if (!merchantTransactionId) {
          throw new Error("Missing transaction reference from PhonePe.");
        }

        if (sdkUrl) {
          try {
            await loadPhonePeSdk(sdkUrl);
          } catch (sdkError) {
            console.warn("PhonePe SDK load failed:", sdkError.message);
          }
        }

        const checkoutPayload = {
          ...(instrumentResponse || {}),
        };
        if (!checkoutPayload.redirectInfo && redirectInfo) {
          checkoutPayload.redirectInfo = redirectInfo;
        }

        const opened = openPhonePeCheckout(checkoutPayload);
        if (!opened) {
          throw new Error(
            "Unable to open PhonePe checkout. Please try again or use a different browser.",
          );
        }

        setStatusMessage(
          "Waiting for you to complete the payment in PhonePe...",
        );

        const pollResult = await pollPaymentStatus(merchantTransactionId);

        if (!pollResult.success) {
          throw new Error(pollResult.error);
        }

        navigate("/dashboard", { replace: true });
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          phonepe: err.message || "Payment failed",
        }));
        setStatusMessage("");
      } finally {
        setProcessingGateway(null);
      }
    },
    [
      isProcessing,
      user,
      selectedPlan,
      plans,
      createPaymentOrder,
      loadPhonePeSdk,
      openPhonePeCheckout,
      pollPaymentStatus,
      navigate,
    ],
  );

  const startChainpayPayment = useCallback(
    async (overridePlanKey) => {
      if (isProcessing) {
        return;
      }

      if (!user?.name?.trim()) {
        setErrors((prev) => ({
          ...prev,
          chainpay:
            "Please update your name in your profile before making a payment.",
        }));
        return;
      }

      const effectivePlanKey = overridePlanKey || selectedChainpayPlan;

      if (!effectivePlanKey || !chainpayPlans[effectivePlanKey]) {
        setErrors((prev) => ({
          ...prev,
          chainpay: "Please select an upgrade plan.",
        }));
        return;
      }

      const plan = chainpayPlans[effectivePlanKey];
      const pricing = chainpayPricing[effectivePlanKey];
      const mstcCoins = Number(pricing?.mstcCoins ?? plan.coins ?? 0);

      setProcessingGateway("chainpay");
      setErrors((prev) => ({ ...prev, chainpay: "" }));
      setChainpayStatusMessage("Creating ChainPay payment request...");

      try {
        const paymentRes = await createChainpayPayment({
          description: `${plan.name} plan purchase`,
          planKey: effectivePlanKey,
          planName: plan.name,
          pricing: {
            ...(pricing || {}),
            mstcCoins,
          },
          metadata: {
            mstcCoins,
            planLabel: plan.name,
          },
        });

        if (!paymentRes.success) {
          throw new Error(
            paymentRes.error || "Unable to initiate ChainPay payment.",
          );
        }

        const {
          orderId: createdOrderId,
          token: paymentToken,
          paymentUrl,
        } = paymentRes.data || {};

        if (!createdOrderId || !paymentToken) {
          throw new Error("Missing ChainPay order reference.");
        }

        try {
          localStorage.setItem(
            CHAINPAY_SESSION_KEY,
            JSON.stringify({
              orderId: createdOrderId,
              token: paymentToken,
              paymentUrl,
              mstcCoins,
              createdAt: Date.now(),
            }),
          );
        } catch (storageError) {
          console.warn("Unable to persist ChainPay session", storageError);
        }

        setChainpayStatusMessage("Opening MSTC checkout...");
        navigate(`/checkout/chainpay/${createdOrderId}`, {
          state: { token: paymentToken, paymentUrl },
          replace: true,
        });
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          chainpay: err.message || "ChainPay payment failed",
        }));
        setChainpayStatusMessage("");
      } finally {
        setProcessingGateway(null);
      }
    },
    [
      isProcessing,
      user,
      selectedChainpayPlan,
      chainpayPlans,
      chainpayPricing,
      createChainpayPayment,
      navigate,
    ],
  );

  const hasUpgradeOptions =
    availablePhonePePlanKeys.length > 0 || availableChainpayPlanKeys.length > 0;

  return (
    <motion.div
      className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="pointer-events-none absolute -z-10 inset-0">
          <div className="absolute -top-24 -right-16 h-52 w-52 rounded-full bg-primary-500/25 blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-52 w-52 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>

        <button
          onClick={async () => {
            try {
              await logout();
            } catch (err) {
              console.warn("Logout before returning to signup failed", err);
            }
            navigate("/signup", { replace: true });
          }}
          className="flex items-center space-x-2 text-slate-300 hover:text-white mb-6 transition-colors"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to signup</span>
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/40">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">QR Folio</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            {hasUpgradeOptions
              ? `Choose the plan you would like to upgrade to. Your current plan is ${
                  PLAN_LABELS[currentPlan] || PLAN_LABELS.basic
                }.`
              : "You already have access to the highest available plan."}
          </p>
        </div>

        <motion.div
          className="grid lg:grid-cols-2 gap-6 lg:gap-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
        >
          {/* ChainPay MSTC column */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-7 shadow-xl shadow-slate-950/40 backdrop-blur">
            <div className="flex items-center space-x-2 mb-5">
              <Shield className="w-5 h-5 text-emerald-400" />

              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Select Your Plan (ChainPay MSTC)
              </h2>
            </div>

            {errors.chainpay && (
              <div className="mb-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10">
                <p className="text-red-300 text-sm">{errors.chainpay}</p>
              </div>
            )}

            {chainpayStatusMessage && !errors.chainpay && (
              <div className="mb-4 p-4 rounded-xl border border-indigo-500/40 bg-indigo-500/10">
                <p className="text-indigo-200 text-sm">
                  {chainpayStatusMessage}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {availableChainpayPlanKeys.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-slate-900/40 p-4 text-sm text-slate-300 text-center">
                  No ChainPay upgrade options available.
                </div>
              ) : (
                availableChainpayPlanKeys.map((key) => {
                  const plan = chainpayPlans[key];
                  const pricing = chainpayPricing[key];
                  const mstcCoins = Number(
                    pricing?.mstcCoins ?? plan?.coins ?? 0,
                  );
                  const isSelected = selectedChainpayPlan === key;

                  if (!plan) {
                    return null;
                  }

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedChainpayPlan(key)}
                      className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-400/80 bg-emerald-500/10 shadow-inner shadow-emerald-500/20"
                          : "border-white/10 bg-slate-900/60 hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold text-white">
                              {plan.name}
                            </div>
                            <div className="text-sm text-slate-300">
                              {plan.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-emerald-400">
                              {`${mstcCoins} MSTC`}
                            </div>
                          </div>
                        </div>
                        <ul className="space-y-1 text-sm text-slate-300">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start space-x-2"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedChainpayPlan(key);
                              startChainpayPayment(key);
                            }}
                            disabled={
                              processingGateway === "chainpay" || isProcessing
                            }
                            className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                              processingGateway === "chainpay" || isProcessing
                                ? "bg-slate-700/60 text-slate-400 cursor-not-allowed"
                                : "bg-emerald-500 hover:bg-emerald-400"
                            }`}
                          >
                            {processingGateway === "chainpay"
                              ? "Processing..."
                              : "Pay with ChainPay"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PhonePe UPI column */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-7 shadow-xl shadow-slate-950/40 backdrop-blur">
            <div className="flex items-center space-x-2 mb-5">
              <Shield className="w-5 h-5 text-primary-400" />

              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Select Your Plan (PhonePe UPI)
              </h2>
            </div>

            <div className="space-y-4">
              {availablePhonePePlanKeys.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-slate-900/40 p-4 text-sm text-slate-300 text-center">
                  No PhonePe upgrade options available.
                </div>
              ) : (
                availablePhonePePlanKeys.map((key) => {
                  const plan = plans[key];

                  if (!plan) {
                    return null;
                  }

                  const breakdown = calculateGstBreakdown(
                    Number(plan.price || 0),
                  );
                  const isSelected = selectedPlan === key;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedPlan(key)}
                      className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary-400/80 bg-primary-500/10 shadow-inner shadow-primary-500/20"
                          : "border-white/10 bg-slate-900/60 hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold text-white">
                              {plan.name}
                            </div>
                            <div className="text-sm text-slate-300">
                              {plan.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary-400">
                              {`${formatINR(breakdown.baseAmount)} / year`}
                            </div>
                            <div className="text-xs text-slate-400">+ GST</div>
                          </div>
                        </div>
                        <ul className="space-y-1 text-sm text-slate-300">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start space-x-2"
                            >
                              <CheckCircle className="w-4 h-4 text-primary-400 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedPlan(key);
                              startPhonePePayment(key);
                            }}
                            disabled={
                              processingGateway === "phonepe" || isProcessing
                            }
                            className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                              processingGateway === "phonepe" || isProcessing
                                ? "bg-slate-700/60 text-slate-400 cursor-not-allowed"
                                : "bg-primary-500 hover:bg-primary-400"
                            }`}
                          >
                            {processingGateway === "phonepe"
                              ? "Processing..."
                              : "Pay with PhonePe"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 p-4 rounded-xl border border-white/10 bg-slate-900/80">
              <h3 className="font-semibold text-white mb-2">Order Summary</h3>
              {selectedPlan && plans[selectedPlan] ? (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300">
                      {plans[selectedPlan].name}
                    </span>

                    <span className="font-semibold text-white">
                      {formatINR(selectedPlanPricing.baseAmount)} / year
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-slate-300">
                    <span>Transaction Fee</span>
                    <span>0%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-300 mb-2">
                    <span>GST (18%)</span>
                    <span>{formatINR(selectedPlanPricing.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-white border-t border-slate-700 pt-2">
                    <span>Total</span>
                    <span>
                      {formatINR(selectedPlanPricing.totalAmount)} / year
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  No active PhonePe upgrade selection.
                </p>
              )}
            </div>

            {errors.phonepe && (
              <div className="mt-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10">
                <p className="text-red-300 text-sm">{errors.phonepe}</p>
              </div>
            )}

            {statusMessage && !errors.phonepe && (
              <div className="mt-6 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10">
                <p className="text-amber-200 text-sm">{statusMessage}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => startPhonePePayment()}
              disabled={processingGateway === "phonepe" || isProcessing}
              className={`w-full mt-6 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white transition-colors ${
                processingGateway === "phonepe" || isProcessing
                  ? "bg-slate-700/60 text-slate-400 cursor-not-allowed"
                  : "bg-primary-500 hover:bg-primary-400"
              }`}
            >
              {processingGateway === "phonepe" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing PhonePe...</span>
                </>
              ) : (
                <span>
                  {selectedPlan && plans[selectedPlan]
                    ? `Pay ${formatINR(
                        selectedPlanPricing.totalAmount,
                      )} / year (PhonePe)`
                    : "Pay with PhonePe"}
                </span>
              )}
            </button>

            <div className="mt-6 p-4 rounded-xl border border-blue-500/40 bg-blue-500/10">
              <p className="text-blue-200 text-sm">
                <strong className="font-semibold text-blue-100">Note:</strong>{" "}
                You may see some technical warnings in the browser console
                during payment. These are from PhonePe's payment system and
                don't affect the payment process. Your payment will work
                normally.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const PaymentPage = () => (
  <>
    <PageSEO
      title="Plans & pricing"
      description="Choose a QR Folio digital business card plan – Basic (Silver), Standard (Gold), or Premium (Platinum) with QR and NFC options."
      keywords={[
        "qr folio pricing",
        "digital business card plans",
        "qrfolio subscription",
        "qr code business card pricing",
      ]}
      canonicalPath="/payment"
    />
    <PaymentForm />
  </>
);

export default PaymentPage;
