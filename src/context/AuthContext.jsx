import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import api from "../api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupData, setSignupData] = useState(null);
  const hasInitialized = useRef(false);

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
              const paymentComplete = !!(
                parsed?.razorpayPaymentId || parsed?.isPaid
              );
              const normalized = {
                ...parsed,
                isPaid: paymentComplete,
                hasCompletedSetup: paymentComplete,
              };
              setUser(normalized);
            }
          } catch (e) {
            console.error("Error parsing saved user:", e);
            localStorage.removeItem("qr_folio_user");
          }
        }

        try {
        } catch (error) {
          console.error("Failed to refresh user:", error);
        }
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

  const signup = async ({ name, email, password, confirmPassword }) => {
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
      });
      if (res.data?.success) {
        setSignupData({ name, email });
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
      const res = await api.post("/auth/verify-otp", { email: userEmail, otp });
      console.log("OTP verification response:", res.data);

      if (res.data?.success) {
        const { token, user: userData } = res.data;

        if (!token) {
          throw new Error("No token received from server");
        }

        localStorage.setItem("token", token);

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const paymentComplete = !!(
          userData?.razorpayPaymentId || userData?.isPaid
        );
        const verifiedUser = {
          id: userData._id || res.data.userId,
          email: userData.email || userEmail,
          name: userData.name || signupData?.name,
          isVerified: true,
          isPaid: paymentComplete,
          hasCompletedSetup: paymentComplete,
          ...userData,
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

  const createPaymentOrder = async (amountPaise, emailOverride) => {
    try {
      const email = emailOverride || user?.email || signupData?.email;
      if (!email) return { success: false, error: "No user email for payment" };
      const res = await api.post("/auth/razorpay-order", {
        email,
        amount: amountPaise,
      });
      if (res.data?.success) {
        return { success: true, data: res.data };
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

  const verifyPayment = async (
    { razorpay_payment_id, razorpay_order_id, razorpay_signature },
    emailOverride
  ) => {
    try {
      const email = emailOverride || user?.email || signupData?.email;
      if (!email)
        return {
          success: false,
          error: "No user email for payment verification",
        };

      setLoading(true);

      const res = await api.post("/auth/verify-payment", {
        email,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      });

      if (res.data?.success) {
        const updatedUser = {
          ...user,
          razorpayPaymentId: res.data.paymentId || razorpay_payment_id,
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
      setLoading(false);
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
          isPaid: !!(u?.razorpayPaymentId || u?.isPaid),
          hasCompletedSetup: !!(u?.razorpayPaymentId || u?.isPaid),
          isVerified: u?.isVerified || false,
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
          email: data.user?.email || normalizedEmail,
          isPaid: false,
          hasCompletedSetup: false,
          isVerified: data.user?.isVerified || true,
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
          errorMessage = "User not registered with this email.";
        } else if (apiError.response.status >= 500) {
          errorMessage = "A server error occurred. Please try again later.";
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

      const paymentComplete = !!(
        merged?.razorpayPaymentId ||
        merged?.isPaid ||
        incomingUser?.razorpayPaymentId
      );

      return {
        ...merged,
        id: merged._id || merged.id || base.id,
        isPaid: paymentComplete,
        hasCompletedSetup:
          typeof merged.hasCompletedSetup === "boolean"
            ? merged.hasCompletedSetup
            : paymentComplete,
        isVerified:
          typeof merged.isVerified === "boolean"
            ? merged.isVerified
            : base?.isVerified || true,
      };
    },
    [user]
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

  const value = {
    user,
    loading,
    signupData,
    signup,
    resendOTP,
    verifyOTP,
    createPaymentOrder,
    verifyPayment,
    login,
    logout,
    updateProfile,
    refreshUser,
    editProfile,
    editCompany,
    uploadPhoto,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
