
import React, { useState, useMemo } from 'react';

interface StatsScreenProps {
  onBack: () => void;
  t: any;
}

const StatsScreen: React.FC<StatsScreenProps> = ({ onBack, t }) => {
  const [timeRange, setTimeRange] = useState<'Week' | 'Month'>('Week');

  const weeklyData = [
    { label: t.language === 'Chinese' ? '周一' : 'Mon', kcal: 1850 },
    { label: t.language === 'Chinese' ? '周二' : 'Tue', kcal: 2100 },
    { label: t.language === 'Chinese' ? '周三' : 'Wed', kcal: 1750 },
    { label: t.language === 'Chinese' ? '周四' : 'Thu', kcal: 1900 },
    { label: t.language === 'Chinese' ? '周五' : 'Fri', kcal: 2200 },
    { label: t.language === 'Chinese' ? '周六' : 'Sat', kcal: 1600 },
    { label: t.language === 'Chinese' ? '周日' : 'Sun', kcal: 1800 },
  ];

  const monthlyData = [
    { label: 'W1', kcal: 1950 },
    { label: 'W2', kcal: 2300 },
    { label: 'W3', kcal: 1800 },
    { label: 'W4', kcal: 2050 },
  ];

  const currentData = useMemo(() => {
    return timeRange === 'Week' ? weeklyData : monthlyData;
  }, [timeRange, weeklyData, monthlyData]);

  const stats = useMemo(() => {
    const avg = Math.round(currentData.reduce((acc, curr) => acc + curr.kcal, 0) / currentData.length);
    const trend = timeRange === 'Week' ? '-12%' : '+5%';
    return { avg, trend };
  }, [currentData, timeRange]);

  const maxKcal = 2500;

  return (
    <div className="bg-background-dark min-h-screen text-white pb-32">
      <header className="p-4 pt-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-white/5 flex items-center">
        <button onClick={onBack} className="absolute left-4 size-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-xl font-bold tracking-tight text-center w-full">{t.myProgress}</h2>
      </header>

      <div className="px-4 py-6">
        <div className="flex bg-[#193322] p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner">
          <button 
            onClick={() => setTimeRange('Week')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 transform active:scale-95 ${timeRange === 'Week' ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.language === 'Chinese' ? '周' : 'Week'}
          </button>
          <button 
            onClick={() => setTimeRange('Month')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 transform active:scale-95 ${timeRange === 'Month' ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
             {t.language === 'Chinese' ? '月' : 'Month'}
          </button>
        </div>

        <section className="bg-[#1a2e20] p-6 rounded-2xl border border-white/5 mb-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-end mb-8 relative z-10">
            <div>
              <p className="text-[#92c9a4] text-xs font-semibold uppercase tracking-widest">{t.avgIntake}</p>
              <p className="text-3xl font-black mt-1 tracking-tighter">
                {stats.avg.toLocaleString()} <span className="text-sm font-normal text-slate-400">kcal</span>
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-1 rounded border ${stats.trend.startsWith('-') ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-accent-orange/10 border-accent-orange/20 text-accent-orange'}`}>
                {stats.trend}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between h-44 gap-3 relative z-10">
            {currentData.map((data, idx) => (
              <div key={`${timeRange}-${idx}`} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div 
                  className="w-full bg-primary/10 rounded-t-lg relative cursor-pointer overflow-hidden transition-all duration-700 ease-out"
                  style={{ height: `${(data.kcal / maxKcal) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-primary opacity-40 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {data.kcal} kcal
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{data.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold tracking-tight">{t.nutrientTrends}</h3>
          <span className="material-symbols-outlined text-primary text-sm animate-pulse">monitoring</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TrendCard title={t.protein} score="92" color="text-primary" icon="fitness_center" />
          <TrendCard title={t.language === 'Chinese' ? '水分' : 'Hydration'} score="78" color="text-blue-400" icon="water_drop" />
          <TrendCard title={t.language === 'Chinese' ? '纤维' : 'Fiber'} score="64" color="text-orange-400" icon="eco" />
          <TrendCard title={t.language === 'Chinese' ? '睡眠' : 'Sleep'} score="85" color="text-purple-400" icon="bedtime" />
        </div>

        <div className="mt-8 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-black shadow-[0_0_15px_rgba(19,236,91,0.3)] group-hover:rotate-12 transition-transform">
            <span className="material-symbols-outlined font-bold">lightbulb</span>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-primary">{t.insight}</p>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              {timeRange === 'Week' 
                ? (t.language === 'Chinese' ? "您在运动日的蛋白质摄入量高出 15%。请继续保持！" : "Your protein intake is 15% higher on workout days. Keep it up!")
                : (t.language === 'Chinese' ? "本月的热量摄入一致性比上月提高了 8%。" : "Your calorie consistency improved by 8% this month compared to May.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendCard = ({ title, score, color, icon }: any) => (
  <div className="bg-[#1a2e20] p-4 rounded-xl border border-white/5 active:scale-95 transition-all cursor-pointer hover:border-white/10 group">
    <div className="flex items-center justify-between mb-3">
      <span className={`material-symbols-outlined ${color} text-lg group-hover:scale-110 transition-transform`}>{icon}</span>
    </div>
    <p className="text-2xl font-black tracking-tight">{score}%</p>
    <p className="text-xs text-slate-400 font-medium">{title}</p>
    <div className="w-full h-1.5 bg-white/5 mt-3 rounded-full overflow-hidden">
      <div className={`h-full transition-all duration-1000 ease-out ${color.replace('text-', 'bg-')}`} style={{ width: `${score}%` }}></div>
    </div>
  </div>
);

export default StatsScreen;
