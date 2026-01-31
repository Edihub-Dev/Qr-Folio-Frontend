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
      pixelRatio = 3,
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const logoImageRef = useRef(null);
    const renderIdRef = useRef(0);

    // 🔥 expose canvas and data URL for download
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getDataUrl: (type = "image/png") =>
        canvasRef.current ? canvasRef.current.toDataURL(type) : null,
    }));

    useEffect(() => {
      if (!value || !canvasRef.current) return;

      const renderId = ++renderIdRef.current;
      const isStale = () => renderIdRef.current !== renderId;

      const scale = pixelRatio && pixelRatio > 0 ? pixelRatio : 1;
      const effectiveSize = size * scale;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set high-resolution canvas while keeping the same visual size
      canvas.width = effectiveSize;
      canvas.height = effectiveSize;

      QRCode.toCanvas(
        canvas,
        value,
        buildOptions({
          size: effectiveSize,
          margin,
          color,
          background,
          level,
        }),
        async (err) => {
          if (err) {
            console.error("QR render error", err);
          }
          if (err || isStale()) {
            return;
          }

          if (!logoSrc) return;

          const drawLogo = (img) => {
            if (!img || isStale() || !canvasRef.current) return;

            const logoSize = effectiveSize * logoSizeRatio;
            const x = (effectiveSize - logoSize) / 2;
            const y = (effectiveSize - logoSize) / 2;

            ctx.save();
            // 🔥 draw logo sharp with no extra white edge
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(img, x, y, logoSize, logoSize);
            ctx.restore();
          };

          let img = logoImageRef.current;

          if (img && img.src === logoSrc && img.complete) {
            drawLogo(img);
            return;
          }

          img = new Image();
          img.crossOrigin = "anonymous";
          img.src = logoSrc;
          logoImageRef.current = img;

          if (img.complete) {
            drawLogo(img);
            return;
          }

          img.onload = () => drawLogo(img);
        }
      );
    }, [
      value,
      size,
      level,
      margin,
      color,
      background,
      logoSrc,
      logoSizeRatio,
      pixelRatio,
    ]);

    return (
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
    );
  }
);

export default QRCodeGenerator;
