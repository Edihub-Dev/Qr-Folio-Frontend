import React from "react";

const RewardRulesCard = () => (
  <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur">
    <div className="border-b border-white/10 pb-4">
      <h3 className="text-lg font-semibold text-white">How rewards work</h3>
    </div>

    <div className="mt-4 space-y-4 text-sm text-slate-200">
      {/* Milestones */}
      <div>
        <h4 className="text-sm font-semibold text-slate-100">
          Reward milestones
        </h4>
        <p className="mt-1">
          Earn exciting merchandise rewards by inviting friends to QRfolio.
        </p>
      </div>

      {/* Key Rules */}
      <div>
        <h4 className="text-sm font-semibold text-slate-100">
          Things to remember
        </h4>

        <ul className="mt-2 list-inside list-disc space-y-2">
          <li>
            Rewards unlock at referral milestones: <b>2 (L1)</b>, <b>5 (L2)</b>,
            and <b>10 (L3)</b>.
          </li>

          <li>
            Extra referrals are <b>carried forward</b>. Example: If you complete
            3 referrals and claim L1, your next progress starts at <b>1/5</b>.
          </li>

          <li>
            You can skip levels — reaching 5 or 10 referrals lets you directly
            unlock L2 or L3 even if you didn’t claim earlier rewards.
          </li>

          <li>
            Claiming a higher reward will automatically <b>expire</b> any unused
            lower-level coupons (L3 claim expires L1 & L2).
          </li>

          <li>
            Each unlocked reward gives a unique <b>100% discount coupon</b>,
            valid for <b>15 days</b> and usable only once on{" "}
            <b>shop.p2pdeal.net</b>.
          </li>
        </ul>
      </div>

      {/* Support */}
      <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-xs text-primary-100">
        Need help? Email{" "}
        <a className="underline" href="mailto:tech.qrfolio@gmail.com">
          tech.qrfolio@gmail.com
        </a>{" "}
        or visit the referral FAQ.
      </div>
    </div>
  </div>
);

export default RewardRulesCard;
