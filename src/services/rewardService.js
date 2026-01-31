import api from "../api";

export const getMyRewards = () => api.get("/rewards/me");

export const claimReward = (rewardCode) => api.post("/rewards/claim", { rewardCode });
