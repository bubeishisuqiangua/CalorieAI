
import React from 'react';
import { MealAnalysis } from '../types';

interface AnalysisResultsProps {
  result: MealAnalysis;
  onSave: (meal: MealAnalysis) => void;
  onBack: () => void;
  t: any;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onSave, onBack, t }) => {
  return (
    <div className="bg-background-dark text-white min-h-screen pb-32 max-w-[480px] mx-auto overflow-x-hidden">
      <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-20 bg-background-dark/80 backdrop-blur-md">
        <div onClick={onBack} className="flex size-12 shrink-0 items-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">{t.analysisResults}</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex items-center justify-center h-12 text-white">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div 
          className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-zinc-800 rounded-xl min-h-64 shadow-lg border border-white/5" 
          style={{ backgroundImage: `url("${result.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaXCIuMqCHBijioyfcsrc5lDcSKud7Um95tzcstxFWwOJ7OFm3eKoeMpUTmw0OxQnwbND7rBSKOEJuoxAWYT6gsNW-F2jpPxNfy8sojvwE0CR7_W_AlYJk2rsEW6A3h0St2IjzZQ4bYjEgZDW84664bMk3DaM-ueUy47uJXm03Wl4fiSah_e0SDNL9LSG2g6JWL_h4zG3W6nd-Kvriw56HmlN3bRPCCNnQQLau7tjCHb2fR-pHzU6xUpsfsGiUqhJFSc7b24lvsg'}")` }}
        ></div>
      </div>

      <div className="flex flex-col items-center">
        <h1 className="text-white tracking-tight text-[48px] font-extrabold leading-tight px-4 text-center pt-4">
          {result.totalCalories} <span className="text-2xl font-bold opacity-70">kcal</span>
        </h1>
        <p className="text-[#92c9a4] text-sm font-medium leading-normal pb-6 pt-1 px-4 text-center uppercase tracking-widest">
          {t.totalCalories}
        </p>
      </div>

      <div className="px-4">
        <h3 className="text-white text-lg font-bold leading-tight tracking-tight pb-4">{t.macronutrients}</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <MacroBox label={t.protein.toUpperCase()} value={`${result.protein}g`} color="bg-primary" percent={40} />
          <MacroBox label={t.carbs.toUpperCase()} value={`${result.carbs}g`} color="bg-blue-400" percent={70} />
          <MacroBox label={t.fat.toUpperCase()} value={`${result.fats}g`} color="bg-orange-400" percent={30} />
        </div>
      </div>

      <div className="px-4 mb-8">
        <h3 className="text-white text-lg font-bold leading-tight tracking-tight pb-3">{t.ingredients}</h3>
        <div className="space-y-2">
          {result.ingredients.map((ing, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-400">nutrition</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{ing.name}</p>
                  <p className="text-zinc-500 text-sm">{ing.serving}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{ing.calories} kcal</p>
                <p className="text-primary text-xs font-medium">{ing.match}% Match</p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 flex items-center justify-center gap-2 text-primary font-semibold text-sm py-2">
          <span className="material-symbols-outlined text-sm">add_circle</span> {t.addMore}
        </button>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-background-dark/80 backdrop-blur-md border-t border-white/5 z-40">
        <button 
          onClick={() => onSave(result)}
          className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined">check_circle</span>
          {t.saveToLog}
        </button>
      </div>
    </div>
  );
};

const MacroBox = ({ label, value, color, percent }: any) => (
  <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center">
    <span className={`font-bold text-xl ${color.replace('bg-', 'text-')}`}>{value}</span>
    <span className="text-zinc-400 text-xs font-semibold mt-1">{label}</span>
    <div className="w-full h-1 bg-zinc-800 mt-3 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);

export default AnalysisResults;
