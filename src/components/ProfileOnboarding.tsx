import React, { useState } from 'react';
import {
  StudentProfile,
  Subject,
  InterestDomain,
  CareerGoal,
  LearningStyle,
  CompletedSubjectMark,
} from '../types/academic';
import { ALL_INTEREST_DOMAINS, ALL_CAREER_GOALS } from '../data/seedData';
import { calculateProfileCompleteness } from '../utils/recommendationEngine';
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  Sliders,
  BookOpen,
  Video,
  FileText,
  Code2,
} from 'lucide-react';

interface ProfileOnboardingProps {
  profile: StudentProfile;
  subjects: Subject[];
  onSaveProfile: (updated: StudentProfile, navigateNext?: boolean) => void;
  isFirstTimeBanner?: boolean;
}

const PROGRAMS = ['B.Tech', 'B.E.', 'M.Tech', 'B.Sc (Hons)', 'MCA'];
const BRANCHES = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Data Science',
  'Information Technology',
  'Electronics & Computer Engineering',
  'Mathematics & Computing',
];

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({
  profile,
  subjects,
  onSaveProfile,
  isFirstTimeBanner = false,
}) => {
  const [draft, setDraft] = useState<StudentProfile>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newSubjId, setNewSubjId] = useState<string>(subjects[0]?.id || '');
  const [newSubjMarks, setNewSubjMarks] = useState<string>('78');
  const [newSubjSem, setNewSubjSem] = useState<string>('3');

  const completeness = calculateProfileCompleteness(draft);

  const validateField = (updatedDraft: StudentProfile): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (updatedDraft.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters.';
    }
    if (!updatedDraft.enrollmentNo.trim()) {
      errs.enrollmentNo = 'Enrollment or Roll Number is required.';
    }
    if (updatedDraft.semester < 1 || updatedDraft.semester > 8) {
      errs.semester = 'Semester must be between 1 and 8.';
    }
    if (
      isNaN(updatedDraft.tenthPercentage) ||
      updatedDraft.tenthPercentage < 35 ||
      updatedDraft.tenthPercentage > 100
    ) {
      errs.tenthPercentage = '10th percentage must be between 35.0 and 100.0.';
    }
    if (
      isNaN(updatedDraft.twelfthPercentage) ||
      updatedDraft.twelfthPercentage < 35 ||
      updatedDraft.twelfthPercentage > 100
    ) {
      errs.twelfthPercentage = '12th percentage must be between 35.0 and 100.0.';
    }
    if (isNaN(updatedDraft.cgpa) || updatedDraft.cgpa < 1 || updatedDraft.cgpa > 10) {
      errs.cgpa = 'CGPA must be between 1.00 and 10.00.';
    }
    const activeInterests = Object.values(updatedDraft.interests).filter((v) => v >= 1);
    if (activeInterests.length < 1) {
      errs.interests = 'Select at least 1 topic interest chip and set its 1–5 slider.';
    }
    return errs;
  };

  const handleFieldChange = <K extends keyof StudentProfile>(
    key: K,
    value: StudentProfile[K]
  ) => {
    const next = { ...draft, [key]: value, updatedAt: new Date().toISOString() };
    setDraft(next);
    setErrors(validateField(next));
    setSaveSuccess(false);
  };

  const toggleInterestChip = (domain: InterestDomain) => {
    const currentVal = draft.interests[domain] || 0;
    const nextVal = currentVal > 0 ? 0 : 4;
    const nextInterests = { ...draft.interests, [domain]: nextVal };
    handleFieldChange('interests', nextInterests);
  };

  const updateInterestSlider = (domain: InterestDomain, level: number) => {
    const nextInterests = { ...draft.interests, [domain]: level };
    handleFieldChange('interests', nextInterests);
  };

  const handleAddCompletedSubject = () => {
    if (!newSubjId) return;
    const parsedMarks = Number(newSubjMarks);
    const parsedSem = Number(newSubjSem);
    if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
      setErrors((prev) => ({
        ...prev,
        completedSubjects: 'Subject marks must be between 0 and 100.',
      }));
      return;
    }
    const existsIndex = draft.completedSubjects.findIndex(
      (c) => c.subjectId === newSubjId
    );
    let nextCompleted: CompletedSubjectMark[];
    if (existsIndex >= 0) {
      nextCompleted = draft.completedSubjects.map((item, i) =>
        i === existsIndex
          ? { subjectId: newSubjId, marks: parsedMarks, semesterTaken: parsedSem }
          : item
      );
    } else {
      nextCompleted = [
        ...draft.completedSubjects,
        { subjectId: newSubjId, marks: parsedMarks, semesterTaken: parsedSem },
      ];
    }
    handleFieldChange('completedSubjects', nextCompleted);
  };

  const handleRemoveCompletedSubject = (subjectId: string) => {
    const nextCompleted = draft.completedSubjects.filter(
      (c) => c.subjectId !== subjectId
    );
    handleFieldChange('completedSubjects', nextCompleted);
  };

  const handleUpdateSubjectMark = (subjectId: string, marks: number) => {
    const clamped = Math.max(0, Math.min(100, marks));
    const nextCompleted = draft.completedSubjects.map((c) =>
      c.subjectId === subjectId ? { ...c, marks: clamped } : c
    );
    handleFieldChange('completedSubjects', nextCompleted);
  };

  const handleSubmit = (navigateNext: boolean) => {
    const validationErrors = validateField(draft);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const finalProfile: StudentProfile = {
      ...draft,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    setDraft(finalProfile);
    setSaveSuccess(true);
    onSaveProfile(finalProfile, navigateNext);
  };

  return (
    <div className="space-y-8">
      {/* Header & Completeness Meter */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            01. Academic Dossier & Onboarding Calibration
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Student Academic Profile & Interest Matrix
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            Every change immediately recalibrates your weighted subject recommendations,
            prerequisite gates, and career skill-gap trajectory.
          </p>
        </div>

        {/* Completeness Bar */}
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Profile Completeness
            </span>
            <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
              {completeness.percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 dark:bg-sky-500 transition-all duration-200"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>
          {completeness.missingFields.length > 0 ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              Pending: {completeness.missingFields.join(' · ')}
            </p>
          ) : (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              All calibration fields verified
            </p>
          )}
        </div>
      </div>

      {isFirstTimeBanner && !profile.onboardingCompleted && (
        <div className="bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Welcome to Academic Path Smart Guide
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              We have pre-loaded a sample Computer Science profile so you can explore immediately, or customize your marks, interests, and career goal below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>Confirm & View Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section 1: Qualification & Academic Standing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Academic Qualifications & Standing
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Used to compute the 25% Academic Readiness weight and verify semester progression.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Student Full Name
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g. Aarav Mehta"
            />
            {errors.name && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Enrollment / Roll No.
            </label>
            <input
              type="text"
              value={draft.enrollmentNo}
              onChange={(e) => handleFieldChange('enrollmentNo', e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g. 2024CS1048"
            />
            {errors.enrollmentNo && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.enrollmentNo}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Degree Program
            </label>
            <select
              value={draft.program}
              onChange={(e) => handleFieldChange('program', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Academic Branch / Major
            </label>
            <select
              value={draft.branch}
              onChange={(e) => handleFieldChange('branch', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Current Semester (1–8)
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={draft.semester}
              onChange={(e) =>
                handleFieldChange('semester', parseInt(e.target.value, 10) || 1)
              }
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.semester && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.semester}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              10th Board Percentage (%)
            </label>
            <input
              type="number"
              step="0.1"
              min={35}
              max={100}
              value={draft.tenthPercentage}
              onChange={(e) =>
                handleFieldChange('tenthPercentage', parseFloat(e.target.value) || 0)
              }
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.tenthPercentage && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.tenthPercentage}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              12th / Diploma Percentage (%)
            </label>
            <input
              type="number"
              step="0.1"
              min={35}
              max={100}
              value={draft.twelfthPercentage}
              onChange={(e) =>
                handleFieldChange('twelfthPercentage', parseFloat(e.target.value) || 0)
              }
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.twelfthPercentage && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.twelfthPercentage}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Cumulative GPA (CGPA / 10)
            </label>
            <input
              type="number"
              step="0.01"
              min={1}
              max={10}
              value={draft.cgpa}
              onChange={(e) =>
                handleFieldChange('cgpa', parseFloat(e.target.value) || 0)
              }
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.cgpa && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.cgpa}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Completed Subject Marks & Prerequisite Transcript */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Completed Subject Marks & Prerequisite Transcript
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Subjects below 70% automatically receive a 15% Weak-Area Remediation Boost. Completed subjects unlock dependent advanced courses.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {draft.completedSubjects.length} subjects logged
          </span>
        </div>

        {/* Add Subject Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <div className="sm:col-span-6">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Subject
            </label>
            <select
              value={newSubjId}
              onChange={(e) => setNewSubjId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Marks (0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={newSubjMarks}
              onChange={(e) => setNewSubjMarks(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Semester Taken
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={newSubjSem}
              onChange={(e) => setNewSubjSem(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddCompletedSubject}
              className="w-full py-2 px-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Update</span>
            </button>
          </div>
        </div>

        {/* Transcript Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Subject Title</th>
                <th className="py-2.5 px-3">Semester</th>
                <th className="py-2.5 px-3">Marks (%)</th>
                <th className="py-2.5 px-3">Academic Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-sm">
              {draft.completedSubjects.map((entry) => {
                const subj = subjects.find((s) => s.id === entry.subjectId);
                if (!subj) return null;
                const isWeak = entry.marks < 70;
                return (
                  <tr
                    key={entry.subjectId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {subj.code}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                      {subj.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      Sem {entry.semesterTaken}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={entry.marks}
                        onChange={(e) =>
                          handleUpdateSubjectMark(
                            entry.subjectId,
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="w-20 px-2.5 py-1 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-3 px-3 text-xs">
                      {isWeak ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          ▲ Weak-Area Boost Active (&lt;70%)
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          ● Strong Foundation ({entry.marks}%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveCompletedSubject(entry.subjectId)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Remove completed subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {draft.completedSubjects.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    No completed subjects recorded yet. Use the selector above to add completed courses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Domain Interests & 1-5 Intensity Sliders */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Domain Interests & Affinity Calibration (35% Weight)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Toggle topic domains to include them in your profile, then fine-tune your interest intensity from 1 (Curious) to 5 (Core Focus).
          </p>
        </div>

        {/* Multi-Select Topic Buttons */}
        <div className="flex flex-wrap gap-2">
          {ALL_INTEREST_DOMAINS.map((domain) => {
            const level = draft.interests[domain] || 0;
            const isSelected = level > 0;
            return (
              <button
                key={domain}
                type="button"
                onClick={() => toggleInterestChip(domain)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{domain}</span>
                <span className="font-mono text-[11px] opacity-85 tabular-nums">
                  {isSelected ? `${level}/5` : 'Off'}
                </span>
              </button>
            );
          })}
        </div>

        {errors.interests && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.interests}
          </p>
        )}

        {/* 1-5 Sliders for Active Domains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {ALL_INTEREST_DOMAINS.map((domain) => {
            const level = draft.interests[domain] || 0;
            const isSelected = level > 0;
            return (
              <div
                key={domain}
                className={`p-4 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
                    : 'bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {domain}
                  </span>
                  <span className="text-xs font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                    {isSelected ? `Interest Level: ${level} / 5` : 'Inactive (0 / 5)'}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={level}
                  onChange={(e) =>
                    updateInterestSlider(domain, parseInt(e.target.value, 10))
                  }
                  aria-label={`Interest level for ${domain}`}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                  <span>0: Off</span>
                  <span>1: Low</span>
                  <span>2</span>
                  <span>3: Moderate</span>
                  <span>4</span>
                  <span>5: High</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Career Goal & Preferred Learning Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Target Career Goal (25% Weight)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Determines career-goal relevance weights and your skill-gap benchmark matrix.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Select Primary Career Trajectory
            </label>
            <select
              value={draft.careerGoal}
              onChange={(e) =>
                handleFieldChange('careerGoal', e.target.value as CareerGoal)
              }
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {ALL_CAREER_GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              Active Career Benchmark: {draft.careerGoal}
            </p>
            <p>
              Roadmaps and top-5 subject rankings will prioritize courses with the highest alignment to {draft.careerGoal}.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Preferred Learning Modality
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prioritizes matching study resources (Video Lectures, Notes, or Interactive Practice) across recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                {
                  id: 'video',
                  label: 'Video Lectures',
                  desc: 'Visual walkthroughs & university recordings',
                  icon: Video,
                },
                {
                  id: 'notes',
                  label: 'Structured Notes',
                  desc: 'Monographs, textbooks & reference PDFs',
                  icon: FileText,
                },
                {
                  id: 'practice',
                  label: 'Hands-on Practice',
                  desc: 'Problem sets, kernel labs & SQL sandboxes',
                  icon: Code2,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = draft.learningStyle === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleFieldChange('learningStyle', item.id as LearningStyle)
                  }
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    active
                      ? 'border-sky-600 bg-sky-50/60 dark:bg-sky-950/40 dark:border-sky-500 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-3 ${
                      active
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs">
          <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          {saveSuccess ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Profile saved to localStorage and recommendations recalibrated.
            </span>
          ) : (
            <span className="text-slate-600 dark:text-slate-400">
              All changes are validated live and persisted locally in your browser.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            Save Profile Changes
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <span>Save & Generate Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
