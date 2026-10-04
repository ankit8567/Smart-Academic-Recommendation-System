import React, { useState } from 'react';
import {
  StudentProfile,
  Subject,
  StudySession,
  DayOfWeek,
  TimeSlot,
  PlannerSettings,
} from '../types/academic';
import { triggerConfetti } from '../utils/confetti';
import {
  Calendar,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  MoveRight,
  Sliders,
  Filter,
  Flame,
  Check,
  Zap,
} from 'lucide-react';

interface WeeklySmartPlannerViewProps {
  profile: StudentProfile;
  subjects: Subject[];
  sessions: StudySession[];
  settings: PlannerSettings;
  onUpdateSessions: (sessions: StudySession[]) => void;
  onUpdateSettings: (settings: PlannerSettings) => void;
  onAwardXP: (amount: number, reason: string) => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_SLOTS: TimeSlot[] = ['Morning', 'Afternoon', 'Evening'];

export const WeeklySmartPlannerView: React.FC<WeeklySmartPlannerViewProps> = ({
  profile,
  subjects,
  sessions,
  settings,
  onUpdateSessions,
  onUpdateSettings,
  onAwardXP,
}) => {
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ day: DayOfWeek; slot: TimeSlot } | null>(null);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);

  // New session state
  const [newSubjectId, setNewSubjectId] = useState<string>(subjects[0]?.id || '');
  const [newDay, setNewDay] = useState<DayOfWeek>('Monday');
  const [newSlot, setNewSlot] = useState<TimeSlot>('Morning');
  const [newDuration, setNewDuration] = useState<number>(60);
  const [customTopicTitle, setCustomTopicTitle] = useState<string>('');

  // Weekly hours target
  const [hoursInput, setHoursInput] = useState<number>(settings.weeklyAvailableHours || 12);

  // Calculate metrics
  const totalPlannedMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const completedMinutes = sessions.filter((s) => s.completed).reduce((acc, s) => acc + s.durationMinutes, 0);
  const plannedHours = (totalPlannedMinutes / 60).toFixed(1);
  const doneHours = (completedMinutes / 60).toFixed(1);
  const completionRate = totalPlannedMinutes > 0 ? Math.round((completedMinutes / totalPlannedMinutes) * 100) : 0;

  // Auto-fill logic
  const handleAutoFillSchedule = () => {
    const hours = hoursInput;
    const targetMinutes = hours * 60;

    // Rank subjects by priority:
    // 1. Weak areas (<70% marks)
    // 2. Incomplete prerequisites
    // 3. Highest career-relevance subjects
    const completedSubjectIds = new Set(profile.completedSubjects.map((c) => c.subjectId));
    const weakSubjectIds = new Set(
      profile.completedSubjects.filter((c) => c.marks < 70).map((c) => c.subjectId)
    );

    const prioritized = [...subjects].sort((a, b) => {
      const aWeak = weakSubjectIds.has(a.id) ? 1 : 0;
      const bWeak = weakSubjectIds.has(b.id) ? 1 : 0;
      if (aWeak !== bWeak) return bWeak - aWeak;

      const aCareer = a.careerRelevance[profile.careerGoal] || 0;
      const bCareer = b.careerRelevance[profile.careerGoal] || 0;
      return bCareer - aCareer;
    });

    const newGeneratedSessions: StudySession[] = [];
    let scheduledMinutes = 0;
    let dayIndex = 0;
    let slotIndex = 0;

    for (const sub of prioritized) {
      if (scheduledMinutes >= targetMinutes) break;

      const incompleteTopics = sub.topics.filter(
        (t) => !profile.completedTopicIds.includes(t.id)
      );
      const topicToStudy = incompleteTopics[0] || sub.topics[0];

      const duration = 60; // 1-hour session
      const day = DAYS_OF_WEEK[dayIndex % DAYS_OF_WEEK.length];
      const slot = TIME_SLOTS[slotIndex % TIME_SLOTS.length];

      newGeneratedSessions.push({
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        subjectId: sub.id,
        subjectCode: sub.code,
        subjectName: sub.name,
        topicId: topicToStudy?.id,
        topicTitle: topicToStudy ? `Unit ${topicToStudy.unitNumber}: ${topicToStudy.title}` : 'Core Fundamentals',
        day,
        slot,
        durationMinutes: duration,
        difficulty: sub.difficulty,
        completed: false,
        isWeakArea: weakSubjectIds.has(sub.id),
      });

      scheduledMinutes += duration;
      slotIndex++;
      if (slotIndex >= TIME_SLOTS.length) {
        slotIndex = 0;
        dayIndex++;
      }
    }

    onUpdateSessions(newGeneratedSessions);
    onUpdateSettings({ ...settings, weeklyAvailableHours: hours });
    setShowAutoFillModal(false);
    triggerConfetti();
    onAwardXP(120, 'Generated smart weekly study schedule');
  };

  const handleToggleComplete = (sessionId: string) => {
    const next = sessions.map((s) => {
      if (s.id === sessionId) {
        const nextCompleted = !s.completed;
        if (nextCompleted) {
          triggerConfetti();
          onAwardXP(35, `Completed study session: ${s.subjectCode}`);
        }
        return { ...s, completed: nextCompleted };
      }
      return s;
    });
    onUpdateSessions(next);
  };

  const handleDeleteSession = (sessionId: string) => {
    onUpdateSessions(sessions.filter((s) => s.id !== sessionId));
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    e.dataTransfer.setData('text/plain', sessionId);
    setDraggedSessionId(sessionId);
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek, slot: TimeSlot) => {
    e.preventDefault();
    setDragOverTarget({ day, slot });
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: DayOfWeek, targetSlot: TimeSlot) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('text/plain') || draggedSessionId;
    if (!sessionId) return;

    const next = sessions.map((s) => {
      if (s.id === sessionId) {
        return { ...s, day: targetDay, slot: targetSlot };
      }
      return s;
    });

    onUpdateSessions(next);
    setDraggedSessionId(null);
    setDragOverTarget(null);
  };

  const handleAddCustomSession = () => {
    const selectedSub = subjects.find((s) => s.id === newSubjectId);
    if (!selectedSub) return;

    const newSess: StudySession = {
      id: `custom-session-${Date.now()}`,
      subjectId: selectedSub.id,
      subjectCode: selectedSub.code,
      subjectName: selectedSub.name,
      topicTitle: customTopicTitle.trim() || 'Unit Review & Problem Solving',
      day: newDay,
      slot: newSlot,
      durationMinutes: newDuration,
      difficulty: selectedSub.difficulty,
      completed: false,
      isWeakArea: profile.completedSubjects.some((c) => c.subjectId === selectedSub.id && c.marks < 70),
    };

    onUpdateSessions([...sessions, newSess]);
    setCustomTopicTitle('');
    setShowAddSessionModal(false);
    onAwardXP(20, 'Scheduled custom study block');
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterSubjectId !== 'all' && s.subjectId !== filterSubjectId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold border border-sky-200 dark:border-sky-800">
              Interactive Schedule
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Drag & Drop Enabled
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-600" />
            <span>Weekly Smart Planner</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Auto-generate optimal study blocks based on your weekly available hours and priority weak areas, or drag & drop sessions between days.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAutoFillModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Auto-Fill Smart Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddSessionModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      {/* Progress & Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-medium">Weekly Target</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {settings.weeklyAvailableHours} Hours
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-medium">Planned Hours</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {plannedHours} hrs
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-medium">Completed</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {doneHours} hrs
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-medium">Weekly Completion</div>
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
              {completionRate}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filter by Subject Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4" />
          <span>Filter by Subject:</span>
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Subjects ({sessions.length} sessions)</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-400">
          Tip: Grab any session card to drag it to another day or time slot!
        </div>
      </div>

      {/* Weekly Planner Grid (Monday - Sunday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3.5 items-start">
        {DAYS_OF_WEEK.map((day) => {
          const daySessions = filteredSessions.filter((s) => s.day === day);
          const isToday =
            new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

          return (
            <div
              key={day}
              className={`rounded-2xl border flex flex-col min-h-[460px] bg-slate-50/70 dark:bg-slate-950/50 ${
                isToday
                  ? 'border-sky-400 dark:border-sky-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 rounded-t-2xl border-b flex items-center justify-between ${
                  isToday
                    ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>{day}</span>
                    {isToday && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-600 text-white font-semibold">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {daySessions.length} {daySessions.length === 1 ? 'block' : 'blocks'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNewDay(day);
                    setShowAddSessionModal(true);
                  }}
                  title={`Add session to ${day}`}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Time Slots in Day */}
              <div className="p-2.5 flex-1 flex flex-col gap-2.5">
                {TIME_SLOTS.map((slot) => {
                  const slotSessions = daySessions.filter((s) => s.slot === slot);
                  const isDragTarget =
                    dragOverTarget?.day === day && dragOverTarget?.slot === slot;

                  return (
                    <div
                      key={slot}
                      onDragOver={(e) => handleDragOver(e, day, slot)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day, slot)}
                      className={`p-2 rounded-xl transition-all border flex flex-col gap-2 min-h-[90px] ${
                        isDragTarget
                          ? 'border-sky-500 bg-sky-100/60 dark:bg-sky-900/40 ring-2 ring-sky-400'
                          : 'border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                        <span>{slot}</span>
                        {slotSessions.length > 0 && (
                          <span>
                            {slotSessions.reduce((a, b) => a + b.durationMinutes, 0)}m
                          </span>
                        )}
                      </div>

                      {/* Sessions List */}
                      {slotSessions.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center">
                          Drop session here
                        </div>
                      ) : (
                        slotSessions.map((s) => (
                          <div
                            key={s.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, s.id)}
                            className={`p-2.5 rounded-lg border text-left cursor-grab active:cursor-grabbing transition-all shadow-2xs group relative ${
                              s.completed
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 opacity-80'
                                : s.isWeakArea
                                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                                : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  s.isWeakArea
                                    ? 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200'
                                    : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                                }`}
                              >
                                {s.subjectCode}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleComplete(s.id)}
                                  title={s.completed ? 'Mark incomplete' : 'Mark completed (+35 XP)'}
                                  className={`p-1 rounded transition-colors ${
                                    s.completed
                                      ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900'
                                      : 'text-slate-400 hover:text-emerald-600'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(s.id)}
                                  title="Delete session"
                                  className="p-1 rounded text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div
                              className={`text-xs font-semibold mt-1 leading-snug ${
                                s.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {s.topicTitle || s.subjectName}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{s.durationMinutes}m</span>
                              </span>
                              {s.isWeakArea && (
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                  Weak Area Focus
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-Fill Configuration Modal */}
      {showAutoFillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Auto-Fill Smart Study Schedule
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculates optimal study blocks matching your available hours.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Weekly Study Hours Target:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={4}
                    max={28}
                    step={2}
                    value={hoursInput}
                    onChange={(e) => setHoursInput(Number(e.target.value))}
                    className="flex-1 accent-sky-600"
                  />
                  <span className="font-mono text-sm font-bold w-14 text-right text-sky-600">
                    {hoursInput} hrs
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Approximately {(hoursInput / 7).toFixed(1)} hours per day.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  Priority Sequencing Applied:
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Reinforces low-score weak areas first</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Schedules pending prerequisite courses</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Focuses on {profile.careerGoal} target skills</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAutoFillModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAutoFillSchedule}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Add Study Session
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Focus Area
                </label>
                <input
                  type="text"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  placeholder="e.g. Normalization & Indexing Drills"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Day
                  </label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value as TimeSlot)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <div className="flex gap-2">
                  {[30, 45, 60, 90].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setNewDuration(dur)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        newDuration === dur
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddSessionModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomSession}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors"
              >
                Add Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
