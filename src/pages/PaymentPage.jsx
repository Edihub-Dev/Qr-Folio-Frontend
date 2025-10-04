import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, ArrowLeft, CheckCircle, QrCode } from "lucide-react";

const PaymentForm = () => {
  const navigate = useNavigate();
  const { createPaymentOrder, verifyPayment, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const phonePeScriptRef = useRef({ loaded: false, url: null });

  const plans = {
    basic: {
      name: "Basic",
      price: 599,
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
      price: 599,
      description: "Best for professionals",
      features: [
        "Everything in Basic",
        "Custom Branding",
        "Advanced Analytics",
        "Priority Support",
        "Team Collaboration",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: 599,
      description: "For large organizations",
      features: [
        "Everything in Professional",
        "White Label Solution",
        "API Access",
        "Dedicated Manager",
        "Custom Integrations",
      ],
    },
  };

  useEffect(() => {
    if (user?.hasCompletedSetup) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      const message = args[0]?.toString() || '';

      if (message.includes('WebGL') || 
          message.includes('svg') || 
          message.includes('phonepe') ||
          message.includes('GroupMarkerNotSet')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('WebGL') || 
          message.includes('svg') || 
          message.includes('phonepe') ||
          message.includes('GroupMarkerNotSet')) {
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
      const existingScript = document.querySelector(
        `script[src="${sdkUrl}"]`
      );
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
        const result = await verifyPayment({ merchantTransactionId }, { silent: true });

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

        setStatusMessage(`Waiting for payment confirmation... (attempt ${
          attempt + 1
        }/${maxAttempts})`);

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
      const checkoutWindow = window.open(redirectUrl, "_blank", "noopener,noreferrer");
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
    if (user?.hasCompletedSetup) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!user?.name?.trim()) {
      setErrors({
        submit: "Please update your name in your profile before making a payment.",
      });
      return;
    }

    setLoading(true);
    setErrors({});
    setStatusMessage("");

    try {
      const amountPaise = plans[selectedPlan].price * 100;
      const orderRes = await createPaymentOrder(amountPaise, user?.email);

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
      setErrors({ submit: err.message || "Payment failed" });
      setStatusMessage("");
    } finally {
      setLoading(false);
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
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/signup")}
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
                const isDisabled = key !== 'professional';
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
                          onChange={(e) => !isDisabled && setSelectedPlan(e.target.value)}
                          disabled={isDisabled}
                          className="w-4 h-4 text-primary-600 disabled:opacity-50"
                        />
                        <div>
                          <h3 className={`font-semibold ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                            {plan.name} {isDisabled && '(Coming Soon)'}
                          </h3>
                          <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                            {plan.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                          ₹{plan.price}
                        </div>
                        <div className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>/year</div>
                      </div>
                    </div>
                    <ul className={`text-sm space-y-1 ml-7 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isDisabled ? 'text-gray-400' : 'text-green-500'}`} />
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
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">
                  {plans[selectedPlan].name} Plan
                </span>
                <span className="font-semibold">
                  ₹{plans[selectedPlan].price}/year
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>₹{plans[selectedPlan].price}/year</span>
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

            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {statusMessage && !errors.submit && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 text-sm">{statusMessage}</p>
              </div>
            )}

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> You may see some technical warnings in the browser console during payment. 
                These are from PhonePe's payment system and don't affect the payment process. Your payment will work normally.
              </p>
            </div>

            <div className="space-y-6">
              <motion.button
                onClick={startPhonePePayment}
                disabled={loading || user?.hasCompletedSetup}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user?.hasCompletedSetup ? (
                  <span>Plan already active</span>
                ) : loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Opening PhonePe...</span>
                  </div>
                ) : (
                  `Pay ₹${plans[selectedPlan].price}/year (PhonePe)`
                )}
              </motion.button>
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
