import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { motion } from "../../utils/motion";
import { ArrowLeft, Clock, Copy, AlertCircle, Loader2 } from "lucide-react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const SUCCESS_STATUSES = new Set([
  "SUCCESS",
  "SUCCESSFUL",
  "COMPLETED",
  "PAID",
  "CONFIRMED",
]);

const formatCountdown = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(0, Math.floor(seconds % 60));
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const ChainpayCheckout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [selectedOptionSymbol, setSelectedOptionSymbol] = useState(null);
  const [optionDetails, setOptionDetails] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [copyState, setCopyState] = useState({ address: false, amount: false });
  const [polling, setPolling] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const token = useMemo(() => {
    if (!order) return null;
    return order.token || order.paymentToken || orderId;
  }, [order, orderId]);

  const description = useMemo(() => {
    if (!order) return "";
    const baseDescription =
      order.description ||
      order?.metadata?.description ||
      `${
        order.planName || order?.metadata?.planName || "Subscription"
      } purchase`;

    const sanitized = baseDescription
      .split("|")
      .map((segment) => segment.trim())
      .filter((segment) => !segment.includes(" INR"));

    return sanitized.join(" | ") || baseDescription;
  }, [order]);

  const mstcCoins = useMemo(() => {
    if (!order) return null;
    const resolved =
      order?.pricing?.mstcCoins ??
      order?.metadata?.mstcCoins ??
      order?.cryptoAmount ??
      order?.metadata?.cryptoAmount ??
      null;
    if (!Number.isFinite(Number(resolved))) {
      return null;
    }
    const amount = Number(resolved);
    const rounded = Math.round(amount);
    return Math.abs(amount - rounded) < 1e-6
      ? rounded
      : Number(amount.toFixed(4));
  }, [order]);

  const formatMstcDisplay = useCallback((value, { withUnit = true } = {}) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return withUnit ? "--" : "";
    }
    const rounded = Math.round(amount);
    const isWhole = Math.abs(amount - rounded) < 1e-6;
    const formatted = isWhole ? rounded.toString() : amount.toFixed(4);
    return withUnit ? `${formatted} MSTC` : formatted;
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError("Missing order ID");
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/chainpay/order/${orderId}`);
      if (!res.data?.success || !res.data?.order) {
        throw new Error(res.data?.message || "Unable to load ChainPay order");
      }
      setOrder(res.data.order);
      setIsPaid(
        SUCCESS_STATUSES.has((res.data.order?.status || "").toUpperCase())
      );
    } catch (err) {
      console.error("ChainPay order fetch error", err);
      setError(
        err.response?.data?.message || err.message || "Unable to load order"
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchPaymentOptions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get(`/chainpay/options/${token}`);
      if (res.data?.success) {
        setPayment(res.data.payment);
        const firstOption = res.data.payment?.options?.[0]?.symbol;
        setSelectedOptionSymbol((prev) => prev || firstOption || null);
      }
    } catch (err) {
      console.warn("ChainPay options fetch error", err);
    }
  }, [token]);

  const fetchOptionDetails = useCallback(
    async (symbol) => {
      if (!token || !symbol) return;
      try {
        const res = await api.get(`/chainpay/options/${token}/${symbol}`);
        if (res.data?.success) {
          setOptionDetails(res.data.option);
          if (res.data.option?.expireAt) {
            const expiry = new Date(res.data.option.expireAt).getTime();
            const now = Date.now();
            if (expiry > now) {
              setCountdown(Math.floor((expiry - now) / 1000));
            }
          }
        }
      } catch (err) {
        console.warn("ChainPay option detail fetch error", err);
      }
    },
    [token]
  );

  const pollStatus = useCallback(async () => {
    if (!token || polling || isPaid) return;
    setPolling(true);
    try {
      const res = await api.get(`/chainpay/status/${token}`);
      if (res.data?.success) {
        const status = (res.data.status || "").toUpperCase();
        if (SUCCESS_STATUSES.has(status) || res.data?.payload?.isPaid) {
          setIsPaid(true);
          await refreshUser();
          navigate(`/success?gateway=chainpay&orderId=${orderId}`, {
            replace: true,
          });
        }
      }
    } catch (err) {
      console.warn("ChainPay status poll error", err.message || err);
    } finally {
      setPolling(false);
    }
  }, [token, polling, isPaid, refreshUser, navigate, orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (order && !isPaid) {
      fetchPaymentOptions();
    }
  }, [order, fetchPaymentOptions, isPaid]);

  useEffect(() => {
    if (selectedOptionSymbol) {
      fetchOptionDetails(selectedOptionSymbol);
    }
  }, [selectedOptionSymbol, fetchOptionDetails]);

  useEffect(() => {
    if (!countdown) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (!Number.isFinite(prev)) return prev;
        return Math.max(prev - 1, 0);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (!token || isPaid) return;
    const interval = setInterval(() => {
      pollStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [token, pollStatus, isPaid]);

  useEffect(() => {
    return () => {
      if (!isPaid) {
        try {
          localStorage.removeItem("qrfolio_chainpay");
        } catch (err) {
          console.warn("Unable to clear ChainPay session on exit", err);
        }
      }
    };
  }, [isPaid]);

  const handleCopy = (key, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value.toString()).then(() => {
      setCopyState((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [key]: false }));
      }, 1500);
    });
  };

  const handleChangeOption = (symbol) => {
    setSelectedOptionSymbol(symbol);
  };

  const handleBack = () => {
    try {
      localStorage.removeItem("qrfolio_chainpay");
    } catch (err) {
      console.warn("Unable to clear ChainPay session on back", err);
    }

    navigate("/payment", { replace: true });
  };

  const handleMarkPaid = async () => {
    if (!token) return;
    try {
      const payload = { token };
      if (orderId) payload.orderId = orderId;
      if (order?.successToken) payload.successToken = order.successToken;
      const res = await api.post("/chainpay/confirm", payload);
      if (res.data?.success && res.data.order) {
        setIsPaid(true);
        await refreshUser();
        navigate(`/success?gateway=chainpay&orderId=${orderId}`, {
          replace: true,
        });
      } else {
        setError(
          res.data?.message ||
            "Payment not yet confirmed. Please wait a bit more."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to confirm payment yet."
      );
    }
  };

  if (!orderId) {
    return <Navigate to="/payment" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
        <h1 className="text-xl font-semibold mb-2">
          Unable to continue checkout
        </h1>
        <p className="text-sm opacity-80 mb-6 text-center max-w-md">{error}</p>
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  const options = payment?.options || [];
  const selectedOption = options.find(
    (option) => option.symbol === selectedOptionSymbol
  );
  const address = optionDetails?.addressIn || selectedOption?.addressIn;

  const amountMstc =
    Number.isFinite(Number(mstcCoins)) && Number(mstcCoins) > 0
      ? Number(mstcCoins)
      : null;
  // const qrImage = optionDetails?.qrCodeWithValue || optionDetails?.qrCode;
  const qrImage = optionDetails?.qrCodeWithValue;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            ChainPay Secure Checkout
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-2">
                Description
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                  You selected MSTC
                </div>
                <div className="text-xl font-semibold text-white">
                  {amountMstc ? `${Number(amountMstc).toFixed(4)} MSTC` : "--"}
                </div>
              </div>
              {countdown !== null && (
                <div className="inline-flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expires in {formatCountdown(countdown)}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">
                Selected network
              </h3>
              <div className="space-y-2">
                {options.length === 0 && (
                  <div className="text-xs text-slate-500">
                    No ChainPay options available at the moment.
                  </div>
                )}
                {options.map((option) => {
                  const networkAmount = (() => {
                    if (Number.isFinite(Number(option.value))) {
                      return Number(option.value);
                    }
                    if (Number.isFinite(Number(option?.estimatedAmount))) {
                      return Number(option.estimatedAmount);
                    }
                    if (
                      Number.isFinite(Number(order?.metadata?.networkCoins))
                    ) {
                      return Number(order.metadata.networkCoins);
                    }
                    return null;
                  })();
                  const isActive = option.symbol === selectedOptionSymbol;
                  return (
                    <button
                      key={option.symbol}
                      type="button"
                      onClick={() => handleChangeOption(option.symbol)}
                      className={`w-full border rounded-xl px-4 py-3 text-left transition-all ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-800 bg-slate-900 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-100">
                          {option.displayName || option.name || option.symbol}
                        </div>
                        {/* <div className="text-xs text-slate-400">
                          {Number.isFinite(networkAmount)
                            ? `${networkAmount.toFixed(4)} MSTC`
                            : "--"}
                        </div> */}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-2">
              <p>
                Only MSTC transfers on the selected network are accepted.
                Sending a different asset or using a different network may
                result in lost funds.
              </p>
              <p>
                If you opened the official ChainPay page in a new tab, you can
                keep this page open to monitor status and copy the payment
                details.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6"
          >
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Send only MSTC to this address
              </div>
              <div className="text-2xl font-semibold text-white">
                {amountMstc ? `${Number(amountMstc).toFixed(4)} MSTC` : "--"}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500 block mb-2">
                  Address
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                  <div className="flex-1 text-sm break-all text-slate-200">
                    {address || "--"}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                    onClick={() => handleCopy("address", address)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copyState.address ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500 block mb-2">
                  Amount (MSTC)
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                  <div className="flex-1 text-sm text-slate-200">
                    {amountMstc ? Number(amountMstc).toFixed(4) : "--"}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                    onClick={() => handleCopy("amount", amountMstc?.toString())}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copyState.amount ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-center min-h-[220px]">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt="ChainPay QR"
                  className="w-full max-w-xs rounded-lg border border-slate-800"
                />
              ) : (
                <div className="text-sm text-slate-400 text-center">
                  QR code not available for this option. Please copy the address
                  manually.
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 space-y-2">
              <p>
                Please pay exactly the displayed MSTC amount. Exchanges
                typically deduct their own network fees—send extra if needed so
                the net amount matches the required total.
              </p>
              <p>
                Once payment is confirmed on the blockchain, this screen will
                update and redirect you automatically.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChainpayCheckout;
