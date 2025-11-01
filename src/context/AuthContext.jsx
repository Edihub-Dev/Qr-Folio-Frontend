import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import api from "../api";

const PAYMENT_SUCCESS_STATES = new Set([
  "COMPLETED",
  "SUCCESS",
  "SUCCESSFUL",
  "CAPTURED",
  "PAID",
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
  const hasInitialized = useRef(false);

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
    password,
    confirmPassword,
    couponCode,
  }) => {
    try {
      setUser(null);
      setSignupData(null);
      localStorage.removeItem("qr_folio_user");
      localStorage.removeItem("token");

      const res = await api.post("/auth/signup", {
        name,
        email,
        password,
        confirmPassword: confirmPassword ?? password,
        couponCode,
      });
      if (res.data?.success) {
        setSignupData({ name, email, couponCode });
        return { success: true };
      }
      return { success: false, error: res.data?.message || "Signup failed" };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const resendOTP = async () => {
    try {
      if (!signupData?.email)
        return { success: false, error: "No email to resend OTP" };
      await api.post("/auth/resend-otp", { email: signupData.email });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const userEmail = email || signupData?.email;
      if (!userEmail)
        return { success: false, error: "Missing email for OTP verification" };

      console.log("Sending OTP verification request for:", userEmail);
      const payload = { email: userEmail, otp };
      if (signupData?.couponCode) {
        payload.couponCode = signupData.couponCode;
      }

      const res = await api.post("/auth/verify-otp", payload);
      console.log("OTP verification response:", res.data);

      if (res.data?.success) {
        const { token, user: userData } = res.data;

        if (!token) {
          throw new Error("No token received from server");
        }

        localStorage.setItem("token", token);

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const paymentComplete = hasPaymentFlag(userData);
        const verifiedUser = {
          id: userData._id || res.data.userId,
          email: userData.email || userEmail,
          name: userData.name || signupData?.name,
          isVerified: true,
          isPaid: paymentComplete,
          hasCompletedSetup: paymentComplete,
          phonepePaymentId: userData.phonepePaymentId,
          phonepeMerchantTransactionId: userData.phonepeMerchantTransactionId,
          subscriptionPlan: normalizePlan(
            userData.subscriptionPlan,
            userData.planName
          ),
        };

        console.log("Setting user state:", verifiedUser);

        setUser(verifiedUser);
        localStorage.setItem("qr_folio_user", JSON.stringify(verifiedUser));

        return {
          success: true,
          requiresPayment: !paymentComplete,
          user: verifiedUser,
        };
      }

      return {
        success: false,
        error: res.data?.message || "Invalid OTP",
      };
    } catch (err) {
      console.error("OTP Verification Error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to verify OTP";
      console.error("Error details:", {
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });
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

  const login = async (email, password) => {
    try {
      console.log("Clearing existing auth data...");
      localStorage.removeItem("token");
      localStorage.removeItem("qr_folio_user");
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "token=; Max-Age=0; path=/";
    } catch (error) {
      console.warn("Error clearing auth data:", error);
    }

    console.log("Attempting login for:", email);

    const normalizedEmail = email ? email.trim().toLowerCase() : "";

    try {
      const res = await api.post("/auth/login", {
        email: normalizedEmail,
        password: password,
      });

      console.log("Login API response:", res.data);

      if (res.data?.success) {
        console.log("Login successful for:", normalizedEmail);
        const { token, user: u } = res.data;

        if (token) {
          console.log("Token received, saving to localStorage");
          localStorage.setItem("token", token);
        } else {
          console.warn("No token received in login response");
        }

        const normalized = {
          ...u,
          email: u?.email || normalizedEmail,
          role: u?.role || "user",
          isBlocked: Boolean(u?.isBlocked),
          paymentStatus:
            u?.paymentStatus || (hasPaymentFlag(u) ? "paid" : "pending"),
          paymentMethod: u?.paymentMethod || "none",
          totalAmountPaid: Number(u?.totalAmountPaid || 0),
          lastPaymentAt: u?.lastPaymentAt || null,
          paymentReference: u?.paymentReference || null,
          isPaid: hasPaymentFlag(u),
          hasCompletedSetup: hasPaymentFlag(u),
          isVerified: u?.isVerified || false,
          subscriptionPlan: normalizePlan(u?.subscriptionPlan, u?.planName),
        };

        console.log("Normalized user data:", normalized);
        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));

        const requiresPayment = res.data?.requiresPayment ?? !normalized.isPaid;

        if (requiresPayment) {
          console.log("Payment required for user:", normalizedEmail);
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

      console.error("Login response indicates failure:", res.data);
      return {
        success: false,
        error: res.data?.message || "Login failed. Please try again.",
        errorCode: res.data?.error,
      };
    } catch (apiError) {
      console.error("API Error:", apiError);
      const data = apiError.response?.data;

      if (data?.requiresPayment && data?.user) {
        console.log("💳 Payment required response received");
        const normalized = {
          ...data.user,
          role: data.user?.role || "user",
          isBlocked: Boolean(data.user?.isBlocked),
          paymentStatus:
            data.user?.paymentStatus ||
            (hasPaymentFlag(data.user) ? "paid" : "pending"),
          paymentMethod: data.user?.paymentMethod || "none",
          totalAmountPaid: Number(data.user?.totalAmountPaid || 0),
          lastPaymentAt: data.user?.lastPaymentAt || null,
          paymentReference: data.user?.paymentReference || null,
          isPaid: hasPaymentFlag(data.user),
          hasCompletedSetup: hasPaymentFlag(data.user),
          isVerified: data.user?.isVerified || true,
          subscriptionPlan: normalizePlan(
            data.user.subscriptionPlan,
            data.user.planName
          ),
        };

        console.log("User needs to complete payment:", normalized);
        setUser(normalized);
        localStorage.setItem("qr_folio_user", JSON.stringify(normalized));

        return {
          success: true,
          requiresPayment: true,
          user: normalized,
        };
      }

      // Handle specific error cases
      let errorMessage = "An error occurred during login. Please try again.";
      let errorCode = "unknown_error";

      if (apiError.response) {
        // Server responded with an error status code
        console.error("Server error response:", {
          status: apiError.response.status,
          data: apiError.response.data,
          headers: apiError.response.headers,
        });

        errorMessage = data?.message || apiError.message;
        errorCode = data?.error || `http_${apiError.response.status}`;

        // Handle common error cases
        if (apiError.response.status === 400) {
          if (data?.error === "invalid_credentials") {
            errorMessage =
              "The email or password you entered is incorrect. Please try again.";
          } else if (data?.error === "email_not_verified") {
            errorMessage =
              "Please verify your email before logging in. Check your inbox for the verification link.";
          } else if (data?.missingFields) {
            errorMessage = `Missing required fields: ${data.missingFields.join(
              ", "
            )}`;
          }
        } else if (apiError.response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (apiError.response.status === 403) {
          errorMessage = "You don't have permission to access this resource.";
        } else if (apiError.response.status === 404) {
          errorMessage = "Please change your password.";
        } else if (apiError.response.status >= 500) {
          errorMessage = "Please change your password.";
        }
      } else if (apiError.request) {
        // Request was made but no response received
        console.error("No response received:", apiError.request);
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
        errorCode = "no_response";
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", apiError.message);
        errorMessage = `Request error: ${apiError.message}`;
        errorCode = "request_error";
      }

      return {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        originalError:
          process.env.NODE_ENV === "development" ? apiError : undefined,
      };
    }
  };

  const logout = useCallback(async () => {
    setUser(null);
    setSignupData(null);

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

      const hasCompletedSetupValue =
        typeof merged.hasCompletedSetup === "boolean"
          ? merged.hasCompletedSetup
          : Boolean(merged.isPaid) || Boolean(merged.profileCompleted);

      const isVerifiedValue =
        typeof merged.isVerified === "boolean"
          ? merged.isVerified
          : base?.isVerified ?? false;

      return {
        ...merged,
        subscriptionPlan: normalizedPlan,
        hasCompletedSetup: hasCompletedSetupValue,
        isVerified: isVerifiedValue,
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
        signupData,
        signup,
        resendOTP,
        verifyOTP,
        createPaymentOrder,
        createChainpayPayment,
        verifyPayment,
        login,
        logout,
        updateProfile,
        refreshUser,
        editProfile,
        editCompany,
        uploadPhoto,
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
