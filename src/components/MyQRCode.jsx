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
import { motion } from "../utils/motion";
import QRCodeGenerator from "./QRCodeGenerator";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

const MyQRCode = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrConfig, setQrConfig] = useState({
    size: 100,
    level: "H",
    margin: 2,
    color: "#000000",
    background: "#FFFFFF",
  });

  const [previewDevice, setPreviewDevice] = useState("desktop");
  const qrContainerRef = useRef(null);
  const qrCodeRef = useRef(null);
  const qrCardRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const width = window.innerWidth;
    if (width < 640) {
      setPreviewDevice("mobile");
    } else if (width < 1024) {
      setPreviewDevice("tablet");
    } else {
      setPreviewDevice("desktop");
    }
  }, []);

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

  // const [toast, setToast] = useState({ show: false, message: "" });

  // const showToast = (message) => {
  //   setToast({ show: true, message });
  //   setTimeout(() => {
  //     setToast({ show: false, message: "" });
  //   }, 1800);
  // };

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
    const safeName = (user?.name || "QR_Code").replace(/\s+/g, "_");

    // For PNG, capture the full preview card (gradient frame + QR + text)
    if (format === "png") {
      if (!qrCardRef.current) {
        toast.error("QR card not ready yet");
        return;
      }

      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(qrCardRef.current, {
          cacheBust: true,
          backgroundColor: "#020617",
          pixelRatio: 6,
          skipFonts: true,
        });

        const link = document.createElement("a");
        link.download = `${safeName}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Downloaded PNG file");
      } catch (e) {
        console.error("QR card PNG download failed:", e);
        toast.error("Unable to download PNG. Please try again.");
      }

      return;
    }

    // SVG and other formats fall back to the raw QR canvas/dataUrl
    if (!qrCodeRef.current) {
      toast.error("QR not ready yet");
      return;
    }

    if (format === "svg") {
      // Preferred: capture the full card (gradient frame + QR + text) as SVG
      if (qrCardRef.current) {
        try {
          const { toSvg } = await import("html-to-image");
          let svgMarkup = await toSvg(qrCardRef.current, {
            cacheBust: true,
            backgroundColor: "#020617",
            pixelRatio: 3,
            skipFonts: true,
          });

          // html-to-image returns a data URL string for SVG, so we need to
          // strip the prefix and decode the payload to get raw SVG markup.
          if (
            typeof svgMarkup === "string" &&
            svgMarkup.startsWith("data:image/svg+xml")
          ) {
            const commaIndex = svgMarkup.indexOf(",");
            if (commaIndex !== -1) {
              const encoded = svgMarkup.slice(commaIndex + 1);
              try {
                svgMarkup = decodeURIComponent(encoded);
              } catch {
                svgMarkup = encoded;
              }
            }
          }

          const blob = new Blob([svgMarkup], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `${safeName}.svg`;
          link.href = url;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          toast.success("Downloaded SVG file");
          return;
        } catch (e) {
          console.error("QR card SVG download failed, falling back:", e);
          // fall through to raw QR SVG fallback below
        }
      }

      const rawSvg =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<svg xmlns='http://www.w3.org/2000/svg' width='${qrConfig.size}' height='${qrConfig.size}'>\n` +
        `<rect width='100%' height='100%' fill='${qrConfig.background}'/>\n` +
        `<image href='${qrCodeRef.current.getDataUrl() || ""}' width='${
          qrConfig.size
        }' height='${qrConfig.size}' />\n` +
        `</svg>`;
      const blob = new Blob([rawSvg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${safeName}.svg`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Downloaded SVG file");
      return;
    }

    const canvas = qrCodeRef.current.getCanvas();
    if (!canvas) {
      toast.error("QR not ready yet");
      return;
    }

    const url = canvas.toDataURL(`image/${format}`);
    const link = document.createElement("a");
    link.download = `${safeName}.${format}`;
    link.href = url;
    link.click();
    toast.success(`Downloaded ${format.toUpperCase()} file`);
  };

  const handleCopyLink = async () => {
    if (!profileUrl) return;

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Digital Business Card",
        text: "Check out my digital business card!",
        url: profileUrl,
      });
      toast.info("Share dialog opened");
    }
  };

  const colorPresets = [
    { name: "Classic Black", color: "#000000", bg: "#FFFFFF" },
    { name: "QrFolio Brand", color: "#6366F1", bg: "#FFFFFF" },
    { name: "Ocean Blue", color: "#0066CC", bg: "#F0F8FF" },
    { name: "Forest Green", color: "#228B22", bg: "#F0FFF0" },
    { name: "Royal Purple", color: "#6A0DAD", bg: "#F8F0FF" },
    { name: "Sunset Orange", color: "#FF6347", bg: "#FFF8F0" },
    { name: "Wine Red", color: "#722F37", bg: "#FDF2F8" },
  ];

  const qrfolioLogoSrc = "/assets/QrLogo.webp";

  const resolvedQrSize = useMemo(() => {
    const raw = typeof qrConfig.size === "number" ? qrConfig.size : 100;
    const clamped = Math.min(Math.max(raw, 100), 160);
    if (previewDevice === "mobile") return Math.min(clamped, 100);
    if (previewDevice === "tablet") return Math.min(clamped, 140);
    return clamped;
  }, [qrConfig.size, previewDevice]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur sm:p-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">QR Code Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-2 rounded-lg ${
                  previewDevice === "desktop"
                    ? "bg-primary-500/20 text-primary-300"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`p-2 rounded-lg ${
                  previewDevice === "tablet"
                    ? "bg-primary-500/20 text-primary-300"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-2 rounded-lg ${
                  previewDevice === "mobile"
                    ? "bg-primary-500/20 text-primary-300"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mb-6 flex justify-center">
            <div
              ref={qrCardRef}
              className={`
                relative rounded-3xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-emerald-400 p-[1px] shadow-[0_22px_50px_rgba(15,23,42,0.9)] transition-all duration-300
                ${
                  previewDevice === "mobile"
                    ? "max-w-xs"
                    : previewDevice === "tablet"
                    ? "max-w-sm"
                    : "max-w-md"
                }
              `}
            >
              <div
                className="rounded-[26px] border border-slate-900 bg-slate-950/95 p-6"
                // style={{ backgroundColor: qrConfig.background }}
              >
                <div ref={qrContainerRef} className="flex justify-center">
                  <QRCodeGenerator
                    ref={qrCodeRef}
                    value={profileUrl}
                    size={resolvedQrSize}
                    level={qrConfig.level}
                    margin={qrConfig.margin}
                    color={qrConfig.color}
                    background={qrConfig.background}
                    logoSrc={qrfolioLogoSrc}
                    logoSizeRatio={0.2}
                    className="overflow-hidden rounded-2xl"
                    pixelRatio={3}
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-slate-100">
                    {user?.name || "—"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {user?.designation || "—"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Scan to view profile
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDownload("png")}
                className="flex items-center justify-center space-x-2 rounded-lg bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-400"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDownload("svg")}
                className="flex items-center justify-center space-x-2 rounded-lg bg-slate-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-600"
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
                className="flex items-center justify-center space-x-2 rounded-lg bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
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
              className="flex w-full items-center justify-center space-x-2 rounded-lg border border-primary-500/60 px-4 py-2 text-sm font-medium text-primary-200 transition-colors hover:bg-primary-500/10"
            >
              <Eye className="w-4 h-4" />
              <span>Generate QR ID Card</span>
            </motion.button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50 backdrop-blur sm:p-7">
          <div className="mb-6 flex items-center space-x-2">
            <Palette className="w-5 h-5 text-primary-300" />
            <h2 className="text-xl font-bold text-white">Customize QR Code</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">
                Size: {resolvedQrSize}px
              </label>
              <input
                type="range"
                min="100"
                max="160"
                value={resolvedQrSize}
                onChange={(e) =>
                  handleConfigChange("size", parseInt(e.target.value))
                }
                onInput={(e) =>
                  handleConfigChange("size", parseInt(e.target.value))
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">
                Error Correction Level
              </label>
              <select
                value={qrConfig.level}
                onChange={(e) => handleConfigChange("level", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">
                Margin: {qrConfig.margin}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={qrConfig.margin}
                onChange={(e) =>
                  handleConfigChange("margin", parseInt(e.target.value))
                }
                onInput={(e) =>
                  handleConfigChange("margin", parseInt(e.target.value))
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">
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
                    className="flex items-center space-x-2 rounded-lg border border-slate-700 bg-slate-900/60 p-2 transition-colors hover:border-primary-400"
                  >
                    <div
                      className="h-4 w-4 rounded border border-slate-600"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-xs font-medium text-slate-100">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Foreground Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={qrConfig.color}
                    onChange={(e) =>
                      handleConfigChange("color", e.target.value)
                    }
                    className="h-10 w-10 cursor-pointer rounded border border-slate-600 bg-slate-900"
                  />
                  <input
                    type="text"
                    value={qrConfig.color}
                    onChange={(e) =>
                      handleConfigChange("color", e.target.value)
                    }
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm font-mono text-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
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
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm font-mono text-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary-500/30 bg-primary-500/10 p-4">
              <h4 className="mb-2 font-medium text-primary-100">Usage Tips</h4>
              <ul className="space-y-1 text-sm text-primary-100/90">
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
