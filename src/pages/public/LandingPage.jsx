import React from "react";
import { SiGnuprivacyguard } from "react-icons/si";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../../api";
import PageSEO from "../../components/seo/PageSEO";
import { buildAbsoluteUrl } from "../../utils/seoConfig";
import {
  QrCode,
  Users,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Smartphone,
  Globe,
  Network,
  Phone,
  Mail,
  MapPin,
  Twitter,
  Facebook,
  Instagram,
  Share2,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const createAvatarDataUri = (initials, background = "#6366F1") => {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
        <rect width='100' height='100' rx='50' fill='${background}' />
        <text
          x='50%'
          y='55%'
          dominant-baseline='middle'
          text-anchor='middle'
          font-family='Inter, sans-serif'
          font-size='40'
          fill='white'
        >${initials}</text>
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };
  const features = [
    {
      icon: QrCode,
      title: "QR Code Generation",
      description:
        "Create customizable QR codes for your digital business cards",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description:
        "Perfect viewing experience across all devices and platforms",
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description:
        "Share your profile instantly via QR code, link, or social media",
    },
    {
      icon: Users,
      title: "Network Building",
      description: "Build and manage your professional network digitally",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and securely stored",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Quick setup and instant profile updates",
    },
  ];

  const pricingPlans = [
    {
      name: "Basic (Silver)",
      price: "399",
      period: "Year",
      description: "Perfect for individuals",
      features: [
        "Custom QR Code",
        "Add Contact Details",
        "Add Company Details",
        "Add Basic Profile Details",
        "Share Profile via QR Code",
        "Share Profile via Link",
        "Media Storage add 5 imgaes and 2 Video links",
        "Prices Exclusive of Taxes",
      ],
      highlighted: false,
      paymentEnabled: true,
    },
    {
      name: "Standard (Gold)",
      price: "599",
      period: "Year",
      description: "Best for professionals",
      features: [
        "Everything in Basic",
        "Add Custom Links",
        "Limited Media Storage",
        "Add Advanced Profile Details",
        "Quick Share to Social Media",
        "Publicly Accessible Profile",
        "Prices Exclusive of Taxes",
        "Media Storage add 10 imgaes and 20 Video links",
      ],
      highlighted: true,
      paymentEnabled: true,
    },
    {
      name: "Premium (Platinum)",
      price: "999",
      period: "Year",
      description: "For large organizations",
      features: [
        "Everything in Standard",
        "Custom Branding",
        "Team Collaboration",
        "Personalized Support",
        "Media Storage up to 10 files of 1GB",
        // "Get NFC Card of your profile",
        "Media Storage add 50 imgaes and 50 Video links",
        "Prices Exclusive of Taxes",
      ],
      highlighted: false,
      paymentEnabled: true,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp",
      content:
        "QR Folio transformed how I network. No more lost business cards!",
      avatar: createAvatarDataUri("SJ", "#6366F1"),
    },
    {
      name: "Michael Chen",
      role: "Sales Manager",
      company: "InnovateNow",
      content:
        "The analytics feature helps me track my networking ROI effectively.",
      avatar: createAvatarDataUri("MC", "#10B981"),
    },
    {
      name: "Emily Davis",
      role: "Entrepreneur",
      company: "StartupHub",
      content:
        "Professional, eco-friendly, and incredibly easy to use. Highly recommended!",
      avatar: createAvatarDataUri("ED", "#F97316"),
    },
  ];

  const [useCases, setUseCases] = useState([
    {
      id: 1,
      icon: "👥",
      title: "Business Networking",
      desc: "Share contacts at events and conferences.",
      active: false,
    },
    {
      id: 2,
      icon: "🎉",
      title: "Events/Conferences",
      desc: "Quick contact sharing without business cards.",
      active: false,
    },
    {
      id: 3,
      icon: "🏢",
      title: "Corporate ID",
      desc: "Secure office entry, attendance, and internal access.",
      active: false,
    },
  ]);

  const handleUseCaseHover = (id) => {
    setUseCases((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: true } : item))
    );
  };

  const handleUseCaseLeave = (id) => {
    setUseCases((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: false } : item))
    );
  };

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email) {
      setMessage("Please enter a valid email!");
      return;
    }

    try {
      const res = await api.post("/subscribe", { email });
      setMessage(res.data.msg);
      setEmail(""); // clear input
    } catch (err) {
      setMessage(err.response?.data?.msg || "Subscription failed");
    }
  };

  const seoDescription =
    "QR Folio lets you create and manage digital business cards with QR codes, optimized for modern professionals and businesses.";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": buildAbsoluteUrl("#organization"),
    name: "QR Folio",
    url: buildAbsoluteUrl("/"),
    sameAs: [
      "https://x.com/qrfolio?t=49XZqhZy-vmd9u_cQ8NPVA&s=09",
      "https://www.instagram.com/_qrfolio?igsh=MWlsNjdxcWt3d2dsNw==",
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": buildAbsoluteUrl("#digital-business-card-service"),
    name: "QR Folio digital business card platform",
    url: buildAbsoluteUrl("/"),
    description: seoDescription,
    provider: {
      "@id": organizationSchema["@id"],
    },
    serviceType: "Digital business card and QR code portfolio",
    areaServed: "IN",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: buildAbsoluteUrl("/"),
    },
    offers: [
      {
        "@type": "Offer",
        name: "Basic (Silver)",
        priceCurrency: "INR",
        price: "399",
        url: buildAbsoluteUrl("/signup"),
      },
      {
        "@type": "Offer",
        name: "Standard (Gold)",
        priceCurrency: "INR",
        price: "599",
        url: buildAbsoluteUrl("/signup"),
      },
      {
        "@type": "Offer",
        name: "Premium (Platinum)",
        priceCurrency: "INR",
        price: "999",
        url: buildAbsoluteUrl("/signup"),
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": buildAbsoluteUrl("#faq"),
    mainEntity: [
      {
        "@type": "Question",
        name: "What is QR Folio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "QR Folio is a digital business card platform that lets you share a single QR code or link with all of your professional details, links, and media.",
        },
      },
      {
        "@type": "Question",
        name: "Who can use QR Folio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "QR Folio is designed for professionals, creators, founders, and teams who want a modern, always up-to-date way to share their identity and portfolio.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need a special app to scan QR Folio cards?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Anyone can scan your QR Folio card using their camera or any QR scanner app, and your profile opens instantly in the browser.",
        },
      },
    ],
  };

  return (
    <>
      <PageSEO
        title="Digital business card platform"
        description={seoDescription}
        keywords={[
          "digital business card",
          "QR code business card",
          "online visiting card",
          "QR portfolio",
          "NFC business card alternative",
          "QR Folio platform",
        ]}
        canonicalPath="/"
        ogType="website"
        structuredData={[organizationSchema, serviceSchema, faqSchema]}
      />
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Promo modal removed as per latest requirements */}
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/40">
                  <a href="/">
                    <QrCode className="w-6 h-6 text-white" />
                  </a>
                </div>
                <span className="text-xl font-semibold tracking-tight text-white">
                  <a href="/">QR Folio</a>
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/login")}
                  className="text-sm font-medium text-slate-200 hover:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-primary-500/90 text-white text-sm font-semibold px-6 py-2 rounded-lg shadow-md shadow-primary-500/40 hover:bg-primary-400 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.section
          className="relative overflow-hidden pt-24 pb-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-500/30 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs sm:text-sm text-slate-100 shadow-sm backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Smarter, contactless networking for modern professionals
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-normal">
                  Your identity,
                  <span className="block pb-2 bg-gradient-to-r from-primary-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
                    one QR away.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-200/80 max-w-xl">
                  Create a beautiful, always up-to-date digital business card.
                  Share it instantly with a single scan and never reprint paper
                  cards again.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate("/signup")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-primary-500/40 transition hover:-translate-y-0.5 hover:bg-primary-400 hover:shadow-xl"
                    type="button"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("features");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm sm:text-base font-medium text-slate-100 backdrop-blur transition hover:bg-white/10"
                  >
                    Explore Features
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>No app required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span>Secure by design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span>Live in minutes</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              >
                <div className="relative rounded-3xl bg-white/5 p-4 sm:p-6 lg:p-8 shadow-2xl shadow-primary-500/30 ring-1 ring-white/10 backdrop-blur">
                  <div className="absolute inset-x-16 -top-12 h-24 rounded-full bg-gradient-to-r from-primary-500/30 via-emerald-400/30 to-sky-400/30 blur-3xl" />
                  <div className="relative rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:p-5">
                    <img
                      src="/assets/landingpage.png"
                      alt="QR Folio Landing Page"
                      className="w-full rounded-xl border border-white/5 shadow-lg"
                    />
                  </div>
                </div>

                <motion.div
                  className="pointer-events-none absolute -bottom-6 left-4 inline-flex items-center gap-3 rounded-2xl bg-slate-900/80 px-4 py-3 text-xs sm:text-sm text-slate-100 shadow-lg shadow-slate-950/40 ring-1 ring-white/10 backdrop-blur"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/90">
                    <QrCode className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Tap or scan to connect</p>
                    <p className="text-xs text-slate-300">
                      Share your profile in under 2 seconds.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="about"
          className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="about-image rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-primary-500/20 backdrop-blur">
                <img
                  src="/assets/aboutVideo.png"
                  alt="About QR Folio"
                  className="rounded-2xl w-full h-full object-cover"
                />
              </div>
              <div className="about-text space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 shadow-xl shadow-primary-500/20 backdrop-blur">
                <h2 className="text-4xl font-bold text-white mb-2">About Us</h2>
                <p className="text-lg sm:text-xl text-slate-200 mb-2">
                  At QR Folio, we believe your identity should be simple,
                  secure, and dynamic. We've helped thousands of individuals and
                  businesses instantly share verified identities, reducing the
                  need for paper forms and business cards.
                </p>
                <p className="text-lg sm:text-xl text-slate-300">
                  Our mission is to create a seamless, cutting-edge, and
                  verifiable digital identity that's portable and accessible to
                  everyone.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          id="features"
          className="relative py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Everything You Need for Digital Networking
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Powerful features designed to make professional networking
                seamless and effective.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-lg shadow-primary-500/20 transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/60 hover:shadow-xl"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-4 shadow-sm shadow-primary-500/30">
                        <Icon className="w-6 h-6 text-primary-300" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-300">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="features-grid"
          className="relative w-[90%] max-w-[75rem] mx-auto py-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-8 auto-rows-auto mr-12 ml-12 mb-[clamp(2rem,5vw,2.5rem)] mt-[clamp(2rem,5vw,2.5rem)]">
            <motion.div
              className="bg-slate-900/80 text-white flex flex-col justify-center row-span-2 text-center p-[clamp(1rem,8vw,2rem)] rounded-3xl border border-white/10 shadow-xl shadow-primary-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
            >
              <SiGnuprivacyguard
                id="privacy"
                style={{
                  color: "#007bffff",
                  fontSize: "3rem",
                  marginLeft: "7.5rem",
                  marginBottom: "1.5rem",
                }}
              />
              <h2 className="text-[clamp(1.5rem,4vw,2rem)] mb-[0.75rem]">
                Secure & Private
              </h2>
              <p className="mb-[1rem] text-slate-300 text-[clamp(0.875rem,2vw,1rem)] m-0">
                All data is encrypted; you decide what to share.
              </p>
              <button
                onClick={() => navigate("/PrivacyPolicy")}
                className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                type="button"
              >
                <span>View Policies</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>

            <motion.div
              className="bg-slate-900/70 rounded-2xl p-4 px-8 shadow-lg shadow-slate-950/40 border border-white/10 transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/assets/customizable.png"
                alt="Customizable Profiles"
                className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] mb-4"
                style={{
                  filter:
                    "invert(33%) sepia(98%) saturate(3266%) hue-rotate(197deg) brightness(102%) contrast(101%)",
                }}
              />

              <h3 className="text-[clamp(1rem,2.5vw,1.25rem)] mb-[0.5rem] text-white">
                Customizable Profiles
              </h3>

              <p className="text-slate-300 text-[clamp(0.875rem,2vw,1rem)] m-0">
                Add or update details anytime — portfolio, documents, links, and
                more.
              </p>
            </motion.div>

            <motion.div
              className="bg-slate-900/70 rounded-2xl p-4 px-8 shadow-lg shadow-slate-950/40 border border-white/10 transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/assets/identity.png"
                alt="Instant Identity Sharing"
                className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] mb-4"
              />
              <h3 className="text-[clamp(1rem,2.5vw,1.25rem)] mb-[0.5rem] text-white">
                Instant Identity Sharing
              </h3>
              <p className="text-slate-300 text-[clamp(0.875rem,2vw,1rem)] m-0">
                Say goodbye to paper IDs — share your profile with a single
                scan.
              </p>
            </motion.div>

            <motion.div
              className="bg-slate-900/70 rounded-2xl p-4 px-8 shadow-lg shadow-slate-950/40 border border-white/10 transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/assets/scan.png"
                alt="Instant Scan & Load"
                className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] mb-4"
              />
              <h3 className="text-[clamp(1rem,2.5vw,1.25rem)] mb-[0.5rem] text-white">
                Instant Scan & Load
              </h3>
              <p className="text-slate-300 text-[clamp(0.875rem,2vw,1rem)] m-0">
                Profiles load in under 2 seconds — even on slow networks.
              </p>
            </motion.div>

            <motion.div
              className="bg-slate-900/70 rounded-2xl p-4 px-8 shadow-lg shadow-slate-950/40 border border-white/10 transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/assets/multi-device.png"
                alt="Multi-Device Support"
                className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] mb-4"
              />
              <h3 className="text-[clamp(1rem,2.5vw,1.25rem)] mb-[0.5rem] text-white">
                Multi-Device Support
              </h3>
              <p className="text-slate-300 text-[clamp(0.875rem,2vw,1rem)] m-0">
                Seamlessly works across smartphones, tablets, and desktops.
              </p>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="use-cases"
          className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Use Cases</h2>
              <p className="text-xl text-slate-300">
                Explore how QR Folio fits into your world.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {useCases.map((useCase) => (
                <motion.div
                  key={useCase.id}
                  className={`rounded-xl p-6 border border-white/10 bg-slate-900/60 text-slate-100 transition-shadow transform duration-300 hover:shadow-xl hover:shadow-primary-500/30 ${
                    useCase.active
                      ? "border-2 border-primary-600 scale-105"
                      : "scale-100"
                  }`}
                  onMouseEnter={() => handleUseCaseHover(useCase.id)}
                  onMouseLeave={() => handleUseCaseLeave(useCase.id)}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  whileHover={{ y: -4 }}
                >
                  <div className="text-4xl mb-4 text-center">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">
                    {useCase.title}
                  </h3>
                  <p className="text-slate-300 text-center">{useCase.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Pricing Section */}
        <motion.section
          id="pricing"
          className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Choose Your Plan
              </h2>
              <p className="text-xl text-slate-300">
                Start and scale as you grow
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  className={`bg-slate-900/60 rounded-2xl p-8 relative ${
                    plan.highlighted
                      ? "border-2 border-primary-500 shadow-xl scale-105"
                      : "border border-white/10 shadow-lg"
                  } transition-transform duration-300`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -6 }}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-slate-300 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-white">
                        ₹{plan.price}/
                      </span>
                      <span className="text-slate-300 ml-2">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center space-x-3"
                      >
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-slate-200">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      plan.paymentEnabled ? navigate("/signup") : null
                    }
                    disabled={!plan.paymentEnabled}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.paymentEnabled
                        ? plan.highlighted
                          ? "bg-primary-600 text-white hover:bg-primary-700 cursor-pointer"
                          : "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {plan.paymentEnabled ? "Get Started" : "Coming Soon"}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Loved by Professionals
              </h2>
              <p className="text-xl text-slate-300">
                Join thousands of professionals who trust QR Folio
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  className="bg-slate-900/60 rounded-2xl p-8 border border-white/10 shadow-lg shadow-slate-950/40 backdrop-blur"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-slate-200 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-slate-300">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          className="py-20 bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Networking?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of professionals who are already using QR Folio to
              build their network.
            </p>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="bg-slate-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Contact Info Section */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Phone */}
              <div className="text-center">
                <a
                  href="tel:+919460117199"
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-300 hover:text-white transition">
                    +91 9460117199
                  </p>
                </a>

                <a
                  href="tel:+916399105369"
                  className="flex flex-col items-center"
                >
                  <p className="text-gray-300 hover:text-white transition">
                    +91 6399105369
                  </p>
                </a>
              </div>

              {/* Email */}
              <div className="text-center">
                <a
                  href="mailto:tech.qrfolio@gmail.com"
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-300 hover:text-white transition">
                    tech.qrfolio@gmail.com
                  </p>
                </a>
              </div>

              {/* Location */}
              <div className="text-center">
                <a
                  href="https://www.google.com/maps/place/St.+John+the+Baptist+Church/@26.9038738,75.6276941,13z/data=!4m20!1m13!4m12!1m4!2m2!1d75.7781814!2d26.8980582!4e1!1m6!1m2!1s0x396c4b239c92cea3:0xc0715d7be4b75ae2!2sSt.+John+the+Baptist+Church,+WP33%2BPC4,+Lalarpura,+Jaipur,+Rajasthan+302021!2m2!1d75.7039065!2d26.9038768!3m5!1s0x396c4b239c92cea3:0xc0715d7be4b75ae2!8m2!3d26.9038803!4d75.7038843!16s%2Fg%2F11t2fd77gc?entry=ttu&g_ep=EgoyMDI1MDkzMC4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-300 hover:text-white transition">
                    Vaishali Nagar, Jaipur, Rajasthan, 302021, India
                  </p>
                </a>
              </div>
            </div>

            {/* Links Section */}
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <h4 className="font-semibold mb-4 text-white">About</h4>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a
                      href="#about"
                      className="hover:text-white transition-colors"
                    >
                      Our Story
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="hover:text-white transition-colors"
                    >
                      Features
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">Company</h4>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a
                      href="#pricing"
                      className="hover:text-white transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#use-cases"
                      className="hover:text-white transition-colors"
                    >
                      Use Cases
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">Resources</h4>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a
                      href="/terms"
                      className="hover:text-white transition-colors"
                    >
                      Terms & Conditions
                    </a>
                  </li>
                  <li>
                    <a
                      href="/PrivacyPolicy"
                      className="hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/RefundPolicy"
                      className="hover:text-white transition-colors"
                    >
                      Refund Policy
                    </a>
                  </li>
                </ul>
              </div>

              {/* Subscribe Section */}
              <div>
                <h4 className="font-semibold mb-4 text-white">Subscribe</h4>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSubscribe}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-blue-700 transition-colors"
                    >
                      Subscribe
                    </button>
                  </div>
                  {message && (
                    <p className="text-green-400 text-sm">{message}</p>
                  )}
                  <p className="text-gray-400 text-sm">
                    Get digital marketing updates in your mailbox
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                <p>Copyright ©2025 All rights reserved | QR Folio</p>
                <p
                  className="text-gray-400"
                  href="https://edihub.in"
                  target="_blank"
                  style={{ marginLeft: "5.5rem" }}
                >
                  Owned by Edihub
                </p>
              </div>
              <div className="flex space-x-4">
                <a
                  href="https://x.com/qrfolio?t=49XZqhZy-vmd9u_cQ8NPVA&s=09"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Twitter className="w-5 h-5 text-gray-400" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Facebook className="w-5 h-5 text-gray-400" />
                </a>
                <a
                  href="https://www.instagram.com/_qrfolio?igsh=MWlsNjdxcWt3d2dsNw=="
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
