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
      if (!res.success) throw new Error(res.error || "Failed to update company");
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
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Company Details
            </h1>
            <p className="text-gray-600">
              Manage your company information and branding
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Referral Code
                </label>
                <input
                  type="text"
                  name="companyReferralCode"
                  value={formData.companyReferralCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="e.g., REF2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Experience
                </label>
                <input
                  type="text"
                  name="companyExperience"
                  value={formData.companyExperience || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="e.g., 3 years"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Describe your company's mission, services, and what makes you unique..."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address
                </label>
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Street, City, State, Zip"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="company@example.com"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = '/dashboard';
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${loading ? 'bg-primary-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
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
