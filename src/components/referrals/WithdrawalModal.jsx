import React, { useMemo, useState } from "react";
import { X, Info } from "lucide-react";

const WithdrawalModal = ({
  isOpen,
  onClose,
  onSubmit,
  minWithdrawal = 50,
  walletBalance = 0,
  pendingRewards = 0,
  totalWithdrawable = 0,
  isEligible = true,
}) => {
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [note, setNote] = useState("");

  const disableSubmit = useMemo(() => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < minWithdrawal) {
      return true;
    }
    if (numericAmount > totalWithdrawable) {
      return true;
    }
    if (payoutMethod === "upi" && !upiId.trim()) {
      return true;
    }
    if (
      payoutMethod === "bank" &&
      (!accountNumber.trim() ||
        !ifsc.trim() ||
        !bankName.trim() ||
        !accountHolderName.trim())
    ) {
      return true;
    }
    return false;
  }, [
    amount,
    payoutMethod,
    upiId,
    accountNumber,
    ifsc,
    totalWithdrawable,
    minWithdrawal,
  ]);

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
      payoutDetails.bankName = bankName.trim();
      payoutDetails.accountHolderName = accountHolderName.trim();
    }

    onSubmit({
      amount: numericAmount,
      payoutMethod,
      payoutDetails,
      note: note.trim(),
    });
  };

  const resetForm = () => {
    setAmount("");
    setPayoutMethod("upi");
    setUpiId("");
    setAccountNumber("");
    setIfsc("");
    setBankName("");
    setAccountHolderName("");
    setNote("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/70 backdrop-blur"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Request withdrawal
            </h3>
            <p className="text-xs text-slate-400">
              Minimum withdrawal ₹{minWithdrawal.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-slate-200">
          {!isEligible && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
              You need at least ₹{minWithdrawal.toLocaleString("en-IN")} to
              place a withdrawal. You can still submit your payout details so
              they’re ready once you meet the minimum.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-primary-500/40 bg-primary-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary-200">
                Wallet balance
              </p>
              <p className="mt-2 text-2xl font-semibold text-primary-100">
                ₹{walletBalance.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-primary-100/90">
                Pending rewards: ₹{pendingRewards.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-primary-100/90">
                Total withdrawable: ₹{totalWithdrawable.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
              <Info className="h-5 w-5 text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-amber-100">
                  Payout timeline
                </p>
                <p className="mt-1 text-xs text-amber-100/90">
                  Withdrawals are reviewed by our team. You’ll receive an update
                  within 2-3 business days.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Amount (INR)
              </span>
              <input
                type="number"
                min={minWithdrawal}
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
                placeholder={`Min ₹${minWithdrawal}`}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Payout method
              </span>
              <select
                value={payoutMethod}
                onChange={(event) => setPayoutMethod(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="upi">UPI transfer</option>
                <option value="bank">Bank account</option>
              </select>
            </label>
          </div>

          {payoutMethod === "upi" ? (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                UPI ID
              </span>
              <input
                type="text"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="name@upi"
              />
            </label>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Bank name
                </span>
                <input
                  type="text"
                  value={bankName}
                  onChange={(event) => setBankName(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="HDFC Bank"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Account holder name
                </span>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(event) => setAccountHolderName(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="John Doe"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Account number
                </span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="000000000000"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  IFSC code
                </span>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(event) => setIfsc(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm uppercase text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="ABCD0123456"
                />
              </label>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Notes for admin (optional)
            </span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="Add any remarks for faster processing"
            />
          </label>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disableSubmit}
            className="inline-flex items-center justify-center rounded-2xl bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/40 hover:bg-primary-400 disabled:opacity-50"
          >
            Submit request
          </button>
        </div>
      </form>
    </div>
  );
};

export default WithdrawalModal;
