import React, { useState } from 'react';
import {
  StudentProfile,
  Subject,
  LearningResource,
  RecommendationItem,
} from '../types/academic';
import {
  computeSubjectRecommendations,
  computeTopicRecommendations,
} from '../utils/recommendationEngine';
import {
  ThumbsUp,
  ThumbsDown,
  Lock,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface RecommendationsViewProps {
  profile: StudentProfile;
  subjects: Subject[];
  resources: LearningResource[];
  onFeedback: (itemId: string, vote: 'up' | 'down') => void;
  onOpenRoadmapForSubject: (subjectId: string) => void;
  onMarkSubjectPrerequisiteComplete: (subjectId: string) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  profile,
  subjects,
  resources,
  onFeedback,
  onOpenRoadmapForSubject,
  onMarkSubjectPrerequisiteComplete,
}) => {
  const [viewMode, setViewMode] = useState<'subjects' | 'topics'>('subjects');
  const [showLockedPrerequisites, setShowLockedPrerequisites] = useState(true);

  const allSubjectRecs = computeSubjectRecommendations(subjects, resources, profile);
  const allTopicRecs = computeTopicRecommendations(subjects, resources, profile);

  const readySubjectRecs = allSubjectRecs.filter((r) => r.prerequisitesMet);
  const lockedSubjectRecs = allSubjectRecs.filter((r) => !r.prerequisitesMet);

  const top5ReadySubjects = readySubjectRecs.slice(0, 5);
  const top5ReadyTopics = allTopicRecs.filter((r) => r.prerequisitesMet).slice(0, 5);

  const activeTop5: RecommendationItem[] =
    viewMode === 'subjects' ? top5ReadySubjects : top5ReadyTopics;

  return (
    <div className="space-y-8">
      {/* Header & Formula Transparency Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            02. Weighted Academic Ranking Engine
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Personalized Top 5 Recommendations
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            Ranked dynamically for <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.name}</span> targeting <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.careerGoal}</span>. Only courses with satisfied prerequisites are unlocked for immediate study.
          </p>
        </div>

        {/* Segmented Control: Top 5 Subjects vs Top 5 Topics */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('subjects')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'subjects'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Top 5 Ready Subjects
          </button>
          <button
            type="button"
            onClick={() => setViewMode('topics')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'topics'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Top 5 Priority Topics
          </button>
        </div>
      </div>

      {/* Mathematical Formula Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Active Scoring Model & Weight Distribution
          </div>
          <div className="font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 tabular-nums">
            Score = <span className="text-sky-600 dark:text-sky-400 font-semibold">0.35</span> × Interest Match +{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0.25</span> × Academic Readiness +{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">0.25</span> × Career Relevance +{' '}
            <span className="text-amber-600 dark:text-amber-400 font-semibold">0.15</span> × Weak-Area Boost
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
          Thumbs Up (<span className="font-mono text-emerald-600 dark:text-emerald-400">+8%</span>) / Down (<span className="font-mono text-red-600 dark:text-red-400">-12%</span>) calibrates live
        </div>
      </div>

      {/* Top 5 Unlocked Recommendations List */}
      <div className="space-y-4">
        {activeTop5.map((item, idx) => {
          const currentVote = profile.recommendationFeedback[item.id];
          const title =
            item.targetType === 'topic' && item.topic
              ? `${item.topic.title}`
              : `${item.subject.code}: ${item.subject.name}`;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                      0{idx + 1}. Recommended
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.subject.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {item.targetType === 'topic' && item.topic
                        ? `${item.subject.code} Unit ${item.topic.unitNumber} (${item.topic.difficulty})`
                        : `${item.subject.difficulty} Level · ${item.subject.credits} Credits`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ● Prerequisites Verified
                    </span>
                    {item.isWeakAreaRemediation && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          ▲ Weak-Area Remediation Boost
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.subject.description}
                  </p>

                  <div className="pt-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Why Recommended for You:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                      {item.whyRecommended.map((reason, rIdx) => (
                        <li key={rIdx}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {item.recommendedResources.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        Matched Resources ({profile.learningStyle} preferred):
                      </span>
                      {item.recommendedResources.slice(0, 2).map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <span>{res.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-80 shrink-0 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-6 space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Composite Match Score
                      </span>
                      <span className="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {item.score}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 dark:bg-sky-500 transition-all duration-200"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono tabular-nums pt-1">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Interest (0.35):</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">
                        {item.breakdown.interestMatch}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Readiness (0.25):</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">
                        {item.breakdown.academicReadiness}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Career Fit (0.25):</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">
                        {item.breakdown.careerGoalRelevance}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Weak-Area Boost (0.15):</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">
                        {item.breakdown.weakAreaBoost}%
                      </span>
                    </div>
                    {item.breakdown.feedbackAdjustment !== 0 && (
                      <div className="flex justify-between text-sky-600 dark:text-sky-400">
                        <span>User Feedback Bias:</span>
                        <span>
                          {item.breakdown.feedbackAdjustment > 0
                            ? `+${item.breakdown.feedbackAdjustment}%`
                            : `${item.breakdown.feedbackAdjustment}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onFeedback(item.id, 'up')}
                        aria-label="Thumbs up recommendation"
                        className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                          currentVote === 'up'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="font-mono tabular-nums">Helpful</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onFeedback(item.id, 'down')}
                        aria-label="Thumbs down recommendation"
                        className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                          currentVote === 'down'
                            ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenRoadmapForSubject(item.subject.id)}
                      className="px-3 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>View Path</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lockedSubjectRecs.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Prerequisite-Gated Courses (Complete Prerequisite First)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                These subjects match your profile but are locked because one or more prerequisite courses are not yet completed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLockedPrerequisites(!showLockedPrerequisites)}
              className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline self-start sm:self-auto"
            >
              {showLockedPrerequisites ? 'Hide Locked Courses' : `Show Locked Courses (${lockedSubjectRecs.length})`}
            </button>
          </div>

          {showLockedPrerequisites && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lockedSubjectRecs.map((lockedItem) => {
                const prereq = lockedItem.suggestedPrerequisiteFirst;
                return (
                  <div
                    key={lockedItem.id}
                    className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Prerequisite Incomplete</span>
                        </span>
                        <span className="font-mono tabular-nums">
                          Projected Match: {lockedItem.score}%
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {lockedItem.subject.code}: {lockedItem.subject.name}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Missing Prerequisite:{' '}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {lockedItem.missingPrerequisites
                            .map((m) => `${m.code} (${m.name})`)
                            .join(', ')}
                        </span>
                      </p>
                    </div>

                    {prereq && (
                      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-sky-600 dark:text-sky-400">
                            Suggested First Step:
                          </span>{' '}
                          Study {prereq.code} ({prereq.name})
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenRoadmapForSubject(prereq.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 hover:border-sky-500 transition-colors whitespace-nowrap"
                          >
                            Start {prereq.code} Path
                          </button>
                          <button
                            type="button"
                            onClick={() => onMarkSubjectPrerequisiteComplete(prereq.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                            title="Log prerequisite as completed with passing marks to unlock"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Unlock Now</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
