
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { analyzeFoodImage } from '../services/geminiService';
import { MealAnalysis } from '../types';

interface CameraScreenProps {
  onBack: () => void;
  onResult: (result: MealAnalysis) => void;
  t: any;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onBack, onResult, t }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [flashOn, setFlashOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      const track = newStream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const newFlashState = !flashOn;
        await track.applyConstraints({
          advanced: [{ torch: newFlashState }]
        } as any);
        setFlashOn(newFlashState);
      } catch (err) {
        console.error("Error toggling flash:", err);
      }
    }
  };

  const processImage = async (dataUrl: string) => {
    setIsAnalyzing(true);
    try {
      const base64Image = dataUrl.split(',')[1];
      const result = await analyzeFoodImage(base64Image);
      onResult({ ...result, imageUrl: dataUrl });
    } catch (err) {
      console.error("Analysis failed:", err);
      alert(t.language === 'Chinese' ? "无法识别食物，请重试。" : "Could not identify food. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      if (flashOn) {
        toggleFlash();
      }

      await processImage(dataUrl);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await processImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      <div className="relative z-30 flex items-center p-4 pt-12 justify-between">
        <button 
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-white text-sm font-bold leading-tight tracking-wider uppercase">AI {t.scanFood}</h2>
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-xs text-white/80 font-medium">LIVE</span>
          </div>
        </div>
        <button className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
          <span className="material-symbols-outlined text-white">help</span>
        </button>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="relative w-full aspect-square max-w-[320px]">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
          
          <div className="absolute top-[40%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#13ec5b] animate-[bounce_2s_infinite]"></div>
          
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-black text-primary tracking-widest uppercase">{t.analyzing}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-30 bg-gradient-to-t from-black/90 via-black/40 to-transparent pb-10 pt-6 px-4">
        <h4 className="text-white text-sm font-medium leading-normal tracking-wide text-center mb-4 opacity-90">
          {t.pointCamera}
        </h4>

        <div className="flex max-w-[280px] mx-auto mb-8">
          <div className="flex h-11 flex-1 items-center justify-center rounded-full bg-black/60 backdrop-blur-xl p-1 border border-white/10">
            <button 
              onClick={() => setMode('single')}
              className={`flex-1 h-full rounded-full text-xs font-bold transition-all ${mode === 'single' ? 'bg-primary text-black' : 'text-white/70'}`}
            >
              {t.language === 'Chinese' ? '单品' : 'Single'}
            </button>
            <button 
              onClick={() => setMode('multi')}
              className={`flex-1 h-full rounded-full text-xs font-bold transition-all ${mode === 'multi' ? 'bg-primary text-black' : 'text-white/70'}`}
            >
              {t.language === 'Chinese' ? '多品' : 'Multi'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between max-w-xs mx-auto mb-4 px-4">
          <button 
            onClick={handleGalleryClick}
            className="flex shrink-0 items-center justify-center rounded-xl size-12 bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-white text-2xl">photo_library</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-4 border-primary ${isAnalyzing ? 'animate-pulse' : 'animate-ping opacity-20'}`}></div>
            <button 
              onClick={captureAndAnalyze}
              disabled={isAnalyzing}
              className="relative flex shrink-0 items-center justify-center rounded-full size-20 bg-white p-1 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full border-4 border-black/10 flex items-center justify-center">
                {isAnalyzing ? (
                   <div className="size-8 bg-primary rounded-sm animate-pulse"></div>
                ) : (
                  <div className="size-16 rounded-full border-2 border-black/5 flex items-center justify-center bg-slate-50">
                    <div className="size-14 rounded-full bg-white shadow-inner"></div>
                  </div>
                )}
              </div>
            </button>
          </div>

          <button 
            onClick={toggleFlash}
            disabled={!hasTorch}
            className={`flex shrink-0 items-center justify-center rounded-full size-12 backdrop-blur-md border border-white/20 active:scale-90 transition-all ${flashOn ? 'bg-primary text-black' : 'bg-white/10 text-white'} ${!hasTorch ? 'opacity-30' : ''}`}
          >
            <span className="material-symbols-outlined text-2xl">{flashOn ? 'flash_off' : 'flash_on'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraScreen;
