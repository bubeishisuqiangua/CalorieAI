
import React, { useRef, useMemo } from 'react';
import { UserProfile, Gender } from '../types';

interface ProfileScreenProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  tdee: number;
  t: any;
  settings: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, onUpdateProfile, onBack, onOpenSettings, tdee, t, settings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMetric = settings.units === 'Metric';
  
  // Convert for display - using a fallback for empty strings
  const displayWeight = useMemo(() => {
    if (profile.weight === '') return '';
    return isMetric ? profile.weight : Math.round(profile.weight * 2.20462);
  }, [profile.weight, isMetric]);

  const displayHeight = useMemo(() => {
    if (profile.height === '') return '';
    return isMetric ? profile.height : Math.round(profile.height * 0.393701);
  }, [profile.height, isMetric]);

  const handleChange = (field: keyof UserProfile, value: string) => {
    let finalValue: any = value;
    
    const numericFields: (keyof UserProfile)[] = ['weight', 'height', 'age'];
    
    if (numericFields.includes(field)) {
        if (value === '') {
            finalValue = '';
        } else {
            const num = Number(value);
            // Convert back to metric if saved from imperial input
            if (field === 'weight' && !isMetric) finalValue = num / 2.20462;
            else if (field === 'height' && !isMetric) finalValue = num / 0.393701;
            else finalValue = num;
        }
    }
    
    onUpdateProfile({ ...profile, [field]: finalValue });
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleSave = () => {
    // Basic validation before exiting: ensure we don't save empty strings to the actual persistence layer if needed
    // However, App.tsx's sanitized logic or the useEffect save handles persistence.
    // We'll just trigger the back navigation.
    onBack();
  }

  return (
    <div className="bg-background-dark min-h-screen text-white pb-32 max-w-md mx-auto flex flex-col">
      <header className="flex items-center justify-between p-4 pt-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-white/5">
        <div onClick={onBack} className="flex size-10 shrink-0 items-center justify-start cursor-pointer">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios</span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">{t.profile}</h2>
        <button onClick={onOpenSettings} className="flex size-10 items-center justify-center rounded-full bg-white/5">
          <span className="material-symbols-outlined text-primary">settings</span>
        </button>
      </header>

      <section className="flex flex-col items-center px-4 py-6">
        <div className="relative mb-8">
          <div className="size-32 rounded-full border-4 border-primary/20 p-1">
            <div className="w-full h-full rounded-full bg-cover bg-center overflow-hidden bg-zinc-800" style={{ backgroundImage: `url("${profile.avatar}")` }} />
          </div>
          <button onClick={handleAvatarClick} className="absolute bottom-1 right-1 size-10 rounded-full bg-primary text-background-dark flex items-center justify-center shadow-lg border-4 border-background-dark">
            <span className="material-symbols-outlined text-xl font-bold">photo_camera</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const r = new FileReader();
              r.onload = (ev) => handleChange('avatar', ev.target?.result as string);
              r.readAsDataURL(file);
            }
          }} />
        </div>

        <div className="w-full space-y-6">
          <div className="bg-[#193322]/40 p-4 rounded-2xl border border-primary/20">
            <InputGroup label={t.nickname} value={profile.name} onChange={(v: string) => handleChange('name', v)} type="text" />
          </div>

          <div className="bg-[#1a2e20] p-6 rounded-2xl border border-white/5 w-full text-center">
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">{t.tdeeLabel}</p>
            <h1 className="text-5xl font-black text-white">{tdee}</h1>
            <p className="text-slate-400 text-sm mt-1">{t.dailyMaintenance}</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label={`${t.weight} (${isMetric ? 'kg' : 'lbs'})`} value={displayWeight} onChange={(v: string) => handleChange('weight', v)} type="number" />
              <InputGroup label={`${t.height} (${isMetric ? 'cm' : 'in'})`} value={displayHeight} onChange={(v: string) => handleChange('height', v)} type="number" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label={t.age} value={profile.age} onChange={(v: string) => handleChange('age', v)} type="number" />
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-[#92c9a4] uppercase px-1">{t.gender}</p>
                <div className="flex bg-[#193322] rounded-xl p-1 border border-white/5">
                  <button onClick={() => handleChange('gender', 'male')} className={`flex-1 py-3 text-xs font-bold rounded-lg ${profile.gender === 'male' ? 'bg-primary text-black' : 'text-slate-400'}`}>{t.male}</button>
                  <button onClick={() => handleChange('gender', 'female')} className={`flex-1 py-3 text-xs font-bold rounded-lg ${profile.gender === 'female' ? 'bg-primary text-black' : 'text-slate-400'}`}>{t.female}</button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-[#92c9a4] uppercase px-1">{t.activityLevel}</p>
              {/* Fix: use onUpdateProfile from props instead of non-existent setProfile */}
              <select value={profile.activityLevel} onChange={(e) => onUpdateProfile({ ...profile, activityLevel: Number(e.target.value) })} className="w-full bg-[#193322] border-white/5 rounded-xl text-white p-4">
                <option value={1.2}>Sedentary</option>
                <option value={1.375}>Light</option>
                <option value={1.55}>Moderate</option>
                <option value={1.725}>Very Active</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <button onClick={handleSave} className="w-full py-4 bg-primary text-background-dark font-black rounded-xl uppercase tracking-widest">{t.saveChanges}</button>
      </section>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, type }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-[#92c9a4] uppercase px-1">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className="bg-[#193322] border border-white/5 rounded-xl p-4 text-white outline-none" 
    />
  </div>
);

export default ProfileScreen;
