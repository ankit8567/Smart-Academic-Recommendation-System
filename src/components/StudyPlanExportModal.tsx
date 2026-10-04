import React from 'react';
import {
  StudentProfile,
  Subject,
  LearningResource,
  MentorNote,
} from '../types/academic';
import {
  computeSubjectRecommendations,
  generateLearningRoadmap,
} from '../utils/recommendationEngine';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface StudyPlanExportModalProps {
  profile: StudentProfile;
  subjects: Subject[];
  resources: LearningResource[];
  mentorNotes: MentorNote[];
  onClose: () => void;
}

export const StudyPlanExportModal: React.FC<StudyPlanExportModalProps> = ({
  profile,
  subjects,
  resources,
  mentorNotes,
  onClose,
}) => {
  const topRecommendations = computeSubjectRecommendations(
    subjects,
    resources,
    profile
  )
    .filter((r) => r.prerequisitesMet)
    .slice(0, 5);

  const roadmapSteps = generateLearningRoadmap(subjects, profile, {
    type: 'career',
    career: profile.careerGoal,
  });

  const studentNotes = mentorNotes.filter(
    (n) => n.studentId === profile.id || n.studentName === profile.name
  );

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 sm:p-8 space-y-6">
        <div className="no-print flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Export Personalized Academic Learning Plan (PDF)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formatted academic dossier ready for PDF export or printing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save as PDF / Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close export modal"
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6 text-slate-900 dark:text-slate-100">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-sky-600 dark:text-sky-400">
                ACADEMIC PATH SMART GUIDE · OFFICIAL STUDY PLAN
              </div>
              <h1 className="text-2xl font-bold mt-1">{profile.name}</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Enrollment: {profile.enrollmentNo} · {profile.program} ({profile.branch}) · Semester {profile.semester}
              </p>
            </div>
            <div className="text-xs font-mono space-y-0.5 sm:text-right tabular-nums">
              <div>CGPA: {profile.cgpa.toFixed(2)} / 10.0</div>
              <div>10th: {profile.tenthPercentage}% · 12th: {profile.twelfthPercentage}%</div>
              <div>Career Goal: {profile.careerGoal}</div>
              <div>Learning Style: {profile.learningStyle.toUpperCase()}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              01. Top 5 Weighted Subject Recommendations
            </h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {topRecommendations.map((rec, i) => (
                <div key={rec.id} className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>
                      0{i + 1}. {rec.subject.code} — {rec.subject.name} ({rec.subject.difficulty})
                    </span>
                    <span className="font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                      {rec.score}% Match Score
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Why Recommended: {rec.whyRecommended.join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              02. Ordered Learning Roadmap ({profile.careerGoal})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roadmapSteps.slice(0, 12).map((step) => (
                <div
                  key={step.topic.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="font-mono text-[11px] text-slate-500">
                      Step {String(step.stepNumber).padStart(2, '0')} · {step.subject.code} Unit {step.topic.unitNumber} ({step.topic.difficulty})
                    </div>
                    <div className="font-medium mt-0.5">{step.topic.title}</div>
                  </div>
                  <span className="font-mono text-[11px] shrink-0">
                    {step.status === 'Completed' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    ) : (
                      step.status
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {studentNotes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                03. Advisor & Mentor Guidance Notes
              </h3>
              {studentNotes.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="font-semibold">
                    {n.mentorName} — Focus: {n.focusArea}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{n.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
