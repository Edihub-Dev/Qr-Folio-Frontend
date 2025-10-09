import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, ArrowLeft, CheckCircle, QrCode } from "lucide-react";

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
  const [processingGateway, setProcessingGateway] = useState(null);
  const isProcessing = processingGateway !== null;
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [selectedChainpayPlan, setSelectedChainpayPlan] = useState("starter");
  const [showChainpayPlans, setShowChainpayPlans] = useState(false);
  const [errors, setErrors] = useState({ phonepe: "", chainpay: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [chainpayStatusMessage, setChainpayStatusMessage] = useState("");
  const phonePeScriptRef = useRef({ loaded: false, url: null });

  const plans = useMemo(
    () => ({
      basic: {
        name: "Basic",
        price: 1,
        description: "Perfect for individuals",
        features: [
          "Digital Business Card",
          "QR Code Generation",
          "Basic Analytics",
          "Email Support",
        ],
      },
      professional: {
        name: "Professional",
        price: 899,
        description: "Best for professionals",
        features: [
          "Everything in Basic",
          "Custom Branding",
          "Advanced Analytics",
          "Priority Support",
          "Team Collaboration",
        ],
      },
      // enterprise: {
      //   name: "Enterprise",
      //   price: 1,
      //   description: "For large organizations",
      //   features: [
      //     "Everything in Professional",
      //     "White Label Solution",
      //     "API Access",
      //     "Dedicated Manager",
      //     "Custom Integrations",
      //   ],
      // },
    }),
    []
  );

  const chainpayPlans = useMemo(
    () => ({
      starter: {
        name: "Crypto Starter",
        price: 90,
        currency: "INR",
        description: "Start accepting crypto payments with INR billing",
        features: [
          "Includes Basic QR Folio features",
          "Accepts major stablecoins",
          "Automatic exchange rate locking",
        ],
      },
      growth: {
        name: "Crypto Growth",
        price: 899,
        currency: "INR",
        description: "Premium tools with annual INR billing",
        features: [
          "Everything in Crypto Starter",
          "Priority payout routing",
          "On-chain payment analytics",
          "Multi-wallet support",
        ],
      },
      // enterprise: {
      //   name: "Crypto Enterprise",
      //   price: 6999,
      //   currency: "INR",
      //   description: "Enterprise billing with custom crypto support",
      //   features: [
      //     "Dedicated ChainPay success engineer",
      //     "Custom webhook retry policies",
      //     "Tiered access management",
      //     "Multi-company dashboards",
      //   ],
      // },
    }),
    []
  );

  const selectedPlanPricing = useMemo(() => {
    const plan = plans[selectedPlan];
    if (!plan) {
      return calculateGstBreakdown(0);
    }
    return calculateGstBreakdown(plan.price);
  }, [plans, selectedPlan]);

  const chainpayPricing = useMemo(() => {
    return Object.fromEntries(
      Object.entries(chainpayPlans).map(([key, plan]) => [
        key,
        {
          baseAmount: plan.price,
          gstAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalAmount: plan.price,
          currency: plan.currency,
        },
      ])
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

  useEffect(() => {
    if (user?.hasCompletedSetup || user?.isPaid) {
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
    if (user?.hasCompletedSetup || user?.isPaid) {
      navigate("/dashboard", { replace: true });
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

    if (user?.hasCompletedSetup || user?.isPaid) {
      navigate("/dashboard", { replace: true });
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

    const plan = chainpayPlans[selectedChainpayPlan];
    if (!plan) {
      setErrors((prev) => ({
        ...prev,
        chainpay: "Please select a ChainPay plan.",
      }));
      return;
    }

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
            Choose your plan and enter payment details
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Select Your Plan
            </h2>
            <div className="space-y-4">
              {Object.entries(plans).map(([key, plan]) => {
                const isDisabled = key !== "professional";
                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                    onClick={() => !isDisabled && setSelectedPlan(key)}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      isDisabled
                        ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                        : selectedPlan === key
                        ? "border-primary-500 bg-primary-50 cursor-pointer"
                        : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="plan"
                          value={key}
                          checked={selectedPlan === key}
                          onChange={(e) =>
                            !isDisabled && setSelectedPlan(e.target.value)
                          }
                          disabled={isDisabled}
                          className="w-4 h-4 text-primary-600 disabled:opacity-50"
                        />
                        <div>
                          <h3
                            className={`font-semibold ${
                              isDisabled ? "text-gray-500" : "text-gray-900"
                            }`}
                          >
                            {plan.name} {isDisabled && "(Coming Soon)"}
                          </h3>
                          <p
                            className={`text-sm ${
                              isDisabled ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {plan.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            isDisabled ? "text-gray-500" : "text-gray-900"
                          }`}
                        >
                          ₹{plan.price}
                          {/* <span className="block text-sm font-normal text-gray-500">
                            + 18% GST
                          </span>
                          <span className="block text-xs text-gray-500">
                            Transaction Fee: 0%
                          </span> */}
                        </div>
                        <div
                          className={`text-sm ${
                            isDisabled ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          /year
                        </div>
                      </div>
                    </div>
                    <ul
                      className={`text-sm space-y-1 ml-7 ${
                        isDisabled ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle
                            className={`w-4 h-4 flex-shrink-0 ${
                              isDisabled ? "text-gray-400" : "text-green-500"
                            }`}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">
                Order Summary
              </h3>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">
                  {plans[selectedPlan].name} Plan
                </span>
                <span className="font-semibold">
                  {formatINR(selectedPlanPricing.baseAmount)} / year
                </span>
              </div>
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
                <span>{formatINR(selectedPlanPricing.totalAmount)} / year</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Shield className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900">
                Secure Payment
              </h2>
            </div>

            {errors.phonepe && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.phonepe}</p>
              </div>
            )}

            {statusMessage && !errors.phonepe && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 text-sm">{statusMessage}</p>
              </div>
            )}

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> You may see some technical warnings in
                the browser console during payment. These are from PhonePe's
                payment system and don't affect the payment process. Your
                payment will work normally.
              </p>
            </div>

            <div className="space-y-6">
              <motion.button
                onClick={startPhonePePayment}
                disabled={isProcessing || user?.hasCompletedSetup}
                whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user?.hasCompletedSetup ? (
                  <span>Plan already active</span>
                ) : processingGateway === "phonepe" ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Opening PhonePe...</span>
                  </div>
                ) : (
                  `Pay ₹${plans[selectedPlan].price}/year (PhonePe)`
                )}
              </motion.button>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pay with MSTC (Crypto)
                  </h3>
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

                <motion.button
                  onClick={() => {
                    if (!showChainpayPlans) {
                      setShowChainpayPlans(true);
                      return;
                    }
                    startChainpayPayment();
                  }}
                  disabled={isProcessing || user?.hasCompletedSetup}
                  whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                  whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold shadow-sm hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {user?.hasCompletedSetup ? (
                    <span>Plan already active</span>
                  ) : processingGateway === "chainpay" ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Opening ChainPay...</span>
                    </div>
                  ) : (
                    `Pay ${formatCurrencyDisplay(
                      chainpayPlans[selectedChainpayPlan].price,
                      chainpayPlans[selectedChainpayPlan].currency
                    )}`
                  )}
                </motion.button>

                {showChainpayPlans && (
                  <div className="mt-6 space-y-4">
                    {Object.entries(chainpayPlans).map(([key, plan]) => (
                      <motion.div
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedChainpayPlan(key)}
                        className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                          selectedChainpayPlan === key
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="chainpay-plan"
                              value={key}
                              checked={selectedChainpayPlan === key}
                              onChange={(e) =>
                                setSelectedChainpayPlan(e.target.value)
                              }
                              className="w-4 h-4 text-indigo-600"
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {plan.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {plan.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrencyDisplay(plan.price, plan.currency)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {plan.currency}
                            </div>
                            {/* <div className="text-xs text-gray-500 mt-1">
                              GST: {formatINR(chainpayPricing[key].gstAmount)}
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              Total:{" "}
                              {formatINR(chainpayPricing[key].totalAmount)}
                            </div> */}
                          </div>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1 ml-7">
                          {plan.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-center space-x-2"
                            >
                              <CheckCircle className="w-4 h-4 text-purple-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const PaymentPage = () => <PaymentForm />;

export default PaymentPage;
