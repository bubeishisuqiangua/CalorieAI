
import React from 'react';
import { AppScreen } from '../types';

interface NavbarProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onScan: () => void;
  t: any;
}

const Navbar: React.FC<NavbarProps> = ({ activeScreen, onNavigate, onScan, t }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
        <button onClick={onScan} className="flex size-16 items-center justify-center rounded-full bg-primary text-background-dark border-4 border-background-dark pointer-events-auto">
          <span className="material-symbols-outlined text-[34px] font-bold">photo_camera</span>
        </button>
        <p className="text-[10px] font-extrabold text-primary mt-1.5 uppercase tracking-wider bg-background-dark/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
          {t.scanFood}
        </p>
      </div>
      <nav className="ios-blur bg-background-dark/95 border-t border-white/10 pb-6 pt-4 px-6 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <NavItem icon="home" label={t.dashboard} active={activeScreen === AppScreen.DASHBOARD} onClick={() => onNavigate(AppScreen.DASHBOARD)} />
        <NavItem icon="analytics" label={t.stats} active={activeScreen === AppScreen.STATS} onClick={() => onNavigate(AppScreen.STATS)} />
        <div className="w-16"></div>
        <NavItem icon="restaurant" label={t.plans} active={activeScreen === AppScreen.PLANS} onClick={() => onNavigate(AppScreen.PLANS)} />
        <NavItem icon="person" label={t.profile} active={activeScreen === AppScreen.PROFILE} onClick={() => onNavigate(AppScreen.PROFILE)} />
      </nav>
      <div className="bg-background-dark h-[env(safe-area-inset-bottom,16px)] w-full"></div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-primary' : 'text-[#92c9a4] opacity-70'}`}>
    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}>{icon}</span>
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

export default Navbar;
