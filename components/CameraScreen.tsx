
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
  const [isFlashing, setIsFlashing] = useState(false);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [flashOn, setFlashOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  
  // Lens and Zoom state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });
  const [currentZoom, setCurrentZoom] = useState(1);
  const [supportsZoom, setSupportsZoom] = useState(false);

  const getDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { 
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
        // iOS fix: Explicitly call play() after setting srcObject
        videoRef.current.play().catch(e => console.warn("Auto-play blocked, waiting for interaction", e));
      }

      const track = newStream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities() as any;
        setHasTorch(!!capabilities.torch);

        if (capabilities.zoom) {
          setSupportsZoom(true);
          setZoomRange({
            min: capabilities.zoom.min || 1,
            max: capabilities.zoom.max || 1,
            step: capabilities.zoom.step || 0.1
          });
          setCurrentZoom(capabilities.zoom.min || 1);
        } else {
          setSupportsZoom(false);
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, [stream]);

  useEffect(() => {
    getDevices().then(() => {
        startCamera();
    });
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const switchCamera = () => {
    if (devices.length < 2) return;
    const nextIndex = (currentDeviceIndex + 1) % devices.length;
    setCurrentDeviceIndex(nextIndex);
    startCamera(devices[nextIndex].deviceId);
  };

  const handleZoomChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentZoom(value);
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: value }]
          } as any);
        } catch (err) {
          console.error("Error applying zoom:", err);
        }
      }
    }
  };

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
      onResult({
        name: t.language === 'Chinese' ? "识别失败" : "Recognition Failed",
        totalCalories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        ingredients: [],
        imageUrl: dataUrl
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualEntry = () => {
    onResult({
      name: t.language === 'Chinese' ? "手动输入" : "Manual Entry",
      totalCalories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      ingredients: [],
      imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=400&auto=format&fit=crop"
    });
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    // Trigger Shutter Effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // iOS READY STATE CHECK: 4 means HAVE_ENOUGH_DATA
    if (videoRef.current.readyState < 2) {
      console.warn("Video not ready for capture");
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (context && videoRef.current) {
      const MAX_SIZE = 1024;
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      
      // Safety check for 0 dimensions on mobile
      if (width === 0) width = 1024;
      if (height === 0) height = 1024;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvasRef.current.width = width;
      canvasRef.current.height = height;
      context.drawImage(videoRef.current, 0, 0, width, height);
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
      
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
      const img = new Image();
      img.onload = async () => {
        if (!canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        if (!context) return;

        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        context.drawImage(img, 0, 0, width, height);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
        await processImage(dataUrl);
      };
      img.src = event.target?.result as string;
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
      
      {/* Shutter Flash Overlay */}
      {isFlashing && <div className="absolute inset-0 bg-white z-50 animate-shutter pointer-events-none"></div>}
      
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Top Controls */}
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
        <button 
          onClick={handleManualEntry}
          className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">edit_note</span>
        </button>
      </div>

      {/* Camera Preview Overlay */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="relative w-full aspect-square max-w-[320px]">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
          
          <div className="absolute top-[40%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#13ec5b] animate-[bounce_2s_infinite]"></div>
          
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm z-40">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-black text-primary tracking-widest uppercase">{t.analyzing}</span>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Zoom Slider */}
        {supportsZoom && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 bg-black/20 backdrop-blur-md p-3 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-white text-sm">add</span>
            <div className="h-40 w-8 flex items-center justify-center relative">
               <input 
                type="range" 
                min={zoomRange.min}
                max={zoomRange.max}
                step={zoomRange.step}
                value={currentZoom}
                onChange={handleZoomChange}
                className="appearance-none w-40 h-1 bg-white/20 rounded-lg -rotate-90 origin-center cursor-pointer accent-primary"
                style={{ position: 'absolute' }}
              />
            </div>
            <span className="material-symbols-outlined text-white text-sm">remove</span>
            <div className="text-[10px] font-bold text-primary mt-1">{currentZoom.toFixed(1)}x</div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
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

          <div className="relative flex items-center justify-center gap-4">
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

            {/* Lens Switch Button */}
            {devices.length > 1 && (
              <button 
                onClick={switchCamera}
                className="absolute -right-16 flex shrink-0 items-center justify-center rounded-full size-12 bg-white/10 backdrop-blur-md border border-white/20 active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-white text-2xl">flip_camera_ios</span>
              </button>
            )}
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
