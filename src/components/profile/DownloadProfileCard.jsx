import React, { Suspense } from "react";
import { Mail, Phone, MapPin, QrCode } from "lucide-react";
import QRCodeGenerator from "../qr/QRCodeGenerator";

const DownloadProfileCard = React.forwardRef(
  ({ user, qrValue, backgroundImage }, ref) => {
    const avatar =
      user?.profilePhotoDataUri ||
      user?.profilePhoto ||
      "/assets/avatar-placeholder.png";

    return (
      <div
        ref={ref}
        className="relative w-[1050px] h-[600px] overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/40" />

        {/* CONTENT */}
        <div className="relative z-10 flex h-full w-full items-center justify-between px-20">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-10">
            {/* AVATAR */}
            <div className="relative">
              <div className="h-60 w-60 rounded-full bg-white/10 backdrop-blur border-4 border-indigo-300/60 overflow-hidden">
                <img
                  src={avatar}
                  alt={user?.name}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            </div>

            {/* USER INFO */}
            <div className="text-white space-y-2 max-w-xl">
              <h1 className="text-4xl font-extrabold tracking-tight">
                {user?.name || user?.companyName || "—"}
              </h1>

              <p className="text-xl text-indigo-200 uppercase tracking-wider">
                {user?.designation || "Professional"}
              </p>

              <div className="space-y-4 text-xl text-white/95">
                {user?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-indigo-300" />
                    <span>{user.email}</span>
                  </div>
                )}

                {user?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-indigo-300" />
                    <span>{user.phone}</span>
                  </div>
                )}

                {user?.address && (
                  <div className="flex items-center gap-3 max-w-md">
                    <MapPin className="h-5 w-5 text-indigo-300" />
                    <span>{user.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE – QR (IMAGE STYLE MATCH) */}
          <div className="flex flex-col items-center gap-5">
            {/* Gradient Border */}
            <div className="rounded-[28px] bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 p-[3px] shadow-2xl">
              {/* White Card */}
              <div className="rounded-[24px] bg-slate-900/90 backdrop-blur p-4">
                <QRCodeGenerator
                  value={qrValue}
                  size={50}
                  level="H"
                  background="#ffffff"
                  color="#000000"
                  logoSrc="/assets/QrLogo.webp"
                  logoSizeRatio={0.2}
                  className="rounded-xl"
                  data-qr-code="true"
                />
              </div>
            </div>

            {/* POWERED BY */}
            <div className="text-center text-[0.7rem] font-semibold text-slate-400">
              <span className="mt-2 inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-indigo-300">
                <QrCode className="h-4 w-4" />
                Powered by QR Folio
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default DownloadProfileCard;
