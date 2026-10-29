import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, Zap, ShieldAlert, Upload, Image, Send, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function QRScannerView({ onScan, onScanSuccess, isPaused, disabled }) {
  const handleScanCallback = onScan || onScanSuccess;
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [fileScanError, setFileScanError] = useState(null);
  const [fileScanSuccess, setFileScanSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'

  const html5QrCodeRef = useRef(null);
  const fileQrScannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check available video input devices and attempt auto-start
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available on phones/tablets
          const backCam = devices.find((d) => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          const chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);
          startScanner(chosenId);
        } else {
          setCameraError('No video camera detected on this system. You can upload a photo of the QR or enter the code below.');
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration error:', err);
        setCameraError('Camera access requires permission. Please allow browser camera access in your address bar.');
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

      // Dynamic QR box sizing (75% of viewfinder) for maximum detection angle
      const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.floor(minEdge * 0.75);
        return { width: size, height: size };
      };

      await qrScanner.start(
        cameraConfig,
        {
          fps: 15, // Higher frame rate for faster snap
          qrbox: qrboxFunction,
          aspectRatio: 1.0,
          videoConstraints: {
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
            facingMode: 'environment'
          }
        },
        (decodedText) => {
          if (!isScanningRef.current || isPaused) return;
          console.log('[Scanner] QR Code detected:', decodedText);
          if (handleScanCallback) handleScanCallback(decodedText);
        },
        () => {
          // Frame misses are normal while seeking
        }
      );

      isScanningRef.current = true;
      setScannerStarted(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setCameraError(err.message || 'Could not access camera. Please allow camera permissions in browser settings.');
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

  // Directly decode an uploaded photo / screenshot of the QR
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setFileScanError(null);
    setFileScanSuccess(false);

    try {
      if (!fileQrScannerRef.current) {
        fileQrScannerRef.current = new Html5Qrcode('qr-reader-file-helper');
      }

      const decodedText = await fileQrScannerRef.current.scanFile(file, true);
      setFileScanSuccess(true);
      if (handleScanCallback) handleScanCallback(decodedText);
    } catch (err) {
      console.error('Image file scan error:', err);
      setFileScanError('Could not read QR code from this photo. Make sure the QR code in the image is in focus, not glare-washed, and uncropped.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      if (handleScanCallback) handleScanCallback(manualToken.trim());
      setManualToken('');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Hidden container for file decoding */}
      <div id="qr-reader-file-helper" className="hidden"></div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'camera' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'upload' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo / Screenshot</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'manual' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Token String</span>
          </button>
        </div>

        {activeTab === 'camera' && (
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
                <span>Stop</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: LIVE CAMERA VIEWPORT */}
      {activeTab === 'camera' && (
        <div className="space-y-3">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center border border-slate-800">
            <div id="qr-reader" className="w-full h-full"></div>

            {/* Laser Line Overlay */}
            {scannerStarted && !isPaused && (
              <div className="laser-line pointer-events-none z-10"></div>
            )}

            {/* Paused Indicator */}
            {isPaused && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs">Scan Processed</p>
                <p className="text-[10px] text-slate-300">Click "Ready for Next Student" on the right to scan again</p>
              </div>
            )}

            {/* Idle Placeholder */}
            {!scannerStarted && !cameraError && (
              <div className="text-center p-6 text-slate-400 z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-300">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-300 mb-1">Camera is idle</p>
                <p className="text-[11px] text-slate-500 max-w-xs mb-4">
                  Click "Enable Camera" to scan student QR codes live.
                </p>
                <button
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/50"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Error Message */}
            {cameraError && (
              <div className="text-center p-6 text-rose-300 z-10 flex flex-col items-center max-w-xs">
                <ShieldAlert className="w-8 h-8 text-rose-400 mb-2" />
                <p className="text-xs font-bold text-rose-200 mb-1">Camera Notice</p>
                <p className="text-[11px] text-rose-300/80 mb-3">{cameraError}</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-3 py-1.5 bg-rose-900/40 border border-rose-700/60 text-white rounded-lg text-xs font-semibold hover:bg-rose-800/50"
                >
                  Switch to Photo Upload
                </button>
              </div>
            )}
          </div>

          {/* Camera switcher if multiple exist */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Camera lens:</span>
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

          {/* Helpful scanning tip */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Photo scanning tip:</span> If scanning a phone screen photo or screenshot, hold the phone <strong>6–10 inches away</strong> (avoid being too close so the camera stays in focus) and lower the screen brightness slightly to prevent glare.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD PHOTO / SCREENSHOT FILE */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
              <Image className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Upload Photo or Screenshot of QR</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Select any photo taken of the student's QR code. Decodes with 100% accuracy with zero camera glare.
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Choose Image File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {fileScanSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Photo decoded successfully! Checking database records...</span>
            </div>
          )}

          {fileScanError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fileScanError}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANUAL TOKEN STRING */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <p className="text-xs text-slate-500">
            Paste the raw token string generated by the student account to simulate a physical scanner gun.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!manualToken.trim() || disabled}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
