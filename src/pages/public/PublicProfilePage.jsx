import React, {
  useEffect,
  useState,
  useRef, // ✅ MUST
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import clsx from "clsx";
import { useParams, useNavigate } from "react-router-dom";
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
  Link2,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import PageSEO from "../../components/seo/PageSEO";
import { buildAbsoluteUrl } from "../../utils/seoConfig";
import DownloadProfileCard from "../../components/profile/DownloadProfileCard";

const QRCodeGenerator = lazy(() => import("../../components/qr/QRCodeGenerator"));

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const downloadRef = useRef(null);
  const { user: authUser, loading: authLoading } = useAuth();
  const [galleryItems, setGalleryItems] = useState([]);
  const [imageItems, setImageItems] = useState([]);
  const [videoItems, setVideoItems] = useState([]);
  const [documentItems, setDocumentItems] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const qrCodeRef = useRef(null);
  const [copyToastMessage, setCopyToastMessage] = useState("");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const copyToastTimeoutRef = useRef(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [docPreviewCount, setDocPreviewCount] = useState(0);
  const [videoPreviewCount, setVideoPreviewCount] = useState(0);

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

      setUser(profileData);
      setError("");

      // Fetch profile photo if not available
      if (!profileData.profilePhotoDataUri) {
        (async () => {
          try {
            const photoRes = await api.get(`/user/public/${id}/photo-data`);
            if (photoRes.data?.success && photoRes.data?.dataUri) {
              setUser((prev) =>
                prev
                  ? { ...prev, profilePhotoDataUri: photoRes.data.dataUri }
                  : prev
              );
            }
          } catch (photoErr) {
            console.warn(
              "Failed to fetch profile photo data URI:",
              photoErr.message
            );
          }
        })();
      }

      // Fetch gallery items
      (async () => {
        try {
          const galleryRes = await api.get(`/gallery/public/${id}`);
          if (galleryRes.data?.success) {
            const items = galleryRes.data.items || [];
            setGalleryItems(items);
            setImageItems(items.filter((item) => item?.type === "image"));
            setVideoItems(items.filter((item) => item?.type === "video"));
            setDocumentItems(items.filter((item) => item?.type === "document"));
          }
        } catch (galleryErr) {
          console.warn("Failed to fetch gallery items:", galleryErr.message);
        }
      })();
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
    return () => {
      if (copyToastTimeoutRef.current) {
        clearTimeout(copyToastTimeoutRef.current);
      }
    };
  }, []);

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

  const handleBackClick = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/", { replace: false });
    }
  }, [navigate]);

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
      label: "Personal website",
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
              className={clsx('w-full', 'h-full')}
              loading="lazy"
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
              className={clsx('w-full', 'h-full')}
              loading="lazy"
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

useEffect(() => {
  const w = window.innerWidth;
  const base = w >= 1024 ? 4 : 4;

  setPreviewCount(base);
  setDocPreviewCount(base);
  setVideoPreviewCount(base);

}, [imageItems.length, documentItems.length, videoItems.length]);


  // Handle loading state
  if (loading) {
    return (
      <div className={clsx('min-h-screen', 'bg-slate-950', 'px-4', 'py-8', 'flex', 'justify-center')}>
        <div className={clsx('w-full', 'max-w-[1440px]', 'space-y-6', 'animate-pulse')}>
          <div className={clsx('h-8', 'w-28', 'rounded-full', 'bg-slate-800')} />

          <div className={clsx('grid', 'gap-6', 'lg:grid-cols-[minmax(0,380px),1fr]')}>
            {/* Left column skeleton: profile card + QR card */}
            <div className="space-y-4">
              <div className={clsx('rounded-3xl', 'bg-slate-900/90', 'p-6', 'space-y-4')}>
                <div className={clsx('mx-auto', 'h-28', 'w-28', 'rounded-full', 'bg-slate-800')} />
                <div className={clsx('mx-auto', 'h-4', 'w-32', 'rounded', 'bg-slate-800')} />
                <div className={clsx('mx-auto', 'h-3', 'w-40', 'rounded', 'bg-slate-800')} />
                <div className={clsx('space-y-2', 'pt-2')}>
                  <div className={clsx('h-3', 'w-full', 'rounded', 'bg-slate-800')} />
                  <div className={clsx('h-3', 'w-5/6', 'rounded', 'bg-slate-800')} />
                  <div className={clsx('h-3', 'w-4/6', 'rounded', 'bg-slate-800')} />
                </div>
              </div>

              <div className={clsx('rounded-3xl', 'bg-slate-900/90', 'p-6', 'space-y-4')}>
                <div className={clsx('h-40', 'w-full', 'rounded-2xl', 'bg-slate-800')} />
                <div className={clsx('h-3', 'w-24', 'rounded', 'bg-slate-800', 'mx-auto')} />
              </div>
            </div>

            {/* Right column skeleton: about + sections */}
            <div className="space-y-4">
              <div className={clsx('rounded-3xl', 'bg-slate-900/90', 'p-6', 'space-y-3')}>
                <div className={clsx('h-4', 'w-32', 'rounded', 'bg-slate-800')} />
                <div className={clsx('space-y-2', 'pt-1')}>
                  <div className={clsx('h-3', 'w-full', 'rounded', 'bg-slate-800')} />
                  <div className={clsx('h-3', 'w-11/12', 'rounded', 'bg-slate-800')} />
                  <div className={clsx('h-3', 'w-10/12', 'rounded', 'bg-slate-800')} />
                </div>
              </div>

              <div className={clsx('rounded-3xl', 'bg-slate-900/90', 'p-6', 'space-y-3')}>
                <div className={clsx('h-4', 'w-40', 'rounded', 'bg-slate-800')} />
                <div className={clsx('grid', 'gap-3', 'sm:grid-cols-2')}>
                  <div className={clsx('h-20', 'rounded-2xl', 'bg-slate-800')} />
                  <div className={clsx('h-20', 'rounded-2xl', 'bg-slate-800')} />
                </div>
                <div className={clsx('h-3', 'w-32', 'rounded', 'bg-slate-800')} />
              </div>

              <div className={clsx('rounded-3xl', 'bg-slate-900/90', 'p-6', 'space-y-3')}>
                <div className={clsx('h-4', 'w-40', 'rounded', 'bg-slate-800')} />
                <div className={clsx('grid', 'gap-3', 'sm:grid-cols-2')}>
                  <div className={clsx('h-16', 'rounded-2xl', 'bg-slate-800')} />
                  <div className={clsx('h-16', 'rounded-2xl', 'bg-slate-800')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (!loading && (error || !user)) {
    return (
      <div className={clsx('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-50', 'p-4')}>
        <div className="text-center">
          <div className={clsx('text-2xl', 'font-semibold', 'text-gray-700', 'mb-2')}>
            {error || "Profile not found"}
          </div>
          <button
            onClick={() => navigate("/")}
            className={clsx('mt-4', 'px-4', 'py-2', 'bg-primary-600', 'text-white', 'rounded-lg', 'hover:bg-primary-700', 'transition-colors')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // User data
  const displayName = user?.name || "—";
  const displayEmail = user?.email || "—";
  const address =
    [user?.address, user?.city, user?.state, user?.zipcode, user?.country]
      .filter(Boolean)
      .join(", ") || "—";
  const profileUrl = window.location.href;
  const idNo = (user?.id || user?._id || "")
    .toString()
    .slice(-6)
    .padStart(6, "0");
  const dateOfBirth = user?.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString("en-GB")
    : "—";

  const companyName = user?.companyName || "—";
  // const companyEmail = user?.companyEmail || "—";
  // const companyPhone = user?.companyPhone || "—";
  const companyReferralCode = user?.companyReferralCode || "—";
  const companyExperience = user?.companyExperience || "—";
  const companyDescription = user?.companyDescription?.trim() || "—";
  // const companyAddress = user?.companyAddress?.trim() || "—";
  const companyWebsiteRaw = (
    user?.website ||
    user?.companyWebsite ||
    ""
  ).trim();
  const companyWebsiteUrl = normalizeLink(companyWebsiteRaw);
  const userSummary = user?.description?.trim() || "";
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
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 9h-2.18a15.6 15.6 0 00-1.03-4.14A8.03 8.03 0 0118.93 11zm-4.22 0h-4.42A13.7 13.7 0 0112 4.06 13.7 13.7 0 0114.71 11zm-6.42 2h4.42A13.7 13.7 0 0112 19.94 13.7 13.7 0 018.29 13zm6.42 0h2.18a8.03 8.03 0 01-3.21 4.14A15.6 15.6 0 0114.71 13zm-8.9-2H4.07a8.03 8.03 0 013.21-4.14A15.6 15.6 0 006.1 11zm0 2h2.18a15.6 15.6 0 001.03 4.14A8.03 8.03 0 016.1 13zM19.93 13h-2.18a15.6 15.6 0 01-1.03 4.14A8.03 8.03 0 0119.93 13z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Format dates
  const issueDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const expireDate = new Date(
    new Date(user?.createdAt || new Date()).setFullYear(
      new Date(user?.createdAt || new Date()).getFullYear() + 1
    )
  ).toLocaleDateString("en-GB");

  const waitForImages = async (container) => {
    const images = Array.from(container.querySelectorAll("img"));

    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            // already loaded or failed
            if (img.complete) return resolve();

            const done = () => resolve();

            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });

            // 🔥 HARD SAFETY (never block download)
            setTimeout(done, 1500);
          })
      )
    );
  };

  const generateCardPNG = async () => {
    const node = downloadRef.current;
    if (!node) throw new Error("Card not ready");

    // wait for images (safe)
    const images = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) return resolve();
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            setTimeout(done, 1500);
          })
      )
    );

    const { toPng } = await import("html-to-image");

    return await toPng(node, {
      backgroundColor: "#ffffff",
      pixelRatio: 6,
      cacheBust: true,
      skipFonts: true,
      filter: (n) => {
        if (n.tagName === "IMG") {
          return n.complete && n.naturalWidth > 0;
        }
        return true;
      },
    });
  };
  const handleDownloadCard = async () => {
    try {
      console.log("Preparing card download...");
      const pngData = await generateCardPNG();

      const link = document.createElement("a");
      link.download = `${displayName.replace(/\s+/g, "_")}_card.png`;
      link.href = pngData;
      link.click();

      console.log("PNG downloaded");
    } catch (err) {
      console.error("PNG failed", err);
      alert("Unable to download image");
    }
  };

  const handleDownloadPDF = async () => {
    if (!downloadRef.current) return;

    console.log("Preparing PDF...");

    const { toPng } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");

    const pngData = await toPng(downloadRef.current, {
      backgroundColor: "#0B1020", // same dark bg
      pixelRatio: 3,
      cacheBust: true,
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [1050, 600],
    });

    pdf.addImage(
      pngData,
      "PNG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      pdf.internal.pageSize.getHeight(),
      undefined,
      "FAST"
    );

    pdf.save(`${displayName.replace(/\s+/g, "_")}_card.pdf`);

    console.log("PDF downloaded");
  };

  const handleDownloadQrCode = () => {
    try {
      if (!qrCodeRef.current || !qrCodeRef.current.getCanvas) {
        showReferralToast("QR code not ready yet");
        return;
      }

      const canvas = qrCodeRef.current.getCanvas();
      if (!canvas) {
        showReferralToast("QR code not ready yet");
        return;
      }

      const baseSize = canvas.width; // QR canvas is square
      const scale = 2; // make QR larger in the exported image
      const qrSize = baseSize * scale;
      const padding = Math.round(baseSize * 0.4);

      const rawName = (displayName || "").toString().trim();
      const hasName = !!rawName;

      const nameAreaHeight = hasName ? Math.round(qrSize * 0.2) : 0;

      const exportWidth = qrSize + padding * 2;
      const exportHeight = qrSize + nameAreaHeight + padding * 2.5; // tighter spacing

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;

      const ctx = exportCanvas.getContext("2d");
      if (!ctx) {
        showReferralToast("Unable to prepare download");
        return;
      }

      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // Draw the user name at the top, centered horizontally
      if (hasName) {
        const fontFamily =
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        let fontSize = Math.round(qrSize * 0.18);
        ctx.fillStyle = "#000000";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = `bold ${fontSize}px ${fontFamily}`;

        const textY = padding + nameAreaHeight / 2;
        const maxWidth = exportWidth - padding * 2;

        // Shrink font if the name would overflow the allocated area
        const metrics = ctx.measureText(rawName);
        if (metrics.width > maxWidth && maxWidth > 0) {
          const ratio = maxWidth / metrics.width;
          fontSize = Math.max(12, Math.floor(fontSize * ratio));
          ctx.font = `bold ${fontSize}px ${fontFamily}`;
        }

        ctx.fillText(rawName, exportWidth / 2, textY, maxWidth);
      }

      // Draw larger QR centered below the name
      const qrX = (exportWidth - qrSize) / 2;
      const qrY = padding + nameAreaHeight + padding * 0.5;
      ctx.drawImage(canvas, qrX, qrY, qrSize, qrSize);

      const dataUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${displayName.replace(/\s+/g, "_")}_QR_Code.png`;
      link.href = dataUrl;
      link.click();

      showReferralToast("QR code downloaded");
    } catch (error) {
      console.error("Failed to download QR code", error);
      showReferralToast("Unable to download QR code");
    }
  };

  const handleSaveContact = () => {
    try {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${displayName}`,
        user?.designation ? `TITLE:${user.designation}` : "",
        user?.email ? `EMAIL;TYPE=INTERNET:${user.email}` : "",
        user?.phone ? `TEL;TYPE=CELL:${user.phone}` : "",
        user?.address
          ? `ADR;TYPE=HOME:;;${user.address.replace(/,/g, ";")}`
          : "",
        user?.companyName ? `ORG:${user.companyName}` : "",
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

  const showReferralToast = (message) => {
    setCopyToastMessage(message);
    setShowCopyToast(true);

    if (copyToastTimeoutRef.current) {
      clearTimeout(copyToastTimeoutRef.current);
    }

    copyToastTimeoutRef.current = setTimeout(() => {
      setShowCopyToast(false);
    }, 2000);
  };

  const handleCopyReferralCode = () => {
    const value = companyReferralCode;

    if (!value || value === "—" || value === "-") {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          showReferralToast("Referral code copied to clipboard");
        })
        .catch(() => {
          showReferralToast("Unable to copy referral code");
        });
    } else {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showReferralToast("Referral code copied to clipboard");
      } catch (_) {
        showReferralToast("Unable to copy referral code");
      }
    }
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

  const skills = Array.isArray(user?.skills)
    ? user.skills.map((skill) => `${skill}`.trim()).filter(Boolean)
    : [];

  const handleGalleryTouchStart = (event) => {
    if (event.touches && event.touches.length > 0) {
      touchStartXRef.current = event.touches[0].clientX;
    }
  };

  const handleGalleryTouchEnd = (event) => {
    if (touchStartXRef.current == null) return;

    const endX =
      event.changedTouches && event.changedTouches.length > 0
        ? event.changedTouches[0].clientX
        : touchStartXRef.current;

    const deltaX = endX - touchStartXRef.current;
    const threshold = 40;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        // swipe left -> next
        handleGalleryNext();
      } else {
        // swipe right -> previous
        handleGalleryPrev();
      }
    }

    touchStartXRef.current = null;
  };

  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": buildAbsoluteUrl(`/profile/${id}#person`),
    name: displayName,
    description:
      professionalSummary ||
      `${displayName}'s digital business card on QR Folio.`,
    url: buildAbsoluteUrl(`/profile/${id}`),
    image: avatar,
    sameAs: socialLinks.map((link) => link.href),
  };

  return (
    <div className={clsx('relative', 'min-h-screen', 'overflow-hidden', 'bg-slate-950')}>
      <PageSEO
        title={`${displayName}'s digital business card`}
        description={
          professionalSummary ||
          `${displayName}'s QR Folio profile with contact details, links, and media.`
        }
        canonicalPath={`/profile/${id}`}
        ogType="profile"
        structuredData={profileSchema}
      />
      <div className={clsx('pointer-events-none', 'absolute', 'inset-0')}>
        <div className={clsx('absolute', 'inset-0', 'bg-gradient-to-b', 'from-slate-950', 'via-slate-950', 'to-slate-950')} />
      </div>

      <div className={clsx('relative', 'z-10', 'flex', 'min-h-screen', 'flex-col')}>
        <div className="w-full">
          <div className={clsx('mx-auto', 'w-full', 'max-w-[1440px]', 'px-6', 'pt-8', 'xl:px-14', 'flex', 'items-center', 'justify-between', 'gap-4')}>
            <button
              type="button"
              onClick={handleBackClick}
              className={clsx('inline-flex', 'items-center', 'gap-2', 'rounded-full', 'border', 'border-indigo-500/40', 'bg-slate-900/60', 'px-4', 'py-2', 'text-sm', 'font-semibold', 'text-indigo-100', 'shadow-lg', 'shadow-indigo-900/40', 'transition-all', 'duration-300', 'hover:-translate-y-0.5', 'hover:border-indigo-300/70', 'hover:bg-slate-900/80', 'hover:text-white')}
            >
              <ArrowLeft className={clsx('h-4', 'w-4')} />
              Back
            </button>
            <div className={clsx('hidden', 'text-xs', 'font-medium', 'uppercase', 'tracking-[0.28em]', 'text-indigo-200/80', 'sm:block')}>
              Public Profile
            </div>
          </div>
          <div className={clsx('mx-auto', 'flex', 'w-full', 'max-w-[1440px]', 'flex-col', 'gap-10', 'px-6', 'pb-20', 'pt-10', 'lg:flex-row', 'lg:gap-12', 'xl:px-14')}>
            <aside className={clsx('w-full', 'max-w-[380px]', 'space-y-6', 'lg:sticky', 'lg:top-10', 'lg:self-start')}>
              <div
                id="public-card-print"
                ref={downloadRef}
                className={clsx('space-y-6', 'rounded-[32px]', 'bg-slate-900/80', 'p-[1px]', 'shadow-xl', 'shadow-slate-950/70', 'ring-1', 'ring-white/10')}
              >
                <div className={clsx('rounded-[30px]', 'bg-gradient-to-b', 'from-slate-900/80', 'via-slate-900/60', 'to-slate-900/80', 'p-8')}>
                  <div className={clsx('flex', 'flex-col', 'items-center', 'text-center')}>
                    <div className="relative">
                      <div className={clsx('absolute', '-inset-1', 'rounded-full', 'bg-gradient-to-tr', 'from-indigo-400', 'via-sky-400', 'to-cyan-300', 'opacity-60', 'blur-md')} />
                      <div className={clsx('relative', 'h-40', 'w-40', 'overflow-hidden', 'rounded-full', 'border-4', 'border-indigo-300/70', 'bg-slate-900', 'shadow-[0_22px_40px_rgba(15,23,42,0.9)]')}>
                        <img
                          src={user?.profilePhotoDataUri || avatar}
                          alt={displayName}
                          className={clsx('h-full', 'w-full', 'object-cover')}
                          data-profile-photo="true"
                          loading="eager"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = avatar; // ✅ fallback ALWAYS
                          }}
                        />
                      </div>
                    </div>
                    <div className={clsx('mt-6', 'space-y-2')}>
                      <h1 className={clsx('text-2xl', 'font-semibold', 'tracking-tight', 'text-slate-50')}>
                        {displayName}
                      </h1>
                      <div className={clsx('text-xs', 'font-medium', 'uppercase', 'tracking-[0.22em]', 'text-indigo-200/90')}>
                        {user?.designation || ""}
                      </div>
                      <div className={clsx('text-sm', 'font-medium', 'text-slate-300')}>
                        at{" "}
                        <span className={clsx('font-semibold', 'text-indigo-200')}>
                          {companyName !== "" ? companyName : "Company"}
                        </span>
                      </div>
                    </div>
                    {socialLinks.length > 0 && (
                      <>
                        <div className={clsx('mt-6', 'flex', 'flex-wrap', 'items-center', 'justify-center', 'gap-3')}>
                          {socialLinks.map((link) => (
                            <a
                              key={link.key}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={link.label}
                              className={`group flex h-9 w-9 items-center justify-center rounded-full ${link.bg} ${link.fg} text-[15px] shadow-md shadow-slate-900/70 ring-1 ring-white/20 transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:ring-indigo-200/70`}
                            >
                              <BrandIcon name={link.key} className={clsx('h-4', 'w-4')} />
                              <span className="sr-only">{link.label}</span>
                            </a>
                          ))}
                        </div>
                        {companyWebsiteUrl && (
                          <a
                            href={companyWebsiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={clsx('mt-4', 'inline-flex', 'w-full', 'items-center', 'justify-center', 'rounded-full', 'bg-indigo-500', 'px-4', 'py-2', 'text-xs', 'font-semibold', 'text-white', 'shadow-md', 'shadow-slate-950/70', 'hover:bg-indigo-400')}
                          >
                            Visit website
                          </a>
                        )}
                      </>
                    )}
                    <div className={clsx('mt-6', 'w-full', 'space-y-3', 'text-left', 'text-xs', 'text-slate-200/90')}>
                      <div className={clsx('flex', 'items-center', 'gap-3', 'rounded-2xl', 'bg-slate-900/70', 'px-3', 'py-2', 'ring-1', 'ring-white/5')}>
                        <span className={clsx('flex', 'h-8', 'w-8', 'items-center', 'justify-center', 'rounded-full', 'bg-indigo-500/15', 'text-indigo-200')}>
                          <Mail className={clsx('h-4', 'w-4')} />
                        </span>
                        <span className={clsx('break-all', 'text-sm')}>
                          {displayEmail}
                        </span>
                      </div>
                      <div className={clsx('flex', 'items-center', 'gap-3', 'rounded-2xl', 'bg-slate-900/70', 'px-3', 'py-2', 'ring-1', 'ring-white/5')}>
                        <span className={clsx('flex', 'h-8', 'w-8', 'items-center', 'justify-center', 'rounded-full', 'bg-indigo-500/15', 'text-indigo-200')}>
                          <Phone className={clsx('h-4', 'w-4')} />
                        </span>
                        <span className={clsx('break-all', 'text-sm')}>{user?.phone}</span>
                      </div>
                      <div className={clsx('flex', 'items-start', 'gap-3', 'rounded-2xl', 'bg-slate-900/70', 'px-3', 'py-2', 'ring-1', 'ring-white/5')}>
                        <span className={clsx('mt-0.5', 'flex', 'h-8', 'w-8', 'items-center', 'justify-center', 'rounded-full', 'bg-indigo-500/15', 'text-indigo-200')}>
                          <MapPin className={clsx('h-4', 'w-4')} />
                        </span>
                        <span className={clsx('break-words', 'text-sm', 'leading-snug')}>
                          {address}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={clsx('relative', 'overflow-hidden', 'rounded-[32px]', 'border', 'border-white/10', 'bg-slate-900/80', 'p-6', 'text-white', 'shadow-lg', 'shadow-slate-950/80')}>
                  <div className={clsx('pointer-events-none', 'absolute', 'inset-0', 'bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.7),_transparent_55%)]')} />
                  <div className={clsx('pointer-events-none', 'absolute', 'inset-0', 'bg-gradient-to-br', 'from-slate-900/10', 'via-indigo-900/10', 'to-slate-950/60')} />
                  <div className={clsx('relative', 'flex', 'flex-col', 'items-center', 'text-center')}>
                    <div className={clsx('rounded-3xl', 'bg-gradient-to-br', 'from-indigo-500', 'via-fuchsia-500', 'to-emerald-400', 'p-[1px]', 'shadow-[0_28px_50px_rgba(15,23,42,0.65)]')}>
                      <div className={clsx('flex', 'items-center', 'justify-center', 'rounded-[26px]', 'bg-slate-950/95', 'p-2.5')}>
                        <Suspense
                          fallback={
                            <div className={clsx('h-[150px]', 'w-[150px]', 'rounded-2xl', 'bg-slate-800/80')} />
                          }
                        >
                          <QRCodeGenerator
                            ref={qrCodeRef}
                            value={profileUrl}
                            size={60}
                            level="H"
                            color="#000000"
                            background="#FFFFFF"
                            logoSrc="/assets/QrLogo.webp"
                            logoSizeRatio={0.22}
                            className={clsx('overflow-hidden', 'rounded-2xl')}
                          />
                        </Suspense>
                      </div>
                    </div>
                    <div className={clsx('mt-6', 'text-[0.65rem]', 'font-semibold', 'uppercase', 'tracking-[0.28em]', 'text-indigo-100/90')}>
                      Powered by
                    </div>
                    <button
                      type="button"
                      onClick={handlePoweredByClick}
                      className={clsx('mt-2', 'inline-flex', 'items-center', 'gap-2', 'rounded-full', 'bg-white/5', 'px-4', 'py-1.5', 'text-xs', 'font-medium', 'text-indigo-50', 'ring-1', 'ring-white/20', 'transition-all', 'duration-200', 'hover:bg-white/10', 'hover:ring-indigo-200/70')}
                    >
                      <QrCode className={clsx('h-4', 'w-4')} />
                      QR Folio
                    </button>
                  </div>
                </div>
              </div>

              <div className={clsx('flex', 'flex-col', 'gap-3')}>
                <button
                  type="button"
                  onClick={handleShare}
                  className={clsx('no-print', 'inline-flex', 'w-full', 'items-center', 'justify-center', 'rounded-full', 'bg-gradient-to-r', 'from-indigo-400', 'via-sky-400', 'to-cyan-300', 'px-8', 'py-3', 'text-sm', 'font-semibold', 'text-slate-950', 'shadow-[0_16px_40px_rgba(56,189,248,0.45)]', 'transition-all', 'duration-300', 'hover:-translate-y-0.5', 'hover:shadow-[0_22px_48px_rgba(56,189,248,0.65)]')}
                >
                  Connect Now &gt;
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className={clsx('no-print', 'inline-flex', 'w-full', 'items-center', 'justify-center', 'rounded-full', 'border', 'border-indigo-400/40', 'bg-slate-900/80', 'px-8', 'py-3', 'text-sm', 'font-semibold', 'text-indigo-100', 'shadow-lg', 'shadow-slate-950/70', 'transition-all', 'duration-300', 'hover:-translate-y-0.5', 'hover:border-indigo-200/70', 'hover:bg-slate-900/90', 'hover:text-white')}
                >
                  Download Card PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  className={clsx('no-print', 'inline-flex', 'w-full', 'items-center', 'justify-center', 'rounded-full', 'border', 'border-indigo-400/40', 'bg-slate-900/80', 'px-8', 'py-3', 'text-sm', 'font-semibold', 'text-indigo-100', 'shadow-lg', 'shadow-slate-950/70', 'transition-all', 'duration-300', 'hover:-translate-y-0.5', 'hover:border-indigo-200/70', 'hover:bg-slate-900/90', 'hover:text-white')}
                >
                  Download Card Image
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQrCode}
                  className={clsx('no-print', 'inline-flex', 'w-full', 'items-center', 'justify-center', 'rounded-full', 'border', 'border-indigo-400/40', 'bg-slate-900/80', 'px-8', 'py-3', 'text-sm', 'font-semibold', 'text-indigo-100', 'shadow-lg', 'shadow-slate-950/70', 'transition-all', 'duration-300', 'hover:-translate-y-0.5', 'hover:border-indigo-200/70', 'hover:bg-slate-900/90', 'hover:text-white')}
                >
                  Download QR Code
                </button>
                <button
                  type="button"
                  onClick={handleSaveContact}
                  className={clsx('no-print', 'inline-flex', 'w-full', 'items-center', 'justify-center', 'rounded-full', 'border', 'border-indigo-400/40', 'bg-slate-900/80', 'px-8', 'py-3', 'text-sm', 'font-semibold', 'text-indigo-100', 'shadow-lg', 'shadow-slate-950/70', 'transition-all', 'duration-300', 'hover:-translate-y-0.5', 'hover:border-indigo-200/70', 'hover:bg-slate-900/90', 'hover:text-white')}
                >
                  Save Contact
                </button>
              </div>
              <div className={clsx('text-center', 'text-[0.7rem]', 'font-semibold', 'text-slate-400')}>
                <button
                  type="button"
                  onClick={handlePoweredByClick}
                  className={clsx('mt-2', 'inline-flex', 'items-center', 'gap-2', 'text-slate-300', 'transition-colors', 'hover:text-indigo-300')}
                >
                  <QrCode className={clsx('h-4', 'w-4')} />
                  Powered by QR Folio
                </button>
              </div>
            </aside>

            <main className={clsx('flex-1', 'space-y-6')}>
              <section className={clsx('rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-6', 'sm:p-8', 'shadow-lg', 'shadow-slate-950/70')}>
                <div className="space-y-8">
                  <div className={clsx('max-w-3xl', 'space-y-4')}>
                    <h2 className={clsx('text-2xl', 'font-semibold', 'text-left', 'justify-center', 'tracking-tight', 'text-indigo-100')}>
                      About Me
                    </h2>
                    <p className={clsx('text-base', 'leading-relaxed', 'text-slate-200/90')}>
                      {professionalSummary}
                    </p>
                  </div>

                </div>
              </section>

              <section className={clsx('grid', 'gap-10', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-6', 'pt-10', 'shadow-lg', 'shadow-slate-950/70', 'lg:grid-cols-[minmax(0,380px),1fr]', 'sm:p-8')}>
                {/* Professional Details */}
                <div className="space-y-5">
                  <h2 className={clsx('text-2xl', 'font-semibold', 'tracking-tight', 'text-indigo-100')}>
                    Professional Details
                  </h2>
                  <div className={clsx('grid', 'min-h-0', 'grid-cols-1', 'gap-4', 'md:grid-cols-2')}>
                    {/* Company Name Card */}
                    <div className={clsx('flex', 'min-h-[200px]', 'flex-col', 'items-center', 'gap-3', 'rounded-2xl', 'border', 'border-white/10', 'bg-slate-900/80', 'p-5', 'text-center', 'shadow-lg', 'shadow-slate-950/80', 'transition-all', 'duration-300', 'hover:-translate-y-1', 'hover:shadow-xl')}>
                      <div className={clsx('m-5', 'flex', 'h-12', 'w-12', 'items-center', 'justify-center', 'rounded-2xl', 'bg-indigo-500/15', 'text-indigo-200', 'shadow-inner', 'shadow-slate-950/70')}>
                        <Building2 className={clsx('h-6', 'w-6')} />
                      </div>
                      <div className={clsx('min-w-0', 'w-full')}>
                        <p className={clsx('text-500', 'font-semibold', 'uppercase', 'tracking-wide', 'text-slate-300')}>
                          Company Name
                        </p>
                        <p className={clsx('mt-2', 'break-words', 'whitespace-pre-wrap', 'text-base', 'font-semibold', 'text-indigo-100', 'sm:text-lg')}>
                          {companyName}
                        </p>
                      </div>
                    </div>

                    {/* Designation Card */}
                    <div className={clsx('flex', 'min-h-[200px]', 'flex-col', 'items-center', 'gap-3', 'rounded-2xl', 'border', 'border-white/10', 'bg-slate-900/80', 'p-5', 'text-center', 'shadow-[0_18px_40px_rgba(15,23,42,0.9)]', 'transition-all', 'duration-300', 'hover:-translate-y-1', 'hover:shadow-[0_24px_60px_rgba(15,23,42,0.95)]')}>
                      <div className={clsx('m-5', 'flex', 'h-12', 'w-12', 'items-center', 'justify-center', 'rounded-2xl', 'bg-sky-500/15', 'text-sky-200', 'shadow-inner', 'shadow-slate-950/70')}>
                        <Briefcase className={clsx('h-6', 'w-6')} />
                      </div>
                      <div className={clsx('min-w-0', 'w-full')}>
                        <p className={clsx('text-500', 'font-semibold', 'uppercase', 'tracking-wide', 'text-slate-300')}>
                          Designation
                        </p>
                        <p className={clsx('mt-2', 'break-words', 'whitespace-pre-wrap', 'text-base', 'font-semibold', 'text-indigo-100', 'sm:text-lg')}>
                          {user?.designation || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Description */}
                <div className="space-y-5">
                  <div className="space-y-4">
                    <h2 className={clsx('text-2xl', 'font-semibold', 'tracking-tight', 'text-indigo-100')}>
                      Company Description
                    </h2>
                    <p className={clsx('break-words', 'text-base', 'leading-relaxed', 'text-slate-200/90')}>
                      {companyDescription !== ""
                        ? companyDescription
                        : "We create visually stunning and engaging content."}
                    </p>
                  </div>

                  {/* Experience & Referral */}
                  <div className={clsx('flex', 'flex-col', 'gap-3')}>
                    <div className={clsx('flex', 'w-full', 'items-stretch', 'rounded-[999px]', 'border', 'border-white/10', 'bg-slate-900/80', 'text-white', 'shadow-md', 'shadow-slate-950/60')}>
                      <div className={clsx('flex', 'items-center', 'justify-center', 'rounded-l-[999px]', 'bg-gradient-to-r', 'from-indigo-500', 'to-sky-400', 'px-16', 'py-3', 'text-xs', 'font-semibold', 'uppercase', 'tracking-wide')}>
                        Experience
                      </div>
                      <div className={clsx('flex', 'flex-1', 'items-center', 'justify-center', 'px-5', 'py-3', 'text-base', 'font-semibold', 'text-indigo-100')}>
                        {companyExperience || "-"}
                      </div>
                    </div>
                    <div className={clsx('flex', 'w-full', 'flex-col', 'gap-3', 'rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/80', 'p-4', 'text-slate-100', 'shadow-md', 'shadow-slate-950/60')}>
                      <div className={clsx('flex', 'flex-wrap', 'items-center', 'justify-between', 'gap-2')}>
                        <p className={clsx('text-xs', 'font-semibold', 'uppercase', 'tracking-[0.3em]', 'text-slate-400')}>
                          Referral Code
                        </p>
                        {companyReferralCode &&
                          companyReferralCode !== "—" &&
                          companyReferralCode !== "-" && (
                            <button
                              type="button"
                              onClick={handleCopyReferralCode}
                              className={clsx('inline-flex', 'items-center', 'justify-center', 'gap-1.5', 'rounded-full', 'bg-gradient-to-r', 'from-indigo-500', 'via-sky-500', 'to-cyan-400', 'px-4', 'py-1.5', 'text-xs', 'font-semibold', 'text-white', 'shadow-lg', 'shadow-slate-950/60', 'transition', 'hover:brightness-110')}
                            >
                              <Copy className={clsx('h-4', 'w-4')} />
                            </button>
                          )}
                      </div>
                      <p className={clsx('break-all', 'text-sm', 'font-medium', 'text-indigo-100')}>
                        {companyReferralCode || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>


            {imageItems.length > 0 && (() => {
              const remaining = imageItems.length - previewCount;
              const previewImages = imageItems.slice(0, previewCount);

              return (
    <div className={clsx('rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-6', 'sm:p-8')}>
<h2 className="mb-4 text-xl font-semibold text-indigo-100">
  Photo Gallery
</h2>
                  <div className={clsx('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-3')}>

                    {previewImages.map((item, index) => {
                      const isLast = index === previewImages.length - 1 && remaining > 0;

                      return (
                        <button
                          key={item._id || index}
                          onClick={() =>
                            isLast ? setPreviewCount(imageItems.length) : setSelectedPhoto(item)
                          }
                          className={clsx('relative', 'overflow-hidden', 'rounded-2xl')}
                        >
                          <img
                            src={item.url}
                            className={clsx('w-full', 'aspect-square', 'object-cover')}
                            loading="lazy"
                          />

                          {/* ✅ +More Overlay */}
                          {isLast && (
                            <div className={clsx('absolute', 'inset-0', 'bg-black/70', 'flex', 'items-center', 'justify-center')}>
                              <span className={clsx('text-white', 'text-3xl', 'font-bold')}>
                                +{remaining}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}

                  </div>

                </div>
              );
            })()}

{documentItems.length > 0 && (() => {
  const remaining = documentItems.length - docPreviewCount;
  const previewDocs = documentItems.slice(0, docPreviewCount);

  return (
    <div className={clsx('rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-6', 'sm:p-8')}>
      <h2 className={clsx('mb-4', 'text-xl', 'font-semibold', 'text-indigo-100')}>
        Certificates/Documents
      </h2>

      <div className={clsx('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-4')}>

        {previewDocs.map((item, index) => {
          const isLast = index === previewDocs.length - 1 && remaining > 0;

          return (
            <button
              key={item._id || index}
              onClick={() =>
                isLast
                  ? setDocPreviewCount(documentItems.length)
                  : window.open(item.url, "_blank")
              }
              className={clsx('relative', 'rounded-2xl', 'bg-slate-900', 'border', 'border-white/10', 'p-6', 'flex', 'flex-col', 'items-center', 'justify-center', 'text-center')}
            >
              <FileText className={clsx('h-10', 'w-10', 'text-indigo-300', 'mb-3')} />
              <p className={clsx('text-xs', 'text-slate-300', 'line-clamp-2')}>
                {item.title || "Document"}
              </p>

              {isLast && (
                <div className={clsx('absolute', 'inset-0', 'bg-black/70', 'flex', 'items-center', 'justify-center', 'rounded-2xl')}>
                  <span className={clsx('text-white', 'text-3xl', 'font-bold')}>
                    +{remaining}
                  </span>
                </div>
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
})()}


{videoItems.length > 0 && (() => {
  const remaining = videoItems.length - videoPreviewCount;
  const previewVideos = videoItems.slice(0, videoPreviewCount);

  return (
    <div className={clsx('rounded-3xl', 'border', 'border-white/10', 'bg-slate-900/70', 'p-6', 'sm:p-8')}>
      <h2 className={clsx('mb-4', 'text-xl', 'font-semibold', 'text-indigo-100')}>
        Work Videos
      </h2>

      <div className={clsx('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-4')}>

        {previewVideos.map((item, index) => {
          const isLast = index === previewVideos.length - 1 && remaining > 0;

          return (
            <button
              key={item._id || index}
              onClick={() =>
                isLast
                  ? setVideoPreviewCount(videoItems.length)
                  : window.open(item.url, "_blank")
              }
              className={clsx('relative', 'overflow-hidden', 'rounded-2xl', 'bg-black')}
            >
              <div className={clsx('aspect-square', 'flex', 'items-center', 'justify-center')}>
                {renderVideoEmbed(item.url) || (
                  <div className={clsx('text-center', 'text-indigo-200', 'p-4')}>
                    <Link2 className={clsx('h-8', 'w-8', 'mx-auto', 'mb-2')} />
                    <p className={clsx('text-xs', 'line-clamp-2')}>{item.title}</p>
                  </div>
                )}
              </div>

              {isLast && (
                <div className={clsx('absolute', 'inset-0', 'bg-black/70', 'flex', 'items-center', 'justify-center')}>
                  <span className={clsx('text-white', 'text-3xl', 'font-bold')}>
                    +{remaining}
                  </span>
                </div>
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
})()}



            </main>
          </div>
        </div>

        {selectedPhoto && (
          <div
            className={clsx('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'bg-black/80', 'p-4')}
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className={clsx('relative', 'w-full', 'max-w-4xl')}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close image preview"
                onClick={() => setSelectedPhoto(null)}
                className={clsx('absolute', '-top-4', '-right-4', 'rounded-full', 'bg-white', 'p-2', 'text-gray-700', 'shadow-lg', 'hover:text-gray-900')}
              >
                <X className={clsx('h-5', 'w-5')} />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title || "Gallery image"}
                className={clsx('max-h-[80vh]', 'w-full', 'rounded-2xl', 'bg-black', 'object-contain')}
                loading="lazy"
              />
              {(selectedPhoto.title || selectedPhoto.description) && (
                <div className={clsx('mt-4', 'text-center', 'text-white')}>
                  {selectedPhoto.title && (
                    <h3 className={clsx('text-lg', 'font-semibold')}>
                      {selectedPhoto.title}
                    </h3>
                  )}
                  {selectedPhoto.description && (
                    <p className={clsx('mt-1', 'text-sm', 'text-white')}>
                      {selectedPhoto.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showCopyToast && (
        <div className={clsx('pointer-events-none', 'fixed', 'inset-x-0', 'bottom-6', 'z-50', 'flex', 'justify-center', 'px-4')}>
          <div className={clsx('pointer-events-auto', 'rounded-full', 'border', 'border-indigo-400/60', 'bg-slate-900/95', 'px-4', 'py-2', 'text-sm', 'font-medium', 'text-slate-50', 'shadow-lg', 'shadow-slate-950/80')}>
            {copyToastMessage}
          </div>
        </div>
      )}
      {/* HIDDEN DOWNLOAD CARD (PNG / PDF SOURCE) */}
      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <DownloadProfileCard
          ref={downloadRef}
          user={user}
          qrValue={profileUrl}
          backgroundImage="/assets/card-bg.png"
        />
      </div>
    </div>
  );
};

export default PublicProfilePage;
