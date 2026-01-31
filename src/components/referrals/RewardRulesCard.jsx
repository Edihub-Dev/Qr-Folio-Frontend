import React from "react";

const RewardRulesCard = () => (
  <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur">
    <div className="border-b border-white/10 pb-4">
      <h3 className="text-lg font-semibold text-white">How rewards work</h3>
    </div>
    <div className="mt-4 space-y-4 text-sm text-slate-200">
      <div>
        <h4 className="text-sm font-semibold text-slate-100">Reward milestones</h4>
        <p className="mt-1">
          Earn merchandise rewards by completing successful referrals.
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-100">
          Things to remember
        </h4>
        <ul className="mt-2 list-inside list-disc space-y-2">
          <li>
            Levels unlock sequentially (L1 → L2 → L3) when you reach: 2, 5, and
            10 successful referrals.
          </li>
          <li>
            When a level unlocks, a unique 100% discount coupon is generated for
            that level’s reward.
          </li>
          <li>
            Coupons are valid for 15 days and can be used only once on
            shop.p2pdeal.net.
          </li>
        </ul>
      </div>
      <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-xs text-primary-100">
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
