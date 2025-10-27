import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// import Dashboard from "../components/Dashboard";
import {
  Mail,
  Phone,
  MapPin,
  QrCode,
  X,
  Building2,
  Briefcase,
  Globe,
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
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isGalleryTransitionEnabled, setIsGalleryTransitionEnabled] =
    useState(true);
  const [visibleGalleryCount, setVisibleGalleryCount] = useState(3);

  const featuredGallery = useMemo(() => [...imageItems], [imageItems]);
  const effectiveVisibleCount =
    featuredGallery.length > 0
      ? Math.min(featuredGallery.length, visibleGalleryCount)
      : 1;
  const extendedGallery = useMemo(() => {
    if (!featuredGallery.length) return [];
    const loopCount = Math.min(featuredGallery.length, visibleGalleryCount);
    return [...featuredGallery, ...featuredGallery.slice(0, loopCount)];
  }, [featuredGallery, visibleGalleryCount]);

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

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleGalleryCount(1);
      } else if (width < 1024) {
        setVisibleGalleryCount(2);
      } else {
        setVisibleGalleryCount(3);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  useEffect(() => {
    if (!featuredGallery.length) {
      setActiveGalleryIndex(0);
      return;
    }

    if (featuredGallery.length <= visibleGalleryCount) {
      setActiveGalleryIndex(0);
      return;
    }

    const maxIndex = featuredGallery.length - visibleGalleryCount;
    setActiveGalleryIndex((prev) => Math.min(prev, maxIndex));
  }, [featuredGallery.length, visibleGalleryCount]);

  useEffect(() => {
    if (selectedPhoto || featuredGallery.length <= visibleGalleryCount) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveGalleryIndex((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [featuredGallery.length, selectedPhoto, visibleGalleryCount]);

  useEffect(() => {
    if (featuredGallery.length <= visibleGalleryCount) {
      setIsGalleryTransitionEnabled(true);
      return;
    }

    if (activeGalleryIndex === featuredGallery.length) {
      const timeout = window.setTimeout(() => {
        setIsGalleryTransitionEnabled(false);
        setActiveGalleryIndex(0);
      }, 700);
      return () => window.clearTimeout(timeout);
    }

    setIsGalleryTransitionEnabled(true);
  }, [activeGalleryIndex, featuredGallery.length, visibleGalleryCount]);

  useEffect(() => {
    if (!isGalleryTransitionEnabled) {
      const raf = window.requestAnimationFrame(() => {
        setIsGalleryTransitionEnabled(true);
      });
      return () => window.cancelAnimationFrame(raf);
    }
    return undefined;
  }, [isGalleryTransitionEnabled]);

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

  const normalizeLink = useCallback((value) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
    if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }, []);

  const socialLinks = useMemo(() => {
    const links = [];
    const addLink = (key, raw, meta) => {
      const href = normalizeLink(raw);
      if (href) {
        links.push({ key, href, ...meta });
      }
    };

    addLink("facebook", user?.facebook, {
      label: "Facebook",
      bg: "bg-blue-100",
      fg: "text-blue-600",
    });
    addLink("instagram", user?.instagram, {
      label: "Instagram",
      bg: "bg-pink-100",
      fg: "text-pink-600",
    });
    addLink("twitter", user?.twitter, {
      label: "X (Twitter)",
      bg: "bg-slate-100",
      fg: "text-slate-900",
    });
    addLink("whatsapp", user?.whatsapp, {
      label: "WhatsApp",
      bg: "bg-green-100",
      fg: "text-green-700",
    });
    addLink("linkedin", user?.linkedin, {
      label: "LinkedIn",
      bg: "bg-blue-100",
      fg: "text-blue-700",
    });
    addLink("github", user?.github, {
      label: "GitHub",
      bg: "bg-gray-100",
      fg: "text-gray-700",
    });
    addLink("website", user?.website || user?.companyWebsite, {
      label: "Website",
      bg: "bg-amber-100",
      fg: "text-amber-700",
    });

    return links;
  }, [
    normalizeLink,
    user?.facebook,
    user?.instagram,
    user?.twitter,
    user?.whatsapp,
    user?.linkedin,
    user?.github,
    user?.website,
    user?.companyWebsite,
  ]);

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
  const displayEmail = user.email || "—";
  const address =
    [user.address, user.city, user.state, user.zipcode, user.country]
      .filter(Boolean)
      .join(", ") || "—";
  const profileUrl = window.location.href;
  const idNo = (user.id || user._id || "")
    .toString()
    .slice(-6)
    .padStart(6, "0");
  const dateOfBirth = user.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString("en-GB")
    : "—";

  const companyName = user.companyName || "—";
  const companyEmail = user.companyEmail || "—";
  const companyPhone = user.companyPhone || "—";
  const companyReferralCode = user.companyReferralCode || "—";
  const companyExperience = user.companyExperience || "—";
  const companyDescription = user.companyDescription?.trim() || "—";
  const companyAddress = user.companyAddress?.trim() || "—";
  const companyWebsiteRaw = user.companyWebsite?.trim() || "";
  const companyWebsiteUrl = normalizeLink(companyWebsiteRaw);
  const userSummary = user.description?.trim() || "";
  const professionalSummary =
    userSummary || (companyDescription !== "—" ? companyDescription : "");

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
      case "website":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 9h-2.18a15.6 15.6 0 00-1.03-4.14A8.03 8.03 0 0118.93 11zm-4.22 0h-4.42A13.7 13.7 0 0112 4.06 13.7 13.7 0 0114.71 11zm-6.42 2h4.42A13.7 13.7 0 0112 19.94 13.7 13.7 0 018.29 13zm6.42 0h2.18a8.03 8.03 0 01-3.21 4.14A15.6 15.6 0 0014.71 13zm-8.9-2H4.07a8.03 8.03 0 013.21-4.14A15.6 15.6 0 006.1 11zm0 2h2.18a15.6 15.6 0 001.03 4.14A8.03 8.03 0 016.1 13zM19.93 13h-2.18a15.6 15.6 0 01-1.03 4.14A8.03 8.03 0 0019.93 13z" />
          </svg>
        );
      default:
        return null;
    }
  };

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

  const skills = Array.isArray(user.skills)
    ? user.skills.map((skill) => `${skill}`.trim()).filter(Boolean)
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#B2C8FF]">
      <div className="pointer-events-none absolute bg-[#B2C8FF] inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#eef2ff_45%,_#f8fafc_100%)]" />
        <div className="absolute inset-0 bg-[url('/assets/publicprofilebackground.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full"
        >
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-14 px-6 pb-20 pt-14 lg:flex-row lg:gap-20 xl:px-14">
            <aside className="w-full max-w-[360px] space-y-6">
              <div id="public-card-print" ref={cardRef} className="space-y-6">
                <div className="rounded-[32px] bg-white p-8 shadow-[0_32px_60px_-20px_rgba(79,70,229,0.4)]">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-40 w-40 overflow-hidden  rounded-full border-4 border-[#1532CB] shadow-[0_18px_36px_rgba(79,70,229,0.18)]">
                      <img
                        src={user.profilePhotoDataUri || avatar}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        data-profile-photo="true"
                      />
                    </div>
                    <div className="mt-6 space-y-2">
                      <h1 className="text-2xl text-[#1532CB] font-semibold text-slate-900">
                        {displayName}
                      </h1>
                      <div className="text-sm font-medium text-slate-500">
                        {user.designation || "—"} at{" "}
                        <span className="font-semibold text-[#1532CB]">
                          {companyName !== "—" ? companyName : "Company"}
                        </span>
                      </div>
                    </div>
                    {socialLinks.length > 0 && (
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        {socialLinks.map((link) => (
                          <a
                            key={link.key}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={link.label}
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${link.bg} ${link.fg} text-[15px] shadow transition hover:-translate-y-1 hover:shadow-md`}
                          >
                            <BrandIcon name={link.key} className="h-4 w-4" />
                            <span className="sr-only">{link.label}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="mt-6 w-full space-y-3 text-left text-sm text-slate-600">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                          <Mail className="h-4 w-4" />
                        </span>
                        <span className="break-all">{displayEmail}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                          <Phone className="h-4 w-4" />
                        </span>
                        <span className="break-all">{user.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <span className="break-words">{address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="relative overflow-hidden rounded-[32px] p-20 text-white"
                  style={{
                    backgroundImage: "url(/assets/card.png)",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.35),_transparent_70%)]" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="rounded-2xl bg-white/92 p-3 shadow-[0_32px_60px_-20px_rgba(79,70,229,0.46)]">
                      <QRCodeGenerator
                        value={profileUrl}
                        size={175}
                        level="M"
                      />
                    </div>
                    <div className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                      Powered by
                    </div>
                    <button
                      type="button"
                      onClick={handlePoweredByClick}
                      className="mt-2 inline-flex items-center gap-2 text-white/90 transition hover:text-white"
                    >
                      <QrCode className="h-4 w-4" />
                      QR Folio
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="no-print inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#4338ca] to-[#2563eb] px-8 py-3 text-sm font-semibold text-white shadow-lg"
                >
                  Connect Now &gt;
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrintCard}
                  className="no-print inline-flex w-full items-center justify-center rounded-full border border-indigo-200 bg-white px-8 py-3 text-sm font-semibold text-indigo-600 shadow"
                >
                  Download Card PDF
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadCard}
                  className="no-print inline-flex w-full items-center justify-center rounded-full border border-indigo-200 bg-white px-8 py-3 text-sm font-semibold text-indigo-600 shadow"
                >
                  Download Card Image
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveContact}
                  className="no-print inline-flex w-full items-center justify-center rounded-full border border-indigo-200 bg-white px-8 py-3 text-sm font-semibold text-indigo-600 shadow"
                >
                  Save Contact
                </motion.button>
              </div>
              <div className="text-center text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={handlePoweredByClick}
                  className="mt-2 inline-flex items-center gap-2 text-[#1E1E1E] transition hover:text-[#4338ca]"
                >
                  <QrCode className="h-4 w-4" />
                  Powered by QR Folio
                </button>
              </div>
            </aside>

            <main className="flex-1 space-y-1">
              <section className="rounded-3xl p-10   backdrop-blur">
                <div className="space-y-8">
                  <div className="max-w-3xl space-y-4">
                    <h2 className="text-2xl text-[#1532CB] font-semibold">
                      About Me
                    </h2>
                    <p className="text-base leading-relaxed text-slate-600">
                      {professionalSummary || "—"}
                    </p>
                  </div>
                  {extendedGallery.length > 0 && (
                    <div className="relative overflow-hidden rounded-3xl border p-3 sm:p-4">
                      <div
                        className="flex"
                        style={{
                          transform: `translateX(-${
                            activeGalleryIndex * (100 / effectiveVisibleCount)
                          }%)`,
                          transition: isGalleryTransitionEnabled
                            ? "transform 0.7s ease-out"
                            : "none",
                        }}
                      >
                        {extendedGallery.map((item, index) => {
                          const basis = 100 / effectiveVisibleCount;

                          return (
                            <button
                              key={`${item._id || item.id || index}-${index}`}
                              type="button"
                              onClick={() => setSelectedPhoto(item)}
                              className="flex-shrink-0 px-1 sm:px-2"
                              style={{
                                flexBasis: `${basis}%`,
                                maxWidth: `${basis}%`,
                              }}
                            >
                              <div className="relative h-[200px] sm:h-[240px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-lg">
                                <img
                                  src={item.url}
                                  alt={item.title || "Gallery image"}
                                  className="h-full w-full object-cover"
                                />
                                {item.title && (
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-3 pt-8 text-left">
                                    <p className="text-sm font-medium text-white">
                                      {item.title}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="grid gap-10 rounded-3xl pt-12 p-10 backdrop-blur lg:grid-cols-[minmax(0,380px),1fr]">
                {/* Professional Details */}
                <div className="space-y-5">
                  <h2 className="text-2xl font-semibold text-[#1532CB]">
                    Professional Details
                  </h2>
                  <div className="grid min-h-0 grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Name Card */}
                    <div className="flex flex-col  h-[200px] shadow-[rgba(0,0,0,0.46)] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm hover:shadow-lg">
                      <div className="flex h-12 w-12 m-5 items-center justify-center rounded-2xl bg-indigo-100 text-[#1E1E1E] shadow-inner">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#1E1E1E]">
                          Company Name
                        </p>
                        <p className="mt-2 break-words text-base font-semibold text-indigo-600">
                          {companyName}
                        </p>
                      </div>
                    </div>

                    {/* Designation Card */}
                    <div className="flex h-[200px] flex-col items-center gap-3 shadow-[rgba(0,0,0,0.46)] rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm hover:shadow-lg">
                      <div className="flex h-12 w-12 m-5 items-center justify-center rounded-2xl bg-blue-100 text-[#1E1E1E] shadow-inner">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#1E1E1E]">
                          Designation
                        </p>
                        <p className="mt-2 break-words text-base font-semibold text-indigo-600">
                          {user.designation || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Description */}
                <div className="space-y-5">
                  <div className="space-y-4">
                    <h2 className="text-2xl text-[#1532CB] font-semibold">
                      Company Description
                    </h2>
                    <p className="text-base leading-relaxed text-slate-600 break-words">
                      {companyDescription !== "—"
                        ? companyDescription
                        : "We create visually stunning and engaging content."}
                    </p>
                  </div>

                  {/* Experience & Referral */}
                  <div className="flex flex-nowrap">
                    <div className="inline-flex items-center rounded-l-full bg-gradient-to-r from-[#4338CA] to-[#2563EB] px-4 py-2 text-sm font-medium text-white">
                      <span>Experience:</span>
                      <span className="ml-1 font-semibold">
                        {companyExperience || "—"}
                      </span>
                    </div>
                    <div className="inline-flex items-center rounded-r-full bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 -ml-1">
                      <span>Referral Code:</span>
                      <span className="ml-1 font-semibold text-indigo-600">
                        {companyReferralCode || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {videoItems.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#1532CB] mb-4">
                    Work Videos
                  </h2>
                  {/* <div className="text-sm text-gray-500 mb-3">
                    Explore the latest videos shared on this profile.
                  </div> */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                      {videoItems.map((item) => (
                        <motion.div
                          key={item._id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-[#e5ecff] hover:text-white hover:shadow-[rgba(0,0,0,0.46)] rounded-2xl shadow-md border border-gray-100 overflow-hidden group"
                        >
                          <div className="relative w-full h-60 bg-black flex items-center justify-center overflow-hidden">
                            {renderVideoEmbed(item.url) || (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center px-6 text-[#1532CB]"
                              >
                                <Link2 className="w-10 h-10 mx-auto mb-3" />
                                <p className="font-semibold truncate">
                                  {item.title}
                                </p>
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary-200 underline mt-2 block truncate"
                                >
                                  Open video
                                </a>
                              </motion.div>
                            )}
                          </div>
                          <div className="p-2 mt-0.5 bg-[#e5ecff] flex items-start gap-4">
                            <div className="flex min-w-0">
                              <h3 className="font-semibold text-sm text-black truncate">
                                {item.title}
                                {item.description && (
                                  <p className="text-xs text-black mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </h3>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </main>
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              className="fixed inset-0 z-50  flex items-center justify-center bg-black/80 p-4"
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
                className="relative w-full max-w-4xl "
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Close image preview"
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute -top-4 -right-4 rounded-full bg-white p-2 text-gray-700 shadow-lg hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title || "Gallery image"}
                  className="max-h-[80vh] w-full rounded-2xl bg-black object-contain"
                />
                {(selectedPhoto.title || selectedPhoto.description) && (
                  <div className="mt-4 text-center text-white">
                    {selectedPhoto.title && (
                      <h3 className="text-lg font-semibold">
                        {selectedPhoto.title}
                      </h3>
                    )}
                    {selectedPhoto.description && (
                      <p className="mt-1 text-sm text-white">
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
    </div>
  );
};

export default PublicProfilePage;
