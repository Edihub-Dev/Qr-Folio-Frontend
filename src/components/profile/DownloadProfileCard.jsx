import React from "react";
import { Mail, Phone, MapPin, QrCode } from "lucide-react";
import clsx from "clsx";

const DownloadProfileCard = React.forwardRef(
  ({ user, qrValue, backgroundImage }, ref) => {
    const getInitials = (name) => {
      if (!name || name === "—") return "??";
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const avatar =
      user?.profilePhotoDataUri ||
      user?.profilePhoto ||
      `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23312e81'/><text x='50%' y='50%' font-family='Arial' font-weight='bold' font-size='80' text-anchor='middle' dy='.3em' fill='white'>${getInitials(
        user?.name || user?.companyName
      )}</text></svg>`;

    const handleImageError = (e) => {
      e.target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23312e81'/><text x='50%' y='50%' font-family='Arial' font-weight='bold' font-size='80' text-anchor='middle' dy='.3em' fill='white'>${getInitials(
        user?.name || user?.companyName
      )}</text></svg>`;
    };

    const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
    const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

    const activeTheme = user?.theme || 'default';

    const cardTheme = {
      default: {
        bg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
        bgBlobs: null,
        avatarBorder: 'border-indigo-300/60',
        designationText: 'text-indigo-200',
        iconColor: 'text-indigo-300',
        qrBorder: 'from-fuchsia-500 via-indigo-500 to-cyan-400',
        qrCardBg: 'bg-slate-900/90'
      },
      glassmorphism: {
        bg: 'bg-[#03001e]',
        bgBlobs: (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-pink-500/15 blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[100px]" />
          </>
        ),
        avatarBorder: 'border-white/40',
        designationText: 'text-pink-200',
        iconColor: 'text-pink-200',
        qrBorder: 'from-pink-400 via-purple-400 to-cyan-300',
        qrCardBg: 'bg-white/10 backdrop-blur-md'
      },
      'sleek-dark': {
        bg: 'bg-neutral-950',
        bgBlobs: (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[120px]" />
          </>
        ),
        avatarBorder: 'border-emerald-500/50',
        designationText: 'text-emerald-300',
        iconColor: 'text-emerald-300',
        qrBorder: 'from-emerald-500 via-teal-400 to-cyan-300',
        qrCardBg: 'bg-neutral-900/80'
      },
      'royal-gold': {
        bg: 'bg-[#0d0d0d]',
        bgBlobs: (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-yellow-600/10 blur-[120px]" />
          </>
        ),
        avatarBorder: 'border-amber-400/50',
        designationText: 'text-amber-200',
        iconColor: 'text-amber-300',
        qrBorder: 'from-amber-500 via-yellow-400 to-amber-300',
        qrCardBg: 'bg-[#141414]/90'
      }
    };

    const style = cardTheme[activeTheme] || cardTheme.default;

    return (
      <div
        ref={ref}
        className={clsx('relative', 'w-[1050px]', 'h-[600px]', 'overflow-hidden')}
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* DARK OVERLAY */}
        <div className={clsx('absolute', 'inset-0', 'bg-black/40')} />

        {/* CONTENT */}
        <div className={clsx('relative', 'z-10', 'flex', 'h-full', 'w-full', 'items-center', 'justify-between', 'px-20')}>
          {/* LEFT SIDE */}
          <div className={clsx('flex', 'items-center', 'gap-10')}>
            {/* AVATAR */}
            <div className="relative">
              <div className={clsx('h-60', 'w-60', 'rounded-full', 'bg-white/5', 'backdrop-blur-sm', 'border-4', style.avatarBorder, 'overflow-hidden', 'shadow-2xl')}>
                <img
                  src={avatar}
                  alt={user?.name}
                  className={clsx('h-full', 'w-full', 'object-cover')}
                  crossOrigin="anonymous"
                  onError={handleImageError}
                />
              </div>
            </div>

            {/* USER INFO */}
            <div className={clsx('text-white', 'space-y-2', 'max-w-xl')}>
              <h1 className={clsx('text-4xl', 'font-extrabold', 'tracking-tight')}>
                {user?.name || user?.companyName || "—"}
              </h1>

              <p className={clsx('text-xl', 'uppercase', 'tracking-wider', style.designationText)}>
                {user?.designation || "Professional"}
              </p>

              <div className={clsx('space-y-4', 'text-xl', 'text-white/95')}>
                {user?.email && (
                  <div className={clsx('flex', 'items-center', 'gap-3')}>
                    <Mail className={clsx('h-5', 'w-5', style.iconColor)} />
                    <span>{user.email}</span>
                  </div>
                )}

                {user?.phone && (
                  <div className={clsx('flex', 'items-center', 'gap-3')}>
                    <Phone className={clsx('h-5', 'w-5', style.iconColor)} />
                    <span>{user.phone}</span>
                  </div>
                )}

                {user?.address && (
                  <div className={clsx('flex', 'items-center', 'gap-3', 'max-w-md')}>
                    <MapPin className={clsx('h-5', 'w-5', style.iconColor)} />
                    <span>{user.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE – QR (IMAGE STYLE MATCH) */}
          <div className={clsx('flex', 'flex-col', 'items-center', 'gap-5')}>
            {/* Gradient Border */}
            <div className={clsx('rounded-[28px]', 'bg-gradient-to-br', style.qrBorder, 'p-[3px]', 'shadow-2xl')}>
              {/* White Card */}
              <div className={clsx('rounded-[24px]', 'backdrop-blur', 'p-4', style.qrCardBg)}>
                <img
                  src={`${base}/qrcode/image/${user?.authUserId || user?.id || user?._id}?v=${user?.updatedAt || 'stable'}`}
                  alt="QR Code"
                  style={{ width: "160px", height: "160px", imageRendering: "pixelated" }}
                  className="rounded-xl"
                  crossOrigin="anonymous"
                  loading="eager"
                />
              </div>
            </div>

            {/* POWERED BY */}
            <div className={clsx('text-center', 'text-[0.7rem]', 'font-semibold', 'text-slate-400')}>
              <span className={clsx('mt-2', 'inline-flex', 'items-center', 'gap-2', 'text-slate-300', 'transition-colors', 'hover:text-indigo-300')}>
                <QrCode className={clsx('h-4', 'w-4')} />
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
