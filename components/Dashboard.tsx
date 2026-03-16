
import React, { useMemo } from 'react';
import { MealHistoryItem, UserProfile } from '../types';

interface DashboardProps {
  history: MealHistoryItem[];
  profile: UserProfile;
  onOpenProfile: () => void;
  targetKcal: number;
  t: any;
  onSelectMeal: (meal: MealHistoryItem) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ history, profile, onOpenProfile, targetKcal, t, onSelectMeal }) => {
  const consumed = useMemo(() => history.reduce((acc, curr) => acc + curr.totalCalories, 0), [history]);
  const proteinTotal = useMemo(() => history.reduce((acc, curr) => acc + curr.protein, 0), [history]);
  const carbsTotal = useMemo(() => history.reduce((acc, curr) => acc + curr.carbs, 0), [history]);
  const fatTotal = useMemo(() => history.reduce((acc, curr) => acc + curr.fats, 0), [history]);
  
  const remaining = Math.max(0, targetKcal - consumed);
  const progressPercent = Math.min(100, (consumed / targetKcal) * 100);

  const firstName = profile.name.split(' ')[0] || 'User';

  return (
    <div className="bg-background-dark min-h-screen text-white pb-32">
      <header className="sticky top-0 z-30 ios-blur bg-background-dark/80 px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div 
            onClick={onOpenProfile}
            className="size-10 rounded-full bg-center bg-cover border-2 border-primary/30 cursor-pointer overflow-hidden shadow-[0_0_10px_rgba(19,236,91,0.2)]" 
            style={{ backgroundImage: `url("${profile.avatar}")` }}
          ></div>
          <div onClick={onOpenProfile} className="cursor-pointer group">
            <p className="text-xs text-[#92c9a4] font-medium">Monday, June 12</p>
            <div className="flex items-center gap-1">
              <h2 className="text-white text-base font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">
                {t.goodMorning}, {firstName}
              </h2>
              <span className="material-symbols-outlined text-[14px] text-primary/60 group-hover:text-primary">edit</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex size-10 items-center justify-center rounded-full bg-[#193322] text-white hover:bg-[#2a4d36] transition-colors">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
          </button>
        </div>
      </header>

      <main>
        <section className="flex flex-col items-center justify-center p-6 mt-4">
          <div className="relative flex items-center justify-center">
            <div className="w-64 h-64 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(19,236,91,0.15)] relative overflow-hidden" 
                 style={{ 
                   background: `radial-gradient(closest-side, #102216 85%, transparent 86% 100%), conic-gradient(#13ec5b ${progressPercent}%, #326744 0)` 
                 }}>
              <div className="flex flex-col items-center text-center z-10">
                <span className="text-[#92c9a4] text-sm font-medium uppercase tracking-widest">{t.remaining}</span>
                <span className="text-white text-5xl font-extrabold my-1 tracking-tight">{remaining.toLocaleString()}</span>
                <span className="text-[#92c9a4] text-sm">{t.goal}: {targetKcal.toLocaleString()} kcal</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -left-4 bg-[#193322] px-4 py-2 rounded-xl border border-[#326744]">
              <p className="text-xs text-[#92c9a4]">{t.consumed}</p>
              <p className="text-sm font-bold">{consumed} kcal</p>
            </div>
            <div className="absolute -bottom-2 -right-4 bg-[#193322] px-4 py-2 rounded-xl border border-[#326744]">
              <p className="text-xs text-[#92c9a4]">{t.status}</p>
              <p className="text-sm font-bold">{progressPercent > 100 ? t.limitExceeded : t.onTrack}</p>
            </div>
          </div>
        </section>

        <section className="px-4 py-6">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <MacroCard title={t.protein} icon="fitness_center" value={`${Math.round(proteinTotal)}g`} goal="150g" progress={Math.min(100, (proteinTotal/150)*100)} />
            <MacroCard title={t.carbs} icon="grain" value={`${Math.round(carbsTotal)}g`} goal="200g" progress={Math.min(100, (carbsTotal/200)*100)} />
            <MacroCard title={t.fat} icon="water_drop" value={`${Math.round(fatTotal)}g`} goal="70g" progress={Math.min(100, (fatTotal/70)*100)} />
          </div>
        </section>

        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-white text-xl font-bold tracking-tight">{t.recentMeals}</h2>
          <button className="text-primary text-sm font-semibold">{t.seeAll}</button>
        </div>

        <div className="flex flex-col gap-4 px-4">
          {history.length > 0 ? history.map((meal) => (
            <MealCard key={meal.id} meal={meal} onClick={() => onSelectMeal(meal)} />
          )) : (
            <div className="py-10 text-center text-slate-500 bg-[#193322]/30 rounded-2xl border border-dashed border-[#326744]/40">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-20">restaurant</span>
              <p className="text-sm">{t.emptyHistory}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const MacroCard: React.FC<{ title: string; icon: string; value: string; goal: string; progress: number }> = ({ title, icon, value, goal, progress }) => (
  <div className="flex min-w-[120px] flex-1 flex-col gap-3 rounded-xl p-4 bg-[#193322] border border-[#326744]/30">
    <div className="flex items-center justify-between">
      <p className="text-[#92c9a4] text-xs font-semibold uppercase tracking-wider">{title}</p>
      <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
    </div>
    <div>
      <p className="text-white text-xl font-bold leading-tight">{value}</p>
      <p className="text-[#92c9a4] text-[10px] font-normal leading-normal">{goal}</p>
    </div>
    <div className="h-1.5 w-full rounded-full bg-[#112217]">
      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

const MealCard: React.FC<{ meal: MealHistoryItem; onClick: () => void }> = ({ meal, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-stretch justify-between gap-4 rounded-xl bg-[#193322] p-3 border border-[#326744]/20 active:scale-[0.98] transition-transform cursor-pointer"
  >
    <div className="flex flex-[2_2_0px] flex-col justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{meal.status}</span>
        </div>
        <p className="text-white text-lg font-bold leading-tight mt-1">{meal.name}</p>
        <p className="text-[#92c9a4] text-sm font-normal">{meal.totalCalories} kcal • {meal.time}</p>
      </div>
    </div>
    <div className="w-24 h-24 bg-center bg-no-repeat bg-cover rounded-lg border border-[#326744]/30 overflow-hidden" style={{ backgroundImage: `url("${meal.image}")` }}></div>
  </div>
);

export default Dashboard;
