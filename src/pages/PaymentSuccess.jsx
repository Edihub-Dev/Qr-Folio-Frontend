import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function PaymentSuccess() {
  const [params] = useSearchParams();
  const merchantOrderId = params.get("merchantOrderId");
  const chainpayOrderId = params.get("orderId");
  const gateway = params.get("gateway") || "phonepe";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const hasRefreshed = useRef(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const confirmingRef = useRef(false);

  const normalizedStatus = (order?.status || "").toUpperCase();
  const isSuccess = [
    "COMPLETED",
    "SUCCESS",
    "SUCCESSFUL",
    "PAID",
    "CONFIRMED",
  ].includes(normalizedStatus);

  useEffect(() => {
    let mounted = true;

    async function fetchOrder() {
      try {
        let response;
        if (gateway === "chainpay" && chainpayOrderId) {
          response = await api.get(`/chainpay/order/${chainpayOrderId}`);
        } else if (merchantOrderId) {
          response = await api.get(`/phonepe/order/${merchantOrderId}`);
        } else {
          setLoading(false);
          return;
        }

        const { data } = response;
        if (mounted) {
          if (data?.success) {
            const nextOrder = data.order || data;
            setOrder(nextOrder);
            const status = (nextOrder?.status || "").toUpperCase();
            if (["COMPLETED", "SUCCESS", "SUCCESSFUL", "PAID", "CONFIRMED"].includes(status)) {
              setRedirectCountdown(5);
            } else if (
              gateway === "chainpay" &&
              nextOrder?.status === "PENDING" &&
              !confirmingRef.current
            ) {
              confirmingRef.current = true;
              try {
                const confirmRes = await api.post("/chainpay/confirm", {
                  orderId: chainpayOrderId,
                });
                if (confirmRes.data?.success && confirmRes.data.order) {
                  setOrder(confirmRes.data.order);
                  setRedirectCountdown(5);
                }
              } catch (confirmError) {
                console.warn("ChainPay manual confirmation failed", confirmError);
              } finally {
                confirmingRef.current = false;
              }
            }
          } else {
            setError(data?.message || "Unable to fetch order details");
          }
        }
      } catch (e) {
        if (mounted)
          setError(
            e.response?.data?.message || "Unable to fetch order details"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [merchantOrderId, chainpayOrderId, gateway]);

  useEffect(() => {
    if (!isSuccess) {
      return undefined;
    }

    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      (async () => {
        try {
          const result = await refreshUser();
          if (!result?.success) {
            console.warn("Failed to refresh user after payment", result?.error);
          }
        } catch (refreshError) {
          console.warn("Error refreshing user after payment", refreshError);
        } finally {
          navigate("/dashboard", { replace: true });
        }
      })();
    }

    if (redirectCountdown <= 0) {
      navigate("/dashboard", { replace: true });
      return undefined;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [order, redirectCountdown, navigate, refreshUser, isSuccess]);

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md border border-green-100 p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-green-600"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53-1.76-1.76a.75.75 0 0 0-1.06 1.06l2.4 2.4a.75.75 0 0 0 1.159-.103l3.717-5.255Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>
        <p className="text-gray-600 mt-1">
          Thank you! Your payment has been processed.
        </p>
        {(merchantOrderId || chainpayOrderId) && (
          <p className="text-sm text-gray-500 mt-2">
            Order ID: <span className="font-mono">{merchantOrderId || chainpayOrderId}</span>
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 mt-4">Loading order details...</p>
        ) : error ? (
          <p className="text-sm text-red-600 mt-4">{error}</p>
        ) : order ? (
          <div className="mt-6 text-left bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Customer</div>
              <div className="font-medium">{order?.customerName || ""}</div>
              <div className="text-gray-500">Mobile</div>
              <div className="font-medium">{order?.mobileNumber || ""}</div>
              <div className="text-gray-500">Amount</div>
              <div className="font-medium">
                {typeof order?.amount === "number"
                  ? `₹${((order?.amount || 0) / 100).toFixed(2)}`
                  : order?.value
                  ? `${order?.currency || "₹"}${Number(order.value).toFixed(2)}`
                  : "-"}
              </div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium text-green-700">{normalizedStatus}</div>
            </div>
          </div>
        ) : null}

        {isSuccess ? (
          <p className="mt-6 text-sm text-gray-500">
            Redirecting you to the dashboard in {redirectCountdown}s...
          </p>
        ) : (
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess;
