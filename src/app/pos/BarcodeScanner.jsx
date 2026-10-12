import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import '../pos/POS.css';

export default function BarcodeScanner({ onScanSuccess, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  const onScanRef = useRef(onScanSuccess);
  onScanRef.current = onScanSuccess;

  useEffect(() => {
    const host = scannerRef.current;
    const target = document.createElement("div");
    target.id = `scanner-${Math.random().toString(36).slice(2)}`;
    host.appendChild(target);
    const html5QrCode = new Html5Qrcode(target.id);
    let cancelled = false;
    let handled = false;

    const startPromise = html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.777778 },
        (decodedText) => {
          if (handled) return;
          handled = true;
          onScanRef.current(decodedText);
        },
        () => {}
      )
      .then(() => {
        if (!cancelled) setScanning(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError("No se pudo acceder a la cámara. Verificá los permisos.");
        console.error(err);
      });

    return () => {
      cancelled = true;
      target.style.display = "none";
      startPromise.then(async () => {
        try {
          if (html5QrCode.isScanning) await html5QrCode.stop();
          html5QrCode.clear();
        } catch (err) {
          console.error(err);
        }
        target.remove();
      });
    };
  }, []);

  return (
    <div className="scanner-container">
      <div ref={scannerRef}></div>
      {error && <p className="scanner-error">{error}</p>}
      {!scanning && !error && <p className="scanner-loading">Iniciando cámara...</p>}
    </div>
  );
}