import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { toPng } from "html-to-image";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Download, QrCode, Printer } from "lucide-react";
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

  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    if (hasFetchedProfile.current) {
      return;
    }
    hasFetchedProfile.current = true;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/public/${id}`);
        const data = res.data;
        if (!data?.success || !data?.user) {
          throw new Error(data?.message || "Failed to load profile");
        }
        setUser(data.user);
      } catch (e) {
        setError(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  const handlePoweredByClick = useCallback(() => {
    if (authLoading) return;

    if (
      authUser?.isVerified &&
      (authUser?.isPaid || authUser?.hasCompletedSetup)
    ) {
      navigate("/dashboard", { replace: false });
      return;
    }

    if (
      authUser?.isVerified &&
      !authUser?.isPaid &&
      !authUser?.hasCompletedSetup
    ) {
      navigate("/payment", { replace: false });
      return;
    }

    navigate("/", { replace: false });
  }, [authLoading, authUser, navigate]);

  const initialsAvatar = useMemo(() => {
    const baseName = user?.name || "User";
    const initials = baseName
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>\n  <rect width='100%' height='100%' fill='%23e5e7eb'/>\n  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='72' fill='%236b7280' font-family='Arial, sans-serif'>${initials}</text>\n</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [user?.name]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex itemscenter justify-center bg-gray-50">
        <div className="text-gray-600">{error || "Profile not found"}</div>
      </div>
    );
  }

  const avatar = (() => {
    const src = user.profilePhoto || user.photo || user.avatar;
    if (src) return src;
    return initialsAvatar;
  })();
  const displayName = user.name || "—";
  const displayEmail = user.email || user.companyEmail || "—";
  const address =
    user.address ||
    [user.city, user.state, user.zipcode].filter(Boolean).join(", ");
  const profileUrl = window.location.href;
  const idNo = (user._id || user.id || "")
    .toString()
    .slice(-6)
    .padStart(6, "0");
  const issue = user.createdAt ? new Date(user.createdAt) : new Date();
  const issueDate = `${String(issue.getDate()).padStart(2, "0")}-${String(
    issue.getMonth() + 1
  ).padStart(2, "0")}-${issue.getFullYear()}`;
  const expBase = new Date(issue);
  expBase.setFullYear(expBase.getFullYear() + 1);
  const expireDate = `${String(expBase.getDate()).padStart(2, "0")}-${String(
    expBase.getMonth() + 1
  ).padStart(2, "0")}-${expBase.getFullYear()}`;

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
    cloneContainer.appendChild(clone);
    document.body.appendChild(cloneContainer);

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

          try {
            const parsed = new URL(src, window.location.href);
            const sameOrigin = parsed.origin === window.location.origin;
            if (!sameOrigin) {
              const dataUrl = await fetchAsDataUrl(src);
              if (dataUrl) {
                imgEl.setAttribute("src", dataUrl);
                return;
              }
              imgEl.setAttribute("src", initialsAvatar);
              return;
            }
            const dataUrl = await fetchAsDataUrl(src);
            if (dataUrl) {
              imgEl.setAttribute("src", dataUrl);
            }
          } catch (_) {
            const dataUrl = await fetchAsDataUrl(src);
            if (dataUrl) {
              imgEl.setAttribute("src", dataUrl);
            } else {
              imgEl.setAttribute("src", initialsAvatar);
            }
          }
        })
      );

      let dataUrl;
      try {
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
        #public-card-print, #public-card-print * { visibility: visible !important; }
        #public-card-print { position: absolute; left: 0; top: 0; right: 0; margin: 0 auto; }
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 animate-gradient bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_rgba(99,102,241,0.2)_35%,_rgba(15,118,110,0.15)_65%,_rgba(15,23,42,0.9))]" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1600&q=80')] opacity-20 mix-blend-overlay" />
      <div className="absolute -top-32 -left-40 w-80 h-80 bg-cyan-500/30 blur-3xl rounded-full animate-pulse-slow" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/25 blur-3xl rounded-full animate-pulse-slow" />

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
            <div className="flex items-center gap-2 text-white font-bold text-xl">
              <QrCode className="w-6 h-6" />
              <span>QR folio</span>
            </div>
            <div className="text-xs text-white">QR Folio ID Card</div>
          </div>

          <div className="p-6 grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-3 flex items-start justify-center sm:justify-start mb-2 sm:mb-0">
              <img
                src={avatar}
                alt={displayName}
                className="w-28 h-28 rounded-md object-cover border shadow-sm"
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

        {/* Footer */}
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
    </div>
  );
};

export default PublicProfilePage;
