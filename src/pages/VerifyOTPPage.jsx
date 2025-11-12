import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QrCode, ArrowLeft, RefreshCw } from "lucide-react";

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP, signupData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});
  const [otp, setOTP] = useState("");
  const [countdown, setCountdown] = useState(0);

  const email = location.state?.email || signupData?.email;
  const name = location.state?.name || signupData?.name;

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOTP(value);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("Verifying OTP...");
      const result = await verifyOTP(email, otp);
      console.log("OTP verification result:", result);
      
      if (result.success) {
        console.log("OTP verification successful, checking payment status...");
        if (result.requiresPayment) {
          console.log("Payment required, redirecting to payment page");
          navigate("/payment");
        } else {
          console.log("No payment required, redirecting to dashboard");
          navigate("/dashboard");
        }
      } else {
        console.error("OTP verification failed:", result.error);
        setErrors({ 
          otp: result.error || "Invalid OTP. Please try again." 
        });
      }
    } catch (err) {
      console.error("Verification error:", err);
      setErrors({ 
        otp: err.message || "Something went wrong. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setErrors({});

    try {
      const result = await resendOTP();
      
      if (result.success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrors({ submit: result.error || "Failed to resend OTP" });
      }
    } catch (err) {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to signup</span>
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Email</h2>
            <p className="text-gray-600">
              We've sent a 6-digit code to
            </p>
            <p className="text-primary-600 font-medium">{email}</p>
          </div>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                value={otp}
                onChange={handleOTPChange}
                placeholder="Enter 6-digit OTP"
                className={`w-full px-4 py-4 border rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.otp
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
                maxLength={6}
              />
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600">{errors.otp}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={countdown > 0 || resending}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-1 mx-auto"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : countdown > 0 ? (
                <span>Resend in {countdown}s</span>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend OTP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
