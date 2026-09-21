import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeImage: React.FC<QRCodeImageProps> = ({ value, size = 180, className = '' }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    let isCurrent = true;

    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (isCurrent) setSvgHtml(svg);
      })
      .catch((err) => {
        console.warn('SVG QR generation fallback:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, [value]);

  const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <div
      className={`bg-white rounded-2xl p-2 flex items-center justify-center shadow-xs overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {svgHtml ? (
        <div
          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : (
        <img
          src={fallbackUrl}
          alt="QR-Code"
          className="w-full h-full object-contain rounded-lg"
        />
      )}
    </div>
  );
};
