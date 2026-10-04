import React, { useState } from 'react';
import {
  StudentProfile,
  PeerStudent,
  Subject,
  MentorNote,
} from '../types/academic';
import {
  computeSubjectRecommendations,
} from '../utils/recommendationEngine';
import {
  UserCheck,
  MessageSquarePlus,
  CheckCircle2,
} from 'lucide-react';

interface MentorViewProps {
  profile: StudentProfile;
  peers: PeerStudent[];
  subjects: Subject[];
  mentorNotes: MentorNote[];
  onAddMentorNote: (note: Omit<MentorNote, 'id' | 'createdAt' | 'acknowledged'>) => void;
  onAcknowledgeNote: (noteId: string) => void;
}

export const MentorView: React.FC<MentorViewProps> = ({
  profile,
  peers,
  subjects,
  mentorNotes,
  onAddMentorNote,
  onAcknowledgeNote,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(profile.id);
  const [mentorName, setMentorName] = useState('Dr. Vikramaditya Rao');
  const [mentorTitle, setMentorTitle] = useState(
    'Associate Professor, Machine Intelligence Lab'
  );
  const [focusArea, setFocusArea] = useState('');
  const [noteText, setNoteText] = useState('');
  const [priority, setPriority] = useState<'Nominal' | 'Elevated' | 'Critical'>(
    'Elevated'
  );
  const [formError, setFormError] = useState('');

  const currentStudentRecs = computeSubjectRecommendations(subjects, [], profile);
  const currentWeakSubjects = profile.completedSubjects
    .filter((c) => c.marks < 70)
    .map((c) => {
      const s = subjects.find((sub) => sub.id === c.subjectId);
      return s ? `${s.code}: ${s.name} (${c.marks}%)` : '';
    })
    .filter(Boolean);

  const allTopicsCount = subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const currentProgressPct =
    allTopicsCount > 0
      ? Math.round((profile.completedTopicIds.length / allTopicsCount) * 100)
      : 0;

  const roster = [
    {
      id: profile.id,
      name: `${profile.name} (Active Student)`,
      rawName: profile.name,
      program: `${profile.program} · ${profile.branch}`,
      semester: profile.semester,
      cgpa: profile.cgpa,
      careerGoal: profile.careerGoal,
      progressPercentage: currentProgressPct,
      weakAreas:
        currentWeakSubjects.length > 0
          ? currentWeakSubjects
          : ['Unit 4: Statistical Hypothesis Testing (Quiz 58%)'],
      recommendedFocus:
        currentStudentRecs[0]
          ? `${currentStudentRecs[0].subject.code}: ${currentStudentRecs[0].subject.name} (${currentStudentRecs[0].score}% Match)`
          : 'Core AI/ML Track',
      isCurrentStudent: true,
    },
    ...peers.map((p) => {
      const topSubj = subjects.find((s) => s.id === p.studiedSubjectIds[0]);
      return {
        id: p.id,
        name: p.name,
        rawName: p.name,
        program: `${p.program} · ${p.branch}`,
        semester: p.semester,
        cgpa: p.cgpa,
        careerGoal: p.careerGoal,
        progressPercentage: p.progressPercentage,
        weakAreas: p.weakAreas,
        recommendedFocus: topSubj
          ? `${topSubj.code}: ${topSubj.name}`
          : p.careerGoal,
        isCurrentStudent: false,
      };
    }),
  ];

  const selectedRosterStudent =
    roster.find((r) => r.id === selectedStudentId) || roster[0];

  const handlePublishNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusArea.trim() || !noteText.trim()) {
      setFormError('Please provide both a focus area and guidance note.');
      return;
    }
    onAddMentorNote({
      studentId: selectedRosterStudent.id,
      studentName: selectedRosterStudent.rawName,
      mentorName: mentorName.trim() || 'Faculty Advisor',
      mentorTitle: mentorTitle.trim() || 'Academic Mentor',
      focusArea: focusArea.trim(),
      note: noteText.trim(),
      priority,
    });
    setFocusArea('');
    setNoteText('');
    setFormError('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
          07. Faculty Advisor & Mentorship Console
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          Mentor Cohort Roster & Guidance Notes
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
          Inspect student progress, weak areas, and recommended focus areas across the cohort, and publish actionable guidance notes visible directly to the student.
        </p>
      </div>

      {/* Cohort Roster Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Advisee Progress & Weak-Area Telemetry</span>
          </h2>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {roster.length} Students Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Sem / CGPA</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Detected Weak Areas</th>
                <th className="py-2.5 px-3">Recommended Focus</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs sm:text-sm">
              {roster.map((st) => {
                const isSelected = st.id === selectedStudentId;
                return (
                  <tr
                    key={st.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-sky-50/60 dark:bg-sky-950/30'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {st.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {st.careerGoal}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      Sem {st.semester} · {st.cgpa.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 w-36">
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums mb-1">
                        <span>{st.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-600 dark:bg-sky-500"
                          style={{ width: `${st.progressPercentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-amber-700 dark:text-amber-300">
                      {st.weakAreas.join(' · ')}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-medium text-slate-800 dark:text-slate-200">
                      {st.recommendedFocus}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Add Guidance'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guidance Note Form + Existing Guidance Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handlePublishNote}
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 self-start"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Publish Mentor Guidance Note</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Student:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {selectedRosterStudent.rawName}
              </strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mentor Name
              </label>
              <input
                type="text"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as 'Nominal' | 'Elevated' | 'Critical'
                  )
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="Nominal">● Nominal Advisory</option>
                <option value="Elevated">▲ Elevated Focus</option>
                <option value="Critical">■ Critical Remediation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Focus Area / Subject Topic
            </label>
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="e.g. B+ Tree Indexing & Query Optimization"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Actionable Guidance Note (Visible to Student)
            </label>
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Provide concrete study recommendations, prerequisite advice, or lab milestones..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          {formError && (
            <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Publish Guidance Note to Student Feed
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Published Faculty Guidance Notes ({mentorNotes.length})
            </h2>
          </div>

          {mentorNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    For: {note.studentName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{note.mentorName}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      note.priority === 'Critical'
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : note.priority === 'Elevated'
                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                        : 'text-emerald-600 dark:text-emerald-400 font-medium'
                    }
                  >
                    {note.priority === 'Critical'
                      ? '■ Critical'
                      : note.priority === 'Elevated'
                      ? '▲ Elevated'
                      : '● Nominal'}
                  </span>
                </div>

                {!note.acknowledged ? (
                  <button
                    type="button"
                    onClick={() => onAcknowledgeNote(note.id)}
                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Acknowledged by Student</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledged</span>
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Focus: {note.focusArea}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {note.note}
              </p>

              <div className="text-[11px] text-slate-400 font-mono">
                {note.mentorTitle} · Logged {new Date(note.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
