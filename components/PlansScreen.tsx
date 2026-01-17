
import React, { useState } from 'react';
import { MealPlan } from '../types';

interface PlansScreenProps {
  currentPlan: MealPlan;
  availablePlans: MealPlan[];
  tdee: number;
  onSelectPlanId: (id: string) => void;
  t: any;
}

const PlansScreen: React.FC<PlansScreenProps> = ({ currentPlan, availablePlans, tdee, onSelectPlanId, t }) => {
  const [showToast, setShowToast] = useState(false);

  const handleSelect = (id: string) => {
    if (id === currentPlan.id) return;
    onSelectPlanId(id);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="bg-background-dark min-h-screen text-white pb-32">
      <header className="p-4 pt-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-white/5">
        <h2 className="text-xl font-bold tracking-tight text-center">{t.smartPlans}</h2>
      </header>

      <div className="px-4 py-6">
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#92c9a4] uppercase tracking-[0.2em]">{t.currentPlan}</h3>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 p-5 relative overflow-hidden transition-all duration-500 shadow-[0_0_20px_rgba(19,236,91,0.1)]">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                <p className="text-primary font-bold text-sm uppercase tracking-widest">{t.language === 'Chinese' ? '当前方案' : currentPlan.title}</p>
              </div>
              <h4 className="text-3xl font-black mb-1 tracking-tight">{currentPlan.dynamicKcal?.toLocaleString()} <span className="text-sm font-normal opacity-60">kcal/day</span></h4>
              
              <div className="flex gap-6 mt-4">
                <MacroStat label={t.protein} val={`${Math.round((currentPlan.dynamicKcal || 0) * (currentPlan.proteinPct/100) / 4)}g`} />
                <MacroStat label={t.carbs} val={`${Math.round((currentPlan.dynamicKcal || 0) * (currentPlan.carbsPct/100) / 4)}g`} />
                <MacroStat label={t.fat} val={`${Math.round((currentPlan.dynamicKcal || 0) * (currentPlan.fatsPct/100) / 9)}g`} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#92c9a4] uppercase tracking-[0.2em]">{t.availableOptions}</h3>
          </div>

          <div className="space-y-4">
            {availablePlans.map((plan) => {
              const kcal = tdee + plan.kcalModifier;
              return (
                <div 
                  key={plan.id}
                  onClick={() => handleSelect(plan.id)}
                  className={`flex gap-4 p-4 rounded-xl border transition-all cursor-pointer group active:scale-[0.98] ${plan.id === currentPlan.id ? 'bg-primary/5 border-primary/40' : 'bg-[#1a2e20] border-white/5'}`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    <img src={plan.image} className="w-full h-full object-cover" alt={plan.title} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-base leading-tight">{t.language === 'Chinese' ? (plan.id === 'weight-loss' ? '减重方案' : '增肌方案') : plan.title}</h5>
                      <p className="text-primary font-bold text-sm">{kcal.toLocaleString()} kcal</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-background-dark px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <span className="material-symbols-outlined font-bold">celebration</span>
          {t.language === 'Chinese' ? '已重新计算目标！' : 'Recalculated your goals!'}
        </div>
      )}
    </div>
  );
};

const MacroStat = ({ label, val }: any) => (
  <div>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</p>
    <p className="font-black text-white">{val}</p>
  </div>
);

export default PlansScreen;
