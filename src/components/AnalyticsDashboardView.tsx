import React, { useState } from 'react';
import {
  StudentProfile,
  Subject,
  LearningResource,
  NavigationTab,
  EnergyMood,
  MoodCheckIn,
  GamificationState,
} from '../types/academic';
import {
  computeSubjectRecommendations,
  getSubjectProgressPercentage,
} from '../utils/recommendationEngine';
import { MoodCheckInBar } from './MoodCheckInBar';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Sliders,
  BarChart3,
  Flame,
  Trophy,
  Share2,
  Zap,
  BatteryCharging,
  Video,
  FileText,
  Code2,
} from 'lucide-react';

interface AnalyticsDashboardViewProps {
  profile: StudentProfile;
  subjects: Subject[];
  resources: LearningResource[];
  onToggleTopicComplete: (topicId: string) => void;
  onUpdateTopicQuizScore: (topicId: string, score: number) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenSubjectRoadmap: (subjectId: string) => void;
  isOverviewMode?: boolean;
  currentMood?: MoodCheckIn;
  onUpdateMood?: (mood: EnergyMood) => void;
  gamification?: GamificationState;
  onOpenGamificationModal?: () => void;
  onOpenShareCardModal?: () => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  profile,
  subjects,
  resources,
  onToggleTopicComplete,
  onUpdateTopicQuizScore,
  onNavigateTab,
  onOpenSubjectRoadmap,
  isOverviewMode = false,
  currentMood = { energy: 'moderate', checkedInAt: new Date().toISOString() },
  onUpdateMood,
  gamification,
  onOpenGamificationModal,
  onOpenShareCardModal,
}) => {
  const [selectedSubjectForChecklist, setSelectedSubjectForChecklist] =
    useState<string>(subjects[0]?.id || 'subj-prog');

  const recommendations = computeSubjectRecommendations(
    subjects,
    resources,
    profile
  );
  const topReadyRecs = recommendations.filter((r) => r.prerequisitesMet).slice(0, 3);

  const allTopics = subjects.flatMap((s) =>
    s.topics.map((t) => ({ ...t, subject: s }))
  );
  const completedTopicsCount = allTopics.filter((t) =>
    profile.completedTopicIds.includes(t.id)
  ).length;
  const overallTopicMasteryPct =
    allTopics.length > 0
      ? Math.round((completedTopicsCount / allTopics.length) * 100)
      : 0;

  const weakSubjectMarks = profile.completedSubjects
    .filter((c) => c.marks < 70)
    .map((c) => ({
      ...c,
      subject: subjects.find((s) => s.id === c.subjectId),
    }))
    .filter((x) => x.subject !== undefined);

  const weakQuizTopics = allTopics
    .filter((t) => {
      const q = profile.topicQuizScores[t.id];
      return q !== undefined && q < 68;
    })
    .map((t) => ({
      topic: t,
      subject: t.subject,
      score: profile.topicQuizScores[t.id],
    }));

  const strongSubjects = profile.completedSubjects
    .filter((c) => c.marks >= 80)
    .map((c) => ({
      ...c,
      subject: subjects.find((s) => s.id === c.subjectId),
    }))
    .filter((x) => x.subject !== undefined);

  const careerSkillGapRows = subjects
    .filter((s) => (s.careerRelevance[profile.careerGoal] || 0) >= 70)
    .map((subj) => {
      const targetBenchmark = subj.careerRelevance[profile.careerGoal] || 80;
      const markEntry = profile.completedSubjects.find(
        (c) => c.subjectId === subj.id
      );
      const topicProgress = getSubjectProgressPercentage(subj, profile);
      const quizScores = subj.topics
        .map((t) => profile.topicQuizScores[t.id])
        .filter((v): v is number => v !== undefined);
      const avgQuiz =
        quizScores.length > 0
          ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
          : null;

      let currentProficiency = topicProgress;
      if (markEntry && avgQuiz !== null) {
        currentProficiency = Math.round(
          markEntry.marks * 0.5 + avgQuiz * 0.3 + topicProgress * 0.2
        );
      } else if (markEntry) {
        currentProficiency = Math.round(markEntry.marks * 0.7 + topicProgress * 0.3);
      } else if (avgQuiz !== null) {
        currentProficiency = Math.round(avgQuiz * 0.6 + topicProgress * 0.4);
      }

      const gap = Math.max(0, targetBenchmark - currentProficiency);

      return {
        subject: subj,
        targetBenchmark,
        currentProficiency,
        gap,
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const activeChecklistSubject =
    subjects.find((s) => s.id === selectedSubjectForChecklist) || subjects[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            {isOverviewMode
              ? '00. Executive Student Workspace'
              : '04. Mastery Analytics & Skill-Gap Telemetry'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {isOverviewMode
              ? `Academic Command Center — ${profile.name}`
              : 'Progress Tracking, Weak-Area Detection & Skill-Gap Matrix'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            {profile.program} ({profile.branch}) · Semester {profile.semester} · Target Career:{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {profile.careerGoal}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenGamificationModal && gamification && (
            <button
              type="button"
              onClick={onOpenGamificationModal}
              className="px-3 py-2 text-xs font-semibold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>{gamification.streakDays} Day Streak · {gamification.totalXP} XP</span>
            </button>
          )}

          {onOpenShareCardModal && (
            <button
              type="button"
              onClick={onOpenShareCardModal}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Profile Card</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('planner')}
            className="px-3.5 py-2 text-xs font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Weekly Planner</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('recommendations')}
            className="px-4 py-2 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Top Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mood & Energy Adaptive Controller */}
      <MoodCheckInBar
        currentMood={currentMood}
        onUpdateMood={onUpdateMood || (() => {})}
      />

      {/* Adaptive Energy Study Pack */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-sky-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">
              {currentMood.energy === 'high' && '⚡'}
              {currentMood.energy === 'moderate' && '💡'}
              {currentMood.energy === 'low' && '🔋'}
              {currentMood.energy === 'sprint' && '🎯'}
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {currentMood.energy === 'high' && "Today's High-Energy Power Pack (Intensive Labs & Challenges)"}
              {currentMood.energy === 'moderate' && "Today's Balanced Syllabus Progression Pack"}
              {currentMood.energy === 'low' && "Today's Low-Fatigue Micro-Learning Pack (Streak Saver)"}
              {currentMood.energy === 'sprint' && "Today's 15-Minute High-Yield Sprint Pack"}
            </h3>
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-400">
            Tuned to your stamina
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {resources
            .filter((res) => {
              if (currentMood.energy === 'low') {
                return res.type === 'video' || res.difficulty === 'Beginner';
              }
              if (currentMood.energy === 'high') {
                return res.type === 'practice' || res.difficulty === 'Advanced';
              }
              if (currentMood.energy === 'sprint') {
                return res.type === 'notes';
              }
              return true;
            })
            .slice(0, 3)
            .map((res) => (
              <div
                key={res.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono uppercase font-bold text-sky-600 dark:text-sky-400">
                      {res.type}
                    </span>
                    <span>{res.durationOrLength}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {res.title}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {res.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{res.provider}</span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Open Resource →
                  </a>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Overall Topic Mastery
          </div>
          <div className="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {overallTopicMasteryPct}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            {completedTopicsCount} of {allTopics.length} topics completed
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Cumulative GPA & Boards
          </div>
          <div className="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {profile.cgpa.toFixed(2)} <span className="text-sm font-normal text-slate-400">/ 10</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            10th: {profile.tenthPercentage}% · 12th: {profile.twelfthPercentage}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Detected Weak Areas
          </div>
          <div className="text-2xl font-mono font-semibold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {weakSubjectMarks.length + weakQuizTopics.length} Flagged
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {weakSubjectMarks.length} subjects &lt;70% · {weakQuizTopics.length} topics &lt;68%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Top Career Alignment
          </div>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1 truncate">
            {profile.careerGoal}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            ● {topReadyRecs[0]?.score || 85}% Top Subject Match
          </div>
        </div>
      </div>

      {/* Recommended for You Quick Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Recommended for You — Immediate Focus
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Top prerequisite-verified courses ranked by our 4-factor weighted recommendation formula.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('recommendations')}
            className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Full Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topReadyRecs.map((rec, i) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                    #0{i + 1} · {rec.subject.code}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {rec.score}% Match
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {rec.subject.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                  {rec.primaryExplanation}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {rec.subject.difficulty} · {rec.subject.credits} Credits
                </span>
                <button
                  type="button"
                  onClick={() => onOpenSubjectRoadmap(rec.subject.id)}
                  className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Start Roadmap</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Subject Progress & Academic Marks Distribution</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compares topic completion percentage with recorded exam marks across subjects.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {subjects.map((subj) => {
              const progressPct = getSubjectProgressPercentage(subj, profile);
              const markEntry = profile.completedSubjects.find(
                (c) => c.subjectId === subj.id
              );
              const marks = markEntry?.marks;

              return (
                <div key={subj.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                      {subj.code}: {subj.name}
                    </span>
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      {marks !== undefined && (
                        <span
                          className={
                            marks < 70
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          }
                        >
                          Marks: {marks}%
                        </span>
                      )}
                      <span className="text-slate-600 dark:text-slate-400">
                        Topics: {progressPct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-sky-600 dark:bg-sky-500 transition-all duration-200"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Career Skill-Gap Analysis — {profile.careerGoal}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Measures your current proficiency (marks + quizzes + completed units) against the industry benchmark required for {profile.careerGoal}.
            </p>
          </div>

          <div className="space-y-4">
            {careerSkillGapRows.map((row) => (
              <div key={row.subject.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {row.subject.code}: {row.subject.name}
                  </span>
                  <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    Current: <strong className="text-slate-900 dark:text-slate-100">{row.currentProficiency}%</strong> / Target: {row.targetBenchmark}%{' '}
                    {row.gap > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        (-{row.gap}% gap)
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        (Benchmark Met)
                      </span>
                    )}
                  </span>
                </div>

                <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      row.gap > 20
                        ? 'bg-amber-500'
                        : 'bg-emerald-600 dark:bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, row.currentProficiency)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white"
                    style={{ left: `${row.targetBenchmark}%` }}
                    title={`Target Benchmark: ${row.targetBenchmark}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths vs Weak Areas Diagnostic Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Detected Weak Areas (Marks &lt;70% or Diagnostic Quiz &lt;68%)</span>
            </h2>
          </div>

          <div className="space-y-3">
            {weakSubjectMarks.map((w) => (
              <div
                key={w.subjectId}
                className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {w.subject?.code}: {w.subject?.name}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Exam Score: <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">{w.marks}%</span> · Triggers +15% Weak-Area Boost in recommendations
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSubjectRoadmap(w.subjectId)}
                  className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 hover:border-amber-500 whitespace-nowrap"
                >
                  Remediate
                </button>
              </div>
            ))}

            {weakQuizTopics.map((wq) => (
              <div
                key={wq.topic.id}
                className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {wq.topic.title} ({wq.subject.code} Unit {wq.topic.unitNumber})
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Topic Diagnostic Quiz: <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{wq.score}%</span> · Priority concept review advised
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectForChecklist(wq.subject.id);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap"
                >
                  Update Score
                </button>
              </div>
            ))}

            {weakSubjectMarks.length === 0 && weakQuizTopics.length === 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 py-4">
                ● Nominal: No low marks (&lt;70%) or low quiz diagnostics (&lt;68%) detected.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Academic Strengths (Marks ≥80%)</span>
            </h2>
          </div>

          <div className="space-y-3">
            {strongSubjects.map((s) => (
              <div
                key={s.subjectId}
                className="p-3.5 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {s.subject?.code}: {s.subject?.name}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Completed in Semester {s.semesterTaken} with <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">{s.marks}%</span> · Unlocks advanced dependent courses
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                  ● Verified
                </span>
              </div>
            ))}
            {strongSubjects.length === 0 && (
              <p className="text-xs text-slate-500 py-4">
                Log completed subjects with 80%+ marks in your Profile to highlight core academic strengths.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Topic Completion & Quiz Score Calibration Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Topic Mastery & Diagnostic Quiz Tracker</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mark topics as complete or adjust diagnostic quiz scores (0–100%) to see weak-area detection and recommendations update immediately.
            </p>
          </div>

          <select
            value={selectedSubjectForChecklist}
            onChange={(e) => setSelectedSubjectForChecklist(e.target.value)}
            aria-label="Select subject to manage topics"
            className="px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.name} ({getSubjectProgressPercentage(s, profile)}%)
              </option>
            ))}
          </select>
        </div>

        {activeChecklistSubject && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeChecklistSubject.topics.map((topic) => {
              const isDone = profile.completedTopicIds.includes(topic.id);
              const quizScore = profile.topicQuizScores[topic.id] ?? 75;
              const isLowQuiz = quizScore < 68;

              return (
                <div
                  key={topic.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => onToggleTopicComplete(topic.id)}
                      id={`chk-${topic.id}`}
                      className="mt-1 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <label
                      htmlFor={`chk-${topic.id}`}
                      className="cursor-pointer space-y-1"
                    >
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Unit {topic.unitNumber}: {topic.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {topic.difficulty} · {topic.estimatedHours} hrs ·{' '}
                        {topic.keyConcepts.join(' · ')}
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Quiz Score:
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={quizScore}
                        onChange={(e) =>
                          onUpdateTopicQuizScore(
                            topic.id,
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        aria-label={`Quiz score for ${topic.title}`}
                        className="w-16 px-2 py-1 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-xs font-mono text-slate-400">%</span>
                    </div>

                    <span
                      className={`text-xs font-mono w-24 text-right tabular-nums ${
                        isLowQuiz
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isLowQuiz ? '▲ Weak (<68%)' : '● Nominal'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
