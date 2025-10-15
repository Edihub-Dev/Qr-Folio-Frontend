import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, ArrowLeft, CheckCircle, QrCode } from "lucide-react";
import {
  normalizePlan,
  getPlanRank,
  PLAN_LABELS,
} from "../utils/subscriptionPlan";

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
  const [selectedChainpayPlan, setSelectedChainpayPlan] = useState("starter");
  const [errors, setErrors] = useState({ phonepe: "", chainpay: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [chainpayStatusMessage, setChainpayStatusMessage] = useState("");
  const phonePeScriptRef = useRef({ loaded: false, url: null });

  const plans = useMemo(
    () => ({
      basic: {
        name: "Basic (Silver)",
        price: 399,
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
    []
  );

  const chainpayPlans = useMemo(
    () => ({
      starter: {
        name: "Basic (Silver) - 100 MSTC",
        price: 110,
        // currency: "INR",
        description: "Start accepting crypto payments with INR billing",
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
        name: "Standard (Gold) - 200 MSTC",
        price: 110,
        // currency: "INR",
        description: "Premium tools with annual INR billing",
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
        name: "Premium (Platinum) - 300 MSTC",
        price: 110,
        // currency: "INR",
        description: "Enterprise billing with custom crypto support",
        features: [
          "Everything in Standard",
          "Custom Branding",
          "Team Collaboration",
          "Personalized Support",
          "Media Storage up to 10 files of 1GB",
          "Includes an NFC-enabled profile card NFC is a short-range wireless technology. ",
          "Prices Exclusive of Taxes",
        ],
      },
    }),
    []
  );

  const promoCode = (user?.promoCode || "").toUpperCase();
  const isPromoEligible = Boolean(
    user?.promoCodeEligible && !user?.promoCodeUsed && promoCode === "QR10FOLIO"
  );

  const rawRequestedUpgrade = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("upgrade");
  }, [location.search]);

  const currentPlan = useMemo(
    () => normalizePlan(user?.subscriptionPlan, user?.planName),
    [user?.subscriptionPlan, user?.planName]
  );
  const currentPlanRank = useMemo(
    () => getPlanRank(currentPlan),
    [currentPlan]
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
    []
  );

  const CHAINPAY_PLAN_TIERS = useMemo(
    () => ({
      starter: "basic",
      growth: "standard",
      enterprise: "premium",
    }),
    []
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
    return Boolean(user.isPaid);
  }, [applicableUpgradeTier, user]);

  const getPreferredPlanKey = useCallback(
    (availableKeys, tierMap) => {
      if (!availableKeys?.length) {
        return null;
      }

      if (applicableUpgradeTier) {
        const requestedKey = availableKeys.find(
          (key) => tierMap[key] === applicableUpgradeTier
        );
        if (requestedKey) {
          return requestedKey;
        }
      }

      return availableKeys[0];
    },
    [applicableUpgradeTier]
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
        CHAINPAY_PLAN_TIERS
      );
    });
  }, [
    availableChainpayPlanKeys,
    getPreferredPlanKey,
    applicableUpgradeTier,
    CHAINPAY_PLAN_TIERS,
  ]);

  const selectedPlanPricing = useMemo(() => {
    if (!selectedPlan) {
      return {
        ...calculateGstBreakdown(0),
        originalBaseAmount: 0,
        promoApplied: false,
        promoCode: null,
        promoDiscountAmount: 0,
      };
    }

    const plan = plans[selectedPlan];
    if (!plan) {
      return {
        ...calculateGstBreakdown(0),
        originalBaseAmount: 0,
        promoApplied: false,
        promoCode: null,
        promoDiscountAmount: 0,
      };
    }

    const originalBaseAmount = Number(plan.price || 0);
    const discountedBaseAmount = isPromoEligible
      ? Number((originalBaseAmount * 0.9).toFixed(2))
      : originalBaseAmount;

    const breakdown = calculateGstBreakdown(discountedBaseAmount);
    const promoDiscountAmount = isPromoEligible
      ? Number((originalBaseAmount - discountedBaseAmount).toFixed(2))
      : 0;

    return {
      ...breakdown,
      originalBaseAmount,
      promoApplied: isPromoEligible,
      promoCode: isPromoEligible ? promoCode : null,
      promoDiscountAmount,
    };
  }, [plans, selectedPlan, isPromoEligible, promoCode]);

  const chainpayPricing = useMemo(() => {
    return Object.fromEntries(
      Object.entries(chainpayPlans).map(([key, plan]) => {
        const originalAmount = Number(plan.price || 0);
        const discountedAmount = isPromoEligible
          ? Number(originalAmount.toFixed(2))
          : originalAmount;
        const promoDiscountAmount = isPromoEligible
          ? Number((originalAmount - discountedAmount).toFixed(2))
          : 0;

        return [
          key,
          {
            baseAmount: discountedAmount,
            originalAmount,
            promoApplied: isPromoEligible,
            promoCode: isPromoEligible ? promoCode : null,
            promoDiscountAmount,
            gstAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalAmount: discountedAmount,
            currency: plan.currency,
          },
        ];
      })
    );
  }, [chainpayPlans, isPromoEligible, promoCode]);

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
      const delayMs = 4000;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const result = await verifyPayment(
          { merchantTransactionId },
          { silent: true }
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
          }/${maxAttempts})`
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
    [verifyPayment]
  );

  const openPhonePeCheckout = useCallback((checkoutPayload = {}) => {
    const redirectUrl =
      checkoutPayload?.redirectInfo?.url ||
      checkoutPayload?.redirectInfo?.redirectUrl;

    if (redirectUrl) {
      const checkoutWindow = window.open(
        redirectUrl,
        "_blank",
        "noopener,noreferrer"
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

  const startPhonePePayment = useCallback(async () => {
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

    if (!selectedPlan || !plans[selectedPlan]) {
      setErrors((prev) => ({
        ...prev,
        phonepe: "Please select an upgrade plan to continue.",
      }));
      return;
    }

    setProcessingGateway("phonepe");
    setErrors((prev) => ({ ...prev, phonepe: "" }));
    setStatusMessage("");
    setChainpayStatusMessage("");

    try {
      const amountPaise = Math.round(selectedPlanPricing.totalAmount * 100);
      const orderRes = await createPaymentOrder({
        amountPaise,
        email: user?.email,
        customerName: user?.name,
        mobileNumber: user?.phone,
        note: `${plans[selectedPlan].name} plan purchase (incl. GST)`,
        planKey: selectedPlan,
        planName: plans[selectedPlan].name,
        pricing: selectedPlanPricing,
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
          "Unable to open PhonePe checkout. Please try again or use a different browser."
        );
      }

      setStatusMessage("Waiting for you to complete the payment in PhonePe...");

      const pollResult = await pollPaymentStatus(merchantTransactionId);

      if (!pollResult.success) {
        throw new Error(pollResult.error);
      }

      await refreshUser();
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
  }, [
    user,
    navigate,
    plans,
    selectedPlan,
    createPaymentOrder,
    loadPhonePeSdk,
    openPhonePeCheckout,
    pollPaymentStatus,
    refreshUser,
    selectedPlanPricing,
    isProcessing,
  ]);

  const startChainpayPayment = useCallback(async () => {
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

    if (!selectedChainpayPlan || !chainpayPlans[selectedChainpayPlan]) {
      setErrors((prev) => ({
        ...prev,
        chainpay: "Please select an upgrade plan.",
      }));
      return;
    }

    const plan = chainpayPlans[selectedChainpayPlan];
    const pricing = chainpayPricing[selectedChainpayPlan];

    setProcessingGateway("chainpay");
    setErrors((prev) => ({ ...prev, chainpay: "" }));
    setChainpayStatusMessage("Creating ChainPay payment request...");

    try {
      const paymentRes = await createChainpayPayment({
        amountFiat: pricing?.totalAmount || plan.price,
        currency: plan.currency || "INR",
        description: `${plan.name} plan purchase`,
        planKey: selectedChainpayPlan,
        planName: plan.name,
        pricing,
        metadata: {
          promoApplied: pricing?.promoApplied || false,
          promoCode: pricing?.promoCode || null,
          promoDiscountAmount: pricing?.promoDiscountAmount || 0,
          originalAmount: pricing?.originalAmount || plan.price,
          finalAmount: pricing?.totalAmount || plan.price,
        },
      });

      if (!paymentRes.success) {
        throw new Error(
          paymentRes.error || "Unable to initiate ChainPay payment."
        );
      }

      const { paymentUrl } = paymentRes.data || {};
      if (!paymentUrl) {
        throw new Error("Missing ChainPay payment URL.");
      }

      setChainpayStatusMessage("Redirecting you to ChainPay checkout...");

      const opened = window.open(paymentUrl, "_blank", "noopener,noreferrer");
      if (opened) {
        opened.focus();
      } else {
        window.location.href = paymentUrl;
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        chainpay: err.message || "ChainPay payment failed",
      }));
      setChainpayStatusMessage("");
    } finally {
      setProcessingGateway(null);
    }
  }, [
    isProcessing,
    user,
    navigate,
    chainpayPlans,
    selectedChainpayPlan,
    createChainpayPayment,
    chainpayPricing,
  ]);

  const hasUpgradeOptions =
    availablePhonePePlanKeys.length > 0 || availableChainpayPlanKeys.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={async () => {
            try {
              await logout();
            } catch (err) {
              console.warn("Logout before returning to signup failed", err);
            }
            navigate("/signup", { replace: true });
          }}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to signup</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">QR Folio</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-gray-600">
            {hasUpgradeOptions
              ? `Choose the plan you would like to upgrade to. Your current plan is ${
                  PLAN_LABELS[currentPlan] || PLAN_LABELS.basic
                }.`
              : "You already have access to the highest available plan."}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Shield className="w-5 h-5 text-purple-500" />

              <h2 className="text-xl font-bold text-gray-900">
                Select Your Plan (ChainPay MSTC)
              </h2>
            </div>

            {errors.chainpay && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.chainpay}</p>
              </div>
            )}

            {chainpayStatusMessage && !errors.chainpay && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-indigo-700 text-sm">
                  {chainpayStatusMessage}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {availableChainpayPlanKeys.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 text-center">
                  No ChainPay upgrade options available.
                </div>
              ) : (
                availableChainpayPlanKeys.map((key) => {
                  const plan = chainpayPlans[key];
                  const planPricing = chainpayPricing[key];
                  const isSelected = selectedChainpayPlan === key;
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: isSelected ? 1 : 1.02 }}
                      onClick={() => setSelectedChainpayPlan(key)}
                      className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {plan.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {plan.description}
                            </div>
                          </div>
                          {/* <div className="text-right">
                            <div className="text-xl font-bold text-indigo-600">
                              {formatCurrencyDisplay()
                              // planPricing?.totalAmount ?? plan.price,
                              // planPricing?.currency || "INR"
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              Inclusive of offers
                            </div>
                          </div> */}
                        </div>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start space-x-2"
                            >
                              <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedChainpayPlan(key);
                            startChainpayPayment();
                          }}
                          disabled={
                            processingGateway === "chainpay" ||
                            isProcessing ||
                            selectedChainpayPlan !== key
                          }
                          className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                            processingGateway === "chainpay" ||
                            isProcessing ||
                            selectedChainpayPlan !== key
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          {processingGateway === "chainpay"
                            ? "Processing..."
                            : isSelected
                            ? "Pay with ChainPay"
                            : "Select Plan to Pay"}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Payments powered by ChainPay (MSTC)
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Shield className="w-5 h-5 text-primary-500" />

              <h2 className="text-xl font-bold text-gray-900">
                Select Your Plan (PhonePe)
              </h2>
            </div>
            <div className="space-y-4">
              {availablePhonePePlanKeys.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 text-center">
                  No PhonePe upgrade options available.
                </div>
              ) : (
                availablePhonePePlanKeys.map((key) => {
                  const plan = plans[key];
                  const isSelected = selectedPlan === key;
                  const breakdown = isSelected
                    ? selectedPlanPricing
                    : calculateGstBreakdown(plan.price);
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: isSelected ? 1 : 1.02 }}
                      onClick={() => setSelectedPlan(key)}
                      className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {plan.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {plan.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary-600">
                              {formatCurrencyDisplay(
                                breakdown.totalAmount,
                                "INR"
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Inclusive of GST
                            </div>
                          </div>
                        </div>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start space-x-2"
                            >
                              <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPlan(key);
                            startPhonePePayment();
                          }}
                          disabled={
                            processingGateway === "phonepe" ||
                            isProcessing ||
                            selectedPlan !== key
                          }
                          className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                            processingGateway === "phonepe" ||
                            isProcessing ||
                            selectedPlan !== key
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-primary-600 hover:bg-primary-700"
                          }`}
                        >
                          {processingGateway === "phonepe"
                            ? "Processing..."
                            : isSelected
                            ? "Pay with PhonePe"
                            : "Select Plan to Pay"}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">
                Order Summary
              </h3>
              {selectedPlan && plans[selectedPlan] ? (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">
                      {plans[selectedPlan].name}
                      {selectedPlanPricing.promoApplied &&
                        selectedPlanPricing.originalBaseAmount > 0 && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            {selectedPlanPricing.promoCode} Applied
                          </span>
                        )}
                    </span>
                    <span className="font-semibold">
                      {formatINR(selectedPlanPricing.baseAmount)} / year
                    </span>
                  </div>
                  {selectedPlanPricing.promoApplied && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>
                        Promo Discount ({selectedPlanPricing.promoCode})
                      </span>
                      <span>
                        -{formatINR(selectedPlanPricing.promoDiscountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Transaction Fee</span>
                    <span>0%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span>GST (18%)</span>
                    <span>{formatINR(selectedPlanPricing.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span>
                      {formatINR(selectedPlanPricing.totalAmount)} / year
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No active PhonePe upgrade selection.
                </p>
              )}
            </div>

            {errors.phonepe && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.phonepe}</p>
              </div>
            )}

            {statusMessage && !errors.phonepe && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 text-sm">{statusMessage}</p>
              </div>
            )}

            <button
              type="button"
              onClick={startPhonePePayment}
              disabled={
                processingGateway === "phonepe" || isProcessing || !selectedPlan
              }
              className={`w-full mt-6 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white transition-colors ${
                processingGateway === "phonepe" || isProcessing || !selectedPlan
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700"
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
                        selectedPlanPricing.totalAmount
                      )} / year (PhonePe)`
                    : "Select a plan to continue"}
                </span>
              )}
            </button>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> You may see some technical warnings in
                the browser console during payment. These are from PhonePe's
                payment system and don't affect the payment process. Your
                payment will work normally.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const PaymentPage = () => <PaymentForm />;

export default PaymentPage;
