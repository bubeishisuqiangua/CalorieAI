
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface SettingsScreenProps {
  settings: {
    language: string;
    units: string;
    notifications: boolean;
  };
  onUpdateSettings: (s: any) => void;
  onBack: () => void;
  onSignOut: () => void;
  onClearData: () => void;
  userProfile: UserProfile;
  t: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onUpdateSettings, onBack, onSignOut, onClearData, userProfile, t }) => {
  const [activeModal, setActiveModal] = useState<'language' | 'units' | 'account' | null>(null);

  const updateLanguage = (lang: string) => {
    onUpdateSettings({ ...settings, language: lang });
    setActiveModal(null);
  };

  const updateUnits = (unit: string) => {
    onUpdateSettings({ ...settings, units: unit });
    setActiveModal(null);
  };

  return (
    <div className="bg-background-dark min-h-screen text-white pb-32 max-w-md mx-auto flex flex-col relative">
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm px-4 pb-8">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-4">{activeModal === 'language' ? t.language : t.units}</h3>
            <div className="space-y-3">
              {activeModal === 'language' ? (
                ['English', 'Chinese'].map(l => (
                  <button key={l} onClick={() => updateLanguage(l)} className={`w-full p-4 rounded-xl border flex justify-between ${settings.language === l ? 'border-primary text-primary bg-primary/10' : 'border-white/5'}`}>
                    {l} {settings.language === l && <span className="material-symbols-outlined">check</span>}
                  </button>
                ))
              ) : (
                ['Metric', 'Imperial'].map(u => (
                  <button key={u} onClick={() => updateUnits(u)} className={`w-full p-4 rounded-xl border flex justify-between ${settings.units === u ? 'border-primary text-primary bg-primary/10' : 'border-white/5'}`}>
                    {u === 'Metric' ? t.metric : t.imperial} {settings.units === u && <span className="material-symbols-outlined">check</span>}
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-white/5 rounded-xl">Close</button>
          </div>
        </div>
      )}

      <header className="flex items-center p-4 pt-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-white/5">
        <button onClick={onBack} className="size-10 flex items-center"><span className="material-symbols-outlined">arrow_back_ios</span></button>
        <h2 className="text-lg font-bold flex-1 text-center">{t.settings}</h2>
        <div className="w-10"></div>
      </header>

      <div className="px-4 py-6 space-y-8">
        <section>
          <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">{t.general}</h3>
          <div className="bg-[#193322]/40 rounded-2xl border border-white/5 overflow-hidden">
            <SettingsItem icon="language" label={t.language} value={settings.language} onClick={() => setActiveModal('language')} />
            <SettingsItem icon="straighten" label={t.units} value={settings.units === 'Metric' ? t.metric : t.imperial} onClick={() => setActiveModal('units')} />
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">notifications</span><span>{t.notifications}</span></div>
              <button onClick={() => onUpdateSettings({...settings, notifications: !settings.notifications})} className={`w-10 h-5 rounded-full transition-colors ${settings.notifications ? 'bg-primary' : 'bg-slate-700'}`}>
                <div className={`size-4 bg-white rounded-full transition-all ${settings.notifications ? 'ml-5' : 'ml-1'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">{t.account}</h3>
          <div className="bg-[#193322]/40 rounded-2xl border border-white/5 overflow-hidden">
            <button onClick={() => { if(confirm("Sign out?")) onSignOut(); }} className="w-full text-left p-4 flex items-center gap-3 text-red-400">
              <span className="material-symbols-outlined">logout</span> {t.signOut}
            </button>
            <button onClick={() => { if(confirm("Clear all data?")) onClearData(); }} className="w-full text-left p-4 flex items-center gap-3 text-orange-400">
              <span className="material-symbols-outlined">delete_forever</span> {t.clearData}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const SettingsItem = ({ icon, label, value, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">{icon}</span><span>{label}</span></div>
    <div className="flex items-center gap-2 font-bold text-primary">{value} <span className="material-symbols-outlined text-slate-600">chevron_right</span></div>
  </button>
);

export default SettingsScreen;
