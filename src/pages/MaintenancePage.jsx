import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import PageSEO from "../components/PageSEO";

const MaintenancePage = () => {
  return (
    <>
      <PageSEO
        title="Maintenance"
        description="QR Folio is temporarily under maintenance while we roll out new updates and improvements."
        canonicalPath="/"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6 py-12 text-white">
        <div className="max-w-3xl w-full text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-300">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">
            We&rsquo;re polishing things up
          </h1>
          <p className="mt-5 text-lg text-slate-200/80">
            Our site is currently undergoing scheduled maintenance to bring you
            new features and improvements. Please check back in a little while.
          </p>
          <div className="mt-10 inline-flex items-center gap-3 rounded-2xl border border-orange-500/40 bg-orange-500/10 px-6 py-3 text-sm uppercase tracking-[0.25em] text-orange-200">
            <Clock className="h-4 w-4" />
            Under Maintenance
          </div>
          <p className="mt-10 text-sm text-slate-300/60">
            If you need urgent assistance, contact us at
            <a
              href="mailto:support@qrfolio.net"
              className="ml-1 text-orange-200 underline"
            >
              tech.qrfolio@gmail.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default MaintenancePage;
