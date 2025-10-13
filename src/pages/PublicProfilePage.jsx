import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Download,
  QrCode,
  Printer,
  X,
} from "lucide-react";
import QRCodeGenerator from "../components/QRCodeGenerator";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cardRef = useRef(null);
  const { user: authUser, loading: authLoading } = useAuth();
  const [galleryItems, setGalleryItems] = useState([]);
  const [imageItems, setImageItems] = useState([]);
  const [videoItems, setVideoItems] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const res = await api.get(`/user/public/${id}`);
      const data = res.data;

      if (!data?.success || !data?.user) {
        throw new Error(data?.message || "Failed to load profile");
      }

      let profileData = {
        ...data.user,
        id: data.user.id || data.user._id || id,
      };

      // Fetch profile photo if not available
      if (!profileData.profilePhotoDataUri) {
        try {
          const photoRes = await api.get(`/user/public/${id}/photo-data`);
          if (photoRes.data?.success && photoRes.data?.dataUri) {
            profileData.profilePhotoDataUri = photoRes.data.dataUri;
          }
        } catch (photoErr) {
          console.warn(
            "Failed to fetch profile photo data URI:",
            photoErr.message
          );
        }
      }

      // Fetch gallery items
      try {
        const galleryRes = await api.get(`/gallery/public/${id}`);
        if (galleryRes.data?.success) {
          const items = galleryRes.data.items || [];
          setGalleryItems(items);
          setImageItems(items.filter((item) => item?.type === "image"));
          setVideoItems(items.filter((item) => item?.type === "video"));
        }
      } catch (galleryErr) {
        console.warn("Failed to fetch gallery items:", galleryErr.message);
      }

      setUser(profileData);
      setError("");
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto]);

  const handlePoweredByClick = useCallback(() => {
    if (authLoading) return;

    if (authUser) {
      if (
        authUser.isVerified &&
        (authUser.isPaid || authUser.hasCompletedSetup)
      ) {
        navigate("/dashboard", { replace: false });
      } else if (
        authUser.isVerified &&
        !authUser.isPaid &&
        !authUser.hasCompletedSetup
      ) {
        navigate("/payment", { replace: false });
      } else {
        navigate("/login", { replace: false });
      }
    } else {
      navigate("/", { replace: false });
    }
  }, [authLoading, authUser, navigate]);

  // Generate avatar with initials
  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatar =
    user?.profilePhotoDataUri ||
    `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23e5e7eb'/><text x='50%' y='50%' font-family='Arial' font-size='80' text-anchor='middle' dy='.3em' fill='%236b7280'>${getInitials(
      user?.name
    )}</text></svg>`;

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Handle error state
  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-2">
            {error || "Profile not found"}
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const renderVideoEmbed = (url) => {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace(/^www\./, "");

      if (hostname.includes("youtube") || hostname.includes("youtu.be")) {
        let videoId = parsed.searchParams.get("v");

        if (!videoId) {
          const segments = parsed.pathname.split("/").filter(Boolean);
          if (hostname === "youtu.be") {
            videoId = segments[0] || "";
          } else if (segments[0] === "shorts" || segments[0] === "live") {
            videoId = segments[1] || "";
          } else if (segments[0] === "embed") {
            videoId = segments[1] || "";
          } else if (segments.length) {
            videoId = segments[segments.length - 1];
          }
        }

        if (videoId) {
          const cleanId = videoId.split("?")[0].split("&")[0];
          const params = new URLSearchParams();
          const startAt =
            parsed.searchParams.get("t") || parsed.searchParams.get("start");
          if (startAt) {
            const numeric = startAt.replace(/[^0-9]/g, "");
            if (numeric) params.set("start", numeric);
          }
          params.set("rel", "0");
          params.set("modestbranding", "1");

          return (
            <iframe
              key={cleanId}
              title={`YouTube video ${cleanId}`}
              src={`https://www.youtube.com/embed/${cleanId}?${params.toString()}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          );
        }
      }

      if (hostname.includes("vimeo.com")) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const videoId = segments.pop();
        if (videoId) {
          return (
            <iframe
              key={videoId}
              title={`Vimeo video ${videoId}`}
              src={`https://player.vimeo.com/video/${videoId}`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          );
        }
      }
    } catch (error) {
      console.error("Error rendering video embed:", error);
    }

    return null;
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Handle error state
  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-2">
            {error || "Profile not found"}
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // User data
  const displayName = user.name || "—";
  const displayEmail = user.email || user.companyEmail || "—";
  const address =
    [user.address, user.city, user.state, user.zipcode, user.country]
      .filter(Boolean)
      .join(", ") || "—";
  const profileUrl = window.location.href;
  const idNo = (user.id || user._id || "")
    .toString()
    .slice(-6)
    .padStart(6, "0");

  // Format dates
  const issueDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const expireDate = new Date(
    new Date(user.createdAt || new Date()).setFullYear(
      new Date(user.createdAt || new Date()).getFullYear() + 1
    )
  ).toLocaleDateString("en-GB");

  const fetchAsDataUrl = async (url) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const waitForImage = (imgEl, nextSrc) =>
    new Promise((resolve) => {
      if (!imgEl) {
        return resolve();
      }

      const finalize = () => {
        imgEl.removeEventListener("load", finalize);
        imgEl.removeEventListener("error", finalize);
        resolve();
      };

      if (nextSrc && imgEl.getAttribute("src") !== nextSrc) {
        imgEl.setAttribute("src", nextSrc);
      }

      const naturalWidth = imgEl.naturalWidth || 0;
      if (
        imgEl.complete &&
        naturalWidth > 0 &&
        (!nextSrc || imgEl.src === nextSrc)
      ) {
        return resolve();
      }

      imgEl.addEventListener("load", finalize, { once: true });
      imgEl.addEventListener("error", finalize, { once: true });
    });

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;

    const cloneContainer = document.createElement("div");
    cloneContainer.style.position = "fixed";
    cloneContainer.style.pointerEvents = "none";
    cloneContainer.style.opacity = "0";
    cloneContainer.style.left = "-10000px";
    cloneContainer.style.top = "0";
    cloneContainer.style.zIndex = "-1";
    cloneContainer.style.width = `${cardRef.current.offsetWidth}px`;
    cloneContainer.style.height = `${cardRef.current.offsetHeight}px`;

    const clone = cardRef.current.cloneNode(true);
    clone.style.backgroundColor = "#ffffff";

    const ensurePrimaryBg = () => {
      const header = clone.querySelector(".card-header-bg");
      if (header) {
        header.style.backgroundColor =
          getComputedStyle(cardRef.current.querySelector(".card-header-bg"))
            .backgroundColor || "#2563EB";
        header.style.setProperty("print-color-adjust", "exact");
        header.style.setProperty("-webkit-print-color-adjust", "exact");
        header.style.setProperty("color-adjust", "exact");
      }
    };

    cloneContainer.appendChild(clone);
    document.body.appendChild(cloneContainer);

    ensurePrimaryBg();

    const cleanup = () => {
      if (cloneContainer.parentNode) {
        cloneContainer.parentNode.removeChild(cloneContainer);
      }
    };

    try {
      const imgNodes = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        imgNodes.map(async (imgEl) => {
          const src = imgEl.getAttribute("src");
          if (!src) return;
          if (src.startsWith("data:")) return;

          if (
            imgEl.dataset.profilePhoto === "true" &&
            user.profilePhotoDataUri
          ) {
            await waitForImage(imgEl, user.profilePhotoDataUri);
            return;
          }

          if (imgEl.dataset.qrCode === "true") {
            await waitForImage(imgEl);
            return;
          }

          try {
            const parsed = new URL(src, window.location.href);
            const sameOrigin = parsed.origin === window.location.origin;
            if (!sameOrigin) {
              const dataUrl = await fetchAsDataUrl(src);
              if (dataUrl) {
                await waitForImage(imgEl, dataUrl);
                return;
              }
              await waitForImage(imgEl, initialsAvatar);
              return;
            }
            const dataUrl = await fetchAsDataUrl(src);
            if (dataUrl) {
              await waitForImage(imgEl, dataUrl);
            }
          } catch (_) {
            const dataUrl = await fetchAsDataUrl(src);
            if (dataUrl) {
              await waitForImage(imgEl, dataUrl);
            } else {
              await waitForImage(imgEl, initialsAvatar);
            }
          }
        })
      );

      let dataUrl;
      try {
        const { toPng } = await import("html-to-image");
        dataUrl = await toPng(clone, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          skipFonts: true,
          filter: (node) => {
            if (!node) return true;
            if (
              node.classList &&
              (node.classList.contains("no-export") ||
                node.classList.contains("no-print"))
            ) {
              return false;
            }
            return true;
          },
        });
      } catch (err) {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(clone, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        dataUrl = canvas.toDataURL("image/png");
      }

      const link = document.createElement("a");
      link.download = `${(displayName || "profile_card").replace(
        /\s+/g,
        "_"
      )}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Download failed:", e);
      alert('Unable to download card image. Try using "Save as PDF" instead.');
    } finally {
      cleanup();
    }
  };

  const handlePrintCard = () => {
    if (!cardRef.current) return;
    const style = document.createElement("style");
    style.setAttribute("id", "print-card-style");
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #public-card-print, #public-card-print * {
          visibility: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        #public-card-print {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          margin: 0 auto;
        }
        #public-card-print .bg-primary-600 {
          background-color: #2563eb !important;
          color: #ffffff !important;
        }
        #public-card-print .no-print { display: none !important; visibility: hidden !important; }
      }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById("print-card-style");
      if (el) el.remove();
    }, 100);
  };

  const handleSaveContact = () => {
    try {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${displayName}`,
        user.designation ? `TITLE:${user.designation}` : "",
        user.email ? `EMAIL;TYPE=INTERNET:${user.email}` : "",
        user.phone ? `TEL;TYPE=CELL:${user.phone}` : "",
        user.address
          ? `ADR;TYPE=HOME:;;${user.address.replace(/,/g, ";")}`
          : "",
        user.companyName ? `ORG:${user.companyName}` : "",
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
      const blob = new Blob([lines], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(displayName || "contact").replace(/\s+/g, "_")}.vcf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${displayName}'s Digital Business Card`,
        text: `Check out ${displayName}'s profile on QR Folio!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return "";

    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtube.com")
        ? url.split("v=")[1]?.split("&")[0]
        : url.split("youtu.be/")[1]?.split("?")[0];

      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return url;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 animate-gradient bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_rgba(99,102,241,0.2)_35%,_rgba(15,118,110,0.15)_65%,_rgba(15,23,42,0.9))]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1600&q=80')] opacity-20 mix-blend-overlay" />
      <div className="pointer-events-none absolute -top-32 -left-40 w-80 h-80 bg-cyan-500/30 blur-3xl rounded-full animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/25 blur-3xl rounded-full animate-pulse-slow" />

      <div className="relative z-10 flex min-h-screen flex-col overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative max-w-2xl mx-auto p-4 sm:p-6 lg:p-8"
        >
          <div className="absolute inset-0 -z-10 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-[0_25px_70px_rgba(15,23,42,0.35)]" />
          <div className="absolute inset-x-12 inset-y-8 -z-20 rounded-full bg-gradient-to-r from-cyan-400/30 via-blue-500/10 to-indigo-400/30 blur-3xl" />

          <div
            id="public-card-print"
            ref={cardRef}
            className="relative bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 max-w-3xl mx-auto"
          >
            <div className="bg-primary-600 h-16 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xl whitespace-nowrap">
                <QrCode className="w-6 h-6" />
                <span className="whitespace-nowrap">QR Folio</span>
              </div>
              <div className="text-xs text-white">QR Folio ID Card</div>
            </div>

            <div className="p-6 grid grid-cols-12 gap-4">
              <div className="col-span-12 sm:col-span-3 flex items-start justify-center sm:justify-start mb-2 sm:mb-0">
                <img
                  src={user.profilePhotoDataUri || avatar}
                  alt={displayName}
                  className="w-28 h-28 rounded-md object-cover border shadow-sm"
                  data-profile-photo="true"
                />
              </div>

              <div className="col-span-12 sm:col-span-6 text-center sm:text-left min-w-0">
                <div className="text-2xl font-bold text-gray-900 break-words">
                  {displayName}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {user.designation || "—"}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-center sm:justify-start">
                    <span className="w-28 text-gray-500">ID No :</span>
                    <span className="text-gray-900">{idNo || "—"}</span>
                  </div>
                  <div className="flex justify-center sm:justify-start">
                    <span className="w-28 text-gray-500">Issue Date :</span>
                    <span className="text-gray-900">{issueDate}</span>
                  </div>
                  <div className="flex justify-center sm:justify-start">
                    <span className="w-28 text-gray-500">Expire Date :</span>
                    <span className="text-gray-900">{expireDate}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-12 sm:col-span-3 flex items-start justify-center sm:justify-end">
                <div className="border rounded p-3">
                  <QRCodeGenerator value={profileUrl} size={100} level="M" />
                </div>
              </div>

              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div className="flex items-start gap-2 text-sm text-gray-700 break-words text-left">
                  <Mail className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="break-all">{user.email || "—"}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700 break-words text-left">
                  <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{address || "—"}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700 break-words text-left">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="break-all">{user.phone || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 flex-wrap justify-center no-export no-print">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveContact}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded"
            >
              <Download className="w-4 h-4" />
              <span>Save Contact</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-800 rounded"
            >
              <span>Share</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadCard}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-800 rounded"
              title="Download card as PNG"
            >
              <span>Download Card</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrintCard}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-800 rounded"
              title="Save as PDF (Print)"
            >
              <Printer className="w-4 h-4" />
              <span>Save as PDF</span>
            </motion.button>
          </div>

          <footer className="text-center mt-8">
            <button
              type="button"
              onClick={handlePoweredByClick}
              className="inline-flex items-center space-x-2 text-black hover:text-primary-600 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              <span className="font-semibold">Powered by QR Folio</span>
            </button>
          </footer>
        </motion.div>

        {(imageItems.length > 0 || videoItems.length > 0) && (
          <section className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              {imageItems.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Photos</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {imageItems.map((item) => (
                      <div
                        key={item._id || item.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(item)}
                          className="block w-full"
                        >
                          <img
                            src={item.url}
                            alt={item.title || "Gallery image"}
                            className="w-full h-48 object-cover cursor-zoom-in"
                          />
                        </button>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900">
                            {item.title || "Image"}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {videoItems.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Video Links</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {videoItems.map((item) => (
                      <div
                        key={item._id || item.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                      >
                        <div className="relative w-full h-48 bg-black flex items-center justify-center overflow-hidden">
                          {renderVideoEmbed(item.url) || (
                            <div className="text-center px-6 text-white">
                              <p className="font-semibold truncate">
                                {item.title || "Video"}
                              </p>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-200 underline mt-2 block truncate"
                              >
                                Watch video
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900">
                            {item.title || "Video"}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative max-w-4xl w-full"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close image preview"
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-4 -right-4 rounded-full bg-white text-gray-700 shadow-lg p-2 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title || "Gallery image"}
                className="w-full max-h-[80vh] object-contain rounded-2xl bg-black"
              />
              {(selectedPhoto.title || selectedPhoto.description) && (
                <div className="mt-4 text-center text-white">
                  {selectedPhoto.title && (
                    <h3 className="text-lg font-semibold">
                      {selectedPhoto.title}
                    </h3>
                  )}
                  {selectedPhoto.description && (
                    <p className="text-sm text-gray-200 mt-1">
                      {selectedPhoto.description}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicProfilePage;
