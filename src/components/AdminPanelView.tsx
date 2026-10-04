import React, { useState } from 'react';
import {
  Subject,
  Topic,
  LearningResource,
  InterestDomain,
  DifficultyLevel,
  LearningStyle,
} from '../types/academic';
import { ALL_INTEREST_DOMAINS } from '../data/seedData';
import { Plus, Trash2, Edit3, Check, RotateCcw } from 'lucide-react';

interface AdminPanelViewProps {
  subjects: Subject[];
  resources: LearningResource[];
  onSaveSubjects: (updated: Subject[]) => void;
  onSaveResources: (updated: LearningResource[]) => void;
  onResetCurriculumToDefault: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  subjects,
  resources,
  onSaveSubjects,
  onSaveResources,
  onResetCurriculumToDefault,
}) => {
  const [adminSection, setAdminSection] = useState<
    'subjects' | 'topics' | 'resources'
  >('subjects');

  // Subject CRUD state
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjCategory, setSubjCategory] = useState<InterestDomain>('AI/ML');
  const [subjDifficulty, setSubjDifficulty] =
    useState<DifficultyLevel>('Intermediate');
  const [subjCredits, setSubjCredits] = useState(4);
  const [subjDesc, setSubjDesc] = useState('');
  const [subjPrereqs, setSubjPrereqs] = useState<string[]>([]);

  // Topic CRUD state
  const [selectedSubjForTopics, setSelectedSubjForTopics] = useState<string>(
    subjects[0]?.id || ''
  );
  const [topicTitle, setTopicTitle] = useState('');
  const [topicUnit, setTopicUnit] = useState(1);
  const [topicDifficulty, setTopicDifficulty] =
    useState<DifficultyLevel>('Intermediate');
  const [topicHours, setTopicHours] = useState(8);
  const [topicConcepts, setTopicConcepts] = useState('');

  // Resource CRUD state
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<LearningStyle>('video');
  const [resDifficulty, setResDifficulty] =
    useState<DifficultyLevel>('Intermediate');
  const [resSubjectId, setResSubjectId] = useState<string>(
    subjects[0]?.id || ''
  );
  const [resUrl, setResUrl] = useState('https://ocw.mit.edu/');
  const [resDuration, setResDuration] = useState('45 min lecture');
  const [resProvider, setResProvider] = useState('University OpenCourseWare');
  const [resDesc, setResDesc] = useState('');

  const handleEditSubjectClick = (subj: Subject) => {
    setEditingSubjectId(subj.id);
    setSubjCode(subj.code);
    setSubjName(subj.name);
    setSubjCategory(subj.category);
    setSubjDifficulty(subj.difficulty);
    setSubjCredits(subj.credits);
    setSubjDesc(subj.description);
    setSubjPrereqs(subj.prerequisites);
  };

  const resetSubjectForm = () => {
    setEditingSubjectId(null);
    setSubjCode('');
    setSubjName('');
    setSubjCategory('AI/ML');
    setSubjDifficulty('Intermediate');
    setSubjCredits(4);
    setSubjDesc('');
    setSubjPrereqs([]);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjCode.trim() || !subjName.trim()) return;

    if (editingSubjectId) {
      const updated = subjects.map((s) =>
        s.id === editingSubjectId
          ? {
              ...s,
              code: subjCode.trim().toUpperCase(),
              name: subjName.trim(),
              category: subjCategory,
              difficulty: subjDifficulty,
              credits: subjCredits,
              description: subjDesc.trim() || s.description,
              prerequisites: subjPrereqs.filter((id) => id !== editingSubjectId),
            }
          : s
      );
      onSaveSubjects(updated);
    } else {
      const newSubj: Subject = {
        id: `subj-${Date.now()}`,
        code: subjCode.trim().toUpperCase(),
        name: subjName.trim(),
        category: subjCategory,
        relatedInterests: [subjCategory, 'Maths'],
        careerRelevance: {
          'Software Developer': 85,
          'Data Analyst': 80,
          'AI/ML Engineer': 88,
          'Cybersecurity Specialist': 78,
          'Cloud & DevOps Architect': 82,
          'Academic Researcher': 85,
        },
        difficulty: subjDifficulty,
        credits: subjCredits,
        prerequisites: subjPrereqs,
        description:
          subjDesc.trim() ||
          'Custom curriculum course added via the Academic Administration Console.',
        topics: [
          {
            id: `top-${Date.now()}-1`,
            title: `Foundations of ${subjName.trim()}`,
            unitNumber: 1,
            unitTitle: 'Core Concepts',
            difficulty: 'Beginner',
            estimatedHours: 6,
            keyConcepts: ['Core Architecture', 'Foundational Models'],
          },
        ],
      };
      onSaveSubjects([...subjects, newSubj]);
    }
    resetSubjectForm();
  };

  const handleDeleteSubject = (id: string) => {
    onSaveSubjects(subjects.filter((s) => s.id !== id));
  };

  const togglePrereqSelection = (prereqId: string) => {
    if (subjPrereqs.includes(prereqId)) {
      setSubjPrereqs(subjPrereqs.filter((id) => id !== prereqId));
    } else {
      setSubjPrereqs([...subjPrereqs, prereqId]);
    }
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim() || !selectedSubjForTopics) return;
    const newTopic: Topic = {
      id: `top-${Date.now()}`,
      title: topicTitle.trim(),
      unitNumber: topicUnit,
      unitTitle: `Unit ${topicUnit}`,
      difficulty: topicDifficulty,
      estimatedHours: topicHours,
      keyConcepts: topicConcepts
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    };
    const updated = subjects.map((s) =>
      s.id === selectedSubjForTopics
        ? { ...s, topics: [...s.topics, newTopic] }
        : s
    );
    onSaveSubjects(updated);
    setTopicTitle('');
    setTopicConcepts('');
  };

  const handleDeleteTopic = (subjectId: string, topicId: string) => {
    const updated = subjects.map((s) =>
      s.id === subjectId
        ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
        : s
    );
    onSaveSubjects(updated);
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resSubjectId) return;
    const targetSubj = subjects.find((s) => s.id === resSubjectId);
    const defaultTopicId = targetSubj?.topics[0]?.id || '';

    const newRes: LearningResource = {
      id: `res-${Date.now()}`,
      title: resTitle.trim(),
      type: resType,
      difficulty: resDifficulty,
      subjectId: resSubjectId,
      topicId: defaultTopicId,
      url: resUrl.trim() || 'https://ocw.mit.edu/',
      durationOrLength: resDuration.trim() || '40 min',
      provider: resProvider.trim() || 'Academic Repository',
      description:
        resDesc.trim() ||
        'Curated learning resource added via Curriculum Admin Console.',
    };
    onSaveResources([newRes, ...resources]);
    setResTitle('');
    setResDesc('');
  };

  const handleDeleteResource = (resId: string) => {
    onSaveResources(resources.filter((r) => r.id !== resId));
  };

  const activeSubjectForTopics =
    subjects.find((s) => s.id === selectedSubjForTopics) || subjects[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            08. Curriculum Governance & Catalog CRUD
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Academic Admin Panel
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            Add, edit, and delete subjects, unit topics, prerequisite dependencies, and learning resources. All changes immediately update the recommendation engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            {(
              [
                { id: 'subjects', label: `Subjects & Prereqs (${subjects.length})` },
                { id: 'topics', label: 'Units & Topics' },
                { id: 'resources', label: `Resources (${resources.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminSection(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  adminSection === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onResetCurriculumToDefault}
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-400 inline-flex items-center gap-1.5 whitespace-nowrap"
            title="Restore default seeded curriculum"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Seed Data</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: SUBJECTS & PREREQUISITES */}
      {adminSection === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveSubject}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 self-start"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingSubjectId ? 'Edit Subject & Prerequisites' : 'Add New Subject'}
              </h2>
              {editingSubjectId && (
                <button
                  type="button"
                  onClick={resetSubjectForm}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                  placeholder="e.g. CS410"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Domain Category
                </label>
                <select
                  value={subjCategory}
                  onChange={(e) =>
                    setSubjCategory(e.target.value as InterestDomain)
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {ALL_INTEREST_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                required
                value={subjName}
                onChange={(e) => setSubjName(e.target.value)}
                placeholder="e.g. Natural Language Processing"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty Tier
                </label>
                <select
                  value={subjDifficulty}
                  onChange={(e) =>
                    setSubjDifficulty(e.target.value as DifficultyLevel)
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={subjCredits}
                  onChange={(e) => setSubjCredits(parseInt(e.target.value, 10) || 4)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prerequisites (Toggle required courses)
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {subjects
                  .filter((s) => s.id !== editingSubjectId)
                  .map((s) => {
                    const active = subjPrereqs.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => togglePrereqSelection(s.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                          active
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {s.code}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Syllabus Description
              </label>
              <textarea
                rows={3}
                value={subjDesc}
                onChange={(e) => setSubjDesc(e.target.value)}
                placeholder="Core learning outcomes and syllabus overview..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {editingSubjectId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Update Subject</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Subject</span>
                </>
              )}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {s.code} · {s.category} · {s.difficulty} · {s.topics.length} Topics
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {s.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Prerequisites:{' '}
                    {s.prerequisites.length > 0
                      ? s.prerequisites
                          .map((pid) => subjects.find((x) => x.id === pid)?.code || pid)
                          .join(', ')
                      : 'None (Foundational)'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditSubjectClick(s)}
                    className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 rounded-lg"
                    title="Edit subject"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubject(s.id)}
                    className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-800 rounded-lg"
                    title="Delete subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: TOPICS CRUD */}
      {adminSection === 'topics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddTopic}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 self-start"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              Add Unit Topic to Subject
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Subject
              </label>
              <select
                value={selectedSubjForTopics}
                onChange={(e) => setSelectedSubjForTopics(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}: {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Topic Title
              </label>
              <input
                type="text"
                required
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g. Reinforcement Learning & MDP Policy Iteration"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Unit #
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={topicUnit}
                  onChange={(e) => setTopicUnit(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={topicDifficulty}
                  onChange={(e) =>
                    setTopicDifficulty(e.target.value as DifficultyLevel)
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Est. Hours
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={topicHours}
                  onChange={(e) => setTopicHours(parseInt(e.target.value, 10) || 6)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Key Concepts (comma-separated)
              </label>
              <input
                type="text"
                value={topicConcepts}
                onChange={(e) => setTopicConcepts(e.target.value)}
                placeholder="Bellman Equation, Q-Learning, Exploration vs Exploitation"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Topic to {activeSubjectForTopics?.code}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {activeSubjectForTopics?.topics.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Unit {t.unitNumber} · {t.difficulty} · {t.estimatedHours} hrs
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.keyConcepts.join(' · ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteTopic(activeSubjectForTopics.id, t.id)
                  }
                  className="p-2 text-slate-400 hover:text-red-600 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: RESOURCES CRUD */}
      {adminSection === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddResource}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 self-start"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              Add Learning Resource
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Resource Title
              </label>
              <input
                type="text"
                required
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                placeholder="e.g. Stanford CS224N: Transformers & Attention"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Modality
                </label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as LearningStyle)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="video">Video</option>
                  <option value="notes">Notes</option>
                  <option value="practice">Practice</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={resDifficulty}
                  onChange={(e) =>
                    setResDifficulty(e.target.value as DifficultyLevel)
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={resSubjectId}
                  onChange={(e) => setResSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Provider
                </label>
                <input
                  type="text"
                  value={resProvider}
                  onChange={(e) => setResProvider(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Duration / Length
                </label>
                <input
                  type="text"
                  value={resDuration}
                  onChange={(e) => setResDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Resource URL
              </label>
              <input
                type="url"
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource to Library</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {resources.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-slate-500 font-mono">
                    {r.type.toUpperCase()} · {r.difficulty} · {r.provider}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {r.title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteResource(r.id)}
                  className="p-2 text-slate-400 hover:text-red-600 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
