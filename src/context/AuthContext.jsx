import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import api from "../api";
import { canUser } from "../utils/permissionHelper";

const PAYMENT_SUCCESS_STATES = new Set([
  "COMPLETED",
  "SUCCESS",
  "SUCCESSFUL",
  "CAPTURED",
  "PAID",
  "CONFIRMED",
]);

const hasPaymentFlag = (data = {}) => {
  if (!data) {
    return false;
  }

  if (data.isPaid) {
    return true;
  }

  if (typeof data.chainpayStatus === "string") {
    const normalized = data.chainpayStatus.toUpperCase();
    if (PAYMENT_SUCCESS_STATES.has(normalized)) {
      return true;
    }
  }

  if (data.phonepePaymentId) {
    return true;
  }

  return false;
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupData, setSignupData] = useState(null);
  const signupDataRef = useRef(null);
  const hasInitialized = useRef(false);

  const can = useCallback(
    (permission) => {
      return canUser(user, permission);
    },
    [user]
  );

  const normalizePlan = useCallback((planKey, fallbackName) => {
    const aliases = {
      basic: "basic",
      silver: "basic",
      starter: "basic",
      entry: "basic",
      standard: "standard",
      professional: "standard",
      gold: "standard",
      growth: "standard",
      pro: "standard",
      premium: "premium",
      platinum: "premium",
      enterprise: "premium",
      elite: "premium",
    };

    const key = (planKey || fallbackName || "").toString().trim().toLowerCase();
    if (!key) {
      return "basic";
    }
    return aliases[key] || "basic";
  }, []);

  // const fetchGallery = useCallback(async () => {
  //   try {
  //     const res = await api.get("/gallery");
  //     if (res.data?.success) {
  //       return { success: true, items: res.data.items || [] };
  //     }
  //     return {
  //       success: false,
  //       error: res.data?.message || "Failed to fetch gallery",
  //     };
  //   } catch (err) {
  //     return {
  //       success: false,
  //       error: err.response?.data?.message || err.message,
  //     };
  //   }
  // }, []);

  // const uploadGalleryImage = useCallback(
  //   async ({ file, title, description }) => {
  //     const form = new FormData();
  //     form.append("file", file);
  //     if (title) form.append("title", title);
  //     if (description) form.append("description", description);

  //     try {
  //       const res = await api.post("/gallery/images", form, {
  //         headers: { "Content-Type": "multipart/form-data" },
  //       });
  //       if (res.data?.success) {
  //         return { success: true, item: res.data.item };
  //       }
  //       return {
  //         success: false,
  //         error: res.data?.message || "Failed to upload image",
  //       };
  //     } catch (err) {
  //       return {
  //         success: false,
  //         error: err.response?.data?.message || err.message,
  //       };
  //     }
  //   },
  //   []
  // );

  // const addGalleryVideo = useCallback(async ({ url, title, description }) => {
  //   try {
  //     const res = await api.post("/gallery/videos", {
  //       url,
  //       title,
  //       description,
  //     });
  //     if (res.data?.success) {
  //       return { success: true, item: res.data.item };
  //     }
  //     return {
  //       success: false,
  //       error: res.data?.message || "Failed to add video link",
  //     };
  //   } catch (err) {
  //     return {
  //       success: false,
  //       error: err.response?.data?.message || err.message,
  //     };
  //   }
  // }, []);

  // const deleteGalleryItem = useCallback(async (itemId) => {
  //   try {
  //     const res = await api.delete(`/gallery/${itemId}`);
  //     if (res.data?.success) {
  //       return { success: true };
  //     }
  //     return {
  //       success: false,
  //       error: res.data?.message || "Failed to delete gallery item",
  //     };
  //   } catch (err) {
  //     return {
  //       success: false,
  //       error: err.response?.data?.message || err.message,
  //     };
  //   }
  // }, []);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    let isMounted = true;

    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        const savedUser = localStorage.getItem("qr_folio_user");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (isMounted) {
              const paymentComplete = hasPaymentFlag(parsed);
              const normalized = {
                ...parsed,
                role: parsed?.role || "user",
                permissions: Array.isArray(parsed?.permissions)
                  ? parsed.permissions
                  : [],
                isBlocked: Boolean(parsed?.isBlocked),
                paymentStatus:
                  parsed?.paymentStatus ||
                  (paymentComplete ? "paid" : "pending"),
                paymentMethod: parsed?.paymentMethod || "none",
                totalAmountPaid: Number(parsed?.totalAmountPaid || 0),
                lastPaymentAt: parsed?.lastPaymentAt || null,
                paymentReference: parsed?.paymentReference || null,
                isPaid: paymentComplete,
                hasCompletedSetup: paymentComplete,
                phonepePaymentId: parsed.phonepePaymentId,
                phonepeMerchantTransactionId:
                  parsed.phonepeMerchantTransactionId,
              };
              setUser(normalized);
            }
          } catch (e) {
            console.error("Error parsing saved user:", e);
            localStorage.removeItem("qr_folio_user");
          }
        }

        // Optionally refresh user here if needed
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isMounted) {
          setUser(null);
          localStorage.removeItem("qr_folio_user");
          localStorage.removeItem("token");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const signup = async ({
    name,
    email,
    phone,
    password,
    confirmPassword,
    couponCode,
  }) => {
    try {
      setUser(null);
      setSignupData(null);
      localStorage.removeItem("qr_folio_user");
      localStorage.removeItem("token");

      const trimmedReferral = couponCode?.trim();
      const payload = {
        name,
        email,
        password,
        confirmPassword: confirmPassword ?? password,
        couponCode,
      };

      if (phone) {
        payload.phone = phone;
      }

      if (trimmedReferral) {
        payload.referralCode = trimmedReferral;
      }

      const nextSignupData = {
        name,
        email,
        phone: phone || null,
        password,
        confirmPassword: confirmPassword ?? password,
        couponCode,
        referralCode: trimmedReferral || null,
      };

      signupDataRef.current = nextSignupData;
      setSignupData(nextSignupData);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const mobileOtpLogin = async ({ phone, firebaseIdToken }) => {
    try {
      const digits = String(phone || "").replace(/\D/g, "").slice(-10);
      if (!digits) {
        return { success: false, error: "Phone is required" };
      }
      if (!firebaseIdToken) {
        return { success: false, error: "Phone verification is required" };
      }

      const res = await api.post("/auth/mobile-otp-login", {
        phone: digits,
        firebaseIdToken,
      });

      if (res.data?.success) {
        const {
          token,
          user: u,
          requiresRenewal,
          planExpired,
          planStatus,
          requiresPayment: resRequiresPayment,
        } = res.data;

        if (token) {
          localStorage.setItem("token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const normalized = normalizeUser(u || {}, {
          requiresRenewal,
          planStatus,
          planExpired,
        });

        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));

        const requiresPayment =
          typeof resRequiresPayment === "boolean"
            ? resRequiresPayment
            : !hasPaymentFlag(normalized);

        return { success: true, requiresPayment, user: normalized };
      }

      return { success: false, error: res.data?.message || "Login failed" };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const updatePhone = async ({ newPhone, firebaseIdToken }) => {
    try {
      const digits = String(newPhone || "").replace(/\D/g, "").slice(-10);
      if (!digits) {
        return { success: false, error: "New phone is required" };
      }
      if (!firebaseIdToken) {
        return { success: false, error: "Phone verification is required" };
      }

      const res = await api.post("/auth/update-phone", {
        newPhone: digits,
        firebaseIdToken,
      });

      if (res.data?.success) {
        const updatedUser = {
          ...(user || {}),
          phone: res.data?.user?.phone || digits,
          phoneVerified: Boolean(res.data?.user?.phoneVerified),
        };
        setUser(updatedUser);
        localStorage.setItem("qr_folio_user", JSON.stringify(updatedUser));
        return { success: true };
      }

      return { success: false, error: res.data?.message || "Failed to update phone" };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const submitSignupAfterPhoneVerification = async (firebaseIdToken) => {
    try {
      const effectiveSignupData = signupData || signupDataRef.current;
      if (!effectiveSignupData) {
        return { success: false, error: "Missing signup data" };
      }

      const normalizePhoneForApi = (value) => {
        const digits = String(value || "").replace(/\D/g, "");
        if (!digits) return null;
        return digits.length > 10 ? digits.slice(-10) : digits;
      };

      const payload = {
        name: effectiveSignupData.name,
        email: effectiveSignupData.email,
        phone: normalizePhoneForApi(effectiveSignupData.phone),
        password: effectiveSignupData.password,
        confirmPassword: effectiveSignupData.confirmPassword,
        couponCode: effectiveSignupData.couponCode,
        firebaseIdToken,
      };

      if (effectiveSignupData.referralCode) {
        payload.referralCode = effectiveSignupData.referralCode;
      }

      const res = await api.post("/auth/signup", payload);
      if (res.data?.success) {
        return { success: true, data: res.data };
      }
      return { success: false, error: res.data?.message || "Signup failed" };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const removeProfilePhoto = async () => {
    try {
      const res = await api.delete("/user/profile-photo");
      if (res.data?.success) {
        const normalized = normalizeUser(
          res.data.user || { profilePhoto: null, profilePhotoStorageKey: null }
        );
        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));
        return { success: true };
      }

      return {
        success: false,
        error: res.data?.message || "Failed to remove photo",
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const resendOTP = async () => {
    try {
      const effectiveSignupData = signupData || signupDataRef.current;
      if (!effectiveSignupData?.email)
        return { success: false, error: "No email to resend OTP" };
      await api.post("/auth/resend-otp", { email: effectiveSignupData.email });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const verifyOTP = async (emailOrOtp, maybeOtp) => {
    try {
      const isOtpString = (value) =>
        typeof value === "string" && /^[0-9]{4,6}$/.test(value.trim());

      const effectiveSignupData = signupData || signupDataRef.current;

      let userEmail = null;
      let otpValue = null;

      if (typeof maybeOtp === "string" && maybeOtp.trim().length > 0) {
        userEmail = emailOrOtp || effectiveSignupData?.email;
        otpValue = maybeOtp.trim();
      } else if (isOtpString(emailOrOtp) && !maybeOtp) {
        userEmail = effectiveSignupData?.email;
        otpValue = emailOrOtp.trim();
      } else {
        userEmail = emailOrOtp || effectiveSignupData?.email;
        otpValue = typeof maybeOtp === "string" ? maybeOtp.trim() : "";
      }

      if (!userEmail)
        return { success: false, error: "Missing email for OTP verification" };
      if (!isOtpString(otpValue))
        return { success: false, error: "Invalid or missing OTP" };

      const payload = { email: userEmail, otp: otpValue };
      const trimmedCoupon = effectiveSignupData?.couponCode?.trim();
      const trimmedReferral = effectiveSignupData?.referralCode?.trim();

      if (trimmedCoupon) {
        payload.couponCode = trimmedCoupon;
      }

      if (trimmedReferral) {
        payload.referralCode = trimmedReferral;
        if (!payload.couponCode) {
          payload.couponCode = trimmedReferral;
        }
      }

      const res = await api.post("/auth/verify-otp", payload);

      if (res.data?.success) {
        const {
          token,
          user: userData,
          couponApplied,
          couponError,
          requiresPayment: resRequiresPayment,
        } = res.data;

        if (!token) {
          throw new Error("No token received from server");
        }

        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const normalizedUser = normalizeUser(userData, {
          isVerified: true,
        });

        setUser(normalizedUser);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalizedUser));

        const hasPayment = hasPaymentFlag(normalizedUser);

        let requiresPayment;
        if (couponApplied) {
          // If a coupon was successfully applied during verification, treat
          // the user as having completed payment so they can skip the
          // payment page and access the dashboard directly.
          requiresPayment = false;
        } else if (typeof resRequiresPayment === "boolean") {
          // Prefer the backend's view when available.
          requiresPayment = resRequiresPayment;
        } else {
          // Fallback to local heuristic based on payment flags.
          requiresPayment = !hasPayment;
        }

        return {
          success: true,
          requiresPayment,
          requiresRenewal: normalizedUser.requiresRenewal,
          user: normalizedUser,
          couponApplied: Boolean(couponApplied),
          couponError: couponApplied ? null : couponError || null,
        };
      }

      return {
        success: false,
        error: res.data?.message || "Invalid OTP",
      };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to verify OTP";
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const createPaymentOrder = async ({
    amountPaise,
    email,
    customerName,
    mobileNumber,
    note,
    planKey,
    planName,
    pricing,
  } = {}) => {
    try {
      if (!amountPaise) {
        return { success: false, error: "Amount is required" };
      }

      const res = await api.post("/phonepe/create-order", {
        amount: amountPaise,
        email,
        customerName,
        mobileNumber,
        note,
        planKey,
        planName,
        pricing,
      });

      if (res.data?.success) {
        const { success, ...rest } = res.data;
        return { success: true, data: rest };
      }

      return {
        success: false,
        error: res.data?.message || "Failed to create order",
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const createChainpayPayment = async ({
    description,
    planKey,
    planName,
    pricing,
  } = {}) => {
    try {
      const payload = {
        description,
        planKey,
        planName,
        pricing,
      };
      const res = await api.post("/chainpay/create-payment", payload);

      if (res.data?.success) {
        return { success: true, data: res.data };
      }

      return {
        success: false,
        error: res.data?.message || "Failed to create ChainPay payment",
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const verifyPayment = async ({ merchantTransactionId }, options = {}) => {
    try {
      if (!merchantTransactionId)
        return {
          success: false,
          error: "Missing PhonePe transaction reference",
        };

      if (!options.silent) {
        setLoading(true);
      }

      const res = await api.get(`/phonepe/order/${merchantTransactionId}`);

      if (res.data?.success) {
        const order = res.data.order;
        const status = (order?.status || "").toUpperCase();

        if (!PAYMENT_SUCCESS_STATES.has(status)) {
          return {
            success: false,
            error:
              status === "PENDING"
                ? "Payment is still pending."
                : "Payment verification failed.",
          };
        }

        const paymentId =
          order?.lastStatusPayload?.transactionId ||
          order?.lastStatusPayload?.paymentId ||
          order?.merchantOrderId ||
          merchantTransactionId;

        const updatedUser = {
          ...user,
          phonepePaymentId: paymentId,
          phonepeMerchantTransactionId: merchantTransactionId,
          isPaid: true,
          hasCompletedSetup: true,
        };

        setUser(updatedUser);
        localStorage.setItem("qr_folio_user", JSON.stringify(updatedUser));

        try {
          const refreshResult = await refreshUser();
          if (!refreshResult.success) {
            console.warn(
              "Failed to refresh user data after payment:",
              refreshResult.error
            );
          }
        } catch (err) {
          console.warn("Error refreshing user data:", err);
        }

        const finalUser = {
          ...updatedUser,
          isVerified: true,
          hasCompletedSetup: true,
          isPaid: true,
        };

        setUser(finalUser);
        localStorage.setItem("qr_folio_user", JSON.stringify(finalUser));

        return {
          success: true,
          user: finalUser,
          message:
            "Payment verified successfully! Your account is now fully activated!",
        };
      }

      return {
        success: false,
        error: res.data?.message || "Payment verification failed",
      };
    } catch (err) {
      console.error("Payment verification error:", err);
      return {
        success: false,
        error:
          err.response?.data?.message ||
          err.message ||
          "An error occurred during payment verification",
      };
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  };

  const login = async (identifier, password) => {
    try {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("qr_folio_user");
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = "token=; Max-Age=0; path=/";
      } catch (_) {
        // ignore storage errors
      }

      const trimmedIdentifier = identifier ? identifier.toString().trim() : "";

      const res = await api.post("/auth/login", {
        identifier: trimmedIdentifier,
        password,
      });

      if (res.data?.success) {
        const {
          token,
          user: u,
          requiresRenewal,
          planExpired,
          planStatus,
          requiresPayment: resRequiresPayment,
        } = res.data;

        if (token) {
          localStorage.setItem("token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const normalized = normalizeUser(
          {
            ...u,
            email: u?.email || "",
          },
          {
            requiresRenewal,
            planStatus,
            planExpired,
          }
        );

        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));

        const requiresPayment =
          typeof resRequiresPayment === "boolean"
            ? resRequiresPayment
            : !hasPaymentFlag(normalized);

        if (requiresRenewal || planExpired) {
          return {
            success: true,
            requiresPayment: requiresPayment || requiresRenewal,
            requiresRenewal: true,
            planExpired: Boolean(planExpired),
            user: normalized,
          };
        }

        if (requiresPayment) {
          return {
            success: true,
            requiresPayment: true,
            user: normalized,
          };
        }

        return {
          success: true,
          user: normalized,
        };
      }

      return {
        success: false,
        error: res.data?.message || "Login failed. Please try again.",
        errorCode: res.data?.error,
      };
    } catch (apiError) {
      const data = apiError.response?.data;

      if (data?.user) {
        const normalized = normalizeUser(data.user, {
          requiresRenewal: Boolean(data.requiresRenewal),
          planStatus: data.planStatus,
          planExpired: data.planExpired,
        });

        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));

        return {
          success: true,
          requiresPayment: Boolean(
            data.requiresPayment && !hasPaymentFlag(normalized)
          ),
          requiresRenewal: Boolean(data.requiresRenewal),
          planExpired: Boolean(data.planExpired),
          user: normalized,
        };
      }

      let errorMessage = "An error occurred during login. Please try again.";
      let errorCode = "unknown_error";

      if (apiError.response) {
        errorMessage = data?.message || apiError.message;
        errorCode = data?.error || `http_${apiError.response.status}`;

        if (apiError.response.status === 400) {
          if (data?.error === "invalid_credentials") {
            errorMessage =
              "The email or password you entered is incorrect. Please try again.";
          } else if (data?.error === "email_not_verified") {
            errorMessage =
              "Please verify your email before logging in. Check your inbox for the verification link.";
          } else if (Array.isArray(data?.missingFields)) {
            errorMessage = `Missing required fields: ${data.missingFields.join(
              ", "
            )}`;
          }
        } else if (apiError.response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (apiError.response.status === 403) {
          errorMessage = "You don't have permission to access this resource.";
        } else if (
          apiError.response.status === 404 ||
          apiError.response.status >= 500
        ) {
          errorMessage = "User Not Found";
        }
      } else if (apiError.request) {
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
        errorCode = "no_response";
      } else {
        errorMessage = `Request error: ${apiError.message}`;
        errorCode = "request_error";
      }

      return {
        success: false,
        error: errorMessage,
        errorCode,
        originalError:
          process.env.NODE_ENV === "development" ? apiError : undefined,
      };
    }
  };

  const logout = useCallback(async () => {
    setUser(null);
    setSignupData(null);
    signupDataRef.current = null;

    try {
      localStorage.removeItem("qr_folio_user");
      localStorage.removeItem("token");
      sessionStorage.clear();
      document.cookie = "token=; Max-Age=0; path=/";
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  const updateProfile = (profileData) => {
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem("qr_folio_user", JSON.stringify(updatedUser));
  };

  const normalizeUser = useCallback(
    (incomingUser = {}, extra = {}) => {
      const base = user || {};
      const merged = {
        ...base,
        ...incomingUser,
        ...extra,
      };

      const normalizedPlan =
        normalizePlan(
          merged.subscriptionPlan,
          merged.planName || merged.planKey
        ) || "basic";

      const planStatus = (merged.planStatus || "active").toLowerCase();
      const planExpireDate = merged.planExpireDate
        ? new Date(merged.planExpireDate)
        : merged.subscriptionExpiresAt
        ? new Date(merged.subscriptionExpiresAt)
        : null;
      const planExpired = planStatus === "expired";
      const requiresRenewal =
        typeof merged.requiresRenewal === "boolean"
          ? merged.requiresRenewal
          : planStatus !== "active";

      const hasPayment = hasPaymentFlag(merged);

      const hasCompletedSetupValue =
        typeof merged.hasCompletedSetup === "boolean"
          ? merged.hasCompletedSetup
          : hasPayment || Boolean(merged.profileCompleted);

      const isVerifiedValue =
        typeof merged.isVerified === "boolean"
          ? merged.isVerified
          : base?.isVerified ?? false;

      return {
        ...merged,
        subscriptionPlan: normalizedPlan,
        hasCompletedSetup: hasCompletedSetupValue,
        isVerified: isVerifiedValue,
        planStatus,
        planExpired,
        planExpireDate: planExpireDate ? planExpireDate.toISOString() : null,
        requiresRenewal,
        isPaid: hasPayment,
      };
    },
    [normalizePlan, user]
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/user/dashboard");
      if (res.data?.success && res.data.user) {
        const normalized = normalizeUser(res.data.user);
        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));
        return { success: true, user: normalized };
      }

      return {
        success: false,
        error: res.data?.message || "Failed to refresh user",
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }, [normalizeUser]);

  const editProfile = async (payload) => {
    try {
      const res = await api.put("/user/edit-profile", payload);
      if (res.data?.success && res.data.user) {
        const normalized = normalizeUser(res.data.user);
        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));

        const refreshed = await refreshUser();
        if (!refreshed.success) {
          console.warn("Profile refresh failed after update", refreshed.error);
        }

        return { success: true };
      }

      return {
        success: false,
        error: res.data?.message || "Failed to update profile",
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const editCompany = async (payload) => {
    try {
      const res = await api.put("/user/edit-company", payload);
      if (res.data?.success && res.data.user) {
        const normalized = normalizeUser(res.data.user);
        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));

        const refreshed = await refreshUser();
        if (!refreshed.success) {
          console.warn("Company refresh failed after update", refreshed.error);
        }

        return { success: true };
      }

      return {
        success: false,
        error: res.data?.message || "Failed to update company details",
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const uploadPhoto = async ({ file, profilePhoto }) => {
    try {
      let res;
      if (file) {
        const form = new FormData();
        form.append("photo", file);
        res = await api.post("/user/upload-photo", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/user/upload-photo", { profilePhoto });
      }
      if (res.data?.success && res.data.user) {
        const normalized = normalizeUser(res.data.user);
        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));
        return { success: true };
      }
      return {
        success: false,
        error: res.data?.message || "Failed to upload photo",
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  // In AuthContext.jsx, inside the AuthProvider component

  const fetchGallery = useCallback(async () => {
    try {
      const res = await api.get("/gallery");
      if (res.data?.success) {
        return { success: true, items: res.data.items || [] };
      }
      return {
        success: false,
        error:
          res.data?.error || res.data?.message || "Failed to fetch gallery",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch gallery",
      };
    }
  }, []);

  const uploadGalleryImage = useCallback(async (formData) => {
    try {
      const res = await api.post("/gallery/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success && res.data?.item) {
        return { success: true, item: res.data.item };
      }

      return {
        success: false,
        error: res.data?.error || res.data?.message || "Failed to upload image",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to upload image",
      };
    }
  }, []);

  const addGalleryVideo = useCallback(async (videoData) => {
    try {
      const res = await api.post("/gallery/videos", videoData);
      if (res.data?.success && res.data?.item) {
        return { success: true, item: res.data.item };
      }

      return {
        success: false,
        error: res.data?.error || res.data?.message || "Failed to add video",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || error.message || "Failed to add video",
      };
    }
  }, []);

  const deleteGalleryItem = useCallback(async (id) => {
    try {
      const res = await api.delete(`/gallery/${id}`);
      if (res.data?.success) {
        return { success: true };
      }
      return {
        success: false,
        error: res.data?.error || res.data?.message || "Failed to delete item",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to delete item",
      };
    }
  }, []);

  // Add these to the value object in the return statement
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        can,
        signupData,
        signup,
        submitSignupAfterPhoneVerification,
        resendOTP,
        verifyOTP,
        createPaymentOrder,
        createChainpayPayment,
        verifyPayment,
        login,
        mobileOtpLogin,
        logout,
        updatePhone,
        updateProfile,
        refreshUser,
        editProfile,
        editCompany,
        uploadPhoto,
        removeProfilePhoto,
        fetchGallery,
        uploadGalleryImage,
        addGalleryVideo,
        deleteGalleryItem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
