import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ 
  value, 
  size = 200, 
  level = 'M', 
  margin = 4,
  color = '#000000',
  background = '#FFFFFF',
  className = ''
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: margin,
          color: {
            dark: color,
            light: background,
          },
          errorCorrectionLevel: level,
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [value, size, level, margin, color, background]);

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full h-auto ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default QRCodeGenerator;
