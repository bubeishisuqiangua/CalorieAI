
import React, { useState } from 'react';
import { UserProfile, Gender } from '../types';

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile, planId: string) => void;
  onLanguageSelect: (lang: string) => void;
  t: any;
  settings: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onLanguageSelect, t, settings }) => {
  const [step, setStep] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState('weight-loss');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    weight: 70,
    height: 170,
    age: 25,
    gender: 'male',
    activityLevel: 1.2
  });

  const handleChange = (field: keyof UserProfile, value: string) => {
    // If it's a numeric field, allow empty string but otherwise convert to number
    const numericFields: (keyof UserProfile)[] = ['weight', 'height', 'age'];
    if (numericFields.includes(field)) {
      setProfile(prev => ({ 
        ...prev, 
        [field]: value === '' ? '' : Number(value) 
      }));
    } else {
      setProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const isStep1Valid = profile.name.trim() !== '' && profile.age !== '' && Number(profile.age) > 0;
  const isStep2Valid = profile.weight !== '' && Number(profile.weight) > 0 && profile.height !== '' && Number(profile.height) > 0;

  const activityLevels = [
    { value: 1.2, label: t.sedentary, desc: t.sedentaryDesc, icon: 'self_care' },
    { value: 1.375, label: t.light, desc: t.lightDesc, icon: 'directions_walk' },
    { value: 1.55, label: t.moderate, desc: t.moderateDesc, icon: 'fitness_center' },
    { value: 1.725, label: t.veryActive, desc: t.veryActiveDesc, icon: 'bolt' }
  ];

  const goals = [
    { id: 'weight-loss', label: t.weightLoss, desc: t.weightLossDesc, icon: 'trending_down', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400&auto=format&fit=crop' },
    { id: 'muscle-building', label: t.muscleBuilding, desc: t.muscleBuildingDesc, icon: 'fitness_center', image: 'https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?q=80&w=400&auto=format&fit=crop' }
  ];

  const handleLanguageSelect = (lang: string) => {
    onLanguageSelect(lang);
    setStep(1);
  };

  return (
    <div className="bg-background-dark min-h-screen text-white flex flex-col p-6 overflow-y-auto no-scrollbar">
      <header className="py-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`w-10 h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-white/10'}`}></div>
            ))}
          </div>
        </div>
        <h2 className="text-3xl font-black tracking-tight">
          {step === 0 ? t.chooseLanguage : step === 4 ? t.chooseGoal : t.onboardingTitle}
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          {step === 4 ? t.chooseGoalDesc : t.onboardingDesc}
        </p>
      </header>

      <main className="flex-1 flex flex-col gap-8 max-w-md mx-auto w-full">
        {step === 0 && (
          <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-4 mt-4">
            <button 
              onClick={() => handleLanguageSelect('English')}
              className={`group flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${settings.language === 'English' ? 'bg-primary border-primary text-black' : 'bg-[#193322] border-white/5 text-white hover:border-primary/40'}`}
            >
              <div className="flex flex-col items-start">
                <span className="text-xl font-black">English</span>
                <span className={`text-xs mt-0.5 ${settings.language === 'English' ? 'text-black/60' : 'text-slate-400'}`}>International</span>
              </div>
              <span className="text-2xl font-display opacity-40 group-hover:opacity-100 transition-opacity">A</span>
            </button>

            <button 
              onClick={() => handleLanguageSelect('Chinese')}
              className={`group flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${settings.language === 'Chinese' ? 'bg-primary border-primary text-black' : 'bg-[#193322] border-white/5 text-white hover:border-primary/40'}`}
            >
              <div className="flex flex-col items-start">
                <span className="text-xl font-black">简体中文</span>
                <span className={`text-xs mt-0.5 ${settings.language === 'Chinese' ? 'text-black/60' : 'text-slate-400'}`}>Chinese Simplified</span>
              </div>
              <span className="text-2xl font-display opacity-40 group-hover:opacity-100 transition-opacity">文</span>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#92c9a4] uppercase px-1">{t.nickname}</label>
              <input 
                type="text" 
                placeholder="e.g. Alex"
                value={profile.name} 
                onChange={(e) => handleChange('name', e.target.value)} 
                className="bg-[#193322] border border-white/5 rounded-2xl p-5 text-lg text-white outline-none focus:border-primary/40 transition-colors" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#92c9a4] uppercase px-1">{t.age}</label>
                <input 
                  type="number" 
                  value={profile.age} 
                  onChange={(e) => handleChange('age', e.target.value)} 
                  className="bg-[#193322] border border-white/5 rounded-2xl p-5 text-lg text-white outline-none focus:border-primary/40 transition-colors" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#92c9a4] uppercase px-1">{t.gender}</label>
                <div className="flex bg-[#193322] rounded-2xl p-1 border border-white/5 h-full">
                  <button 
                    onClick={() => handleChange('gender', 'male')} 
                    className={`flex-1 rounded-xl text-sm font-bold transition-all ${profile.gender === 'male' ? 'bg-primary text-black' : 'text-slate-400'}`}
                  >
                    {t.male}
                  </button>
                  <button 
                    onClick={() => handleChange('gender', 'female')} 
                    className={`flex-1 rounded-xl text-sm font-bold transition-all ${profile.gender === 'female' ? 'bg-primary text-black' : 'text-slate-400'}`}
                  >
                    {t.female}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mt-4">
              <button 
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="w-full py-5 bg-primary text-background-dark font-black rounded-2xl uppercase tracking-widest disabled:opacity-30 transition-all active:scale-[0.98]"
              >
                Continue
              </button>
              <button 
                onClick={() => setStep(0)}
                className="w-full py-2 text-slate-400 font-bold uppercase text-xs tracking-widest"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#92c9a4] uppercase px-1">{t.weight} (kg)</label>
                <input 
                  type="number" 
                  value={profile.weight} 
                  onChange={(e) => handleChange('weight', e.target.value)} 
                  className="bg-[#193322] border border-white/5 rounded-2xl p-5 text-lg text-white outline-none focus:border-primary/40 transition-colors" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#92c9a4] uppercase px-1">{t.height} (cm)</label>
                <input 
                  type="number" 
                  value={profile.height} 
                  onChange={(e) => handleChange('height', e.target.value)} 
                  className="bg-[#193322] border border-white/5 rounded-2xl p-5 text-lg text-white outline-none focus:border-primary/40 transition-colors" 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mt-4">
              <button 
                onClick={() => setStep(3)}
                disabled={!isStep2Valid}
                className="w-full py-5 bg-primary text-background-dark font-black rounded-2xl uppercase tracking-widest disabled:opacity-30 transition-all active:scale-[0.98]"
              >
                Almost There
              </button>
              <button 
                onClick={() => setStep(1)}
                className="w-full py-4 text-slate-400 font-bold uppercase text-xs tracking-widest"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-4">
            <label className="text-xs font-bold text-[#92c9a4] uppercase px-1 mb-2">{t.activityLevel}</label>
            <div className="space-y-3">
              {activityLevels.map((lvl) => (
                <div 
                  key={lvl.value}
                  onClick={() => setProfile(prev => ({ ...prev, activityLevel: lvl.value }))}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${profile.activityLevel === lvl.value ? 'bg-primary text-black border-primary' : 'bg-[#193322] border-white/5 text-white'}`}
                >
                  <span className="material-symbols-outlined text-3xl">{lvl.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-base leading-tight">{lvl.label}</p>
                    <p className={`text-xs mt-0.5 ${profile.activityLevel === lvl.value ? 'text-black/60 font-medium' : 'text-slate-400'}`}>{lvl.desc}</p>
                  </div>
                  {profile.activityLevel === lvl.value && <span className="material-symbols-outlined font-bold">check_circle</span>}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-6">
              <button 
                onClick={() => setStep(4)}
                className="w-full py-5 bg-primary text-background-dark font-black rounded-2xl uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,91,0.3)] active:scale-[0.98] transition-all"
              >
                Next
              </button>
              <button 
                onClick={() => setStep(2)}
                className="w-full py-4 text-slate-400 font-bold uppercase text-xs tracking-widest"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4">
              {goals.map((goal) => (
                <div 
                  key={goal.id}
                  onClick={() => setSelectedPlanId(goal.id)}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer h-32 flex flex-col justify-center px-6 ${selectedPlanId === goal.id ? 'border-primary shadow-[0_0_20px_rgba(19,236,91,0.2)]' : 'border-white/5'}`}
                >
                  <div className="absolute inset-0 z-0">
                    <img src={goal.image} className={`w-full h-full object-cover transition-all duration-700 ${selectedPlanId === goal.id ? 'scale-110 opacity-40' : 'opacity-10 grayscale'}`} alt={goal.label} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-3xl ${selectedPlanId === goal.id ? 'text-primary' : 'text-slate-400'}`}>{goal.icon}</span>
                      <div>
                        <p className={`text-xl font-black ${selectedPlanId === goal.id ? 'text-white' : 'text-slate-400'}`}>{goal.label}</p>
                        <p className={`text-xs font-medium ${selectedPlanId === goal.id ? 'text-white/70' : 'text-slate-500'}`}>{goal.desc}</p>
                      </div>
                    </div>
                  </div>
                  {selectedPlanId === goal.id && (
                    <div className="absolute top-4 right-4 text-primary">
                      <span className="material-symbols-outlined font-black">check_circle</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <button 
                onClick={() => onComplete(profile, selectedPlanId)}
                className="w-full py-5 bg-primary text-background-dark font-black rounded-2xl uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,91,0.4)] active:scale-[0.98] transition-all"
              >
                {t.finishSetup}
              </button>
              <button 
                onClick={() => setStep(3)}
                className="w-full py-4 text-slate-400 font-bold uppercase text-xs tracking-widest"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default OnboardingScreen;
