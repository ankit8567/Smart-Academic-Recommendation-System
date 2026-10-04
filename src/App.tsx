import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  Subject,
  LearningResource,
  PeerStudent,
  MentorNote,
  AcademicNotification,
  NavigationTab,
  StudySession,
  PlannerSettings,
  MoodCheckIn,
  EnergyMood,
  GamificationState,
} from './types/academic';
import {
  INITIAL_SUBJECTS,
  INITIAL_RESOURCES,
  INITIAL_STUDENT_PROFILE,
  INITIAL_PEER_STUDENTS,
  INITIAL_MENTOR_NOTES,
  INITIAL_NOTIFICATIONS,
  INITIAL_STUDY_SESSIONS,
  INITIAL_PLANNER_SETTINGS,
  INITIAL_MOOD_CHECKIN,
} from './data/seedData';
import {
  INITIAL_GAMIFICATION_STATE,
  calculateLevel,
  recordDailyActivity,
  checkAndAwardBadge,
} from './utils/gamification';
import { triggerConfetti } from './utils/confetti';
import { ProfileOnboarding } from './components/ProfileOnboarding';
import { RecommendationsView } from './components/RecommendationsView';
import { LearningPathsView } from './components/LearningPathsView';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { ResourceLibraryView } from './components/ResourceLibraryView';
import { CollaborativeView } from './components/CollaborativeView';
import { MentorView } from './components/MentorView';
import { AdminPanelView } from './components/AdminPanelView';
import { StudyPlanExportModal } from './components/StudyPlanExportModal';
import { OpheliaChatbot } from './components/OpheliaChatbot';
import { WeeklySmartPlannerView } from './components/WeeklySmartPlannerView';
import { GamificationModal } from './components/GamificationModal';
import { ShareableProfileCardModal } from './components/ShareableProfileCardModal';
import {
  Sun,
  Moon,
  Bell,
  FileDown,
  LayoutDashboard,
  UserCircle,
  Sparkles,
  GitBranch,
  BarChart3,
  BookOpen,
  Users,
  UserCheck,
  Settings,
  Menu,
  X,
  Bot,
  Flame,
  Trophy,
  Calendar,
  Share2,
} from 'lucide-react';

const STORAGE_KEYS = {
  PROFILE: 'sars_student_profile_v1',
  SUBJECTS: 'sars_subjects_v1',
  RESOURCES: 'sars_resources_v1',
  MENTOR_NOTES: 'sars_mentor_notes_v1',
  NOTIFICATIONS: 'sars_notifications_v1',
  THEME: 'sars_theme_v1',
  GAMIFICATION: 'sars_gamification_v1',
  MOOD: 'sars_mood_v1',
  SESSIONS: 'sars_sessions_v1',
  PLANNER_SETTINGS: 'sars_planner_settings_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  const [profile, setProfile] = useState<StudentProfile>(() =>
    loadFromStorage(STORAGE_KEYS.PROFILE, INITIAL_STUDENT_PROFILE)
  );
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    loadFromStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS)
  );
  const [resources, setResources] = useState<LearningResource[]>(() =>
    loadFromStorage(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES)
  );
  const [peers] = useState<PeerStudent[]>(INITIAL_PEER_STUDENTS);
  const [mentorNotes, setMentorNotes] = useState<MentorNote[]>(() =>
    loadFromStorage(STORAGE_KEYS.MENTOR_NOTES, INITIAL_MENTOR_NOTES)
  );
  const [notifications, setNotifications] = useState<AcademicNotification[]>(
    () => loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  );

  const [gamification, setGamification] = useState<GamificationState>(() =>
    loadFromStorage(STORAGE_KEYS.GAMIFICATION, INITIAL_GAMIFICATION_STATE)
  );
  const [currentMood, setCurrentMood] = useState<MoodCheckIn>(() =>
    loadFromStorage(STORAGE_KEYS.MOOD, INITIAL_MOOD_CHECKIN)
  );
  const [sessions, setSessions] = useState<StudySession[]>(() =>
    loadFromStorage(STORAGE_KEYS.SESSIONS, INITIAL_STUDY_SESSIONS)
  );
  const [plannerSettings, setPlannerSettings] = useState<PlannerSettings>(() =>
    loadFromStorage(STORAGE_KEYS.PLANNER_SETTINGS, INITIAL_PLANNER_SETTINGS)
  );

  const [activeTab, setActiveTab] = useState<NavigationTab>(() =>
    profile.onboardingCompleted ? 'dashboard' : 'profile'
  );
  const [roadmapTargetSubjectId, setRoadmapTargetSubjectId] = useState<
    string | null
  >(null);
  const [showNotificationsDropdown, setShowNotificationsDropdown] =
    useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOpheliaChat, setShowOpheliaChat] = useState(false);
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [showShareCardModal, setShowShareCardModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Daily activity / streak check
  useEffect(() => {
    setGamification((prev) => recordDailyActivity(prev));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(gamification));
    } catch {
      // Ignore
    }
  }, [gamification]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOOD, JSON.stringify(currentMood));
    } catch {
      // Ignore
    }
  }, [currentMood]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch {
      // Ignore
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLANNER_SETTINGS, JSON.stringify(plannerSettings));
    } catch {
      // Ignore
    }
  }, [plannerSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch {
      // Ignore
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    } catch {
      // Ignore
    }
  }, [resources]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.MENTOR_NOTES,
        JSON.stringify(mentorNotes)
      );
    } catch {
      // Ignore
    }
  }, [mentorNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(notifications)
      );
    } catch {
      // Ignore
    }
  }, [notifications]);

  const handleSaveProfile = (
    updatedProfile: StudentProfile,
    navigateNext?: boolean
  ) => {
    setProfile(updatedProfile);
    if (navigateNext) {
      setActiveTab('recommendations');
    }
  };

  const handleRecommendationFeedback = (
    itemId: string,
    vote: 'up' | 'down'
  ) => {
    setProfile((prev) => {
      const current = prev.recommendationFeedback[itemId];
      const nextFeedback = { ...prev.recommendationFeedback };
      if (current === vote) {
        delete nextFeedback[itemId];
      } else {
        nextFeedback[itemId] = vote;
      }
      return {
        ...prev,
        recommendationFeedback: nextFeedback,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAwardXP = (amount: number, reason: string) => {
    setGamification((prev) => ({
      ...prev,
      totalXP: prev.totalXP + amount,
    }));
  };

  const handleUpdateMood = (energy: EnergyMood) => {
    setCurrentMood({
      energy,
      checkedInAt: new Date().toISOString(),
    });
    setGamification((prev) => checkAndAwardBadge(prev, 'mindful_student'));
    handleAwardXP(25, 'Daily mood check-in completed');
  };

  const handleOpenRoadmapForSubject = (subjectId: string) => {
    setRoadmapTargetSubjectId(subjectId);
    setActiveTab('roadmap');
  };

  const handleMarkPrerequisiteComplete = (subjectId: string) => {
    handleAwardXP(100, 'Prerequisite completed');
    setGamification((prev) => checkAndAwardBadge(prev, 'prereq_master'));

    setProfile((prev) => {
      const exists = prev.completedSubjects.some(
        (c) => c.subjectId === subjectId
      );
      const nextCompleted = exists
        ? prev.completedSubjects.map((c) =>
            c.subjectId === subjectId
              ? { ...c, marks: Math.max(c.marks, 76) }
              : c
          )
        : [
            ...prev.completedSubjects,
            {
              subjectId,
              marks: 78,
              semesterTaken: Math.max(1, prev.semester - 1),
            },
          ];
      return {
        ...prev,
        completedSubjects: nextCompleted,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleToggleTopicComplete = (topicId: string) => {
    setProfile((prev) => {
      const exists = prev.completedTopicIds.includes(topicId);
      const nextTopics = exists
        ? prev.completedTopicIds.filter((id) => id !== topicId)
        : [...prev.completedTopicIds, topicId];

      if (!exists) {
        handleAwardXP(40, 'Topic completed');
        triggerConfetti();
        if (currentMood.energy === 'high') {
          setGamification((prevGam) => checkAndAwardBadge(prevGam, 'high_voltage'));
        }
      }

      return {
        ...prev,
        completedTopicIds: nextTopics,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleUpdateTopicQuizScore = (topicId: string, score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    if (clamped >= 80) {
      handleAwardXP(60, 'Scored 80%+ on quiz');
      setGamification((prev) => checkAndAwardBadge(prev, 'quiz_ace'));
    }
    setProfile((prev) => ({
      ...prev,
      topicQuizScores: {
        ...prev.topicQuizScores,
        [topicId]: clamped,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleToggleBookmark = (resourceId: string) => {
    setProfile((prev) => {
      const exists = prev.bookmarkedResourceIds.includes(resourceId);
      const nextBookmarks = exists
        ? prev.bookmarkedResourceIds.filter((id) => id !== resourceId)
        : [...prev.bookmarkedResourceIds, resourceId];

      if (!exists && nextBookmarks.length >= 3) {
        setGamification((prevGam) => checkAndAwardBadge(prevGam, 'resource_hound'));
      }

      return {
        ...prev,
        bookmarkedResourceIds: nextBookmarks,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAddMentorNote = (
    newNoteData: Omit<MentorNote, 'id' | 'createdAt' | 'acknowledged'>
  ) => {
    const created: MentorNote = {
      ...newNoteData,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
    setMentorNotes((prev) => [created, ...prev]);

    const notif: AcademicNotification = {
      id: `notif-${Date.now()}`,
      title: `New Guidance from ${created.mentorName}`,
      message: `${created.focusArea}: ${created.note.slice(0, 90)}...`,
      category: 'mentor',
      createdAt: 'Just now',
      read: false,
      actionTab: 'mentor',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleAcknowledgeMentorNote = (noteId: string) => {
    setGamification((prev) => checkAndAwardBadge(prev, 'mentor_sync'));
    setMentorNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, acknowledged: true } : n))
    );
  };

  const handleResetCurriculumToDefault = () => {
    setSubjects(INITIAL_SUBJECTS);
    setResources(INITIAL_RESOURCES);
    setProfile(INITIAL_STUDENT_PROFILE);
    setMentorNotes(INITIAL_MENTOR_NOTES);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const levelInfo = calculateLevel(gamification.totalXP);

  const sidebarItems: Array<{
    id: NavigationTab;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'planner',
      label: 'Weekly Smart Planner',
      shortLabel: 'Planner',
      icon: Calendar,
    },
    {
      id: 'profile',
      label: '1. Student Profile',
      shortLabel: 'Profile',
      icon: UserCircle,
    },
    {
      id: 'recommendations',
      label: '2. Recommendations',
      shortLabel: 'Recommendations',
      icon: Sparkles,
    },
    {
      id: 'roadmap',
      label: '3. Learning Paths',
      shortLabel: 'Roadmap',
      icon: GitBranch,
    },
    {
      id: 'analytics',
      label: '4. Progress & Skill-Gap',
      shortLabel: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'resources',
      label: '5. Resource Library',
      shortLabel: 'Resources',
      icon: BookOpen,
    },
    {
      id: 'collaborative',
      label: '6. Peer Suggestions',
      shortLabel: 'Peers',
      icon: Users,
    },
    {
      id: 'mentor',
      label: '7. Mentor Console',
      shortLabel: 'Mentor',
      icon: UserCheck,
    },
    {
      id: 'admin',
      label: '8. Admin Curriculum',
      shortLabel: 'Admin',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="no-print sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap"
        >
          Academic Path Smart Guide
        </a>

        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
          {(
            [
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'planner', label: 'Smart Planner' },
              { id: 'recommendations', label: 'Recommendations' },
              { id: 'roadmap', label: 'Roadmaps' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'resources', label: 'Resources' },
            ] as const
          ).map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => setActiveTab(nav.id)}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === nav.id
                  ? 'text-sky-600 dark:text-sky-400 font-semibold underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Daily Streak Flame */}
          <button
            type="button"
            onClick={() => setShowGamificationModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900/60 bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-all font-mono font-bold text-xs shadow-2xs"
            title={`${gamification.streakDays} Day Active Study Streak - View XP & Badges`}
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{gamification.streakDays}</span>
          </button>

          {/* Level & XP Badge */}
          <button
            type="button"
            onClick={() => setShowGamificationModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all text-xs font-semibold shadow-2xs"
            title={`Level ${levelInfo.level}: ${levelInfo.title} (${gamification.totalXP} XP)`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Lvl {levelInfo.level}</span>
          </button>

          {/* Share Profile Card Button */}
          <button
            type="button"
            onClick={() => setShowShareCardModal(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
            title="Open Shareable Student Passport Card (PNG / PDF)"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Card</span>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowNotificationsDropdown(!showNotificationsDropdown)
              }
              aria-label="Academic notifications and reminders"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Pending Topic Reminders & Alerts
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, read: true }))
                      )
                    }
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((item) =>
                            item.id === n.id ? { ...item, read: true } : item
                          )
                        );
                        if (n.actionTab) setActiveTab(n.actionTab);
                        setShowNotificationsDropdown(false);
                      }}
                      className={`py-2.5 px-2 rounded-lg cursor-pointer transition-colors ${
                        !n.read
                          ? 'bg-sky-50/60 dark:bg-sky-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="uppercase font-mono">{n.category}</span>
                        <span>{n.createdAt}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {n.title}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowOpheliaChat(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            title="Ask Ophelia - Gemini Academic Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold">Ask Ophelia</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Plan PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={
              darkMode ? 'Switch to light mode' : 'Switch to dark mode'
            }
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation drawer"
            className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="no-print hidden md:flex flex-col justify-between w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="space-y-6">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {profile.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {profile.program} · Sem {profile.semester} · CGPA{' '}
                {profile.cgpa.toFixed(2)}
              </div>
              <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium pt-0.5 truncate">
                Goal: {profile.careerGoal}
              </div>
            </div>

            <div className="space-y-1">
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Academic Modules
              </div>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Study Plan (PDF)</span>
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="no-print md:hidden fixed inset-0 top-16 z-40 bg-slate-950/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium ${
                      active
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowExportModal(true);
                }}
                className="w-full mt-2 py-2.5 px-3.5 bg-sky-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Study Plan (PDF)</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <AnalyticsDashboardView
              profile={profile}
              subjects={subjects}
              resources={resources}
              onToggleTopicComplete={handleToggleTopicComplete}
              onUpdateTopicQuizScore={handleUpdateTopicQuizScore}
              onNavigateTab={setActiveTab}
              onOpenSubjectRoadmap={handleOpenRoadmapForSubject}
              isOverviewMode={true}
              currentMood={currentMood}
              onUpdateMood={handleUpdateMood}
              gamification={gamification}
              onOpenGamificationModal={() => setShowGamificationModal(true)}
              onOpenShareCardModal={() => setShowShareCardModal(true)}
            />
          )}

          {activeTab === 'planner' && (
            <WeeklySmartPlannerView
              profile={profile}
              subjects={subjects}
              sessions={sessions}
              settings={plannerSettings}
              onUpdateSessions={setSessions}
              onUpdateSettings={setPlannerSettings}
              onAwardXP={handleAwardXP}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileOnboarding
              profile={profile}
              subjects={subjects}
              onSaveProfile={handleSaveProfile}
              isFirstTimeBanner={!profile.onboardingCompleted}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationsView
              profile={profile}
              subjects={subjects}
              resources={resources}
              onFeedback={handleRecommendationFeedback}
              onOpenRoadmapForSubject={handleOpenRoadmapForSubject}
              onMarkSubjectPrerequisiteComplete={handleMarkPrerequisiteComplete}
            />
          )}

          {activeTab === 'roadmap' && (
            <LearningPathsView
              profile={profile}
              subjects={subjects}
              resources={resources}
              initialSubjectId={roadmapTargetSubjectId}
              onToggleTopicComplete={handleToggleTopicComplete}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboardView
              profile={profile}
              subjects={subjects}
              resources={resources}
              onToggleTopicComplete={handleToggleTopicComplete}
              onUpdateTopicQuizScore={handleUpdateTopicQuizScore}
              onNavigateTab={setActiveTab}
              onOpenSubjectRoadmap={handleOpenRoadmapForSubject}
              isOverviewMode={false}
              currentMood={currentMood}
              onUpdateMood={handleUpdateMood}
              gamification={gamification}
              onOpenGamificationModal={() => setShowGamificationModal(true)}
              onOpenShareCardModal={() => setShowShareCardModal(true)}
            />
          )}

          {activeTab === 'resources' && (
            <ResourceLibraryView
              profile={profile}
              subjects={subjects}
              resources={resources}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {activeTab === 'collaborative' && (
            <CollaborativeView
              profile={profile}
              peers={peers}
              subjects={subjects}
              onOpenSubjectRoadmap={handleOpenRoadmapForSubject}
            />
          )}

          {activeTab === 'mentor' && (
            <MentorView
              profile={profile}
              peers={peers}
              subjects={subjects}
              mentorNotes={mentorNotes}
              onAddMentorNote={handleAddMentorNote}
              onAcknowledgeNote={handleAcknowledgeMentorNote}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanelView
              subjects={subjects}
              resources={resources}
              onSaveSubjects={setSubjects}
              onSaveResources={setResources}
              onResetCurriculumToDefault={handleResetCurriculumToDefault}
            />
          )}
        </main>
      </div>

      {showExportModal && (
        <StudyPlanExportModal
          profile={profile}
          subjects={subjects}
          resources={resources}
          mentorNotes={mentorNotes}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Gamification, Streak & Badges Modal */}
      <GamificationModal
        state={gamification}
        isOpen={showGamificationModal}
        onClose={() => setShowGamificationModal(false)}
      />

      {/* Shareable Profile Passport Card Modal */}
      <ShareableProfileCardModal
        profile={profile}
        subjects={subjects}
        gamification={gamification}
        isOpen={showShareCardModal}
        onClose={() => setShowShareCardModal(false)}
      />

      {/* Floating Ophelia Chatbot Launcher */}
      {!showOpheliaChat && (
        <button
          type="button"
          onClick={() => setShowOpheliaChat(true)}
          className="no-print fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5 group focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          aria-label="Open Ophelia Academic AI Advisor"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-left pr-1">
            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>Ophelia</span>
              <span className="text-[10px] font-mono font-medium bg-white/20 px-1.5 py-0.5 rounded">Gemini AI</span>
            </div>
            <div className="text-[10px] text-sky-100 leading-tight">Academic Advisor</div>
          </div>
        </button>
      )}

      <OpheliaChatbot
        profile={profile}
        subjects={subjects}
        isOpen={showOpheliaChat}
        onClose={() => setShowOpheliaChat(false)}
      />
    </div>
  );
}

export default App;
