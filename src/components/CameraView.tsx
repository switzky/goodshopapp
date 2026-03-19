import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Check } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Nie można uzyskać dostępu do kamery. Upewnij się, że masz podłączoną kamerę i udzieliłeś uprawnień.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        setIsCaptured(true);
        
        // Give a brief visual feedback before closing
        setTimeout(() => {
          onCapture(imageData);
        }, 600);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Camera Preview Area */}
      <div className="relative flex-grow overflow-hidden flex items-center justify-center bg-zinc-950">
        {error ? (
          <div className="p-8 text-center space-y-6 max-w-xs">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {error}
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-white/10 rounded-2xl font-medium hover:bg-white/20 transition-colors"
            >
              Zamknij
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay UI */}
            {!isCaptured && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                  animate={{ 
                    scale: [1.2, 1],
                    opacity: [0, 0.3]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    repeatType: 'reverse'
                  }}
                  className="w-48 h-48 border-2 border-emerald-500/50 rounded-3xl"
                />
              </div>
            )}
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Controls Area */}
      <div className="h-40 bg-black flex items-center justify-center relative px-6">
        <button
          onClick={capture}
          disabled={isCaptured || !!error}
          className={`
            relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all
            ${isCaptured 
              ? 'border-emerald-500 bg-emerald-500' 
              : 'border-white bg-white/10 hover:bg-white/20 active:scale-95'
            }
          `}
        >
          {isCaptured ? (
            <Check className="w-10 h-10 text-white" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
          
          {!isCaptured && !error && (
            <div className="absolute -inset-2 border border-white/20 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    </motion.div>
  );
};
