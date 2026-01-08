import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { Download, Edit3, Copy, Share2, Eye } from "lucide-react";
import QRCodeGenerator from "./QRCodeGenerator";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { getReferralOverview } from "../services/referralService";
import { toast } from "react-hot-toast";
import {
  PLAN_LABELS,
  PLAN_ORDER,
  normalizePlan,
} from "../utils/subscriptionPlan";
// import { motion } from "framer-motion";

const Dashboard = () => {
  const { user: authUser, refreshUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState("");
  const qrDownloadRef = useRef(null);

  const baseClientUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_CLIENT_BASE_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, "");
    }
    const deploymentOverride = import.meta.env.VITE_DEPLOYMENT_URL;
    if (deploymentOverride) {
      return deploymentOverride.replace(/\/$/, "");
    }
    const productionFallback = "http://www.qrfolio.net";
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      return productionFallback;
    }
    return window.location.origin || productionFallback;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchReferral = async () => {
      try {
        const { data } = await getReferralOverview();
        if (!isMounted) return;
        if (data?.success && data.data?.referralCode) {
          setReferralCode(data.data.referralCode);
        }
      } catch {
        // ignore referral fetch errors
      }
    };

    fetchReferral();

    return () => {
      isMounted = false;
    };
  }, []);

  const user = useMemo(
    () => ({
      id: authUser?.authUserId || authUser?.id || authUser?._id,
      name: authUser?.name || "—",
      email: authUser?.email || "—",
      phone: authUser?.phone || "—",
      bloodGroup: authUser?.bloodGroup || "—",

      address:
        authUser?.address ||
        [authUser?.city, authUser?.state, authUser?.zipcode]
          .filter(Boolean)
          .join(", ") ||
        "—",
      designation: authUser?.designation || "",
      companyName: authUser?.companyName || "—",
      companyDescription: authUser?.companyDescription || "",
      companyReferralCode: authUser?.companyReferralCode || "",
      companyEmail: authUser?.companyEmail || "",
      companyPhone: authUser?.companyPhone || "",
      companyWebsite: authUser?.companyWebsite || "",
      dateOfBirth: authUser?.dateOfBirth
        ? new Date(authUser.dateOfBirth).toLocaleDateString()
        : "—",
      description: authUser?.description || "",
      facebook: authUser?.facebook || "",
      linkedin: authUser?.linkedin || "",
      instagram: authUser?.instagram || "",
      twitter: authUser?.twitter || "",
      whatsapp: authUser?.whatsapp || "",
      github: authUser?.github || "",
      website: authUser?.website || "",
      companyExperience: authUser?.companyExperience || "",
      subscriptionPlan: normalizePlan(
        authUser?.subscriptionPlan,
        authUser?.planName
      ),
      profilePhoto:
        authUser?.profilePhoto ||
        "https://via.placeholder.com/200?text=Profile",
      qrCodeUrl:
        authUser?.qrCodeUrl ||
        (authUser?.id ? `${baseClientUrl}/profile/${authUser.id}` : ""),
    }),
    [authUser, baseClientUrl]
  );

  const currentPlan = useMemo(
    () => normalizePlan(authUser?.subscriptionPlan, authUser?.planName),
    [authUser?.subscriptionPlan, authUser?.planName]
  );
  const currentPlanLabel = PLAN_LABELS[currentPlan] || PLAN_LABELS.basic;
  const isPremiumPlan = currentPlan === "premium";
  const nextPlanKey = useMemo(() => {
    const index = PLAN_ORDER.indexOf(currentPlan);
    if (index === -1) return null;
    return PLAN_ORDER[index + 1] || null;
  }, [currentPlan]);
  const nextPlanLabel = nextPlanKey
    ? PLAN_LABELS[nextPlanKey] || nextPlanKey
    : null;

  const nextUpgradePath = useMemo(() => {
    if (!nextPlanKey) return null;
    const params = new URLSearchParams({ upgrade: nextPlanKey }).toString();
    return `/payment?${params}`;
  }, [nextPlanKey]);

  const handleUpgradeClick = useCallback(() => {
    if (!nextUpgradePath) return;
    navigate(nextUpgradePath);
  }, [nextUpgradePath, navigate]);

  const handleUpgradeToPremiumClick = useCallback(() => {
    const params = new URLSearchParams({ upgrade: "premium" }).toString();
    navigate(`/payment?${params}`);
  }, [navigate]);

  const matrimonyUrl = useMemo(() => {
    const url = import.meta.env?.VITE_MATRIMONY_URL;
    if (typeof url === "string" && url.trim()) {
      return url.trim().replace(/\/$/, "");
    }
    return null;
  }, []);

  const handleMatrimonyClick = useCallback(() => {
    if (matrimonyUrl) {
      try {
        const target = new URL(matrimonyUrl);
        if (user?.email) {
          target.searchParams.set("email", user.email);
        }
        if (referralCode) {
          target.searchParams.set("ref", referralCode);
        }
        window.location.href = target.toString();
        return;
      } catch {
        window.location.href = matrimonyUrl;
        return;
      }
    }
    navigate("/matrimonial-login");
  }, [matrimonyUrl, navigate, user, referralCode]);

  const safeAvatar = useMemo(() => {
    if (authUser?.profilePhoto) return authUser.profilePhoto;
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
        <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
        <circle cx='12' cy='7' r='4'></circle>
      </svg>
    `)}`;
  }, [authUser?.profilePhoto, authUser?.name]);

  const [qrSize, setQrSize] = useState(80);
  const [copied, setCopied] = useState(false);
  const qrWrapperRef = useRef(null);
  const qrGeneratorRef = useRef(null);
  const qrCardRef = useRef(null);

  const resolvedQrSize = useMemo(
    () => Math.min(Math.max(qrSize, 80), 110),
    [qrSize]
  );

  const hasRefreshed = useRef(false);
  const nfcFormInitializedRef = useRef(false);
  const nfcNameRef = useRef(null);
  const nfcPhoneRef = useRef(null);
  const nfcAddress1Ref = useRef(null);
  const nfcAddress2Ref = useRef(null);
  const nfcCityRef = useRef(null);
  const nfcStateRef = useRef(null);
  const nfcPostalRef = useRef(null);
  const nfcCountryRef = useRef(null);
  const nfcNotesRef = useRef(null);

  const profileUrl =
    user.qrCodeUrl || (user.id ? `${baseClientUrl}/profile/${user.id}` : "");

  useEffect(() => {
    if (hasRefreshed.current) {
      return;
    }
    hasRefreshed.current = true;
    refreshUser?.();
  }, [refreshUser]);

  const [nfcStatus, setNfcStatus] = useState({
    status: "not_requested",
    requestedAt: null,
    trackingNumber: null,
    shippedAt: null,
    deliveredAt: null,
    shippingName: "",
    shippingPhone: "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "",
    shippingNotes: "",
  });
  const [nfcLoading, setNfcLoading] = useState(false);
  const [nfcRequesting, setNfcRequesting] = useState(false);
  const [nfcForm, setNfcForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    notes: "",
  });
  const [nfcFormVisible, setNfcFormVisible] = useState(false);

  const loadNfcStatus = useCallback(async () => {
    try {
      setNfcLoading(true);
      const { data } = await api.get("/user/nfc/status");
      if (data?.success) {
        const nextStatus = {
          status: data.nfcCardStatus || "not_requested",
          requestedAt: data.nfcRequestedAt || null,
          trackingNumber: data.nfcTrackingNumber || null,
          shippedAt: data.nfcShippedAt || null,
          deliveredAt: data.nfcDeliveredAt || null,
          shippingName: data.nfcShippingName || "",
          shippingPhone: data.nfcShippingPhone || "",
          shippingAddressLine1: data.nfcShippingAddressLine1 || "",
          shippingAddressLine2: data.nfcShippingAddressLine2 || "",
          shippingCity: data.nfcShippingCity || "",
          shippingState: data.nfcShippingState || "",
          shippingPostalCode: data.nfcShippingPostalCode || "",
          shippingCountry: data.nfcShippingCountry || "",
          shippingNotes: data.nfcShippingNotes || "",
        };
        setNfcStatus(nextStatus);

        if (!nfcFormInitializedRef.current) {
          setNfcForm((prev) => ({
            ...prev,
            name: nextStatus.shippingName || user.name || "",
            phone: nextStatus.shippingPhone || user.phone || "",
            addressLine1:
              nextStatus.shippingAddressLine1 ||
              (user.address && user.address !== "—" ? user.address : ""),
            addressLine2: nextStatus.shippingAddressLine2 || "",
            city: nextStatus.shippingCity || "",
            state: nextStatus.shippingState || "",
            postalCode: nextStatus.shippingPostalCode || "",
            country: nextStatus.shippingCountry || "India",
            notes: nextStatus.shippingNotes || "",
          }));
          nfcFormInitializedRef.current = true;
        }
      } else if (!nfcFormInitializedRef.current) {
        setNfcForm((prev) => ({
          ...prev,
          name: user.name || "",
          phone: user.phone || "",
          addressLine1:
            user.address && user.address !== "—" ? user.address : "",
        }));
        nfcFormInitializedRef.current = true;
      }
    } catch (error) {
      console.error("nfc.status.error", error);
    } finally {
      setNfcLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNfcStatus();
  }, [loadNfcStatus]);

  const nfcStatusLabel = useMemo(() => {
    switch (nfcStatus.status) {
      case "requested":
        return "Requested";
      case "in_production":
        return "In production";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      default:
        return "Not requested";
    }
  }, [nfcStatus.status]);

  const formatNfcDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleRequestNfc = async (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }

    const name = (nfcNameRef.current?.value || "").trim();
    const phone = (nfcPhoneRef.current?.value || "").trim();
    const addressLine1 = (nfcAddress1Ref.current?.value || "").trim();
    const addressLine2 = (nfcAddress2Ref.current?.value || "").trim();
    const city = (nfcCityRef.current?.value || "").trim();
    const state = (nfcStateRef.current?.value || "").trim();
    const postalCode = (nfcPostalRef.current?.value || "").trim();
    const country =
      (nfcCountryRef.current?.value || "").trim() || nfcForm.country || "India";
    const notes = (nfcNotesRef.current?.value || "").trim();

    if (!name || !phone || !addressLine1 || !city || !state || !postalCode) {
      toast.error(
        "Please fill in name, phone, address line 1, city, state, and postal code."
      );
      return;
    }

    try {
      setNfcRequesting(true);
      const { data } = await api.post("/user/nfc/request", {
        shippingName: name,
        shippingPhone: phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        notes,
      });
      if (data?.success) {
        if (data.message) {
          toast.success(data.message);
        } else {
          toast.success("NFC card request submitted.");
        }
        loadNfcStatus();
      } else {
        toast.error(data?.message || "Unable to submit NFC card request");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to submit NFC card request";
      toast.error(message);
      console.error("nfc.request.error", error);
    } finally {
      setNfcRequesting(false);
    }
  };

  const socialLinks = useMemo(() => {
    const links = [];
    const normalizeLink = (value) => {
      if (!value) return "";
      const trimmed = value.trim();
      if (!trimmed) return "";
      if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
      if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    };

    if (user.facebook)
      links.push({
        key: "facebook",
        href: user.facebook,
        bg: "bg-blue-100",
        fg: "text-blue-600",
        label: "Facebook",
      });
    if (user.linkedin)
      links.push({
        key: "linkedin",
        href: user.linkedin,
        bg: "bg-blue-100",
        fg: "text-blue-700",
        label: "LinkedIn",
      });
    if (user.instagram)
      links.push({
        key: "instagram",
        href: user.instagram,
        bg: "bg-pink-100",
        fg: "text-pink-600",
        label: "Instagram",
      });
    if (user.twitter)
      links.push({
        key: "twitter",
        href: user.twitter,
        bg: "bg-slate-100",
        fg: "text-slate-900",
        label: "X (Twitter)",
      });
    if (user.whatsapp)
      links.push({
        key: "whatsapp",
        href: user.whatsapp,
        bg: "bg-green-100",
        fg: "text-green-700",
        label: "WhatsApp",
      });
    if (user.github)
      links.push({
        key: "github",
        href: user.github,
        bg: "bg-gray-100",
        fg: "text-gray-700",
        label: "GitHub",
      });
    const websiteHref = normalizeLink(user.website || user.companyWebsite);
    if (websiteHref)
      links.push({
        key: "website",
        href: websiteHref,
        bg: "bg-amber-100",
        fg: "text-amber-700",
        label: "Website",
      });
    return links;
  }, [
    user.facebook,
    user.linkedin,
    user.instagram,
    user.twitter,
    user.whatsapp,
    user.github,
    user.website,
    user.companyWebsite,
  ]);

  const BrandIcon = ({ name, className }) => {
    switch (name) {
      case "facebook":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
          >
            <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5 3.66 9.14 8.44 9.93v-7.02H7.9v-2.9h2.4V9.41c0-2.37 1.41-3.69 3.57-3.69 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.18 0-1.55.73-1.55 1.48v1.77h2.64l-.42 2.9h-2.22V22c4.78-.79 8.44-4.93 8.44-9.93z" />
          </svg>
        );
      case "linkedin":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
          >
            <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.09V23h-4v-6.5c0-1.55-.03-3.55-2.17-3.55-2.17 0-2.5 1.69-2.5 3.43V23h-4V8.5z" />
          </svg>
        );
      case "instagram":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
          >
            <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h10zm-5 3.5A5.5 5.5 0 117 13a5.5 5.5 0 015-5.5zm0 2A3.5 3.5 0 1015.5 13 3.5 3.5 0 0012 9.5zM17.5 6A1.5 1.5 0 1116 7.5 1.5 1.5 0 0117.5 6z" />
          </svg>
        );
      case "twitter":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
          >
            <path d="M19.5 3h-3.3l-4.2 5.98L7.8 3H4.5l6.02 8.53L4.33 21h3.3l4.5-6.38L16.68 21h3.3l-6.27-9.03L19.5 3z" />
          </svg>
        );
      case "whatsapp":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
          >
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.59-5.945C.154 5.281 5.438 0 12.057 0c3.184 0 6.167 1.24 8.413 3.488a11.82 11.82 0 013.49 8.414c-.003 6.62-5.286 11.904-11.905 11.904a11.9 11.9 0 01-5.943-1.59L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.593 5.448 0 9.886-4.434 9.889-9.885.003-5.462-4.415-9.89-9.881-9.893-5.452 0-9.887 4.434-9.889 9.885a9.8 9.8 0 001.588 5.361l-.999 3.648 3.9-.709zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.521.074-.794.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413z" />
          </svg>
        );
      case "github":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
          >
            <path d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53 0-.26-.01-1.12-.02-2.03-3.05.66-3.69-1.3-3.69-1.3-.5-1.28-1.22-1.63-1.22-1.63-.99-.67.08-.66.08-.66 1.1.08 1.67 1.12 1.67 1.12.98 1.67 2.57 1.19 3.2.91.1-.71.38-1.19.69-1.47-2.44-.28-5.01-1.22-5.01-5.45 0-1.2.43-2.19 1.12-2.96-.11-.28-.49-1.41.11-2.94 0 0 .93-.3 3.06 1.13a10.6 10.6 0 015.57 0c2.13-1.43 3.06-1.13 3.06-1.13.6 1.53.22 2.66.11 2.94.69.77 1.12 1.76 1.12 2.96 0 4.24-2.57 5.17-5.02 5.44.39.33.73.98.73 1.98 0 1.43-.01 2.58-.01 2.93 0 .29.2.64.76.53 4.35-1.45 7.5-5.57 7.5-10.43C23.02 5.24 18.27.5 12 .5z" />
          </svg>
        );
      case "website":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 9h-2.18a15.6 15.6 0 00-1.03-4.14A8.03 8.03 0 0118.93 11zm-4.22 0h-4.42A13.7 13.7 0 0112 4.06 13.7 13.7 0 0114.71 11zm-6.42 2h4.42A13.7 13.7 0 0112 19.94 13.7 13.7 0 018.29 13zm6.42 0h2.18a8.03 8.03 0 01-3.21 4.14A15.6 15.6 0 0014.71 13zm-8.9-2H4.07a8.03 8.03 0 013.21-4.14A15.6 15.6 0 006.1 11zm0 2h2.18a15.6 15.6 0 001.03 4.14A8.03 8.03 0 016.1 13zM19.93 13h-2.18a15.6 15.6 0 01-1.03 4.14A8.03 8.03 0 0019.93 13z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleShareProfile = () => {
    if (!profileUrl) return;
    if (navigator.share) {
      navigator
        .share({
          title: "My Digital Business Card",
          text: "Check out my profile",
          url: profileUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        bloodGroup: user.bloodGroup,
        designation: user.designation,
        company: {
          name: user.companyName,
          email: user.companyEmail,
          phone: user.companyPhone,
          address: user.companyAddress,
          website: user.companyWebsite,
          referralCode: user.companyReferralCode,
          description: user.companyDescription,
          experience: user.companyExperience,
        },
        socials: {
          linkedin: user.linkedin,
          twitter: user.twitter,
          website: user.website,
          github: user.github,
          instagram: user.instagram,
          facebook: user.facebook,
          whatsapp: user.whatsapp,
        },
        profileUrl,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = (user.name || "profile").replace(/\s+/g, "_");
      link.download = `${safeName}_data.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveQR = async () => {
    try {
      if (!qrDownloadRef.current) {
        toast.error("QR not ready");
        return;
      }

      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(qrDownloadRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 6, // 🔥 HD quality
      });

      const safeName = (user.name || "User").replace(/\s+/g, "_");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${safeName}_QR_Code.png`;
      link.click();

      toast.success("QR Code saved with name");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save QR");
    }
  };

  const handleCopyLink = async () => {
    if (!profileUrl) return;

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto px-3 sm:px-0 animate-pulse">
        <div className="rounded-3xl bg-slate-900/90 p-6 space-y-3">
          <div className="h-4 w-40 rounded bg-slate-800" />
          <div className="h-3 w-64 rounded bg-slate-800" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl bg-slate-900/90 p-6 space-y-4">
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 rounded bg-slate-800" />
                  <div className="h-3 w-40 rounded bg-slate-800" />
                  <div className="h-3 w-48 rounded bg-slate-800" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="h-16 rounded-2xl bg-slate-800" />
                <div className="h-16 rounded-2xl bg-slate-800" />
                <div className="h-16 rounded-2xl bg-slate-800" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-900/90 p-6 space-y-4">
              <div className="h-40 w-full rounded-2xl bg-slate-800" />
              <div className="h-3 w-32 rounded bg-slate-800 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-primary-500/30 via-primary-500/20 to-emerald-500/30 p-6 text-white shadow-xl shadow-primary-500/30 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-primary-100">
              Manage your digital business card and track your networking
              success.
            </p>
            {/* <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-20 text-xs font-semibold uppercase tracking-wide text-white/90">
              Current Plan: {currentPlanLabel}
            </div> */}
          </div>
          <div className="hidden md:block">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/25 bg-white/10 shadow-lg shadow-slate-950/40">
              <QRCodeGenerator
                value={profileUrl}
                size={10}
                level="M"
                color="#000000"
                background="#FFFFFF"
                className="opacity-80"
                pixelRatio={6}
              />
            </div>
          </div>
        </div>
      </div>

      {nextPlanKey && (
        <div className="rounded-2xl border border-primary-500/40 bg-primary-500/10 p-6 shadow-xl shadow-primary-500/30 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Upgrade to {nextPlanLabel}
              </h2>
              <p className="mt-1 text-sm text-primary-100/90">
                Unlock additional features and benefits available in the{" "}
                {nextPlanLabel} plan.
              </p>
            </div>
            <button
              onClick={handleUpgradeClick}
              disabled={!nextUpgradePath}
              className={`inline-flex items-center justify-center px-5 py-3 rounded-lg font-medium transition-colors ${
                nextUpgradePath
                  ? "bg-primary-500 text-white hover:bg-primary-400"
                  : "cursor-not-allowed bg-slate-600/60 text-slate-300"
              }`}
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your Profile</h2>
            <button
              onClick={() => navigate("/dashboard/profile")}
              className="flex items-center space-x-2 rounded-lg border border-primary-500/60 bg-primary-500/15 px-4 py-2 text-sm font-medium text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="flex-shrink-0">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-500"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                {authUser?.profilePhoto && (
                  <img
                    src={safeAvatar}
                    alt={user.name}
                    className="relative z-10 h-full w-full rounded-full border-4 border-slate-900 object-cover shadow-[0_18px_45px_rgba(15,23,42,0.9)]"
                  />
                )}
              </div>
            </div>

            <div className="flex-1">
              <button
                type="button"
                onClick={() => user.id && navigate(`/profile/${user.id}`)}
                className="text-left"
                title="View Public Profile"
              >
                <h3 className="text-2xl font-bold text-white hover:underline">
                  {user.name}
                </h3>
              </button>
              <p className="text-sm font-medium text-primary-300">
                {user.designation || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* ---------------- PERSONAL DETAILS ---------------- */}
            <div>
              <div className="mb-3 text-sm font-semibold text-slate-100">
                Personal Details
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs text-slate-400">Full Name</div>
                  <div className="text-sm text-slate-100">
                    {user.name || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Email</div>
                  <div className="text-sm text-slate-100">
                    {user.email || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Phone Number</div>
                  <div className="text-sm text-slate-100">
                    {user.phone || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Address</div>
                  <div className="text-sm text-slate-100">
                    {user.address || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Date of Birth</div>
                  <div className="text-sm text-slate-100">
                    {user.dateOfBirth || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Blood Group</div>
                  <div className="text-sm text-slate-100">
                    {user.bloodGroup || "—"}
                  </div>
                </div>
              </div>

              {/* <div className="mt-4 grid gap-4 border-b border-slate-800 pb-4 md:grid-cols-2"></div> */}
            </div>
            <div>
              <div className="mb-3 text-sm font-semibold text-slate-100">
                Professional Details
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4 md:grid-cols-4">
                <div>
                  <div className="text-xs text-slate-400">Company Name</div>
                  <div className="text-sm text-slate-100">
                    {user.companyName || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Designation</div>
                  <div className="text-sm text-slate-100">
                    {user.designation || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Experience</div>
                  <div className="text-sm text-slate-100">
                    {user.companyExperience || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    Company Referral Code
                  </div>
                  <div className="text-sm text-slate-100 break-all break-words">
                    {user.companyReferralCode || "—"}
                  </div>
                </div>
              </div>
            </div>

            {user.description && (
              <div className="border-b border-slate-800 pb-4">
                <div className="mb-2 text-sm font-semibold text-slate-100">
                  Professional Summary
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  {user.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${s.bg} ${s.fg} shadow-sm shadow-slate-950/30`}
                >
                  <BrandIcon name={s.key} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur">
          <h3 className="mb-4 text-lg font-bold text-white">Your QR Code</h3>

          <div className="space-y-4">
            <div className="flex justify-center" ref={qrWrapperRef}>
              <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-emerald-400 p-[1px] shadow-inner shadow-slate-950/60">
                <div
                  ref={qrDownloadRef} // 🔥 DOWNLOAD ONLY THIS
                  className="flex flex-col items-center rounded-[22px] bg-white p-4 pb-5"
                >
                  <div className="mt-4 text-center">
                    <p className="text-xl font-extrabold text-black">
                      {user.name || "—"}
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <QRCodeGenerator
                      ref={qrGeneratorRef}
                      value={profileUrl}
                      size={resolvedQrSize}
                      level="H"
                      color="#000000"
                      background="#FFFFFF"
                      logoSrc="/assets/QrLogo.webp" // 🔥 SVG preferred
                      logoSizeRatio={0.22}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 ">
              <label className="text-sm font-medium text-slate-200">
                QR Code Size
              </label>
              <input
                type="range"
                min="80"
                max="110"
                value={resolvedQrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
              />
              <div className="text-center text-xs text-slate-400">
                {resolvedQrSize}px
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSaveQR}
                className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-400"
              >
                <Download className="w-4 h-4" />
                <span>Save QR Code</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className="group relative flex items-center justify-center space-x-1 rounded-lg bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                  <span
                    className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                      copied ? "opacity-100" : ""
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>
                <button
                  onClick={handleShareProfile}
                  className="flex items-center justify-center space-x-1 rounded-lg bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur">
        <h3 className="mb-4 text-lg font-bold text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={() => user.id && navigate(`/profile/${user.id}`)}
            className="flex items-center space-x-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-slate-100 transition-all hover:border-primary-400 hover:bg-primary-500/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20 text-primary-200">
              <Eye className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-100">
                Generate QR ID Card
              </div>
              <div className="text-sm text-slate-400">
                See how others view your profile
              </div>
            </div>
          </button>

          <button
            onClick={handleShareProfile}
            className="flex items-center space-x-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-50 transition-all hover:bg-emerald-500/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/25 text-emerald-100">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-medium text-emerald-50">Share Profile</div>
              <div className="text-sm text-emerald-100/80">
                Send your digital card to contacts
              </div>
            </div>
          </button>
          {/* 
          {isPremiumPlan && (
            <div className="rounded-2xl border border-pink-500/40 bg-gradient-to-r from-pink-500/10 to-rose-500/10 p-6 shadow-xl shadow-pink-500/20 backdrop-blur">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    Matrimonial Profile
                  </h2>
                  <p className="mt-1 text-sm text-pink-100/90">
                    Create a dedicated matrimonial profile with your premium
                    account.
                  </p>
                </div>
                <button
                  onClick={handleMatrimonyClick}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg font-medium transition-colors bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-400 hover:to-rose-400 shadow-lg shadow-pink-500/30"
                >
                  Create Profile
                </button>
              </div>
            </div>
          )} */}

          {/* <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900"></div>
              <div className="text-sm text-gray-500"></div>
            </div>
          </motion.button> */}
        </div>
      </div>

      {/* <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">NFC Card</h3>
            <p className="mt-1 text-sm text-slate-300">
              Track the status of your physical NFC card linked to this profile.
            </p>
            <div className="mt-3 inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200">
              <span className="mr-2 text-slate-400">Current status:</span>
              <span className="capitalize text-slate-100">
                {nfcLoading ? "Checking..." : nfcStatusLabel}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
              <div>
                <div className="font-medium text-slate-200">Requested</div>
                <div>{formatNfcDate(nfcStatus.requestedAt)}</div>
              </div>
              <div>
                <div className="font-medium text-slate-200">Shipped</div>
                <div>{formatNfcDate(nfcStatus.shippedAt)}</div>
              </div>
              <div>
                <div className="font-medium text-slate-200">Delivered</div>
                <div>{formatNfcDate(nfcStatus.deliveredAt)}</div>
              </div>
            </div>
            {nfcStatus.trackingNumber && (
              <div className="mt-3 text-xs text-slate-300">
                Tracking number:{" "}
                <span className="font-mono font-medium text-slate-100">
                  {nfcStatus.trackingNumber}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            {isPremiumPlan && nfcStatus.status === "not_requested" && (
              <>
                <button
                  type="button"
                  disabled={nfcLoading || nfcRequesting}
                  onClick={() => setNfcFormVisible(true)}
                  className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/40 hover:bg-primary-400 disabled:cursor-not-allowed disabled:bg-primary-300"
                >
                  {nfcFormVisible
                    ? "Fill shipping details below"
                    : "Request NFC card"}
                </button>
                <p className="max-w-xs text-right text-xs text-slate-400">
                  NFC cards are available for Premium (Platinum) users. We will
                  ship to the address you provide in the form.
                </p>
              </>
            )}
            {!isPremiumPlan && nfcStatus.status === "not_requested" && (
              <>
                <p className="max-w-xs text-right text-xs text-slate-400">
                  Physical NFC cards are available on the Premium (Platinum)
                  plan. Upgrade your plan to request a card.
                </p>
                <button
                  type="button"
                  onClick={handleUpgradeToPremiumClick}
                  className="inline-flex items-center justify-center rounded-lg border border-primary-500 px-4 py-1.5 text-xs font-semibold text-primary-200 shadow-sm hover:bg-primary-500/10"
                >
                  Upgrade to Premium
                </button>
              </>
            )}
            {nfcStatus.status !== "not_requested" && (
              <p className="max-w-xs text-right text-xs text-slate-400">
                You have already submitted a request. You will receive your card
                once it is produced and shipped.
              </p>
            )}
          </div>
        </div>

        {isPremiumPlan &&
          nfcFormVisible &&
          nfcStatus.status === "not_requested" && (
            <div className="mt-6 grid gap-3 border-t border-gray-100 pt-4 text-xs text-gray-700">
              <p className="text-sm font-semibold text-gray-900">
                Shipping details
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span>Full name *</span>
                  <input
                    type="text"
                    defaultValue={nfcForm.name}
                    ref={nfcNameRef}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Phone number *</span>
                  <input
                    type="tel"
                    defaultValue={nfcForm.phone}
                    ref={nfcPhoneRef}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span>Address line 1 *</span>
                <input
                  type="text"
                  defaultValue={nfcForm.addressLine1}
                  ref={nfcAddress1Ref}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Address line 2</span>
                <input
                  type="text"
                  defaultValue={nfcForm.addressLine2}
                  ref={nfcAddress2Ref}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span>City *</span>
                  <input
                    type="text"
                    defaultValue={nfcForm.city}
                    ref={nfcCityRef}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>State *</span>
                  <input
                    type="text"
                    defaultValue={nfcForm.state}
                    ref={nfcStateRef}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span>Postal code *</span>
                  <input
                    type="text"
                    defaultValue={nfcForm.postalCode}
                    ref={nfcPostalRef}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Country</span>
                  <input
                    type="text"
                    defaultValue={nfcForm.country}
                    ref={nfcCountryRef}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span>Delivery notes (optional)</span>
                <textarea
                  rows={3}
                  defaultValue={nfcForm.notes}
                  ref={nfcNotesRef}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <div className="flex flex-col gap-2 md:items-end">
                <button
                  type="button"
                  onClick={handleRequestNfc}
                  disabled={nfcLoading || nfcRequesting}
                  className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
                >
                  {nfcRequesting ? "Submitting..." : "Submit NFC request"}
                </button>
              </div>
            </div>
          )}
      </div> */}
    </div>
  );
};

export default Dashboard;
