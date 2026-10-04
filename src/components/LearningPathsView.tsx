import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  Subject,
  CareerGoal,
  LearningResource,
} from '../types/academic';
import { ALL_CAREER_GOALS } from '../data/seedData';
import {
  generateLearningRoadmap,
  isSubjectCompletedOrMastered,
} from '../utils/recommendationEngine';
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  ArrowRight,
  ExternalLink,
  GitBranch,
  Layers,
} from 'lucide-react';

interface LearningPathsViewProps {
  profile: StudentProfile;
  subjects: Subject[];
  resources: LearningResource[];
  initialSubjectId?: string | null;
  onToggleTopicComplete: (topicId: string) => void;
}

export const LearningPathsView: React.FC<LearningPathsViewProps> = ({
  profile,
  subjects,
  resources,
  initialSubjectId,
  onToggleTopicComplete,
}) => {
  const [mode, setMode] = useState<'career' | 'subject'>(
    initialSubjectId ? 'subject' : 'career'
  );
  const [selectedCareer, setSelectedCareer] = useState<CareerGoal>(
    profile.careerGoal
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || subjects[0]?.id || 'subj-aiml'
  );
  const [difficultyFilter, setDifficultyFilter] = useState<
    'All' | 'Beginner' | 'Intermediate' | 'Advanced'
  >('All');

  useEffect(() => {
    if (initialSubjectId) {
      setMode('subject');
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);

  const roadmapSteps = generateLearningRoadmap(
    subjects,
    profile,
    mode === 'career'
      ? { type: 'career', career: selectedCareer }
      : { type: 'subject', subjectId: selectedSubjectId }
  );

  const filteredSteps =
    difficultyFilter === 'All'
      ? roadmapSteps
      : roadmapSteps.filter((s) => s.topic.difficulty === difficultyFilter);

  const completedCount = roadmapSteps.filter(
    (s) => s.status === 'Completed'
  ).length;
  const currentCount = roadmapSteps.filter((s) => s.status === 'Current').length;
  const lockedCount = roadmapSteps.filter((s) => s.status === 'Locked').length;
  const overallProgress =
    roadmapSteps.length > 0
      ? Math.round((completedCount / roadmapSteps.length) * 100)
      : 0;

  const roadmapSubjects = Array.from(
    new Map(roadmapSteps.map((s) => [s.subject.id, s.subject])).values()
  );

  return (
    <div className="space-y-8">
      {/* Header & Target Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            03. Topological Curriculum Sequencer
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Prerequisite-Aware Learning Roadmap
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            Generates an ordered dependency flow from foundational concepts to advanced production mastery, locking modules whose prerequisite subjects are incomplete.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('career')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'career'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Career Goal Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMode('subject')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'subject'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Single Subject Dependency Path
            </button>
          </div>

          {mode === 'career' ? (
            <select
              value={selectedCareer}
              onChange={(e) => setSelectedCareer(e.target.value as CareerGoal)}
              aria-label="Select Career Goal Roadmap"
              className="px-3.5 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {ALL_CAREER_GOALS.map((c) => (
                <option key={c} value={c}>
                  {c} Roadmap
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              aria-label="Select Target Subject Roadmap"
              className="px-3.5 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Visual Subject Dependency Flow Graph */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>
                Subject Dependency Graph —{' '}
                {mode === 'career'
                  ? `${selectedCareer} Track`
                  : subjects.find((s) => s.id === selectedSubjectId)?.name}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ordered left-to-right from foundational prerequisites to advanced specialization. Click any subject node to focus its modules.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">
              ● {completedCount} Completed
            </span>
            <span className="text-sky-600 dark:text-sky-400">
              ◉ {currentCount} Active
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              🔒 {lockedCount} Locked
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {roadmapSubjects.map((subj, idx) => {
            const mastered = isSubjectCompletedOrMastered(subj, profile);
            const missingPrereqs = subj.prerequisites.filter((pid) => {
              const pSub = subjects.find((s) => s.id === pid);
              return pSub && !isSubjectCompletedOrMastered(pSub, profile);
            });
            const isLocked = missingPrereqs.length > 0;

            return (
              <React.Fragment key={subj.id}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('subject');
                    setSelectedSubjectId(subj.id);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all min-w-[200px] ${
                    mastered
                      ? 'border-emerald-500/70 bg-emerald-50/40 dark:bg-emerald-950/30'
                      : isLocked
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 opacity-75'
                      : 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      {subj.code} · {subj.difficulty}
                    </span>
                    {mastered ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ● Mastered
                      </span>
                    ) : isLocked ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        🔒 Locked
                      </span>
                    ) : (
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">
                        ◉ Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                    {subj.name}
                  </div>
                </button>
                {idx < roadmapSubjects.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-600 dark:text-slate-400">
              Pathway Completion Velocity
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {overallProgress}% ({completedCount}/{roadmapSteps.length} topics)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Adaptive Difficulty Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>
            Difficulty adapts progressively from <strong className="text-slate-900 dark:text-slate-200">Beginner</strong> Foundations to <strong className="text-slate-900 dark:text-slate-200">Intermediate</strong> Systems and <strong className="text-slate-900 dark:text-slate-200">Advanced</strong> Synthesis.
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg self-start sm:self-auto">
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setDifficultyFilter(tier)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                difficultyFilter === tier
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Step-by-Step Interactive Roadmap Timeline */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
        {filteredSteps.map((step) => {
          const isDone = step.status === 'Completed';
          const isCurrent = step.status === 'Current';
          const isLocked = step.status === 'Locked';
          const matchingResource = resources.find(
            (r) =>
              r.topicId === step.topic.id || r.subjectId === step.subject.id
          );

          return (
            <div
              key={step.topic.id}
              className={`relative bg-white dark:bg-slate-900 border rounded-xl p-5 transition-colors ${
                isCurrent
                  ? 'border-sky-500 dark:border-sky-500 shadow-xs'
                  : isDone
                  ? 'border-emerald-200 dark:border-emerald-900/60'
                  : 'border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div
                className={`absolute -left-[35px] sm:-left-[43px] top-6 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isDone
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                <span className="text-[9px] font-mono font-bold tabular-nums">
                  {step.stepNumber}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      Step {String(step.stepNumber).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {step.subject.code}: {step.subject.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Unit {step.topic.unitNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {step.topic.difficulty}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {step.topic.estimatedHours} hrs est.
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {step.topic.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {step.adaptiveDifficultyNote} — Key Concepts:{' '}
                    <span className="text-slate-700 dark:text-slate-300">
                      {step.topic.keyConcepts.join(' · ')}
                    </span>
                  </p>

                  {isLocked && step.lockReason && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 pt-1">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>{step.lockReason}</span>
                    </p>
                  )}

                  {matchingResource && !isLocked && (
                    <div className="pt-1">
                      <a
                        href={matchingResource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>
                          Study Resource: {matchingResource.title} ({matchingResource.durationOrLength})
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isDone ? (
                    <button
                      type="button"
                      onClick={() => onToggleTopicComplete(step.topic.id)}
                      className="px-3.5 py-2 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed (Undo)</span>
                    </button>
                  ) : isLocked && step.prerequisiteSubject ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('subject');
                        setSelectedSubjectId(step.prerequisiteSubject!.id);
                      }}
                      className="px-3.5 py-2 text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Go to Prerequisite ({step.prerequisiteSubject.code})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleTopicComplete(step.topic.id)}
                      className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Mark Topic Complete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
