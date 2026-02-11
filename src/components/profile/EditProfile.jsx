import React, { useState, useEffect, useMemo } from "react";
import { Save, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { firebaseAuth } from "../../firebase";
import clsx from "clsx";

const EditProfile = () => {
  const { user, editProfile, uploadPhoto, refreshUser, removeProfilePhoto, updatePhone } =
    useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bloodGroup: "",
    dateOfBirth: "",
    description: "",
    linkedin: "",
    twitter: "",
    website: "",
    github: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
  });

  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [phoneEditMode, setPhoneEditMode] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneSession, setPhoneSession] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bloodGroup: user.bloodGroup || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
          : "",
        description: user.description || "",
        linkedin: user.linkedin || "",
        twitter: user.twitter || "",
        website: user.website || "",
        github: user.github || "",
        instagram: user.instagram || "",
        facebook: user.facebook || "",
        whatsapp: user.whatsapp || "",
      });
      setAvatar(user.profilePhoto || "");
    }
  }, [user]);

  useEffect(() => {
    if (!uploadError) return;
    const timeout = setTimeout(() => setUploadError(""), 3000);
    return () => clearTimeout(timeout);
  }, [uploadError]);

  const safeAvatar = useMemo(() => {
    const src = avatar || user?.profilePhoto;
    if (src) return src;
    const initials = (user?.name || "User")
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>\n  <rect width='100%' height='100%' fill='%23e5e7eb'/>\n  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='72' fill='%236b7280' font-family='Arial, sans-serif'>${initials}</text>\n</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [avatar, user?.profilePhoto, user?.name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // const trimmedPhone = formData.phone.trim();
    // if (!trimmedPhone) {
    //   alert("Phone number is required");
    //   return;
    // }

    setSaving(true);
    try {
      if (avatarFile) {
        await uploadPhoto({ file: avatarFile });
      }
      const { name, email, phone, ...payload } = {
        ...formData,
      };

      const res = await editProfile(payload);
      if (res.success) {
        await refreshUser();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(res.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  const ensureRecaptcha = async () => {
    const container = document.getElementById("recaptcha-container-change-phone");
    if (!container) throw new Error("reCAPTCHA container not found");
    container.innerHTML = "";
    const child = document.createElement("div");
    container.appendChild(child);
    const verifier = new RecaptchaVerifier(firebaseAuth, child, { size: "invisible" });
    await verifier.render();
    return verifier;
  };

  const handleSendPhoneOtp = async () => {
    setPhoneError("");
    const digits = String(newPhone || "").replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setPhoneError("Enter a valid 10-digit mobile number");
      return;
    }
    setPhoneLoading(true);
    try {
      const verifier = await ensureRecaptcha();
      const confirmation = await signInWithPhoneNumber(firebaseAuth, `+91${digits}`, verifier);
      setPhoneSession(confirmation);
    } catch (err) {
      setPhoneError(err.message || "Failed to send OTP");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtpAndUpdate = async () => {
    setPhoneError("");
    if (!phoneSession) {
      setPhoneError("Please request an OTP first");
      return;
    }
    const otpValue = phoneOtp.trim();
    if (otpValue.length !== 6) {
      setPhoneError("Enter the 6-digit OTP");
      return;
    }
    setPhoneLoading(true);
    try {
      const result = await phoneSession.confirm(otpValue);
      const token = await result.user.getIdToken(true);
      const digits = String(newPhone || "").replace(/\D/g, "").slice(-10);
      const res = await updatePhone({ newPhone: digits, firebaseIdToken: token });
      if (!res.success) {
        setPhoneError(res.error || "Failed to update phone");
        return;
      }
      await refreshUser();
      setPhoneEditMode(false);
      setNewPhone("");
      setPhoneOtp("");
      setPhoneSession(null);
    } catch (err) {
      setPhoneError(err.message || "Invalid OTP");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    setUploadError("");

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError("Profile photo must be 5MB or smaller");
      setAvatar("");
      setAvatarFile(null);
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (readerEvent) => setAvatar(readerEvent.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    if (!avatar && !user?.profilePhoto) {
      return;
    }
    const confirmed = window.confirm("Remove your profile photo?");
    if (!confirmed) {
      return;
    }
    try {
      const res = await removeProfilePhoto();
      if (res?.success) {
        setAvatar("");
        setAvatarFile(null);
        await refreshUser();
      } else if (res?.error) {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to remove profile photo");
    }
  };

  return (
    <div className={clsx('max-w-4xl', 'mx-auto')}>
      {(saved || uploadError) && (
        <div className={clsx('fixed', 'top-4', 'right-4', 'z-50', 'space-y-2')}>
          {uploadError && (
            <div className={clsx('px-4', 'py-3', 'rounded-lg', 'shadow-md', 'bg-red-600', 'text-white', 'text-sm')}>
              {uploadError}
            </div>
          )}
          {saved && (
            <div className={clsx('px-4', 'py-3', 'rounded-lg', 'shadow-md', 'bg-green-600', 'text-white', 'text-sm')}>
              Profile updated successfully
            </div>
          )}
        </div>
      )}
      <div className={clsx('rounded-2xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-6', 'sm:p-8', 'shadow-xl', 'shadow-slate-950/50', 'backdrop-blur')}>
        <div className={clsx('flex', 'items-center', 'justify-between', 'mb-6')}>
          <div>
            <h1 className={clsx('text-2xl', 'font-bold', 'text-white')}>Edit Profile</h1>
            <p className={clsx('text-sm', 'text-slate-300')}>
              Update your personal and professional information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={clsx('flex', 'items-center', 'space-x-6')}>
            <div className="relative">
              <div className={clsx('relative', 'w-24', 'h-24')}>
                <div className={clsx('absolute', 'inset-0', 'flex', 'items-center', 'justify-center', 'rounded-full', 'bg-slate-800')}>
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
                {avatar || user?.profilePhoto ? (
                  <img
                    src={safeAvatar}
                    alt="Profile"
                    className={clsx('relative', 'z-10', 'h-full', 'w-full', 'rounded-full', 'border-4', 'border-slate-900', 'object-cover')}
                  />
                ) : null}
              </div>
              <label
                className={clsx('absolute', '-bottom-2', '-right-2', 'z-20', 'flex', 'h-8', 'w-8', 'cursor-pointer', 'items-center', 'justify-center', 'rounded-full', 'bg-primary-500', 'shadow-md', 'transition-colors', 'hover:bg-primary-400')}
                title="Change profile photo"
              >
                <Upload className={clsx('w-4', 'h-4', 'text-white')} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              {avatar || user?.profilePhoto ? (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className={clsx('text-xs', 'text-red-400', 'hover:text-red-300')}
                >
                  Remove profile photo
                </button>
              ) : null}
              <h3 className={clsx('font-medium', 'text-slate-100')}>Profile Photo</h3>
              <p className={clsx('text-sm', 'text-slate-400')}>
                Upload a professional photo (max 5MB) to personalize your
                profile.
              </p>
            </div>
          </div>

          <div>
            <h3 className={clsx('mb-4', 'text-lg', 'font-semibold', 'text-slate-100')}>
              Personal Information
            </h3>
            <div className={clsx('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6')}>
              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  className={clsx('w-full', 'cursor-not-allowed', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/80', 'px-4', 'py-3', 'text-slate-400')}
                  disabled
                />
                <p className={clsx('mt-1', 'text-xs', 'text-slate-400')}>
                  Your name cannot be changed.
                </p>
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className={clsx('w-full', 'cursor-not-allowed', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/80', 'px-4', 'py-3', 'text-slate-400')}
                  disabled
                />
                <p className={clsx('mt-1', 'text-xs', 'text-slate-400')}>
                  Your email cannot be changed.
                </p>
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                />
              </div>

              <div className={clsx('rounded-xl', 'border', 'border-slate-800', 'bg-slate-900/40', 'p-4')}>
                <div className={clsx('flex', 'items-center', 'justify-between', 'gap-4')}>
                  <div>
                    <p className={clsx('text-sm', 'font-semibold', 'text-slate-100')}>Change phone number</p>
                    <p className={clsx('text-xs', 'text-slate-400')}>Requires OTP verification</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneEditMode((prev) => !prev);
                      setPhoneError("");
                      setPhoneSession(null);
                      setPhoneOtp("");
                      setNewPhone("");
                    }}
                    className={clsx('rounded-lg', 'border', 'border-white/10', 'px-3', 'py-2', 'text-sm', 'font-semibold', 'text-slate-200', 'hover:bg-white/5')}
                  >
                    {phoneEditMode ? "Cancel" : "Change"}
                  </button>
                </div>

                {phoneEditMode && (
                  <div className={clsx('mt-4', 'space-y-3')}>
                    {phoneError && (
                      <div className={clsx('rounded-lg', 'border', 'border-red-500/40', 'bg-red-500/10', 'px-3', 'py-2')}>
                        <p className={clsx('text-sm', 'text-red-300')}>{phoneError}</p>
                      </div>
                    )}

                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="New mobile number"
                      inputMode="numeric"
                      className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                    />

                    <div id="recaptcha-container-change-phone" />

                    {!phoneSession ? (
                      <button
                        type="button"
                        onClick={handleSendPhoneOtp}
                        disabled={phoneLoading}
                        className={clsx('w-full', 'rounded-lg', 'bg-primary-500', 'px-4', 'py-3', 'text-sm', 'font-semibold', 'text-white', 'shadow-lg', 'shadow-primary-500/30', 'hover:bg-primary-400', 'disabled:opacity-50')}
                      >
                        {phoneLoading ? "Sending OTP..." : "Send OTP"}
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="Enter 6-digit OTP"
                          inputMode="numeric"
                          maxLength={6}
                          className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOtpAndUpdate}
                          disabled={phoneLoading}
                          className={clsx('w-full', 'rounded-lg', 'bg-primary-500', 'px-4', 'py-3', 'text-sm', 'font-semibold', 'text-white', 'shadow-lg', 'shadow-primary-500/30', 'hover:bg-primary-400', 'disabled:opacity-50')}
                        >
                          {phoneLoading ? "Verifying..." : "Verify & Update"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Blood Group
                </label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="e.g., O+, A-, B+"
                />
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                />
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                />
              </div>

              <div className="md:col-span-2">
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Professional Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="Tell others about your professional background and expertise..."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className={clsx('mb-4', 'text-lg', 'font-semibold', 'text-slate-100')}>
              Social Links
            </h3>
            <div className={clsx('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6')}>
              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Twitter Profile
                </label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div className="md:col-span-2">
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Personal Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  GitHub Profile
                </label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Instagram Profile
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  Facebook Profile
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div>
                <label className={clsx('mb-2', 'block', 'text-sm', 'font-medium', 'text-slate-200')}>
                  WhatsApp Link
                </label>
                <input
                  type="url"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className={clsx('w-full', 'rounded-lg', 'border', 'border-slate-700', 'bg-slate-900/60', 'px-4', 'py-3', 'text-slate-50', 'placeholder-slate-500', 'transition-colors', 'focus:border-primary-500', 'focus:ring-2', 'focus:ring-primary-500')}
                  placeholder="https://wa.me/<phone-number>"
                />
              </div>
            </div>
          </div>

          <div className={clsx('flex', 'justify-end', 'space-x-4', 'border-t', 'border-slate-800', 'pt-6')}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = "/dashboard";
              }}
              className={clsx('rounded-lg', 'border', 'border-slate-700', 'px-6', 'py-3', 'text-slate-200', 'transition-colors', 'hover:bg-slate-800/80')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center space-x-2 rounded-lg px-6 py-3 transition-colors ${
                saving
                  ? "bg-primary-300 cursor-not-allowed text-white/80"
                  : "bg-primary-500 text-white hover:bg-primary-400"
              }`}
            >
              <Save className={clsx('w-4', 'h-4')} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
