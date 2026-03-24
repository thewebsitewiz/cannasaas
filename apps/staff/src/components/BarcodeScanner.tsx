import { useEffect, useRef, useState } from 'react';
import { Camera, X, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (manualMode) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const BarcodeDetectorAPI = (window as any).BarcodeDetector;
        if (!BarcodeDetectorAPI) {
          setError('BarcodeDetector not supported in this browser. Use manual entry.');
          setManualMode(true);
          return;
        }

        const detector = new BarcodeDetectorAPI({ formats: ['ean_13', 'code_128', 'qr_code'] });

        intervalId = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              clearInterval(intervalId);
              stopStream();
              onScan(barcodes[0].rawValue);
            }
          } catch {}
        }, 500);
      } catch (err: any) {
        setError('Camera access denied. Use manual entry instead.');
        setManualMode(true);
      }
    };

    start();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      stopStream();
    };
  }, [manualMode, onScan]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleManualSubmit = () => {
    const val = manualInput.trim();
    if (val) {
      onScan(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Scan Barcode</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { stopStream(); setManualMode(!manualMode); }}
              className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
              title={manualMode ? 'Switch to camera' : 'Manual entry'}
            >
              {manualMode ? <Camera size={20} /> : <Keyboard size={20} />}
            </button>
            <button
              onClick={() => { stopStream(); onClose(); }}
              className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {manualMode ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500">Enter barcode or SKU manually:</p>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              autoFocus
              placeholder="Barcode / SKU"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              Look Up
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full aspect-square object-cover"
              playsInline
              muted
            />
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/3 border-2 border-white/70 rounded-lg">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/60 animate-pulse" />
              </div>
            </div>
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
