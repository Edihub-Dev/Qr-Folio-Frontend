import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 12;

const PaymentStatusPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("PENDING");
  const [message, setMessage] = useState("Checking payment status...");
  const [attempts, setAttempts] = useState(0);

  const merchantTransactionId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("merchantTransactionId") || "";
  }, [location.search]);

  useEffect(() => {
    if (!merchantTransactionId) {
      setStatus("ERROR");
      setMessage("Missing merchant transaction id in the URL.");
      return;
    }

    let cancelled = false;
    let timer;

    const fetchStatus = async () => {
      try {
        const res = await api.get(`/phonepe/status/${merchantTransactionId}`);
        if (cancelled) return;

        const nextStatus = (res.data?.status || "PENDING").toUpperCase();
        setStatus(nextStatus);
        setMessage(
          res.data?.message ||
            (nextStatus === "COMPLETED"
              ? "Payment confirmed!"
              : nextStatus === "FAILURE"
              ? "Payment failed."
              : "Payment is still pending...")
        );

        if (res.data?.success || nextStatus === "COMPLETED") {
          try {
            await refreshUser();
          } catch (refreshErr) {
            console.warn("Failed to refresh user after payment:", refreshErr);
          }
          timer = setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
          return;
        }

        if (nextStatus === "FAILURE") {
          return;
        }

        if (attempts + 1 >= MAX_ATTEMPTS) {
          setMessage(
            "Payment is still pending. You can close this page and check your dashboard later."
          );
          return;
        }

        setAttempts((prev) => prev + 1);
        timer = setTimeout(fetchStatus, POLL_INTERVAL_MS);
      } catch (error) {
        if (cancelled) return;
        setStatus("ERROR");
        setMessage(error.response?.data?.message || error.message || "Status check failed.");
      }
    };

    fetchStatus();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [merchantTransactionId, attempts, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Status</h1>
        <p className="text-sm text-gray-500 mb-6">
          Transaction Reference: <span className="font-mono">{merchantTransactionId || "N/A"}</span>
        </p>
        <div className="mb-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              status === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : status === "FAILURE" || status === "ERROR"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-gray-700">{message}</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentStatusPage;
