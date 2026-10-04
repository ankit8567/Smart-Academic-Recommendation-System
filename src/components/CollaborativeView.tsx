import React from 'react';
import { StudentProfile, PeerStudent, Subject } from '../types/academic';
import { computeCollaborativeSuggestions } from '../utils/recommendationEngine';
import { Users, ArrowRight, Sparkles } from 'lucide-react';

interface CollaborativeViewProps {
  profile: StudentProfile;
  peers: PeerStudent[];
  subjects: Subject[];
  onOpenSubjectRoadmap: (subjectId: string) => void;
}

export const CollaborativeView: React.FC<CollaborativeViewProps> = ({
  profile,
  peers,
  subjects,
  onOpenSubjectRoadmap,
}) => {
  const suggestions = computeCollaborativeSuggestions(profile, peers, subjects);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
          06. Cohort Vector Similarity Engine
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          Students Like You Also Studied
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
          Collaborative filtering matches your 8-dimensional interest vector, CGPA band, and <span className="font-semibold text-slate-900 dark:text-slate-100">{profile.careerGoal}</span> trajectory against high-performing peers.
        </p>
      </div>

      {/* Peer Cards */}
      <div className="space-y-4">
        {suggestions.map((item, idx) => {
          const { peer, similarityScore, sharedInterests, recommendedSubjectsFromPeer } =
            item;

          return (
            <div
              key={peer.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                      0{idx + 1}. Cohort Peer Match
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {peer.program} ({peer.branch})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Sem {peer.semester} · CGPA {peer.cgpa.toFixed(2)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Career Goal: {peer.careerGoal}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>{peer.name}</span>
                  </h2>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Shared High-Affinity Interests:{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {sharedInterests.length > 0
                        ? sharedInterests.join(' · ')
                        : peer.topInterests.join(' · ')}
                    </span>
                  </p>
                </div>

                <div className="w-full lg:w-60 shrink-0">
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Profile Similarity
                    </span>
                    <span className="font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {similarityScore}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500"
                      style={{ width: `${similarityScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Subjects Studied by {peer.name}:</span>
                  </div>
                  <div className="space-y-2">
                    {recommendedSubjectsFromPeer.map((subj) => (
                      <div
                        key={subj.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="text-xs">
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {subj.code}
                          </span>{' '}
                          —{' '}
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {subj.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenSubjectRoadmap(subj.id)}
                          className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 shrink-0"
                        >
                          <span>Explore Path</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    High-Impact Topics & Outcome:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                    {peer.highlightedTopics.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <div className="pt-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Outcome: {peer.recentAchievement}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
