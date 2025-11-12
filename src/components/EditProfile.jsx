import React, { useState, useEffect, useMemo } from 'react';
import { Save, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const { user, editProfile, uploadPhoto } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bloodGroup: '',
    dateOfBirth: '',
    description: '',
    linkedin: '',
    twitter: '',
    website: '',
    github: '',
    instagram: '',
    facebook: '',
    whatsapp: ''
  });

  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bloodGroup: user.bloodGroup || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0,10) : '',
        description: user.description || '',
        linkedin: user.linkedin || '',
        twitter: user.twitter || '',
        website: user.website || '',
        github: user.github || '',
        instagram: user.instagram || '',
        facebook: user.facebook || '',
        whatsapp: user.whatsapp || ''
      });
      setAvatar(user.profilePhoto || '');
    }
  }, [user]);

  // Removed automatic redirection to payment page to allow profile editing
  // without forcing payment

  // Safe avatar (inline SVG initials) to avoid external placeholder requests
  const safeAvatar = useMemo(() => {
    const src = avatar || user?.profilePhoto;
    if (src) return src;
    const initials = (user?.name || 'User')
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>\n  <rect width='100%' height='100%' fill='%23e5e7eb'/>\n  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='72' fill='%236b7280' font-family='Arial, sans-serif'>${initials}</text>\n</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [avatar, user?.profilePhoto, user?.name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedPhone = formData.phone.trim();
    if (!trimmedPhone) {
      alert('Phone number is required');
      return;
    }
    setSaving(true);
    try {
      if (avatarFile) {
        await uploadPhoto({ file: avatarFile });
      }
      const { name, email, ...payload } = {
        ...formData,
        phone: trimmedPhone,
      };
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== "")
      );
      const res = await editProfile(cleaned);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(res.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatar(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {saved && (
        <div className="fixed top-4 right-4 z-50">
          <div className="px-4 py-3 rounded-lg shadow-md bg-green-600 text-white text-sm">
            Profile updated successfully
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600">Update your personal and professional information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
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
                {avatar || user?.profilePhoto ? (
                  <img
                    src={safeAvatar}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-white relative z-10"
                  />
                ) : null}
              </div>
              <label 
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-md z-20"
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
              <h3 className="font-medium text-gray-900">Profile Photo</h3>
              <p className="text-sm text-gray-500">
                Upload a professional photo (max 5MB) to personalize your public profile.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  disabled
                />
                 <p className="text-xs text-gray-500 mt-1">Your name cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  disabled
                />
                 <p className="text-xs text-gray-500 mt-1">Your email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="e.g., O+, A-, B+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Tell others about your professional background and expertise..."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter Profile
                </label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram Profile
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook Profile
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Link
                </label>
                <input
                  type="url"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://wa.me/<phone-number>"
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
              disabled={saving}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${saving ? 'bg-primary-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
