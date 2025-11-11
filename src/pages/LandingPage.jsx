import React from "react";
import { motion } from "../utils/motion";
import { SiGnuprivacyguard } from "react-icons/si";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";
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
        "Get NFC Card of your profile",
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
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Michael Chen",
      role: "Sales Manager",
      company: "InnovateNow",
      content:
        "The analytics feature helps me track my networking ROI effectively.",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "Emily Davis",
      role: "Entrepreneur",
      company: "StartupHub",
      content:
        "Professional, eco-friendly, and incredibly easy to use. Highly recommended!",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
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

  return (
    <div className="min-h-screen bg-white">
      {/* Promo modal removed as per latest requirements */}
      <nav className="bg-white border-b border-gray-100 justify-content:space-between top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QR Folio</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-4"
            >
              <button
                onClick={() => navigate("/login")}
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Get Started
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Your Digital
                <span className="text-primary-600 block">Business Card</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create, customize, and share your professional profile with QR
                codes. Network smarter, not harder with QR Folio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/signup")}
                  className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-10">
                <img
                  src="/assets/dashboard.png"
                  alt="QR Folio Dashboard"
                  className="w-full rounded-xl"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-100 rounded-full opacity-50"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary-200 rounded-full opacity-30"></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="about-image">
              <motion.img
                src="/assets/aboutVideo.png"
                alt="About QR Folio"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="rounded-xl"
              />
            </div>
            <div className="about-text">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                About Us
              </h2>
              <p className="text-xl text-gray-600 mb-4">
                At QR Folio, we believe your identity should be simple, secure,
                and dynamic. We've helped thousands of individuals and
                businesses instantly share verified identities, reducing the
                need for paper forms and business cards.
              </p>
              <p className="text-xl text-gray-600">
                Our mission is to create a seamless, cutting-edge, and
                verifiable digital identity that's portable and accessible to
                everyone.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Digital Networking
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to make professional networking
              seamless and effective.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="w-[90%] max-w-[75rem] mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-8 auto-rows-auto mr-12 ml-12 mb-[clamp(2rem,5vw,2.5rem)] mt-[clamp(2rem,5vw,2.5rem)]">
          <motion.div
            className="bg-black text-white flex flex-col justify-center row-span-2 text-center p-[clamp(1rem,8vw,2rem)] rounded-md shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SiGnuprivacyguard
              id="privacy"
              style={{
                color: "#007bff",
                fontSize: "3rem",
                marginLeft: "7.5rem",
                marginBottom: "1.5rem",
              }}
            />
            <h2 className="text-[clamp(1.5rem,4vw,2rem)] mb-[0.75rem]">
              Secure & Private
            </h2>
            <p className="mb-[1rem] text-[#666] text-[clamp(0.875rem,2vw,1rem)] m-0">
              All data is encrypted; you decide what to share.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/PrivacyPolicy")}
              className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>View Policies</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <motion.div
            className="bg-white rounded-md p-4 px-8 shadow-sm transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src="/assets/customizable.png"
              alt="Customizable Profiles"
              className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] mb-4"
            />
            <h3 className="text-[clamp(1rem,2.5vw,1.25rem)] mb-[0.5rem] text-black">
              Customizable Profiles
            </h3>
            <p className="text-[#666] text-[clamp(0.875rem,2vw,1rem)] m-0">
              Add or update details anytime — portfolio, documents, links, and
              more.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-md p-4 px-8 shadow-sm transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <img
              src="/assets/identity.png"
              alt="Instant Identity Sharing"
              className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] mb-4"
            />
            <h3 className="text-[clamp(1rem,2.5vw,1.25rem)] mb-[0.5rem] text-black">
              Instant Identity Sharing
            </h3>
            <p className="text-[#666] text-[clamp(0.875rem,2vw,1rem)] m-0">
              Say goodbye to paper IDs — share your profile with a single scan.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-md p-4 px-8 shadow-sm transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <img
              src="/assets/scan.png"
              alt="Instant Scan & Load"
              className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] mb-4"
            />
            <h3 className="text-[clamp(1rem,2.5vw,1.25rem)] mb-[0.5rem] text-black">
              Instant Scan & Load
            </h3>
            <p className="text-[#666] text-[clamp(0.875rem,2vw,1rem)] m-0">
              Profiles load in under 2 seconds — even on slow networks.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-md p-4 px-8 shadow-sm transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <img
              src="/assets/multi-device.png"
              alt="Multi-Device Support"
              className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] mb-4"
            />
            <h3 className="text-[clamp(1rem,2.5vw,1.25rem)] mb-[0.5rem] text-black">
              Multi-Device Support
            </h3>
            <p className="text-[#666] text-[clamp(0.875rem,2vw,1rem)] m-0">
              Seamlessly works across smartphones, tablets, and desktops.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="use-cases" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Use Cases</h2>
            <p className="text-xl text-gray-600">
              Explore how QR Folio fits into your world.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase) => (
              <motion.div
                key={useCase.id}
                className={`bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow ${
                  useCase.active ? "border-2 border-primary-600" : ""
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => handleUseCaseHover(useCase.id)}
                onHoverEnd={() => handleUseCaseLeave(useCase.id)}
                transition={{ duration: 0.3 }}
              >
                <div className="text-4xl mb-4 text-center">{useCase.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 text-center">{useCase.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">Start and scale as you grow</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl p-8 relative ${
                  plan.highlighted
                    ? "border-2 border-primary-500 shadow-xl scale-105"
                    : "border border-gray-200 shadow-lg"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      ₹{plan.price}/
                    </span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: plan.paymentEnabled ? 1.02 : 1 }}
                  whileTap={{ scale: plan.paymentEnabled ? 0.98 : 1 }}
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
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Professionals
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of professionals who trust QR Folio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-8"
              >
                <div className="flex items-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Networking?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of professionals who are already using QR Folio to
              build their network.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/signup")}
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Contact Info Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Phone */}
            <div className="text-center">
              <a
                href="tel:+919460117199"
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-300 hover:text-white transition">
                  +91 1413656918
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
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-300 hover:text-white transition">
                  Floor No.: SECOND FLOOR Building, No./Flat No.: 208, Building:
                  Royal Essence Road/Street: Unnamed Road, Nearby Landmark: St
                  John The Baptist Church Locality/Sub, Locality: Lalarpura,
                  District: Jaipur, State: Rajasthan, PIN Code: 302021
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
                {message && <p className="text-green-400 text-sm">{message}</p>}
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
  );
};

export default LandingPage;
