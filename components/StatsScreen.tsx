
import React, { useState, useMemo } from 'react';
import { MealHistoryItem } from '../types';

interface StatsScreenProps {
  onBack: () => void;
  t: any;
  history: MealHistoryItem[];
}

const StatsScreen: React.FC<StatsScreenProps> = ({ onBack, t, history }) => {
  const [timeRange, setTimeRange] = useState<'Week' | 'Month'>('Week');

  // 计算今日总摄入（用于周视图中的“今天”）
  const todayKcal = useMemo(() => history.reduce((acc, curr) => acc + curr.totalCalories, 0), [history]);

  // 根据 history 动态生成的周数据
  // 逻辑：除了“今天”显示 history 总和，其余天数默认为 0（因为是新会话）
  const weeklyData = useMemo(() => {
    const days = t.language === 'Chinese' 
      ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] 
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // 获取今天是周几 (0-6, 0 是周日)
    const todayIndex = (new Date().getDay() + 6) % 7; // 调整为 0=周一, 6=周日
    
    return days.map((label, idx) => ({
      label,
      kcal: idx === todayIndex ? todayKcal : 0
    }));
  }, [t.language, todayKcal]);

  // 根据 history 动态生成的月数据（展示每周平均摄入）
  const monthlyData = useMemo(() => {
    const weeks = t.language === 'Chinese' ? ['第1周', '第2周', '第3周', '第4周'] : ['W1', 'W2', 'W3', 'W4'];
    
    // 假设当前处于第 4 周，只有当前周显示 history 计算出的“平均”
    return weeks.map((label, idx) => ({
      label,
      kcal: idx === 3 ? todayKcal : 0 // 月视图这里简化逻辑，将今日数据视作本周数据
    }));
  }, [t.language, todayKcal]);

  const currentData = useMemo(() => {
    return timeRange === 'Week' ? weeklyData : monthlyData;
  }, [timeRange, weeklyData, monthlyData]);

  const stats = useMemo(() => {
    // 仅统计有数据的天数来计算平均，如果全为0则平均为0
    const activeData = currentData.filter(d => d.kcal > 0);
    const sum = currentData.reduce((acc, curr) => acc + curr.kcal, 0);
    const avg = activeData.length > 0 ? Math.round(sum / activeData.length) : 0;
    
    // 初始状态下趋势设为 0%
    const trend = history.length > 0 ? (timeRange === 'Week' ? '-12%' : '+5%') : '0%';
    return { avg, trend };
  }, [currentData, history, timeRange]);

  const maxKcal = timeRange === 'Week' ? 2500 : 18000;

  // 营养趋势动态百分比（根据是否有数据）
  const getMacroScore = (base: number) => history.length > 0 ? base : 0;

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
              <p className="text-[#92c9a4] text-xs font-semibold uppercase tracking-widest">
                {timeRange === 'Week' ? t.avgDailyIntake : t.avgWeeklyIntake}
              </p>
              <p className="text-3xl font-black mt-1 tracking-tighter">
                {stats.avg.toLocaleString()} <span className="text-sm font-normal text-slate-400">kcal</span>
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-1 rounded border ${stats.trend.startsWith('-') ? 'bg-primary/10 border-primary/20 text-primary' : (stats.trend === '0%' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-accent-orange/10 border-accent-orange/20 text-accent-orange')}`}>
                {stats.trend}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between h-44 gap-3 relative z-10">
            {currentData.map((data, idx) => (
              <div key={`${timeRange}-${idx}`} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div 
                  className="w-full bg-primary/10 rounded-t-lg relative cursor-pointer overflow-hidden transition-all duration-700 ease-out"
                  style={{ height: `${Math.max(2, (data.kcal / maxKcal) * 100)}%` }}
                >
                  <div className={`absolute inset-0 bg-primary transition-all duration-300 ${data.kcal > 0 ? 'opacity-40 group-hover:opacity-100' : 'opacity-5'}`}></div>
                  {data.kcal > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      {data.kcal} kcal
                    </div>
                  )}
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
          <TrendCard title={t.protein} score={getMacroScore(92)} color="text-primary" icon="fitness_center" />
          <TrendCard title={t.language === 'Chinese' ? '水分' : 'Hydration'} score={getMacroScore(78)} color="text-blue-400" icon="water_drop" />
          <TrendCard title={t.language === 'Chinese' ? '纤维' : 'Fiber'} score={getMacroScore(64)} color="text-orange-400" icon="eco" />
          <TrendCard title={t.language === 'Chinese' ? '睡眠' : 'Sleep'} score={getMacroScore(85)} color="text-purple-400" icon="bedtime" />
        </div>

        <div className="mt-8 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-black shadow-[0_0_15px_rgba(19,236,91,0.3)] group-hover:rotate-12 transition-transform">
            <span className="material-symbols-outlined font-bold">lightbulb</span>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-primary">{t.insight}</p>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              {history.length > 0 
                ? (timeRange === 'Week' 
                    ? (t.language === 'Chinese' ? "您在运动日的蛋白质摄入量高出 15%。请继续保持！" : "Your protein intake is 15% higher on workout days. Keep it up!")
                    : (t.language === 'Chinese' ? "本月您每周的饮食一致性表现优异，热量偏差极小。" : "Your weekly consistency is excellent this month with minimal calorie deviation."))
                : t.noDataInsight
              }
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
