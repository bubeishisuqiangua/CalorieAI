
import React, { useState, useMemo, useEffect } from 'react';
import { AppScreen, MealAnalysis, MealHistoryItem, MealPlan, UserProfile } from './types';
import { storageService } from './services/storageService';
import SplashScreen from './components/SplashScreen';
import Dashboard from './components/Dashboard';
import CameraScreen from './components/CameraScreen';
import AnalysisResults from './components/AnalysisResults';
import ProfileScreen from './components/ProfileScreen';
import StatsScreen from './components/StatsScreen';
import PlansScreen from './components/PlansScreen';
import SettingsScreen from './components/SettingsScreen';
import OnboardingScreen from './components/OnboardingScreen';
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
    avgDailyIntake: "Avg. Daily Intake",
    avgWeeklyIntake: "Avg. Weekly Intake",
    nutrientTrends: "Nutrient Trends",
    insight: "AI Insight",
    smartPlans: "Smart Meal Plans",
    currentPlan: "Current Plan",
    availableOptions: "Available Options",
    pointCamera: "Point camera at your meal or pick from gallery",
    emptyHistory: "No meals logged yet today.",
    back: "Back",
    noDataInsight: "Start logging your meals to see AI-powered trends and insights!",
    onboardingTitle: "Personalize Your Plan",
    onboardingDesc: "Help us calculate your calorie goals by providing a few details.",
    sedentary: "Sedentary",
    sedentaryDesc: "Office job, little to no exercise",
    light: "Lightly Active",
    lightDesc: "Light exercise 1-3 days a week",
    moderate: "Moderate exercise 3-5 days a week",
    veryActive: "Very Active",
    veryActiveDesc: "Heavy exercise 6-7 days a week",
    finishSetup: "Complete Setup",
    chooseLanguage: "Choose Your Language",
    chooseGoal: "What is your goal?",
    chooseGoalDesc: "We'll tailor your daily targets based on this.",
    weightLoss: "Weight Loss",
    weightLossDesc: "Burn fat with a calorie deficit",
    muscleBuilding: "Muscle Building",
    muscleBuildingDesc: "Gain mass with high protein",
    maintenance: "Maintenance",
    maintenanceDesc: "Keep your current weight",
    storageError: "Storage error occurred. Please try again.",
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
    avgDailyIntake: "平均每日摄入",
    avgWeeklyIntake: "每星期平均摄入",
    nutrientTrends: "营养趋势",
    insight: "AI 洞察",
    smartPlans: "智能饮食计划",
    currentPlan: "当前计划",
    availableOptions: "可选方案",
    pointCamera: "将摄像头对准食物或从相册选择",
    emptyHistory: "今天还没有记录饮食哦",
    back: "返回",
    noDataInsight: "开始记录您的饮食，解锁 AI 趋势分析与健康建议！",
    onboardingTitle: "个性化您的计划",
    onboardingDesc: "提供一些基本信息，帮助我们计算您的热量目标。",
    sedentary: "久坐不动",
    sedentaryDesc: "办公室工作，几乎不运动",
    light: "轻度活跃",
    lightDesc: "每周运动 1-3 天",
    moderate: "中度活跃",
    moderateDesc: "每周运动 3-5 天",
    veryActive: "非常活跃",
    veryActiveDesc: "重体力工作或每天运动",
    finishSetup: "完成设置",
    chooseLanguage: "选择语言",
    chooseGoal: "您的目标是什么？",
    chooseGoalDesc: "我们将根据您的目标制定每日摄入指标。",
    weightLoss: "减重",
    weightLossDesc: "通过热量缺口燃烧脂肪",
    muscleBuilding: "增肌",
    muscleBuildingDesc: "通过高蛋白摄入增加肌肉",
    maintenance: "维持体重",
    maintenanceDesc: "保持当前体重和状态",
    storageError: "存储错误，请稍后再试。",
  }
};

const STORAGE_KEYS = {
  PROFILE: 'calorie_ai_profile',
  SETTINGS: 'calorie_ai_settings',
  ACTIVE_PLAN: 'calorie_ai_active_plan'
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysis | null>(null);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [mealHistory, setMealHistory] = useState<MealHistoryItem[]>([]);
  
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : { language: 'English', units: 'Metric', notifications: true };
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : {
      name: '', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      weight: 70, height: 170, age: 25, gender: 'male', activityLevel: 1.2
    };
  });

  const [activePlanId, setActivePlanId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN) || 'weight-loss';
  });

  const t = useMemo(() => translations[settings.language] || translations.English, [settings.language]);

  // Load history from Persistent Storage on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await storageService.getAllMeals();
        setMealHistory(history);
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, activePlanId);
  }, [activePlanId]);

  useEffect(() => {
    if (userProfile.name) {
      setCurrentScreen(AppScreen.DASHBOARD);
    }
  }, []);

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
    const w = Number(weight) || 0;
    const h = Number(height) || 0;
    const a = Number(age) || 0;
    if (w === 0 || h === 0 || a === 0) return 2000;
    const bmr = gender === 'male' ? (10 * w) + (6.25 * h) - (5 * a) + 5 : (10 * w) + (6.25 * h) - (5 * a) - 161;
    return Math.round(bmr * activityLevel);
  }, [userProfile]);

  const activePlan = useMemo(() => {
    const plan = availablePlans.find(p => p.id === activePlanId) || availablePlans[0];
    return { ...plan, dynamicKcal: tdee + plan.kcalModifier };
  }, [activePlanId, tdee, availablePlans]);

  const handleStart = () => {
    if (userProfile.name) setCurrentScreen(AppScreen.DASHBOARD);
    else setCurrentScreen(AppScreen.ONBOARDING);
  };

  const handleOnboardingComplete = (profile: UserProfile, planId: string) => {
    const sanitized = { ...profile, weight: Number(profile.weight) || 0, height: Number(profile.height) || 0, age: Number(profile.age) || 0 };
    setUserProfile(sanitized);
    setActivePlanId(planId);
    setCurrentScreen(AppScreen.DASHBOARD);
  };
  
  const handleOpenCamera = () => setCurrentScreen(AppScreen.CAMERA);

  const handleSignOut = async () => {
    await storageService.clearAll();
    localStorage.clear();
    setMealHistory([]);
    setUserProfile({
      name: '', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      weight: 70, height: 170, age: 25, gender: 'male', activityLevel: 1.2
    });
    setSettings({ language: 'English', units: 'Metric', notifications: true });
    setCurrentScreen(AppScreen.SPLASH);
  };

  const handleClearData = async () => {
    await storageService.clearAll();
    setMealHistory([]);
  };

  const handleMealClick = (meal: MealHistoryItem) => {
    setAnalysisResult(meal);
    setIsViewingHistory(true);
    setCurrentScreen(AppScreen.ANALYSIS);
  };

  const handleSaveMeal = async (m: MealAnalysis) => {
    const newItem: MealHistoryItem = {
      ...m,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      image: m.imageUrl || 'https://picsum.photos/200',
      status: 'VERIFIED'
    };
    
    try {
      await storageService.saveMeal(newItem);
      setMealHistory(prev => [newItem, ...prev]);
      setCurrentScreen(AppScreen.DASHBOARD);
    } catch (e) {
      alert(t.storageError);
    }
  };

  const renderScreen = () => {
    const commonProps = { t, settings };
    switch (currentScreen) {
      case AppScreen.SPLASH:
        return <SplashScreen {...commonProps} onStart={handleStart} />;
      case AppScreen.ONBOARDING:
        return <OnboardingScreen {...commonProps} onComplete={handleOnboardingComplete} onLanguageSelect={(lang) => setSettings(prev => ({ ...prev, language: lang }))} />;
      case AppScreen.DASHBOARD:
        return <Dashboard {...commonProps} history={mealHistory} profile={userProfile} onOpenProfile={() => setCurrentScreen(AppScreen.PROFILE)} targetKcal={activePlan.dynamicKcal || 2000} onSelectMeal={handleMealClick} />;
      case AppScreen.CAMERA:
        return <CameraScreen {...commonProps} onBack={() => setCurrentScreen(AppScreen.DASHBOARD)} onResult={(r) => { setAnalysisResult(r); setIsViewingHistory(false); setCurrentScreen(AppScreen.ANALYSIS); }} />;
      case AppScreen.ANALYSIS:
        return analysisResult ? (
          <AnalysisResults 
            {...commonProps} 
            result={analysisResult} 
            isViewOnly={isViewingHistory}
            onSave={handleSaveMeal} 
            onBack={() => isViewingHistory ? setCurrentScreen(AppScreen.DASHBOARD) : setCurrentScreen(AppScreen.CAMERA)} 
          />
        ) : null;
      case AppScreen.PROFILE:
        return <ProfileScreen {...commonProps} profile={userProfile} onUpdateProfile={setUserProfile} onBack={() => setCurrentScreen(AppScreen.DASHBOARD)} onOpenSettings={() => setCurrentScreen(AppScreen.SETTINGS)} tdee={tdee} />;
      case AppScreen.SETTINGS:
        return <SettingsScreen {...commonProps} onUpdateSettings={setSettings} onBack={() => setCurrentScreen(AppScreen.PROFILE)} onSignOut={handleSignOut} onClearData={handleClearData} userProfile={userProfile} />;
      case AppScreen.STATS:
        return <StatsScreen {...commonProps} history={mealHistory} onBack={() => setCurrentScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.PLANS:
        return <PlansScreen {...commonProps} currentPlan={activePlan} availablePlans={availablePlans} tdee={tdee} onSelectPlanId={setActivePlanId} />;
      default:
        return <Dashboard {...commonProps} history={mealHistory} profile={userProfile} onOpenProfile={() => setCurrentScreen(AppScreen.PROFILE)} targetKcal={2000} onSelectMeal={handleMealClick} />;
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
