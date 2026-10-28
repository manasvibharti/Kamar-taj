import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, Zap, ShieldAlert, Sparkles, Send } from 'lucide-react';

export default function QRScannerView({ onScan, isPaused, disabled }) {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    // Check available video input devices
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration warning:', err);
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId) => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current && isScanningRef.current) {
        await stopScanner();
      }

      const qrScanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = qrScanner;

      const cameraConfig = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      await qrScanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!isScanningRef.current || isPaused) return;
          console.log('[Scanner] QR Code read:', decodedText);
          onScan(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame misses
        }
      );

      isScanningRef.current = true;
      setScannerStarted(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setCameraError(err.message || 'Could not access camera. Please allow camera permissions.');
      setScannerStarted(false);
      isScanningRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        isScanningRef.current = false;
        setScannerStarted(false);
      }
    }
  };

  const toggleScanner = () => {
    if (scannerStarted) {
      stopScanner();
    } else {
      startScanner(selectedCameraId);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      onScan(manualToken.trim());
      setManualToken('');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Live QR Scanner</h3>
            <p className="text-[11px] text-slate-400">Powered by html5-qrcode</p>
          </div>
        </div>

        <button
          onClick={toggleScanner}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            scannerStarted
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
              : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
          }`}
        >
          {scannerStarted ? (
            <>
              <CameraOff className="w-3.5 h-3.5" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              Start Camera
            </>
          )}
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center border border-slate-800">
        <div id="qr-reader" className="w-full h-full"></div>

        {/* Laser line overlay when scanning */}
        {scannerStarted && !isPaused && (
          <div className="laser-line pointer-events-none z-10"></div>
        )}

        {/* Paused 2-second indicator */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20 transition-all">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 animate-bounce">
              <Zap className="w-5 h-5" />
            </div>
            <p className="font-bold text-xs">Scan Processed</p>
            <p className="text-[10px] text-slate-300">Scanner paused 2s to prevent duplicate reads</p>
          </div>
        )}

        {/* Placeholder when camera not active */}
        {!scannerStarted && !cameraError && (
          <div className="text-center p-6 text-slate-400 z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-300">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-300 mb-1">Camera is currently idle</p>
            <p className="text-[11px] text-slate-500 max-w-xs mb-4">
              Click "Start Camera" above to scan dynamic student QR codes on phone or counter scanner.
            </p>
            <button
              onClick={() => startScanner(selectedCameraId)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/50"
            >
              Enable Camera
            </button>
          </div>
        )}

        {/* Camera error message */}
        {cameraError && (
          <div className="text-center p-6 text-rose-300 z-10 flex flex-col items-center max-w-xs">
            <ShieldAlert className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-xs font-bold text-rose-200 mb-1">Camera Permission Notice</p>
            <p className="text-[11px] text-rose-300/80 mb-3">{cameraError}</p>
            <p className="text-[10px] text-slate-400">
              You can still test scans instantly using the manual input below.
            </p>
          </div>
        )}
      </div>

      {/* Camera switcher if multiple cameras exist */}
      {cameras.length > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Camera source:</span>
          <select
            value={selectedCameraId}
            onChange={(e) => {
              setSelectedCameraId(e.target.value);
              if (scannerStarted) startScanner(e.target.value);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label || `Camera ${c.id.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manual Token Paste/Test (Essential for developer testing without webcams or across devices) */}
      <div className="pt-3 border-t border-slate-100">
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
            <span>Or Paste QR Token String (Direct Test):</span>
            <span className="text-[10px] font-normal text-indigo-600">Simulates physical scan</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!manualToken.trim() || disabled}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

