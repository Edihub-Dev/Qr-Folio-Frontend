import React, { useMemo, useState } from "react";
import { X, Info } from "lucide-react";

const WithdrawalModal = ({
  isOpen,
  onClose,
  onSubmit,
  minWithdrawal = 500,
  walletBalance = 0,
  pendingRewards = 0,
}) => {
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [note, setNote] = useState("");

  const disableSubmit = useMemo(() => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < minWithdrawal) {
      return true;
    }
    if (numericAmount > walletBalance) {
      return true;
    }
    if (payoutMethod === "upi" && !upiId.trim()) {
      return true;
    }
    if (payoutMethod === "bank" && (!accountNumber.trim() || !ifsc.trim())) {
      return true;
    }
    return false;
  }, [amount, payoutMethod, upiId, accountNumber, ifsc, walletBalance, minWithdrawal]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (disableSubmit) return;

    const payoutDetails = { method: payoutMethod };
    if (payoutMethod === "upi") {
      payoutDetails.upiId = upiId.trim();
    } else {
      payoutDetails.accountNumber = accountNumber.trim();
      payoutDetails.ifsc = ifsc.trim();
    }

    onSubmit({ amount: numericAmount, payoutMethod, payoutDetails, note: note.trim() });
  };

  const resetForm = () => {
    setAmount("");
    setPayoutMethod("upi");
    setUpiId("");
    setAccountNumber("");
    setIfsc("");
    setNote("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Request withdrawal</h3>
            <p className="text-xs text-slate-500">
              Minimum withdrawal ₹{minWithdrawal.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 text-sm text-slate-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary-500">
                Wallet balance
              </p>
              <p className="mt-2 text-2xl font-semibold text-primary-600">
                ₹{walletBalance.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-primary-500">
                Pending rewards: ₹{pendingRewards.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex gap-3">
              <Info className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-600">
                  Payout timeline
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Withdrawals are reviewed by our team. You’ll receive an update within 2-3 business days.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Amount (INR)
              </span>
              <input
                type="number"
                min={minWithdrawal}
                step="100"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder={`Min ₹${minWithdrawal}`}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Payout method
              </span>
              <select
                value={payoutMethod}
                onChange={(event) => setPayoutMethod(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="upi">UPI transfer</option>
                <option value="bank">Bank account</option>
              </select>
            </label>
          </div>

          {payoutMethod === "upi" ? (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                UPI ID
              </span>
              <input
                type="text"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="name@upi"
              />
            </label>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Account number
                </span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="000000000000"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  IFSC code
                </span>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(event) => setIfsc(event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="ABCD0123456"
                />
              </label>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Notes for admin (optional)
            </span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Add any remarks for faster processing"
            />
          </label>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disableSubmit}
            className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 disabled:opacity-50"
          >
            Submit request
          </button>
        </div>
      </form>
    </div>
  );
};

export default WithdrawalModal;
