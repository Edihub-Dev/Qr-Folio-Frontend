import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import QRCode from "qrcode";

const buildOptions = ({ size, margin, color, background, level }) => ({
  width: size,
  margin,
  errorCorrectionLevel: level,
  color: {
    dark: color,
    light: background,
  },
});

const drawRoundedRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const QRCodeGenerator = forwardRef(
  (
    {
      value,
      size = 200,
      level = "H",
      margin = 2,
      color = "#000000",
      background = "#FFFFFF",
      logoSrc,
      logoSizeRatio = 0.18,
      className = "",
    },
    ref
  ) => {
    const canvasRef = useRef(null);

    // 🔥 expose canvas for download
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    useEffect(() => {
      if (!value || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      QRCode.toCanvas(
        canvas,
        value,
        buildOptions({ size, margin, color, background, level }),
        async (err) => {
          if (err) {
            console.error("QR render error", err);
            return;
          }

          if (!logoSrc) return;

          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = logoSrc;

          img.onload = () => {
            const logoSize = size * logoSizeRatio;
            const x = (size - logoSize) / 2;
            const y = (size - logoSize) / 2;
            const radius = logoSize * 0.22;

            // 🔥 white background behind logo (scan safe)
            ctx.save();
            ctx.fillStyle = "#FFFFFF";
            drawRoundedRect(
              ctx,
              x - 6,
              y - 6,
              logoSize + 12,
              logoSize + 12,
              radius
            );
            ctx.fill();

            // 🔥 draw logo sharp
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(img, x, y, logoSize, logoSize);
            ctx.restore();
          };
        }
      );
    }, [value, size, level, margin, color, background, logoSrc, logoSizeRatio]);

    return (
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }
);

export default QRCodeGenerator;
