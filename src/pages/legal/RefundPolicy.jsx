import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "../../utils/motion";
import PageSEO from "../../components/seo/PageSEO";

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <PageSEO
        title="Refund & Cancellation Policy"
        description="Refund and cancellation policy for QR Folio digital services and subscriptions."
        canonicalPath="/RefundPolicy"
      />
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Refund & Cancellation Policy
            </h1>
          </div>

          <p className="text-gray-600 mb-8">
            At <strong>QrFolio</strong>, we strive to provide high-quality
            digital services and ensure customer satisfaction. Please read our
            refund and cancellation policy carefully before making a purchase.
          </p>

          <section className="space-y-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. General Policy
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  As a standard practice, QrFolio does not offer refunds once a
                  purchase has been made.
                </li>
                <li>
                  Refunds are only considered in exceptional cases, such as
                  duplicate payments or technical errors resulting in
                  non-delivery of services.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Cancellations
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  Cancellation requests must be raised within 7 days of placing
                  the order.
                </li>
                <li>
                  Once the service has been initiated, customized, or delivered,
                  cancellations will not be accepted.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. Damaged / Defective Deliverables
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  If you receive defective or incomplete digital deliverables,
                  please notify us within 7 days of purchase.
                </li>
                <li>
                  After verification, we may provide a replacement or
                  re-delivery of the service.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Third-Party Products / Services
              </h2>
              <p className="text-gray-700">
                If your purchase involves third-party tools, plugins, or
                services integrated with QrFolio, any warranty or refund claims
                must be directed to the respective provider.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Refund Timelines (If Applicable)
              </h2>
              <p className="text-gray-700">
                In rare cases where a refund is approved, it may take 5–7
                business days to process the refund and reflect in your account,
                depending on your payment method and bank.
              </p>
            </div>
          </section>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              For any refund or cancellation inquiries, please contact us at{" "}
              <a
                href="mailto:tech.qrfolio@gmail.com"
                className="text-primary-600 hover:underline font-medium"
              >
                tech.qrfolio@gmail.com
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicy;
