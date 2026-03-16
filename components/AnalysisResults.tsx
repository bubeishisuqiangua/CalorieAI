
import React, { useState, useEffect } from 'react';
import { MealAnalysis } from '../types';

interface AnalysisResultsProps {
  result: MealAnalysis;
  onSave: (meal: MealAnalysis) => void;
  onBack: () => void;
  t: any;
  isViewOnly?: boolean;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onSave, onBack, t, isViewOnly = false }) => {
  const [editedResult, setEditedResult] = useState<MealAnalysis>({ ...result });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedResult({ ...result });
  }, [result]);

  const handleFieldChange = (field: keyof MealAnalysis, value: any) => {
    setEditedResult(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Sanitize values to ensure they are valid numbers before saving
    const sanitized: MealAnalysis = {
      ...editedResult,
      totalCalories: Number(editedResult.totalCalories) || 0,
      protein: Number(editedResult.protein) || 0,
      carbs: Number(editedResult.carbs) || 0,
      fats: Number(editedResult.fats) || 0,
    };
    onSave(sanitized);
  };

  const isUnknown = editedResult.totalCalories === 0 || editedResult.name.toLowerCase().includes('unknown') || editedResult.name.toLowerCase().includes('unidentified');

  return (
    <div className="bg-background-dark text-white min-h-screen pb-32 max-w-[480px] mx-auto overflow-x-hidden">
      <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-20 bg-background-dark/80 backdrop-blur-md">
        <div onClick={onBack} className="flex size-12 shrink-0 items-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">{t.analysisResults}</h2>
        <div className="flex w-12 items-center justify-end">
          {!isViewOnly && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center justify-center h-12 ${isEditing ? 'text-primary' : 'text-white'}`}
            >
              <span className="material-symbols-outlined">{isEditing ? 'done_all' : 'edit'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        <div 
          className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-zinc-800 rounded-xl min-h-64 shadow-lg border border-white/5" 
          style={{ backgroundImage: `url("${editedResult.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'}")` }}
        >
          {isUnknown && !isEditing && (
            <div className="m-4 p-3 bg-accent-orange/90 backdrop-blur-md rounded-xl text-black flex items-center gap-3">
              <span className="material-symbols-outlined font-bold">warning</span>
              <p className="text-xs font-bold leading-tight">
                {t.language === 'Chinese' ? 'AI 无法确定该食物。请手动检查结果。' : 'AI is unsure about this food. Please check the details manually.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center px-4">
        {isEditing ? (
          <div className="w-full space-y-4 mt-4">
            <div className="flex flex-col gap-1 items-center">
               <input 
                type="text" 
                value={editedResult.name} 
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="bg-zinc-900 border border-primary/30 rounded-xl p-3 text-center text-xl font-black w-full outline-none focus:border-primary"
                placeholder="Meal Name"
              />
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="number" 
                  value={editedResult.totalCalories} 
                  onChange={(e) => handleFieldChange('totalCalories', e.target.value)}
                  className="bg-zinc-900 border border-primary/30 rounded-xl p-3 text-center text-4xl font-black w-32 outline-none focus:border-primary"
                />
                <span className="text-xl font-bold opacity-70">kcal</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-white tracking-tight text-[48px] font-extrabold leading-tight px-4 text-center pt-4">
              {editedResult.totalCalories} <span className="text-2xl font-bold opacity-70">kcal</span>
            </h1>
            <p className="text-primary text-xl font-black tracking-tight text-center mb-1">
              {editedResult.name}
            </p>
            <p className="text-[#92c9a4] text-xs font-medium leading-normal pb-6 pt-1 px-4 text-center uppercase tracking-widest">
              {t.totalCalories}
            </p>
          </>
        )}
      </div>

      <div className="px-4">
        <h3 className="text-white text-lg font-bold leading-tight tracking-tight pb-4">{t.macronutrients}</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <MacroBox 
            label={t.protein.toUpperCase()} 
            value={isEditing ? 
              <input type="number" value={editedResult.protein} onChange={(e) => handleFieldChange('protein', e.target.value)} className="bg-transparent w-full text-center outline-none" /> : 
              `${editedResult.protein}g`
            } 
            color="bg-primary" 
            percent={Math.min(100, (Number(editedResult.protein)/50)*100)} 
          />
          <MacroBox 
            label={t.carbs.toUpperCase()} 
            value={isEditing ? 
              <input type="number" value={editedResult.carbs} onChange={(e) => handleFieldChange('carbs', e.target.value)} className="bg-transparent w-full text-center outline-none" /> : 
              `${editedResult.carbs}g`
            } 
            color="bg-blue-400" 
            percent={Math.min(100, (Number(editedResult.carbs)/100)*100)} 
          />
          <MacroBox 
            label={t.fat.toUpperCase()} 
            value={isEditing ? 
              <input type="number" value={editedResult.fats} onChange={(e) => handleFieldChange('fats', e.target.value)} className="bg-transparent w-full text-center outline-none" /> : 
              `${editedResult.fats}g`
            } 
            color="bg-orange-400" 
            percent={Math.min(100, (Number(editedResult.fats)/30)*100)} 
          />
        </div>
      </div>

      <div className="px-4 mb-8">
        <h3 className="text-white text-lg font-bold leading-tight tracking-tight pb-3">{t.ingredients}</h3>
        <div className="space-y-2">
          {editedResult.ingredients.length > 0 ? editedResult.ingredients.map((ing, i) => (
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
          )) : (
            <div className="py-8 text-center bg-zinc-900/20 rounded-xl border border-dashed border-zinc-700">
               <p className="text-zinc-500 text-sm">{t.language === 'Chinese' ? '暂无成分信息' : 'No ingredient details identified.'}</p>
            </div>
          )}
        </div>
        {!isViewOnly && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 text-primary font-semibold text-sm py-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span> {t.addMore}
          </button>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-background-dark/80 backdrop-blur-md border-t border-white/5 z-40">
        {isViewOnly ? (
          <button 
            onClick={onBack}
            className="w-full bg-zinc-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {t.back}
          </button>
        ) : (
          <button 
            onClick={handleSave}
            className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined">{isEditing ? 'save' : 'check_circle'}</span>
            {isEditing ? (t.language === 'Chinese' ? '保存更改并记录' : 'Save & Log') : t.saveToLog}
          </button>
        )}
      </div>
    </div>
  );
};

const MacroBox = ({ label, value, color, percent }: any) => (
  <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center min-h-[100px] justify-center">
    <div className={`font-bold text-lg ${color.replace('bg-', 'text-')} mb-1`}>{value}</div>
    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-tight">{label}</span>
    <div className="w-full h-1 bg-zinc-800 mt-3 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);

export default AnalysisResults;
