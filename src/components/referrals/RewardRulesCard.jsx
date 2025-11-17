import React from "react";

const RewardRulesCard = () => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
    <div className="px-6 py-5 border-b border-slate-100">
      <h3 className="text-lg font-semibold text-slate-900">How rewards work</h3>
    </div>
    <div className="p-6 space-y-4 text-sm text-slate-600">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">Reward summary</h4>
        <p className="mt-1">
          You earn <span className="font-semibold text-primary-600">₹100</span>{" "}
          when your friend signs up through your link and completes their first
          paid plan. They receive ₹50 off their first purchase.
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Things to remember
        </h4>
        <ul className="mt-2 space-y-2 list-disc list-inside">
          <li>
            Rewards move from pending to wallet once the referral passes
            anti-fraud checks.
          </li>
          <li>
            Withdrawals unlock once you have at least ₹1000 in wallet balance.
          </li>
          <li>
            Self-referrals or suspicious patterns will be rejected and may
            result in account review.
          </li>
        </ul>
      </div>
      <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 text-xs text-primary-700">
        Need help or want to review full terms? Email{" "}
        <a className="underline" href="mailto:support@qrfolio.net">
          tech.qrfolio@gmail.com
        </a>{" "}
        or visit the referral FAQ.
      </div>
    </div>
  </div>
);

export default RewardRulesCard;
