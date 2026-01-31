import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageSEO from "../../components/seo/PageSEO";

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageSEO
        title="Terms & Conditions"
        description="Terms and Conditions for using the QR Folio digital business card platform."
        canonicalPath="/terms"
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
          <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
          <p className="mb-2">
            Effective Date: <strong>01st October 2025</strong>
          </p>

          <p className="mb-6">
            Welcome to <strong>QR Folio</strong> (the "Platform", "we", "us",
            "our"). These Terms & Conditions ("Terms") govern your access to and
            use of{" "}
            <a
              href="http://www.qrfolio.net/"
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              http://www.qrfolio.net/
            </a>{" "}
            and any associated services (the "Service"). By accessing or using
            the Platform, you agree to be bound by these Terms. If you do not
            agree to any part of these Terms, you must not use the Platform.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            1. Eligibility & Account
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              You must be at least 18 years old (or the legal age in your
              jurisdiction) to use our services.
            </li>
            <li>
              You agree to provide accurate, current, and complete information
              when registering or using the features of the Platform.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              login credentials and for all actions under your account.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            2. Services Provided
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              QR Folio provides you the ability to create, host, share, and
              manage digital business cards / profiles via QR codes ("Digital
              Cards").
            </li>
            <li>
              We may add, change, suspend or remove features or functionalities
              at our discretion.
            </li>
            <li>
              We may impose limits on use (e.g. number of cards, storage,
              bandwidth, etc.).
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            3. Content & Licenses
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>
              <strong>Your Content.</strong> You retain ownership of content you
              upload (such as profile data, images, text). You grant us a
              non-exclusive, worldwide, royalty-free license to host, display,
              and distribute such content as necessary for the Platform's
              operation.
            </li>
            <li>
              You represent and warrant that you have all rights to the content
              you upload, and it does not violate laws, infringe on copyrights,
              contain unlawful or defamatory content, or violate third-party
              rights.
            </li>
            <li>
              We reserve the right (but not obligation) to remove or disable
              access to any content that we believe (in our judgment) violates
              these Terms or is harmful.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            4. Acceptable Use / Prohibited Activities
          </h2>
          <p className="mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Use the platform for any illegal or unauthorized purpose.</li>
            <li>Upload viruses, malware, or other harmful code.</li>
            <li>Attempt to disrupt, hack, or overload the Platform.</li>
            <li>
              Impersonate another person or misrepresent your affiliation.
            </li>
            <li>
              Use the Service to transmit spam, unsolicited messages, or
              phishing attempts.
            </li>
            <li>Harvest or misuse user data or personal information.</li>
            <li>
              Reverse-engineer, decompile, or otherwise attempt to derive source
              code of the Platform.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            5. Payments & Subscription (if applicable)
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Our Features require payment or a subscription.</li>
            <li>
              You agree to pay all applicable fees according to the plan you
              choose.
            </li>
            <li>
              Fees are non-refundable, except at our discretion or as required
              by law.
            </li>
            <li>
              We may change pricing, add new fees, or discontinue services;
              prior notice may be provided.
            </li>
            <li>
              You may refer to the{" "}
              <Link
                to="/RefundPolicy"
                className="text-primary-600 hover:underline"
              >
                Refund Policy
              </Link>{" "}
              before making any purchase.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            6. Termination & Suspension
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              We may suspend or terminate your access (in whole or part) at any
              time, with or without notice, for violation of these Terms or for
              any reason.
            </li>
            <li>
              Upon termination, your rights to use the Platform immediately
              cease. You may lose access to content stored on the service.
            </li>
            <li>
              Provisions which by their nature should survive termination (e.g.
              indemnification, disclaimers, liability limits) shall survive.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            7. Disclaimers & Limitation of Liability
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>
              <strong>No warranty.</strong> The Platform is provided "as is" and
              "as available" without warranties of any kind, whether express or
              implied, including warranties of merchantability, fitness for a
              particular purpose, uptime, or non-infringement.
            </li>
            <li>
              <strong>Limitation of liability.</strong> To the maximum extent
              permitted under applicable law, we (and our officers, employees,
              agents) are not liable for any indirect, incidental, special,
              punitive, or consequential damages, or loss of profits, data, or
              goodwill, arising from or in connection with your use (or
              inability to use) the Platform, even if we have been advised of
              the possibility of such damages.
            </li>
          </ul>
          <p className="mb-6">
            Our total liability under these Terms for direct damages is capped
            at the amount you have paid us (if any) during the prior 12 months.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            8. Indemnification
          </h2>
          <p className="mb-3">
            You agree to defend, indemnify, and hold harmless QR Folio, its
            officers, directors, employees, agents, and affiliates from and
            against any claims, liabilities, losses, damages, demands, or
            expenses (including reasonable legal fees) arising from:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Your breach of these Terms,</li>
            <li>Your content submissions,</li>
            <li>Your misuse of the Platform,</li>
            <li>Your violation of third-party rights.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            9. Privacy & Data Protection
          </h2>
          <p className="mb-6">
            Your use of the Platform is also governed by our{" "}
            <button
              onClick={() => navigate("/PrivacyPolicy")}
              className="text-blue-600 hover:underline font-medium"
            >
              Privacy Policy
            </button>
            , which explains how we collect, use, store, and share your personal
            data. By using the Platform, you consent to the practices described
            in our Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            10. Third-Party Links & Services
          </h2>
          <p className="mb-6">
            The Platform may contain links to third-party websites, services, or
            APIs. These are provided for convenience. We do not endorse or
            control them, and are not responsible for their content,
            availability, or practices. Your use of such third-party services is
            at your own risk.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            11. Changes to Terms
          </h2>
          <p className="mb-6">
            We may revise or update these Terms from time to time. We will
            usually notify you (for example, via email or via the Platform). By
            continuing to use the Platform after changes become effective, you
            agree to be bound by the revised Terms.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">12. Miscellaneous</h2>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              <strong>Entire Agreement.</strong> These Terms, along with the
              Privacy Policy and any additional rules or policies we post,
              constitute the entire agreement between you and us regarding the
              Platform.
            </li>
            <li>
              <strong>Severability.</strong> If any provision of these Terms is
              held invalid or unenforceable, the remainder shall remain in full
              force.
            </li>
            <li>
              <strong>Waiver.</strong> Failure to enforce any right or provision
              does not constitute a waiver of such right.
            </li>
            <li>
              <strong>Assignment.</strong> You may not assign or transfer your
              rights under these Terms without our prior written consent. We may
              assign these Terms freely.
            </li>
          </ul>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              If you have questions about these Terms & Conditions, please
              contact us a:{" "}
              <a
                href="mailto:tech.qrfolio@gmail.com"
                className="text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                tech.qrfolio@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
