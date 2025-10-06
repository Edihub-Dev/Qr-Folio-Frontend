import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const QRCodeGenerator = ({
  value,
  size = 200,
  level = "M",
  margin = 4,
  color = "#000000",
  background = "#FFFFFF",
  className = "",
}) => {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let isActive = true;

    if (!value) {
      setDataUrl(null);
      return undefined;
    }

    const options = {
      width: size,
      margin,
      color: {
        dark: color,
        light: background,
      },
      errorCorrectionLevel: level,
    };

    QRCode.toDataURL(value, options, (error, url) => {
      if (error) {
        console.error("QR Code generation error:", error);
        if (canvasRef.current) {
          QRCode.toCanvas(canvasRef.current, value, options, () => {});
        }
        return;
      }
      if (isActive) {
        setDataUrl(url);
      }
    });

    return () => {
      isActive = false;
    };
  }, [value, size, level, margin, color, background]);

  if (dataUrl) {
    return (
      <img
        src={dataUrl}
        alt="QR Code"
        className={`max-w-full h-auto ${className}`}
        style={{ width: size, height: size }}
        data-qr-code="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full h-auto ${className}`}
      style={{ width: size, height: size }}
      data-qr-code="true"
    />
  );
};

export default QRCodeGenerator;
