
import React from 'react';

interface SplashScreenProps {
  onStart: () => void;
  t: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, t }) => {
  return (
    <div className="bg-background-dark h-full flex flex-col items-center justify-between transition-colors duration-500 py-12 px-6">
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        <div className="relative w-32 h-32 mb-8 group">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="relative flex items-center justify-center w-full h-full bg-background-dark border-2 border-primary/30 rounded-full shadow-2xl overflow-hidden">
            <span className="material-symbols-outlined text-primary text-[64px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>camera</span>
            <div className="absolute top-8 right-8 w-2 h-2 bg-accent-orange rounded-full"></div>
          </div>
        </div>
        <h1 className="text-white tracking-tight text-[36px] font-bold leading-tight text-center pb-2 font-display">
          Calorie<span className="text-primary">AI</span>
        </h1>
        <p className="text-white/60 text-lg font-medium leading-normal text-center max-w-[280px]">
          {t.tagline}
        </p>
      </div>

      <div className="w-full max-w-[480px] pb-10">
        <p className="text-white/40 text-sm font-normal leading-normal pb-6 text-center uppercase tracking-[0.2em]">
          {t.motto}
        </p>
        <button 
          onClick={onStart}
          className="w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 bg-primary text-[#102216] text-lg font-bold shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:scale-[0.98] transition-transform flex"
        >
          {t.getStarted}
        </button>
        <div className="flex justify-center mt-8 space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
