import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import QRCode from "qrcode";

const buildOptions = ({ size, margin, color, background, level }) => ({
  width: size,
  margin,
  color: {
    dark: color,
    light: background,
  },
  errorCorrectionLevel: level,
});

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const r =
    typeof radius === "number"
      ? { tl: radius, tr: radius, br: radius, bl: radius }
      : { tl: 0, tr: 0, br: 0, bl: 0, ...(radius || {}) };

  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
};

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== "string") return null;
  let value = hex.trim();
  if (value.startsWith("#")) value = value.slice(1);
  if (value.length === 3) {
    value = value
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (value.length !== 6) return null;
  const num = Number.parseInt(value, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const rgbToHex = (r, g, b) => {
  const toHex = (v) => {
    const clamped = Math.max(0, Math.min(255, Math.round(v)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mixHex = (hex1, hex2, weight) => {
  const w = Math.max(0, Math.min(1, weight));
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return hex1;
  const r = c1.r * (1 - w) + c2.r * w;
  const g = c1.g * (1 - w) + c2.g * w;
  const b = c1.b * (1 - w) + c2.b * w;
  return rgbToHex(r, g, b);
};

const lightenHex = (hex, amount) => mixHex(hex, "#ffffff", amount);
const darkenHex = (hex, amount) => mixHex(hex, "#000000", amount);

const createGradient = (ctx, width, height, baseColor) => {
  const safeBase = baseColor || "#6366F1";
  const rgb = hexToRgb(safeBase);
  if (!rgb) {
    return null;
  }
  const start = lightenHex(safeBase, 0.35);
  const mid = safeBase;
  const end = darkenHex(safeBase, 0.3);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, start);
  gradient.addColorStop(0.5, mid);
  gradient.addColorStop(1, end);
  return gradient;
};

const QRCodeGenerator = React.forwardRef(
  (
    {
      value,
      size = 200,
      level = "M",
      margin = 4,
      color = "#000000",
      background = "#FFFFFF",
      className = "",
      logoSrc,
      logoSizeRatio = 0.22,
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [dataUrl, setDataUrl] = useState(null);

    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        getImage: () => imgRef.current,
        getDataUrl: () => dataUrl,
      }),
      [dataUrl]
    );

    useEffect(() => {
      let isActive = true;

      if (!value) {
        setDataUrl(null);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          ctx?.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
        return () => {
          isActive = false;
        };
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return () => {
          isActive = false;
        };
      }

      const options = buildOptions({ size, margin, color, background, level });

      const finalize = () => {
        if (!isActive) return;
        try {
          const url = canvas.toDataURL();
          setDataUrl(url);
        } catch (error) {
          console.error("QR Code data URL error:", error);
        }
      };

      QRCode.toCanvas(canvas, value, options, (error) => {
        if (error) {
          console.error("QR Code canvas error:", error);
          finalize();
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finalize();
          return;
        }

        if (logoSrc) {
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";
          logoImg.onload = () => {
            if (!isActive) return;
            const width = canvas.width || size;
            const height = canvas.height || size;
            const logoSize = size * logoSizeRatio;
            const x = (width - logoSize) / 2;
            const y = (height - logoSize) / 2;
            const radius = logoSize * 0.25;

            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.97)";
            drawRoundedRect(ctx, x, y, logoSize, logoSize, radius);
            ctx.fill();
            ctx.drawImage(logoImg, x, y, logoSize, logoSize);
            ctx.restore();

            finalize();
          };
          logoImg.onerror = () => {
            finalize();
          };
          logoImg.src = logoSrc;
        } else {
          finalize();
        }
      });

      return () => {
        isActive = false;
      };
    }, [value, size, level, margin, color, background, logoSrc, logoSizeRatio]);

    return (
      <div
        className={`relative inline-block ${className}`}
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
        {dataUrl && (
          <img
            ref={imgRef}
            src={dataUrl}
            alt="QR Code"
            className="h-full w-full max-w-full"
            style={{ width: size, height: size }}
            data-qr-code="true"
          />
        )}
      </div>
    );
  }
);

export default QRCodeGenerator;
