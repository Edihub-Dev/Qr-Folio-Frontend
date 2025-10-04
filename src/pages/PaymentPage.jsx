import React, { useEffect, useState } from "react";
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
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
          message.includes('razorpay') ||
          message.includes('GroupMarkerNotSet')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('WebGL') || 
          message.includes('svg') || 
          message.includes('razorpay') ||
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

  const startRazorpayPayment = async () => {
    try {
      if (user?.hasCompletedSetup) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setLoading(true);
      setErrors({});

      if (!user?.name?.trim()) {
        setErrors({ 
          submit: "Please update your name in your profile before making a payment." 
        });
        setLoading(false);
        return;
      }

      const amountPaise = plans[selectedPlan].price * 100;
      const orderRes = await createPaymentOrder(amountPaise, user?.email);
      if (!orderRes.success) {
        setErrors({ submit: orderRes.error });
        setLoading(false);
        return;
      }

      const { orderId, amount, currency, key } = orderRes.data;

      if (!window.Razorpay) {
        setErrors({ submit: "Razorpay SDK failed to load. Please refresh and try again." });
        setLoading(false);
        return;
      }

      const options = {
        key,
        amount,
        currency,
        name: "QR Folio",
        description: `${plans[selectedPlan].name} Plan`,
        order_id: orderId,
        prefill: {
          name: user?.name?.trim() || "Customer",
          email: user?.email?.trim() || "",
          contact: "+919999999999"
        },
        theme: { color: "#3b82f6" },
        handler: async function (response) {
          try {
            setLoading(true);
            setErrors({});
            
            const verifyRes = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }, user?.email);
            
            if (verifyRes.success) {
              await refreshUser();
              navigate('/dashboard', { replace: true });
            } else {
              setErrors({ 
                submit: verifyRes.error || "Payment verification failed. Please contact support if the amount was deducted." 
              });
            }
          } catch (err) {
            console.error("Payment processing error:", err);
            setErrors({ 
              submit: "An unexpected error occurred. Please check your payment status or contact support." 
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setTimeout(() => {
              if (window.console && window.console.clear) {
                const hasRazorpayErrors = document.querySelectorAll('[src*="razorpay"]').length > 0;
                if (hasRazorpayErrors) {
                  console.log('Payment modal closed - Razorpay warnings are normal and can be ignored');
                }
              }
            }, 100);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setErrors({ submit: err.message || "Payment failed" });
    } finally {
    }
  };

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

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> You may see some technical warnings in the browser console during payment. 
                These are from Razorpay's payment system and don't affect the payment process. Your payment will work normally.
              </p>
            </div>

            <div className="space-y-6">
              <motion.button
                onClick={startRazorpayPayment}
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
                    <span>Opening Razorpay...</span>
                  </div>
                ) : (
                  `Pay ₹${plans[selectedPlan].price}/year (Razorpay)`
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
