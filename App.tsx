
import React, { useState, useMemo } from 'react';
import { AppScreen, MealAnalysis, MealHistoryItem, MealPlan, UserProfile } from './types';
import SplashScreen from './components/SplashScreen';
import Dashboard from './components/Dashboard';
import CameraScreen from './components/CameraScreen';
import AnalysisResults from './components/AnalysisResults';
import ProfileScreen from './components/ProfileScreen';
import StatsScreen from './components/StatsScreen';
import PlansScreen from './components/PlansScreen';
import SettingsScreen from './components/SettingsScreen';
import Navbar from './components/Navbar';

// Localization Dictionary
const translations: any = {
  English: {
    dashboard: "Dashboard",
    stats: "Stats",
    plans: "Plans",
    profile: "Profile",
    settings: "Settings",
    goodMorning: "Good Morning",
    remaining: "Remaining",
    consumed: "Consumed",
    status: "Status",
    onTrack: "On Track",
    limitExceeded: "Limit Exceeded",
    recentMeals: "Recent Meals",
    seeAll: "See all",
    weight: "Weight",
    height: "Height",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
    activityLevel: "Activity Level",
    nickname: "Nickname",
    saveChanges: "Save Changes",
    tdeeLabel: "Estimated TDEE",
    dailyMaintenance: "Daily Maintenance Calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    goal: "Goal",
    scanFood: "Scan Food",
    language: "Language",
    units: "Units",
    notifications: "Notifications",
    general: "General",
    account: "Account",
    signOut: "Sign Out",
    clearData: "Clear App Data",
    metric: "Metric",
    imperial: "Imperial",
    getStarted: "Get Started",
    tagline: "The smartest way to track your meals.",
    motto: "Eat smart, live better",
    analyzing: "Analyzing...",
    analysisResults: "Analysis Results",
    macronutrients: "Macronutrients",
    ingredients: "Identified Ingredients",
    saveToLog: "Save to Daily Log",
    totalCalories: "Total Estimated Calories",
    addMore: "Add more ingredients",
    myProgress: "My Progress",
    avgIntake: "Avg. Daily Intake",
    nutrientTrends: "Nutrient Trends",
    insight: "AI Insight",
    smartPlans: "Smart Meal Plans",
    currentPlan: "Current Plan",
    availableOptions: "Available Options",
    pointCamera: "Point camera at your meal or pick from gallery"
  },
  Chinese: {
    dashboard: "主页",
    stats: "统计",
    plans: "计划",
    profile: "个人资料",
    settings: "设置",
    goodMorning: "早上好",
    remaining: "剩余",
    consumed: "已摄入",
    status: "状态",
    onTrack: "进度良好",
    limitExceeded: "超出限制",
    recentMeals: "最近饮食",
    seeAll: "查看全部",
    weight: "体重",
    height: "身高",
    age: "年龄",
    gender: "性别",
    male: "男",
    female: "女",
    activityLevel: "活动强度",
    nickname: "昵称",
    saveChanges: "保存更改",
    tdeeLabel: "预计 TDEE",
    dailyMaintenance: "每日维持热量",
    protein: "蛋白质",
    carbs: "碳水化合物",
    fat: "脂肪",
    goal: "目标",
    scanFood: "扫描食物",
    language: "语言",
    units: "单位",
    notifications: "通知",
    general: "常规设置",
    account: "账户设置",
    signOut: "退出登录",
    clearData: "清除所有数据",
    metric: "公制 (kg, cm)",
    imperial: "英制 (lbs, in)",
    getStarted: "开始体验",
    tagline: "最智能的饮食追踪方式",
    motto: "智慧饮食，健康生活",
    analyzing: "正在识别...",
    analysisResults: "分析结果",
    macronutrients: "宏量营养分析",
    ingredients: "识别到的成分",
    saveToLog: "保存到日志",
    totalCalories: "总热量估算",
    addMore: "添加更多成分",
    myProgress: "我的进度",
    avgIntake: "平均每日摄入",
    nutrientTrends: "营养趋势",
    insight: "AI 洞察",
    smartPlans: "智能饮食计划",
    currentPlan: "当前计划",
    availableOptions: "可选方案",
    pointCamera: "将摄像头对准食物或从相册选择"
  }
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysis | null>(null);
  
  const [settings, setSettings] = useState({
    language: 'Chinese',
    units: 'Metric',
    notifications: true
  });

  const t = useMemo(() => translations[settings.language] || translations.English, [settings.language]);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    weight: 78, 
    height: 175, 
    age: 28,
    gender: 'male',
    activityLevel: 1.2
  });

  const [activePlanId, setActivePlanId] = useState<string>('weight-loss');

  const availablePlans: MealPlan[] = [
    {
      id: 'weight-loss',
      title: 'Weight Loss',
      desc: 'Targeted calorie deficit for healthy fat loss.',
      kcalModifier: -500,
      proteinPct: 35,
      carbsPct: 35,
      fatsPct: 30,
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'muscle-building',
      title: 'Muscle Building',
      desc: 'High protein focus for lean muscle gains.',
      kcalModifier: 500,
      proteinPct: 40,
      carbsPct: 40,
      fatsPct: 20,
      image: 'https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?q=80&w=400&auto=format&fit=crop'
    }
  ];

  const tdee = useMemo(() => {
    const { weight, height, age, gender, activityLevel } = userProfile;
    const bmr = gender === 'male'
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5
      : (10 * weight) + (6.25 * height) - (5 * age) - 161;
    return Math.round(bmr * activityLevel);
  }, [userProfile]);

  const activePlan = useMemo(() => {
    const plan = availablePlans.find(p => p.id === activePlanId) || availablePlans[0];
    return {
      ...plan,
      dynamicKcal: tdee + plan.kcalModifier
    };
  }, [activePlanId, tdee]);

  const [mealHistory, setMealHistory] = useState<MealHistoryItem[]>([
    {
      id: '1',
      name: '牛油果吐司',
      calories: 340,
      time: '08:30',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgHYXIKTK1Y1dqYvv3c1HhNY3Bo-rNWwfAENjPb75BYK4NUYtDQJWEM1eaLmw1dUvjQYSLKtfpcrsvvfhD_K32R0rS7iX10wWHdOuRRBad9rAyi3bA1xgMjcI5mou5K9OPinF8naHVX8caqHyvHN6qHgpi_ziXBnd8qMzZDkBuv5pm0qYbK8vm6uz19YsqDFCpWyfugeWI6-H4IuM1_WJRzEb6tvH4DAgDxEvtNQwCYwjRX-wCx32c2x3diXxjlot2lQ3Z6a43SA',
      status: 'AI RECOGNIZED'
    }
  ]);

  const handleStart = () => setCurrentScreen(AppScreen.DASHBOARD);
  const handleOpenCamera = () => setCurrentScreen(AppScreen.CAMERA);
  
  const handleSignOut = () => setCurrentScreen(AppScreen.SPLASH);
  const handleClearData = () => setMealHistory([]);

  const renderScreen = () => {
    const commonProps = { t, settings };
    switch (currentScreen) {
      case AppScreen.SPLASH:
        return <SplashScreen {...commonProps} onStart={handleStart} />;
      case AppScreen.DASHBOARD:
        return <Dashboard {...commonProps} history={mealHistory} profile={userProfile} onOpenProfile={() => setCurrentScreen(AppScreen.PROFILE)} targetKcal={activePlan.dynamicKcal || 2000} />;
      case AppScreen.CAMERA:
        return <CameraScreen {...commonProps} onBack={() => setCurrentScreen(AppScreen.DASHBOARD)} onResult={(r) => { setAnalysisResult(r); setCurrentScreen(AppScreen.ANALYSIS); }} />;
      case AppScreen.ANALYSIS:
        return analysisResult ? <AnalysisResults {...commonProps} result={analysisResult} onSave={(m) => {
          const newItem: MealHistoryItem = {
            id: Date.now().toString(),
            name: m.name,
            calories: m.totalCalories,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            image: m.imageUrl || 'https://picsum.photos/200',
            status: 'VERIFIED'
          };
          setMealHistory(prev => [newItem, ...prev]);
          setCurrentScreen(AppScreen.DASHBOARD);
        }} onBack={() => setCurrentScreen(AppScreen.CAMERA)} /> : null;
      case AppScreen.PROFILE:
        return <ProfileScreen 
          {...commonProps}
          profile={userProfile} 
          onUpdateProfile={setUserProfile} 
          onBack={() => setCurrentScreen(AppScreen.DASHBOARD)} 
          onOpenSettings={() => setCurrentScreen(AppScreen.SETTINGS)}
          tdee={tdee} 
        />;
      case AppScreen.SETTINGS:
        return <SettingsScreen 
          {...commonProps}
          onUpdateSettings={setSettings} 
          onBack={() => setCurrentScreen(AppScreen.PROFILE)} 
          onSignOut={handleSignOut}
          onClearData={handleClearData}
          userProfile={userProfile}
        />;
      case AppScreen.STATS:
        return <StatsScreen {...commonProps} onBack={() => setCurrentScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.PLANS:
        return <PlansScreen {...commonProps} currentPlan={activePlan} availablePlans={availablePlans} tdee={tdee} onSelectPlanId={setActivePlanId} />;
      default:
        return <Dashboard {...commonProps} history={mealHistory} profile={userProfile} onOpenProfile={() => setCurrentScreen(AppScreen.PROFILE)} targetKcal={2000} />;
    }
  };

  const showNavbar = [AppScreen.DASHBOARD, AppScreen.PROFILE, AppScreen.STATS, AppScreen.PLANS, AppScreen.SETTINGS].includes(currentScreen);

  return (
    <div className="h-screen w-full relative flex flex-col bg-background-dark overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderScreen()}
      </div>
      {showNavbar && (
        <Navbar {...{t, settings}} activeScreen={currentScreen} onNavigate={setCurrentScreen} onScan={handleOpenCamera} />
      )}
    </div>
  );
};

export default App;
