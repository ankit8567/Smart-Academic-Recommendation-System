import React from 'react';
import { EnergyMood, MoodCheckIn } from '../types/academic';
import { Zap, BatteryCharging, Compass, Timer, Sparkles, Check } from 'lucide-react';

interface MoodCheckInBarProps {
  currentMood: MoodCheckIn;
  onUpdateMood: (mood: EnergyMood) => void;
}

interface MoodOption {
  id: EnergyMood;
  label: string;
  sublabel: string;
  icon: React.FC<{ className?: string }>;
  colorClasses: string;
  activeClasses: string;
  description: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'high',
    label: 'High Energy',
    sublabel: 'Deep Focus & Labs',
    icon: Zap,
    colorClasses: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    activeClasses: 'ring-2 ring-amber-500 bg-amber-100/80 dark:bg-amber-900/60 border-amber-400',
    description: 'Challenging problem sets, advanced topics, and diagnostic quizzes are prioritized.',
  },
  {
    id: 'moderate',
    label: 'Balanced',
    sublabel: 'Standard Syllabus Pace',
    icon: Compass,
    colorClasses: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900',
    activeClasses: 'ring-2 ring-sky-500 bg-sky-100/80 dark:bg-sky-900/60 border-sky-400',
    description: 'Steady mix of prerequisite units, structured notes, and core practice questions.',
  },
  {
    id: 'low',
    label: 'Low Energy',
    sublabel: 'Micro-Recaps & Rest',
    icon: BatteryCharging,
    colorClasses: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    activeClasses: 'ring-2 ring-emerald-500 bg-emerald-100/80 dark:bg-emerald-900/60 border-emerald-400',
    description: 'Bite-sized video summaries (5-10m) and cheat-sheets to keep your streak without burnout.',
  },
  {
    id: 'sprint',
    label: 'Sprint Mode',
    sublabel: '15-20 Min Quick Review',
    icon: Timer,
    colorClasses: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
    activeClasses: 'ring-2 ring-purple-500 bg-purple-100/80 dark:bg-purple-900/60 border-purple-400',
    description: 'Fast flashcard reviews and high-yield milestone formulas for tight schedules.',
  },
];

export const MoodCheckInBar: React.FC<MoodCheckInBarProps> = ({
  currentMood,
  onUpdateMood,
}) => {
  const activeOption = MOOD_OPTIONS.find((m) => m.id === currentMood.energy) || MOOD_OPTIONS[1];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Daily Mood & Energy Check-in</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Live Adaptation
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              How are you feeling today? We automatically tune syllabus difficulty and duration to match your stamina.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="text-[11px] font-medium text-slate-400">Current Strategy: </span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {activeOption.label}
          </span>
        </div>
      </div>

      {/* Mood Options Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {MOOD_OPTIONS.map((opt) => {
          const isSelected = opt.id === currentMood.energy;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onUpdateMood(opt.id)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                opt.colorClasses
              } ${isSelected ? opt.activeClasses : 'hover:opacity-90'}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5" />
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-current text-white dark:text-slate-900 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold leading-tight">{opt.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5 leading-tight">{opt.sublabel}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Feedback Banner */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <span className="shrink-0 text-base">
          {currentMood.energy === 'high' && '⚡'}
          {currentMood.energy === 'moderate' && '💡'}
          {currentMood.energy === 'low' && '🔋'}
          {currentMood.energy === 'sprint' && '🎯'}
        </span>
        <span className="text-[11px] leading-relaxed">
          <strong>Recommendation Engine Tuned:</strong> {activeOption.description}
        </span>
      </div>
    </div>
  );
};
