import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Download,
  Share2,
  Copy,
  Eye,
  Palette,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import { motion } from "framer-motion";
import QRCodeGenerator from "./QRCodeGenerator";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api";

const MyQRCode = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrConfig, setQrConfig] = useState({
    size: 300,
    level: "H",
    margin: 4,
    color: "#000000",
    background: "#FFFFFF",
  });

  const [previewDevice, setPreviewDevice] = useState("desktop");
  const qrContainerRef = useRef(null);
  const qrCodeRef = useRef(null);

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

  const userId = user?.authUserId || user?.id || user?._id;
  const profileUrl =
    user?.qrCodeUrl || (userId ? `${baseClientUrl}/profile/${userId}` : "");
  const [toast, setToast] = useState("");
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  };

  const apiBase = useMemo(
    () =>
      import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
      "http://api.qrfolio.net",
    []
  );
  const hasFetchedConfig = useRef(false);

  useEffect(() => {
    if (hasFetchedConfig.current) {
      return;
    }
    hasFetchedConfig.current = true;

    const fetchQrConfig = async () => {
      try {
        const res = await api.get("/qrcode");
        const cfg = res.data?.data || res.data;
        if (cfg && typeof cfg === "object") {
          setQrConfig((prev) => ({ ...prev, ...cfg }));
        }
      } catch (e) {
        const message = e.response?.data?.message || e.message;
        console.warn("QR config fetch failed:", message);
      }
    };

    fetchQrConfig();
  }, []);

  const handleConfigChange = (key, value) => {
    setQrConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDownload = async (format = "png") => {
    if (!qrCodeRef.current) {
      showToast("QR not ready yet");
      return;
    }

    const safeName = (user?.name || "QR_Code").replace(/\s+/g, "_");

    if (format === "svg") {
      const svg =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<svg xmlns='http://www.w3.org/2000/svg' width='${qrConfig.size}' height='${qrConfig.size}'>\n` +
        `<rect width='100%' height='100%' fill='${qrConfig.background}'/>\n` +
        `<image href='${qrCodeRef.current.getDataUrl() || ""}' width='${
          qrConfig.size
        }' height='${qrConfig.size}' />\n` +
        `</svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${safeName}.svg`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("Downloaded SVG file");
      return;
    }

    const canvas = qrCodeRef.current.getCanvas();
    if (!canvas) {
      showToast("QR not ready yet");
      return;
    }

    const url = canvas.toDataURL(`image/${format}`);
    const link = document.createElement("a");
    link.download = `${safeName}.${format}`;
    link.href = url;
    link.click();
    showToast(`Downloaded ${format.toUpperCase()} file`);
  };

  const handleCopyLink = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    showToast("Link copied to clipboard");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Digital Business Card",
        text: "Check out my digital business card!",
        url: profileUrl,
      });
      showToast("Share dialog opened");
    }
  };

  const colorPresets = [
    { name: "Classic Black", color: "#000000", bg: "#FFFFFF" },
    { name: "Ocean Blue", color: "#0066CC", bg: "#F0F8FF" },
    { name: "Forest Green", color: "#228B22", bg: "#F0FFF0" },
    { name: "Royal Purple", color: "#6A0DAD", bg: "#F8F0FF" },
    { name: "Sunset Orange", color: "#FF6347", bg: "#FFF8F0" },
    { name: "Wine Red", color: "#722F37", bg: "#FDF2F8" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="px-4 py-3 rounded-lg shadow-md bg-green-600 text-white text-sm">
            {toast}
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">QR Code Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-2 rounded-lg ${
                  previewDevice === "desktop"
                    ? "bg-primary-100 text-primary-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`p-2 rounded-lg ${
                  previewDevice === "tablet"
                    ? "bg-primary-100 text-primary-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-2 rounded-lg ${
                  previewDevice === "mobile"
                    ? "bg-primary-100 text-primary-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div
              className={`
                p-6 rounded-2xl border-2 border-gray-100 transition-all duration-300
                ${
                  previewDevice === "mobile"
                    ? "max-w-xs"
                    : previewDevice === "tablet"
                    ? "max-w-sm"
                    : "max-w-md"
                }
              `}
              style={{ backgroundColor: qrConfig.background }}
            >
              <div ref={qrContainerRef} className="flex justify-center">
                <QRCodeGenerator
                  ref={qrCodeRef}
                  value={profileUrl}
                  size={
                    previewDevice === "mobile"
                      ? 200
                      : previewDevice === "tablet"
                      ? 250
                      : qrConfig.size
                  }
                  level={qrConfig.level}
                  margin={qrConfig.margin}
                  color={qrConfig.color}
                  background={qrConfig.background}
                />
              </div>
              <div className="text-center mt-4">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "—"}
                </p>
                <p className="text-xs text-gray-600">
                  {user?.designation || "—"}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Scan to view profile
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDownload("png")}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDownload("svg")}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download SVG</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyLink}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </motion.button>
            </div>

            <motion.button
              type="button"
              onClick={() => userId && navigate(`/profile/${userId}`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors w-full"
            >
              <Eye className="w-4 h-4" />
              <span>Generate QR ID Card</span>
            </motion.button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <Palette className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Customize QR Code
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Size: {qrConfig.size}px
              </label>
              <input
                type="range"
                min="200"
                max="500"
                step="10"
                value={qrConfig.size}
                onChange={(e) =>
                  handleConfigChange("size", parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Error Correction Level
              </label>
              <select
                value={qrConfig.level}
                onChange={(e) => handleConfigChange("level", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Margin: {qrConfig.margin}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={qrConfig.margin}
                onChange={(e) =>
                  handleConfigChange("margin", parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Color Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      handleConfigChange("color", preset.color);
                      handleConfigChange("background", preset.bg);
                    }}
                    className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foreground Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={qrConfig.color}
                    onChange={(e) =>
                      handleConfigChange("color", e.target.value)
                    }
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={qrConfig.color}
                    onChange={(e) =>
                      handleConfigChange("color", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={qrConfig.background}
                    onChange={(e) =>
                      handleConfigChange("background", e.target.value)
                    }
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={qrConfig.background}
                    onChange={(e) =>
                      handleConfigChange("background", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-4">
              <h4 className="font-medium text-primary-900 mb-2">Usage Tips</h4>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>
                  • Higher error correction allows for better scanning with
                  damage
                </li>
                <li>
                  • Ensure good contrast between foreground and background
                </li>
                <li>• Test your QR code before printing in large quantities</li>
                <li>• Minimum size for print: 1 inch (2.5cm) square</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MyQRCode;
