export const PLAN_ORDER = ["basic", "standard", "premium"];

export const PLAN_LABELS = {
  basic: "Basic (Silver)",
  standard: "Standard (Gold)",
  premium: "Premium (Platinum)",
};

export const PLAN_LIMITS = {
  basic: {
    maxImages: 5,
    maxVideos: 2,
  },
  standard: {
    maxImages: 10,
    maxVideos: 15,
  },
  premium: {
    maxImages: 50,
    maxVideos: 30,
  },
};

export const normalizePlan = (planKey, fallbackName) => {
  const aliases = {
    basic: "basic",
    silver: "basic",
    "basic (silver)": "basic",
    starter: "basic",
    entry: "basic",
    standard: "standard",
    professional: "standard",
    gold: "standard",
    "standard (gold)": "standard",
    growth: "standard",
    pro: "standard",
    premium: "premium",
    platinum: "premium",
    "premium (platinum)": "premium",
    enterprise: "premium",
    elite: "premium",
  };

  const key = (planKey || fallbackName || "").toString().trim().toLowerCase();
  if (!key) {
    return "basic";
  }
  return aliases[key] || "basic";
};

export const getPlanRank = (planKey) => {
  const normalized = normalizePlan(planKey);
  const index = PLAN_ORDER.indexOf(normalized);
  return index === -1 ? 0 : index;
};
