import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const PhonePeDemoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/phonepe/order", {
        amount: 100 * 100, // ₹100 in paise
      });

      if (!res.data?.success || !res.data?.redirectUrl) {
        throw new Error(res.data?.message || "Unable to create PhonePe order");
      }

      const redirectUrl = res.data.redirectUrl;
      const merchantTransactionId = res.data.merchantTransactionId;

      if (merchantTransactionId) {
        navigate(`/payment-status?merchantTransactionId=${merchantTransactionId}`);
      }

      window.location.href = redirectUrl;
    } catch (err) {
      setError(err.message || "Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          PhonePe Sandbox Demo
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Click the button below to trigger a demo payment of <strong>₹100</strong> via PhonePe.
        </p>
        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Redirecting to PhonePe..." : "Pay ₹100 with PhonePe"}
        </button>
        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
};

export default PhonePeDemoPage;
