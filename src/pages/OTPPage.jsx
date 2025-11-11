import React, { useState, useEffect, useRef } from "react";
import { motion } from "../utils/motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QrCode, ArrowLeft, RefreshCw } from "lucide-react";

const OTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, signupData, resendOTP } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const inputRefs = useRef([]);

  const email = location.state?.email || signupData?.email;

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));

    if (value && index < 5) inputRefs.current[index + 1]?.focus();

    if (newOtp.every((d) => d !== "")) handleSubmit(newOtp.join(""));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    if (pasted.length === 6) handleSubmit(pasted);
  };

  const handleSubmit = async (otpValue = null) => {
    const otpString = otpValue || otp.join("");
    if (!email) {
      setErrors({ otp: "No email found for verification." });
      return;
    }
    if (otpString.length !== 6) {
      setErrors({ otp: "Please enter all 6 digits." });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(otpString);
      if (result.success) {

        navigate("/payment");
      } else {
        setErrors({ otp: result.error });
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrors({ otp: "Verification failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setErrors({ resend: "No email found to resend OTP." });
      return;
    }
    setResendLoading(true);
    try {
      const result = await resendOTP();
      if (!result.success) throw new Error(result.error);
      setErrors({ resend: "" });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setTimeLeft(300); 
    } catch (err) {
      setErrors({ resend: err.message });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-600 mb-4">We've sent a 6-digit code to</p>
            <p className="font-medium text-gray-900">
              {email || "your email address"}
            </p>
          </div>

          {errors.otp && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center text-red-600">
              {errors.otp}
            </div>
          )}
          {errors.resend && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center text-red-600">
              {errors.resend}
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Enter the 6-digit code
            </label>
            <div className="flex justify-center space-x-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(i, e.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                    errors.otp ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <motion.button
            onClick={() => handleSubmit()}
            disabled={loading || otp.some((d) => !d)}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </motion.button>

          <div className="mt-6 text-center space-y-4">
            <div className="text-sm text-gray-600">
              Time remaining:{" "}
              <span className="font-mono font-bold text-primary-600">
                {formatTime(timeLeft)}
              </span>
            </div>

            <motion.button
              onClick={handleResendOTP}
              disabled={resendLoading || timeLeft > 0}
              whileHover={{ scale: resendLoading ? 1 : 1.02 }}
              whileTap={{ scale: resendLoading ? 1 : 0.98 }}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`}
              />
              <span>{resendLoading ? "Sending..." : "Resend Code"}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OTPPage;
