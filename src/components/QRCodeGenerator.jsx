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
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        return () => {
          isActive = false;
        };
      }

      const options = buildOptions({ size, margin, color, background, level });

      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, value, options, (error) => {
          if (error) {
            console.error("QR Code canvas error:", error);
          }
        });
      }

      QRCode.toDataURL(value, options, (error, url) => {
        if (error) {
          console.error("QR Code data URL error:", error);
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

    return (
      <>
        <canvas
          ref={canvasRef}
          className={`max-w-full h-auto ${className}`}
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
        {dataUrl && (
          <img
            ref={imgRef}
            src={dataUrl}
            alt="QR Code"
            className={`max-w-full h-auto ${className}`}
            style={{ width: size, height: size }}
            data-qr-code="true"
          />
        )}
      </>
    );
  }
);

export default QRCodeGenerator;
