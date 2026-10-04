import React from 'react';
import { Badge, GamificationState } from '../types/academic';
import { ALL_BADGES, calculateLevel } from '../utils/gamification';
import { triggerConfetti } from '../utils/confetti';
import {
  X,
  Flame,
  Sparkles,
  Trophy,
  ShieldCheck,
  Award,
  Crown,
  Zap,
  CalendarCheck2,
  TrendingUp,
  BookmarkCheck,
  UserCheck,
  Lock,
  CheckCircle2,
  Snowflake,
} from 'lucide-react';

interface GamificationModalProps {
  state: GamificationState;
  isOpen: boolean;
  onClose: () => void;
  onClaimBadge?: (badgeId: string) => void;
}

const BADGE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Flame,
  Crown,
  Award,
  ShieldCheck,
  CalendarCheck2,
  Zap,
  TrendingUp,
  BookmarkCheck,
  UserCheck,
};

export const GamificationModal: React.FC<GamificationModalProps> = ({
  state,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const levelInfo = calculateLevel(state.totalXP);
  const unlockedCount = state.unlockedBadgeIds.length;
  const totalCount = ALL_BADGES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-r from-sky-600 via-indigo-600 to-amber-500 text-white flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-lg">
              <Trophy className="w-8 h-8 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-mono font-bold tracking-wide uppercase">
                  Level {levelInfo.level}
                </span>
                <span className="text-xs font-medium text-sky-100">
                  {levelInfo.title}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Academic Achievements & XP
              </h2>
              <p className="text-xs text-sky-100 mt-0.5">
                Earn XP, maintain your daily study flame, and collect prestigious honors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerConfetti()}
              title="Celebrate with confetti"
              aria-label="Celebrate with confetti"
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              aria-label="Close modal"
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Daily Streak Card */}
            <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span>Daily Streak</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {state.streakDays} Days
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Active study sessions
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Flame className="w-7 h-7 fill-orange-500 animate-pulse" />
              </div>
            </div>

            {/* Total XP Card */}
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Total XP</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {state.totalXP} XP
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {levelInfo.nextLevelXP - state.totalXP} XP to Level {levelInfo.level + 1}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            {/* Badges Count Card */}
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Honors Unlocked</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {unlockedCount} / {totalCount}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {Math.round((unlockedCount / totalCount) * 100)}% achievements
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Crown className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-700 dark:text-slate-300">
                Level {levelInfo.level}: {levelInfo.title}
              </span>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                {state.totalXP} / {levelInfo.nextLevelXP} XP ({levelInfo.progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Badges Collection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Unlockable Badges</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {unlockedCount} of {totalCount} Claimed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {ALL_BADGES.map((badge) => {
                const isUnlocked = state.unlockedBadgeIds.includes(badge.id);
                const IconComponent = BADGE_ICONS[badge.iconName] || Award;

                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 relative overflow-hidden ${
                      isUnlocked
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {badge.title}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                          +{badge.xpReward} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {badge.description}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Freeze & Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Snowflake className="w-4 h-4 text-sky-400" />
              <span>
                Streak Freeze Available: <strong>{state.streakFreezeCount}</strong> (Protects your streak if you miss a day)
              </span>
            </div>
            <button
              type="button"
              onClick={() => triggerConfetti()}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Celebrate 🎉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
