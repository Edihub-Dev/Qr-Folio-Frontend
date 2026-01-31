import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageSEO from "../../components/seo/PageSEO";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageSEO
        title="Privacy Policy"
        description="Privacy Policy for QR Folio – learn how we collect, use, and protect your data on the digital business card platform."
        canonicalPath="/PrivacyPolicy"
      />
      <div className="max-w-4xl mx-auto px-4 text-gray-800">
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="mb-2">
            Effective Date: <strong>01st October 2025</strong>
          </p>
          <p className="mb-6">
            This Privacy Policy explains how <strong>QR Folio</strong> (“we”,
            “us”, “our”, or the “Platform”) collects, uses, discloses, and
            protects your personal information when you use
            <a
              href="http://www.qrfolio.net/"
              className="text-blue-600 underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              http://www.qrfolio.net/
            </a>{" "}
            and related services (the “Service”).
          </p>

          <p className="mb-6">
            By using the Service, you agree to the practices described in this
            Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">
            1. Information We Collect
          </h2>
          <h3 className="font-semibold mb-1">a) Information You Provide</h3>
          <ul className="list-disc list-inside mb-3">
            <li>
              Name, email address, profile photo, bio, links, and other details
              you upload to create your digital business card.
            </li>
            <li>Login information if you sign up using email.</li>
            <li>
              Payment details when you purchase our features (processed securely
              via third-party payment processors).
            </li>
          </ul>
          <h3 className="font-semibold mb-1">
            b) Automatically Collected Information
          </h3>
          <ul className="list-disc list-inside mb-3">
            <li>
              IP address, browser type, operating system, device information.
            </li>
            <li>
              Log data about your use of the Service (pages viewed, actions
              taken, referral links).
            </li>
            <li>Cookies and similar technologies (see Section 7).</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-2">
            2. How We Use Your Information
          </h2>
          <ul className="list-decimal list-inside space-y-1 mb-3">
            <li>Provide and maintain the Platform.</li>
            <li>Allow you to create and share digital business cards.</li>
            <li>Improve, personalize, and optimize the user experience.</li>
            <li>
              Communicate with you (service updates, customer support,
              promotional messages if you consent).
            </li>
            <li>Process payments and subscriptions.</li>
            <li>
              Ensure security, prevent fraud, and enforce our Terms &
              Conditions.
            </li>
            <li>Comply with legal obligations.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-2">
            3. How We Share Your Information
          </h2>
          <ul className="list-disc list-inside mb-3">
            <li>
              <strong>Service Providers:</strong> Hosting providers, analytics,
              email services, payment processors, etc.
            </li>
            <li>
              <strong>Business Transfers:</strong> In case of merger,
              acquisition, or sale of assets, user information may be
              transferred.
            </li>
            <li>
              <strong>Legal Requirements:</strong> If required by law,
              regulation, legal process, or governmental request.
            </li>
            <li>
              <strong>With Your Consent:</strong> When you voluntarily share
              your QR code or digital business card publicly.
            </li>
          </ul>
          <p className="mb-3">
            We do not sell your personal data to third parties.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Retention</h2>
          <p className="mb-3">
            We retain your information for as long as necessary to provide the
            Service, comply with legal obligations, resolve disputes, or enforce
            agreements. You may request deletion of your account and data at any
            time (see Section 8).
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">5. Your Rights</h2>
          <p className="mb-2">
            Depending on your jurisdiction (e.g., GDPR in EU, DPDP Act in
            India), you may have rights including:
          </p>
          <ul className="list-disc list-inside mb-3">
            <li>Access to your personal data.</li>
            <li>Correction of inaccurate information.</li>
            <li>Request deletion (“Right to be Forgotten”).</li>
            <li>Restrict or object to processing.</li>
            <li>Data portability.</li>
            <li>
              Withdraw consent (for optional features like marketing emails).
            </li>
          </ul>
          <p>
            To exercise these rights, contact us at:{" "}
            <strong>tech.qrfolio@gmail.com</strong>.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">6. Security</h2>
          <p className="mb-3">
            We use reasonable technical and organizational measures to protect
            your data (encryption, secure servers, restricted access). However,
            no method of transmission or storage is 100% secure, and we cannot
            guarantee absolute security.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">
            7. Cookies & Tracking
          </h2>
          <ul className="list-disc list-inside mb-3">
            <li>Keep you logged in.</li>
            <li>Remember preferences.</li>
            <li>Analyze traffic and usage trends.</li>
            <li>Improve features.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-2">
            8. Data Deletion & Account Removal
          </h2>
          <p className="mb-3">
            You may request deletion of your account and data by contacting us
            at tech.qrfolio@gmail.com. We will process your request in a
            reasonable timeframe, subject to applicable law.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">
            9. Children’s Privacy
          </h2>
          <p className="mb-3">
            The Service is not directed to children under 18 (or the minimum
            legal age in your jurisdiction). We do not knowingly collect
            personal information from children. If we discover such data, we
            will delete it.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">
            10. Changes to This Policy
          </h2>
          <p className="mb-3">
            We may update this Privacy Policy from time to time. The updated
            version will be posted on this page with a revised Effective Date.
            Continued use of the Service after changes indicates your
            acceptance. Please also review our{" "}
            <button
              onClick={() => navigate("/terms")}
              className="text-blue-600 hover:underline font-medium"
            >
              Terms & Conditions
            </button>{" "}
            for additional information about your rights and obligations.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-2">11. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please
            contact us:
            <br />
            📧 <strong>tech.qrfolio@gmail.com</strong>
            <br />
            🌐{" "}
            <a
              href="http://www.qrfolio.net"
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              http://www.qrfolio.net/
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
