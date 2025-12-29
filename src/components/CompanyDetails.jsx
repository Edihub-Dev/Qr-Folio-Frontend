import React, { useState, useEffect } from "react";
import { Save, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CompanyDetails = () => {
  const { user, editCompany } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: "",
    designation: "",
    companyReferralCode: "",
    companyDescription: "",
    companyExperience: "",
    companyWebsite: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        companyName: user.companyName || "",
        designation: user.designation || "",
        companyReferralCode: user.companyReferralCode || "",
        companyDescription: user.companyDescription || "",
        companyExperience: user.companyExperience || "",
        companyWebsite: user.companyWebsite || "",
        companyAddress: user.companyAddress || "",
        companyPhone: user.companyPhone || "",
        companyEmail: user.companyEmail || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        companyName: formData.companyName,
        designation: formData.designation,
        companyReferralCode: formData.companyReferralCode,
        companyDescription: formData.companyDescription,
        companyExperience: formData.companyExperience,
        companyWebsite: formData.companyWebsite,
        companyAddress: formData.companyAddress,
        companyPhone: formData.companyPhone,
        companyEmail: formData.companyEmail,
      };
      const res = await editCompany(payload);
      if (!res.success)
        throw new Error(res.error || "Failed to update company");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error updating company details");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {saved && (
        <div className="fixed top-4 right-4 z-50">
          <div className="px-4 py-3 rounded-lg shadow-md bg-green-600 text-white text-sm">
            Company details updated successfully
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-xl shadow-slate-950/50 backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Company Details</h1>
            <p className="text-sm text-slate-300">
              Manage your company information and branding
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-100">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Your Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Referral Code
                </label>
                <input
                  type="text"
                  name="companyReferralCode"
                  value={formData.companyReferralCode}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., REF2025"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Your Experience
                </label>
                <input
                  type="text"
                  name="companyExperience"
                  value={formData.companyExperience || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 3 years"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Description
                </label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe your company's mission, services, and what makes you unique..."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-100">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Address
                </label>
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="Street, City, State, Zip"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Company Email
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-50 placeholder-slate-500 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="company@example.com"
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
              disabled={loading}
              className={`flex items-center space-x-2 rounded-lg px-6 py-3 transition-colors ${
                loading
                  ? "bg-primary-300 cursor-not-allowed text-white/80"
                  : "bg-primary-500 text-white hover:bg-primary-400"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyDetails;
