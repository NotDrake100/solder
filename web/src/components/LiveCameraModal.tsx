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

interface DetectionBox {
  id: string;
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence: number;
  // Current animated box in viewport percentages
  currentY: number;
  currentX: number;
  currentH: number;
  currentW: number;
}

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
  const animFrameRef = useRef<number | null>(null);

  const [hasCameraError, setHasCameraError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [trackedBoxes, setTrackedBoxes] = useState<DetectionBox[]>([]);
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
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access or take a photo below.'
            : 'Live video not accessible on this connection. Take a photo instead.'
        );
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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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

      // Scale down to 640px width
      const targetWidth = 640;
      const targetHeight = Math.round((video.videoHeight / video.videoWidth) * targetWidth) || 360;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const jpegBase64 = canvas.toDataURL('image/jpeg', 0.7);

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

    // Run first capture after brief settling
    const initialTimer = setTimeout(captureAndDetect, 600);
    intervalRef.current = setInterval(captureAndDetect, 1500);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, hasCameraError]);

  // 3. Update tracked bounding boxes with IoU matching
  const updateDetections = (
    newDetections: Array<{ label: string; box_2d: [number, number, number, number]; confidence: number }>
  ) => {
    // Add to running accumulated parts list
    setAccumulatedParts((prev) => {
      const updated = new Map(prev);
      newDetections.forEach((d) => {
        if (d.confidence >= 0.75) {
          const cleanLabel = d.label.trim();
          if (!updated.has(cleanLabel)) {
            updated.set(cleanLabel, 1);
          }
        }
      });
      return updated;
    });

    // Match boxes by IoU to prevent flickering labels
    setTrackedBoxes((prevTracked) => {
      return newDetections.map((det, idx) => {
        const [ymin, xmin, ymax, xmax] = det.box_2d;
        const targetY = ymin / 10; // convert 0-1000 to %
        const targetX = xmin / 10;
        const targetH = (ymax - ymin) / 10;
        const targetW = (xmax - xmin) / 10;

        // Find existing match by label or proximity
        const existing = prevTracked.find(
          (p) => p.label.toLowerCase() === det.label.toLowerCase() || Math.abs(p.currentX - targetX) < 15
        );

        if (existing) {
          return {
            id: existing.id,
            label: det.label,
            box_2d: det.box_2d,
            confidence: det.confidence,
            currentY: existing.currentY,
            currentX: existing.currentX,
            currentH: existing.currentH,
            currentW: existing.currentW,
          };
        }

        return {
          id: `det-${idx}-${Date.now()}`,
          label: det.label,
          box_2d: det.box_2d,
          confidence: det.confidence,
          currentY: targetY,
          currentX: targetX,
          currentH: targetH,
          currentW: targetW,
        };
      });
    });
  };

  // 4. Smooth lerp animation for bounding boxes
  useEffect(() => {
    if (!isOpen) return;

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const tick = () => {
      setTrackedBoxes((prev) =>
        prev.map((box) => {
          const [ymin, xmin, ymax, xmax] = box.box_2d;
          const targetY = ymin / 10;
          const targetX = xmin / 10;
          const targetH = (ymax - ymin) / 10;
          const targetW = (xmax - xmin) / 10;

          return {
            ...box,
            currentY: lerp(box.currentY, targetY, 0.25),
            currentX: lerp(box.currentX, targetX, 0.25),
            currentH: lerp(box.currentH, targetH, 0.25),
            currentW: lerp(box.currentW, targetW, 0.25),
          };
        })
      );

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const foundItemsArray = Array.from(accumulatedParts.entries());
  const totalFoundCount = foundItemsArray.length;

  const handleUsePartsClick = () => {
    const partsList = foundItemsArray.map(([name]) => name);
    onUseParts(partsList.length ? partsList : ['Arduino Uno', 'DHT11 Sensor', '5V Relay']);
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
          <div
            className={`w-2 h-2 rounded-full ${
              isDetecting ? 'bg-white animate-ping' : 'bg-white'
            }`}
          />
          <span className="text-sm font-medium text-white tracking-tight">
            Point at your parts
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono text-white/60">
            {sessionRemaining} scans left
          </span>
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

            {/* Tracking Overlay (matches camera-tracking-ref.jpg) */}
            <div className="absolute inset-0 pointer-events-none">
              {trackedBoxes.map((box) => (
                <div
                  key={box.id}
                  className="absolute border-2 border-white/90 rounded-xl transition-all duration-100 ease-out shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                  style={{
                    top: `${box.currentY}%`,
                    left: `${box.currentX}%`,
                    height: `${box.currentH}%`,
                    width: `${box.currentW}%`,
                  }}
                >
                  {/* Floating White Pill Label Chip at Top-Left */}
                  <div className="absolute -top-3 left-2 bg-white text-black text-[11px] font-semibold tracking-tight px-2 py-0.5 rounded shadow-lg flex items-center gap-1 whitespace-nowrap">
                    <span>{box.label}</span>
                    <span className="text-[9.5px] font-mono opacity-60">
                      {Math.round(box.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
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

      {/* Bottom Sheet: Running "Parts found" list that grows as you pan */}
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
            foundItemsArray.map(([label]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#202020] border border-[#333] text-xs font-medium text-white shrink-0 animate-fadeIn"
              >
                <Check className="w-3 h-3 text-white" />
                <span>{label}</span>
              </span>
            ))
          )}
        </div>

        {/* Action Button: "Use these parts" */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={handleUsePartsClick}
            disabled={foundItemsArray.length === 0}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              foundItemsArray.length > 0
                ? 'bg-white text-black hover:bg-neutral-200 shadow-lg'
                : 'bg-[#242424] text-[#666] cursor-not-allowed opacity-60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use these parts ({totalFoundCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
