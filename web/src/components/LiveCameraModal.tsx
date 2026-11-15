import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  TrackedMarker,
  RawDetection,
  mergeDetections,
  trackMarkers,
  getVisibleMarkers,
  preventLabelOverlap,
  dedupePartsList,
  FoundPartItem,
} from '../utils/cameraTracking';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseParts: (parts: string[]) => void;
  onUploadFallback?: (file: File) => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onUseParts,
  onUploadFallback,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);

  const [hasCameraError, setHasCameraError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [trackedMarkers, setTrackedMarkers] = useState<TrackedMarker[]>([]);
  const [accumulatedParts, setAccumulatedParts] = useState<Map<string, number>>(new Map());
  const [sessionRemaining, setSessionRemaining] = useState(40);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initialize Camera Stream
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setHasCameraError(false);
    setErrorMessage('');

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not available in this browser or over insecure HTTP.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        if (!mounted) return;
        console.warn('Camera stream error:', err);
        setHasCameraError(true);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Camera access is blocked. Allow it in your browser settings, or upload a photo.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('No camera found on this device.');
        } else {
          setErrorMessage('Live video not accessible on this connection. Take a photo instead.');
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen]);

  // 2. Periodic Frame Capture & Gemini Vision Call (~1.5s interval)
  useEffect(() => {
    if (!isOpen || hasCameraError) return;

    let inFlight = false;

    const captureAndDetect = async () => {
      if (inFlight || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2) return; // HAVE_CURRENT_DATA

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // QA-R5 #1: Capture exactly the visible object-fit: cover crop region
      const container = video.parentElement || video;
      const cw = container.clientWidth || window.innerWidth;
      const ch = container.clientHeight || window.innerHeight;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      let sx = 0;
      let sy = 0;
      let sw = vw;
      let sh = vh;

      if (cw > 0 && ch > 0 && vw > 0 && vh > 0) {
        const containerAspect = cw / ch;
        const videoAspect = vw / vh;
        if (containerAspect > videoAspect) {
          // Container is wider: crop top and bottom of video
          sh = vw / containerAspect;
          sy = (vh - sh) / 2;
        } else {
          // Container is taller: crop left and right of video (portrait mobile)
          sw = vh * containerAspect;
          sx = (vw - sw) / 2;
        }
      }

      // Scale down to 512px width for fast Gemini vision detection (q0.6)
      const targetWidth = 512;
      const targetHeight = Math.round((sh / sw) * targetWidth) || 512;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      const jpegBase64 = canvas.toDataURL('image/jpeg', 0.6);

      inFlight = true;
      setIsDetecting(true);

      try {
        const res = await fetch('/api/vision/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: jpegBase64 }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.sessionRemaining !== undefined) {
            setSessionRemaining(data.sessionRemaining);
          }
          if (Array.isArray(data.detections)) {
            updateDetections(data.detections);
          }
        }
      } catch (err) {
        console.warn('Vision detection fetch error:', err);
      } finally {
        inFlight = false;
        setIsDetecting(false);
      }
    };

    // Run first capture immediately once stream starts
    const initialTimer = setTimeout(captureAndDetect, 120);
    intervalRef.current = setInterval(captureAndDetect, 1500);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, hasCameraError]);

  // 3. Update tracked markers with proximity/label matching and chip collision avoidance
  const updateDetections = (
    newDetections: RawDetection[]
  ) => {
    // Spatial merge: merge detections with same canonical name whose boxes overlap
    // or whose centers are within ~25% frame width into a single marker at the merged box center
    const merged = mergeDetections(newDetections);

    // Update running accumulated parts with genuinely separate objects
    setAccumulatedParts((prev) => {
      const updated = new Map<string, number>(prev);
      const confident = merged.filter((d) => d.confidence >= 0.6);
      const countsInFrame = new Map<string, number>();

      confident.forEach((d) => {
        countsInFrame.set(d.canonicalName, (countsInFrame.get(d.canonicalName) || 0) + 1);
      });

      countsInFrame.forEach((count, canonicalName) => {
        const existing = updated.get(canonicalName) || 0;
        updated.set(canonicalName, Math.max(existing, count));
      });

      return updated;
    });

    // Track markers across frames with exponential smoothing and 2-consecutive detection gating
    setTrackedMarkers((prevTracked) => {
      const nextTracked = trackMarkers(prevTracked, merged);
      return preventLabelOverlap(nextTracked);
    });
  };

  if (!isOpen) return null;

  const foundItemsArray: FoundPartItem[] = dedupePartsList(
    Array.from(accumulatedParts.entries()).map(([canonicalName, count]) => ({
      canonicalName,
      count,
    }))
  );
  const totalFoundCount = foundItemsArray.length;

  const handleUsePartsClick = () => {
    const partsList = foundItemsArray.map((item) => item.displayText);
    onUseParts(partsList.length ? partsList : ['Arduino Uno', 'DHT11 Sensor', '5V Relay Module']);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFallback) {
      onUploadFallback(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none animate-fadeIn">
      {/* Hidden Frame Canvas for Grab */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar */}
      <div className="h-14 shrink-0 px-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/40 text-white/80 hover:text-white backdrop-blur-md transition cursor-pointer"
          title="Close camera"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white tracking-tight">
            Point at your parts
          </span>
        </div>

        <div className="text-right">
          {sessionRemaining < 5 && (
            <span className="text-[11px] font-mono text-white/60">
              {sessionRemaining} scans left
            </span>
          )}
        </div>
      </div>

      {/* Camera Viewport or Fallback */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {hasCameraError ? (
          /* Graceful Fallback Card */
          <div className="max-w-sm mx-4 p-6 rounded-2xl bg-[#161616] border border-[#333] text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#262626] border border-[#444] mx-auto flex items-center justify-center text-[#d4d4d4]">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Live Camera Unavailable</h3>
              <p className="text-xs text-[#888] mt-1 leading-relaxed">
                {errorMessage || 'Camera access requires permission or HTTPS.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo / Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl text-xs text-[#888] hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Live Video Stream with Rounded White Tracking Overlay */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Tracking Overlay with Center Markers & Side Chips (QA-CAMERA-MARKERS) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {getVisibleMarkers(trackedMarkers).map((marker) => {
                const isHighConf = marker.confidence >= 0.6;
                const isLeft = marker.x > 70;

                return (
                  <div
                    key={marker.id}
                    className="absolute transition-all duration-350 ease-out select-none pointer-events-none"
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      transform: 'translate(-50%, -50%)',
                      opacity: marker.missCount === 0 ? 1 : marker.missCount === 1 ? 0.4 : 0.2,
                    }}
                  >
                    {isHighConf ? (
                      /* High-confidence (>= 0.6): Hollow rounded square (40px, 10px radius) + tiny centre triangle + side label chip */
                      <div className="relative flex items-center justify-center">
                        {/* 40px rounded square */}
                        <div className="w-10 h-10 rounded-[10px] border-2 border-white bg-black/35 backdrop-blur-[2px] flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.25)]">
                          {/* Tiny 8px white triangle glyph in centre */}
                          <svg width="8" height="8" viewBox="0 0 8 8" className="fill-white shrink-0">
                            <polygon points="4,1 7,7 1,7" />
                          </svg>
                        </div>

                        {/* Side label chip with 1px hairline */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 flex items-center ${
                            isLeft ? 'right-full flex-row-reverse pr-1' : 'left-full flex-row pl-1'
                          }`}
                          style={{
                            marginTop: `${marker.nudgeY || 0}px`,
                            transition: 'margin-top 200ms ease-out',
                          }}
                        >
                          {/* 1px hairline connector */}
                          <div className="w-2.5 h-[1px] bg-white/60 shrink-0" />
                          {/* White label chip */}
                          <div className="bg-white text-black text-[12px] font-semibold tracking-tight px-2 py-0.5 rounded-[6px] shadow-lg flex items-center gap-1.5 whitespace-nowrap ml-1 mr-1">
                            <span>{marker.label}</span>
                            <span className="text-[10px] font-mono opacity-60">
                              {Math.round(marker.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Low-confidence (< 0.6): Just tiny faint white triangle glyph on its own */
                      <div className="w-3 h-3 flex items-center justify-center opacity-40">
                        <svg width="8" height="8" viewBox="0 0 8 8" className="fill-white">
                          <polygon points="4,1 7,7 1,7" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subtle Crosshairs in center */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-4 h-4 border-t border-l border-white/30" />
              <div className="w-4 h-4 border-t border-r border-white/30" />
              <div className="w-4 h-4 border-b border-l border-white/30" />
              <div className="w-4 h-4 border-b border-r border-white/30" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet: Running "Parts found" list (hidden when camera has error per QA-BREAK B5) */}
      {!hasCameraError && (
        <div className="shrink-0 p-4 bg-[#141414] border-t border-[#262626] z-20 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">Parts found</span>
              <span className="text-[11px] font-mono text-[#888]">
                ({totalFoundCount})
              </span>
            </div>

            <div className="text-[11px] text-[#666]">
              Pan slowly across your desk
            </div>
          </div>

          {/* Found Parts horizontal chip list */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none min-h-[34px]">
            {foundItemsArray.length === 0 ? (
              <div className="text-xs text-[#666] italic flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#888]" />
                <span>Scanning for Arduino, sensors, relays...</span>
              </div>
            ) : (
              foundItemsArray.map((item) => (
                <span
                  key={item.canonicalName}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#202020] border border-[#333] text-xs font-medium text-white shrink-0 animate-fadeIn"
                >
                  <Check className="w-3 h-3 text-white" />
                  <span>{item.displayText}</span>
                </span>
              ))
            )}
          </div>

          {/* Action Button: "Use these parts" */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleUsePartsClick}
              disabled={foundItemsArray.length === 0}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center cursor-pointer ${
                foundItemsArray.length > 0
                  ? 'bg-white text-black hover:bg-neutral-200 shadow-lg'
                  : 'bg-[#242424] text-[#666] cursor-not-allowed opacity-60'
              }`}
            >
              <span>Use these parts ({totalFoundCount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
