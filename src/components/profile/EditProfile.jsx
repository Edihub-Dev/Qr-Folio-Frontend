import React, { useState, useEffect, useMemo } from "react";
import { Save, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const { user, editProfile, uploadPhoto, refreshUser, removeProfilePhoto } =
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
      const { name, email, ...payload } = {
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
    <div className="max-w-4xl mx-auto">
      {(saved || uploadError) && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {uploadError && (
            <div className="px-4 py-3 rounded-lg shadow-md bg-red-600 text-white text-sm">
              {uploadError}
            </div>
          )}
          {saved && (
            <div className="px-4 py-3 rounded-lg shadow-md bg-green-600 text-white text-sm">
              Profile updated successfully
            </div>
          )}
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-xl shadow-slate-950/50 backdrop-blur">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
            <p className="text-sm text-slate-300">
              Update your personal and professional information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
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
                {avatar || user?.profilePhoto ? (
                  <img
                    src={safeAvatar}
                    alt="Profile"
                    className="relative z-10 h-full w-full rounded-full border-4 border-slate-900 object-cover"
                  />
                ) : null}
              </div>
              <label
                className="absolute -bottom-2 -right-2 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary-500 shadow-md transition-colors hover:bg-primary-400"
                title="Change profile photo"
              >
                <Upload className="w-4 h-4 text-white" />
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
                  className=" text-xs text-red-400 hover:text-red-300"
                >
                  Remove profile photo
                </button>
              ) : null}
              <h3 className="font-medium text-slate-100">Profile Photo</h3>
              <p className="text-sm text-slate-400">
                Upload a professional photo (max 5MB) to personalize your
                profile.
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-100">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  className="w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-400"
                  disabled
                />
                <p className="mt-1 text-xs text-slate-400">
                  Your name cannot be changed.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-400"
                  disabled
                />
                <p className="mt-1 text-xs text-slate-400">
                  Your email cannot be changed.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Blood Group
                </label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., O+, A-, B+"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Professional Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="Tell others about your professional background and expertise..."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-100">
              Social Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Twitter Profile
                </label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Personal Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Instagram Profile
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Facebook Profile
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  WhatsApp Link
                </label>
                <input
                  type="url"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="https://wa.me/<phone-number>"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = "/dashboard";
              }}
              className="rounded-lg border border-slate-700 px-6 py-3 text-slate-200 transition-colors hover:bg-slate-800/80"
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
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
