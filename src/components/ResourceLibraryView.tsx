import React, { useState } from 'react';
import {
  StudentProfile,
  Subject,
  LearningResource,
  DifficultyLevel,
  LearningStyle,
} from '../types/academic';
import {
  Search,
  Bookmark,
  ExternalLink,
  Video,
  FileText,
  Code2,
  Sparkles,
} from 'lucide-react';

interface ResourceLibraryViewProps {
  profile: StudentProfile;
  subjects: Subject[];
  resources: LearningResource[];
  onToggleBookmark: (resourceId: string) => void;
}

export const ResourceLibraryView: React.FC<ResourceLibraryViewProps> = ({
  profile,
  subjects,
  resources,
  onToggleBookmark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<
    'ALL' | DifficultyLevel
  >('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LearningStyle>('ALL');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const selectedSubject = subjects.find((s) => s.id === subjectFilter);
  const availableTopics = selectedSubject
    ? selectedSubject.topics
    : subjects.flatMap((s) => s.topics);

  const filteredResources = resources
    .filter((res) => {
      if (onlyBookmarked && !profile.bookmarkedResourceIds.includes(res.id)) {
        return false;
      }
      if (subjectFilter !== 'ALL' && res.subjectId !== subjectFilter) {
        return false;
      }
      if (topicFilter !== 'ALL' && res.topicId !== topicFilter) {
        return false;
      }
      if (difficultyFilter !== 'ALL' && res.difficulty !== difficultyFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && res.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const subj = subjects.find((s) => s.id === res.subjectId);
        return (
          res.title.toLowerCase().includes(q) ||
          res.description.toLowerCase().includes(q) ||
          res.provider.toLowerCase().includes(q) ||
          (subj && subj.name.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aMatch = a.type === profile.learningStyle ? 1 : 0;
      const bMatch = b.type === profile.learningStyle ? 1 : 0;
      return bMatch - aMatch;
    });

  const getModalityIcon = (type: LearningStyle) => {
    if (type === 'video') return Video;
    if (type === 'notes') return FileText;
    return Code2;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            05. Curated Academic Repository
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Learning Resource Library & Bookmarks
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            University lectures, reference monographs, and interactive coding labs prioritized by your preferred <span className="font-semibold text-slate-900 dark:text-slate-100">{profile.learningStyle}</span> modality.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOnlyBookmarked(!onlyBookmarked)}
          className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors inline-flex items-center gap-2 self-start lg:self-auto whitespace-nowrap ${
            onlyBookmarked
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>
            Saved Bookmarks ({profile.bookmarkedResourceIds.length})
          </span>
        </button>
      </div>

      {/* Search & Multi-Faceted Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, concept, MIT/Stanford..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setTopicFilter('ALL');
              }}
              aria-label="Filter by Subject"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All Subjects ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              aria-label="Filter by Topic"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All Units & Topics</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  Unit {t.unitNumber}: {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(e.target.value as 'ALL' | DifficultyLevel)
              }
              aria-label="Filter by Difficulty"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Modality Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
            {(
              [
                { id: 'ALL', label: 'All Formats' },
                { id: 'video', label: 'Video Lectures' },
                { id: 'notes', label: 'Study Notes' },
                { id: 'practice', label: 'Practice Labs' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Showing {filteredResources.length} of {resources.length} resources
          </span>
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((res) => {
          const subj = subjects.find((s) => s.id === res.subjectId);
          const topic = subj?.topics.find((t) => t.id === res.topicId);
          const isBookmarked = profile.bookmarkedResourceIds.includes(res.id);
          const isPreferredStyle = res.type === profile.learningStyle;
          const ModalityIcon = getModalityIcon(res.type);

          return (
            <div
              key={res.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ModalityIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                      {res.type}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{res.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{subj?.code || 'General'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{res.durationOrLength}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(res.id)}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark resource'}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isBookmarked
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {res.title}
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {res.description}
                </p>

                {topic && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Topic: <span className="text-slate-700 dark:text-slate-300 font-medium">Unit {topic.unitNumber} — {topic.title}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{res.provider}</span>
                  {isPreferredStyle && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-sky-600 dark:text-sky-400 font-medium inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Matches {profile.learningStyle} style</span>
                      </span>
                    </>
                  )}
                </div>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No learning resources match your current filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSubjectFilter('ALL');
              setTopicFilter('ALL');
              setDifficultyFilter('ALL');
              setTypeFilter('ALL');
              setOnlyBookmarked(false);
            }}
            className="px-4 py-2 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
