import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Edit3, Copy, Share2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import QRCodeGenerator from "./QRCodeGenerator";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user: authUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const baseClientUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_CLIENT_BASE_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, "");
    }
    const deploymentOverride = import.meta.env.VITE_DEPLOYMENT_URL;
    if (deploymentOverride) {
      return deploymentOverride.replace(/\/$/, "");
    }
    const productionFallback = "https://www.qrfolio.net";
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      return productionFallback;
    }
    return window.location.origin || productionFallback;
  }, []);

  const user = useMemo(
    () => ({
      id: authUser?.authUserId || authUser?.id || authUser?._id,
      name: authUser?.name || "—",
      email: authUser?.email || "—",
      phone: authUser?.phone || "—",
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
      companyExperience: authUser?.companyExperience || "",
      profilePhoto:
        authUser?.profilePhoto ||
        "https://via.placeholder.com/200?text=Profile",
      qrCodeUrl:
        authUser?.qrCodeUrl ||
        (authUser?.id ? `${baseClientUrl}/profile/${authUser.id}` : ""),
    }),
    [authUser, baseClientUrl]
  );

  const safeAvatar = useMemo(() => {
    if (authUser?.profilePhoto) return authUser.profilePhoto;
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
        <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
        <circle cx='12' cy='7' r='4'></circle>
      </svg>
    `)}`;
  }, [authUser?.profilePhoto, authUser?.name]);

  const [qrSize, setQrSize] = useState(200);
  const [copied, setCopied] = useState(false);
  const qrWrapperRef = useRef(null);
  const qrGeneratorRef = useRef(null);

  const profileUrl =
    user.qrCodeUrl || (user.id ? `${baseClientUrl}/profile/${user.id}` : "");

  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (hasRefreshed.current) {
      return;
    }
    hasRefreshed.current = true;
    refreshUser?.();
  }, [refreshUser]);

  const socialLinks = useMemo(() => {
    const links = [];
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
    return links;
  }, [
    user.facebook,
    user.linkedin,
    user.instagram,
    user.twitter,
    user.whatsapp,
    user.github,
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

  const handleSaveQR = () => {
    if (!qrGeneratorRef.current) {
      return;
    }

    const canvas = qrGeneratorRef.current.getCanvas();
    if (!canvas) {
      return;
    }

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = (user.name || "User").replace(/\s+/g, "_");
    link.download = `${safeName}_QR_Code.png`;
    link.href = url;
    link.click();
  };

  const handleCopyLink = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {copied && (
        <div className="fixed top-4 right-4 z-50">
          <div className="px-4 py-3 rounded-lg shadow-md bg-green-600 text-white text-sm">
            Link copied to clipboard
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-primary-100">
              Manage your digital business card and track your networking
              success.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <QRCodeGenerator
                value={profileUrl}
                size={60}
                level="M"
                className="opacity-80"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/dashboard/profile")}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </motion.button>
          </div>

          <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="flex-shrink-0">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-full">
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
                    className="text-gray-500"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                {authUser?.profilePhoto && (
                  <img
                    src={safeAvatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover border-4 border-white relative z-10"
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
                <h3 className="text-2xl font-bold text-gray-900 hover:underline">
                  {user.name}
                </h3>
              </button>
              <p className="text-lg text-primary-600 font-medium">
                {user.designation || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                Personal Details
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Full Name</div>
                  <div className="text-sm text-gray-900">{user.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm text-gray-900">{user.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone Number</div>
                  <div className="text-sm text-gray-900">{user.phone}</div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 border-b border-gray-200 pb-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500">Address</div>
                  <div className="text-sm text-gray-900">{user.address}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date of Birth</div>
                  <div className="text-sm text-gray-900">
                    {user.dateOfBirth}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                Professional Details
              </div>
              <div className="grid md:grid-cols-4 gap-4 border-b border-gray-200 pb-4">
                <div>
                  <div className="text-xs text-gray-500">Company Name</div>
                  <div className="text-sm text-gray-900">
                    {user.companyName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Designation</div>
                  <div className="text-sm text-gray-900">
                    {user.designation || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Experience</div>
                  <div className="text-sm text-gray-900">
                    {user.companyExperience || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">
                    Company Referral Code
                  </div>
                  <div className="text-sm text-gray-900">
                    {user.companyReferralCode || "—"}
                  </div>
                </div>
              </div>
            </div>

            {user.description && (
              <div className="border-b border-gray-200 pb-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Professional Summary
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
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
                  className={`w-9 h-9 rounded-full ${s.bg} ${s.fg} flex items-center justify-center`}
                >
                  <BrandIcon name={s.key} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your QR Code</h3>

          <div className="space-y-4">
            <div className="flex justify-center" ref={qrWrapperRef}>
              <div className="p-4 bg-white rounded-xl border-2 border-gray-100">
                <QRCodeGenerator ref={qrGeneratorRef} value={profileUrl} size={qrSize} level="H" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                QR Code Size
              </label>
              <input
                type="range"
                min="150"
                max="300"
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 text-center">
                {qrSize}px
              </div>
            </div>

            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveQR}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Save QR Code</span>
              </motion.button>

              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  className="relative group flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
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
                </motion.button>
                <motion.button
                  onClick={handleShareProfile}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </motion.button>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Scan to view public profile
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => user.id && navigate(`/profile/${user.id}`)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">
                Generate QR ID Card
              </div>
              <div className="text-sm text-gray-500">
                See how others view your profile
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShareProfile}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Share Profile</div>
              <div className="text-sm text-gray-500">
                Send your digital card to contacts
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Export Data</div>
              <div className="text-sm text-gray-500">
                Download your profile information
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
