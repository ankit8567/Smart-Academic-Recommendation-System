import { Badge, GamificationState } from '../types/academic';
import { triggerConfetti } from './confetti';

export interface LevelInfo {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  nextLevelXP: number;
  progressPercent: number;
}

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_ignition',
    title: 'First Ignition',
    description: 'Completed onboarding profile and selected target career goal.',
    iconName: 'Sparkles',
    category: 'learning',
    xpReward: 100,
  },
  {
    id: 'streak_3',
    title: '3-Day Dynamo',
    description: 'Maintained a 3-day continuous active learning streak.',
    iconName: 'Flame',
    category: 'streak',
    xpReward: 150,
  },
  {
    id: 'streak_7',
    title: 'Weekly Titan',
    description: 'Maintained a 7-day uninterrupted study streak.',
    iconName: 'Crown',
    category: 'streak',
    xpReward: 300,
  },
  {
    id: 'quiz_ace',
    title: 'Quiz Ace',
    description: 'Scored 80% or higher on a diagnostic topic assessment.',
    iconName: 'Award',
    category: 'mastery',
    xpReward: 150,
  },
  {
    id: 'prereq_master',
    title: 'Prerequisite Slayer',
    description: 'Mastered a critical foundational prerequisite subject.',
    iconName: 'ShieldCheck',
    category: 'mastery',
    xpReward: 200,
  },
  {
    id: 'master_planner',
    title: 'Architect of Time',
    description: 'Generated a personalized weekly schedule using the Smart Planner.',
    iconName: 'CalendarCheck2',
    category: 'consistency',
    xpReward: 120,
  },
  {
    id: 'mindful_student',
    title: 'Mindful Scholar',
    description: 'Completed a daily energy check-in to adapt learning intensity.',
    iconName: 'Zap',
    category: 'consistency',
    xpReward: 75,
  },
  {
    id: 'high_voltage',
    title: 'High Voltage Focus',
    description: 'Completed an advanced problem unit during a High Energy check-in.',
    iconName: 'TrendingUp',
    category: 'mastery',
    xpReward: 180,
  },
  {
    id: 'resource_hound',
    title: 'Resource Collector',
    description: 'Saved 3 or more high-yield learning resources to your library.',
    iconName: 'BookmarkCheck',
    category: 'learning',
    xpReward: 100,
  },
  {
    id: 'mentor_sync',
    title: 'Guided Path',
    description: 'Reviewed and acknowledged tailored faculty mentor guidance.',
    iconName: 'UserCheck',
    category: 'consistency',
    xpReward: 100,
  },
];

const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Curious Scholar', minXP: 0, maxXP: 200 },
  { level: 2, title: 'Logic Novice', minXP: 200, maxXP: 500 },
  { level: 3, title: 'Course Navigator', minXP: 500, maxXP: 1000 },
  { level: 4, title: 'Prerequisite Conqueror', minXP: 1000, maxXP: 1750 },
  { level: 5, title: 'Focus Specialist', minXP: 1750, maxXP: 2750 },
  { level: 6, title: 'Insight Analyst', minXP: 2750, maxXP: 4000 },
  { level: 7, title: "Dean's List Aspirant", minXP: 4000, maxXP: 5500 },
  { level: 8, title: 'Academic Maestro', minXP: 5500, maxXP: 7500 },
  { level: 9, title: 'Research Prodigy', minXP: 7500, maxXP: 10000 },
  { level: 10, title: 'Grand Scholar', minXP: 10000, maxXP: 15000 },
];

export function calculateLevel(totalXP: number): LevelInfo {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = LEVEL_THRESHOLDS[i];
    if (totalXP >= t.minXP) {
      const range = t.maxXP - t.minXP;
      const progress = Math.min(100, Math.max(0, ((totalXP - t.minXP) / range) * 100));
      return {
        level: t.level,
        title: t.title,
        minXP: t.minXP,
        maxXP: t.maxXP,
        nextLevelXP: t.maxXP,
        progressPercent: Math.round(progress),
      };
    }
  }

  return {
    level: 1,
    title: LEVEL_THRESHOLDS[0].title,
    minXP: 0,
    maxXP: 200,
    nextLevelXP: 200,
    progressPercent: 0,
  };
}

export const INITIAL_GAMIFICATION_STATE: GamificationState = {
  streakDays: 4,
  lastActiveDate: new Date().toISOString().split('T')[0],
  totalXP: 420,
  unlockedBadgeIds: ['first_ignition', 'mindful_student'],
  streakFreezeCount: 1,
};

export function checkAndAwardBadge(
  currentState: GamificationState,
  badgeId: string,
  onUnlock?: (badge: Badge) => void
): GamificationState {
  if (currentState.unlockedBadgeIds.includes(badgeId)) {
    return currentState;
  }

  const badge = ALL_BADGES.find((b) => b.id === badgeId);
  if (!badge) return currentState;

  const nextUnlocked = [...currentState.unlockedBadgeIds, badgeId];
  const nextXP = currentState.totalXP + badge.xpReward;

  // Trigger celebration confetti
  triggerConfetti();
  if (onUnlock) onUnlock(badge);

  return {
    ...currentState,
    totalXP: nextXP,
    unlockedBadgeIds: nextUnlocked,
  };
}

export function recordDailyActivity(currentState: GamificationState): GamificationState {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = currentState.lastActiveDate;

  if (lastDate === today) {
    return currentState;
  }

  const todayObj = new Date(today);
  const lastDateObj = new Date(lastDate);
  const diffDays = Math.round((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 3600 * 24));

  let nextStreak = currentState.streakDays;
  let bonusXP = 20;

  if (diffDays === 1) {
    nextStreak += 1;
    bonusXP += 10;
  } else if (diffDays > 1) {
    if (currentState.streakFreezeCount > 0 && diffDays === 2) {
      // Used streak freeze
      return {
        ...currentState,
        lastActiveDate: today,
        totalXP: currentState.totalXP + bonusXP,
        streakFreezeCount: currentState.streakFreezeCount - 1,
      };
    }
    nextStreak = 1;
  }

  let updatedState: GamificationState = {
    ...currentState,
    streakDays: nextStreak,
    lastActiveDate: today,
    totalXP: currentState.totalXP + bonusXP,
  };

  if (nextStreak >= 3 && !updatedState.unlockedBadgeIds.includes('streak_3')) {
    updatedState = checkAndAwardBadge(updatedState, 'streak_3');
  }
  if (nextStreak >= 7 && !updatedState.unlockedBadgeIds.includes('streak_7')) {
    updatedState = checkAndAwardBadge(updatedState, 'streak_7');
  }

  return updatedState;
}
