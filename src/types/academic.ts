export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LearningStyle = 'video' | 'notes' | 'practice';

export type CareerGoal =
  | 'Software Developer'
  | 'Data Analyst'
  | 'AI/ML Engineer'
  | 'Cybersecurity Specialist'
  | 'Cloud & DevOps Architect'
  | 'Academic Researcher';

export type InterestDomain =
  | 'AI/ML'
  | 'Web Dev'
  | 'Cybersecurity'
  | 'Cloud'
  | 'Data Science'
  | 'Maths'
  | 'Systems & OS'
  | 'Databases';

export interface LearningResource {
  id: string;
  title: string;
  type: LearningStyle;
  difficulty: DifficultyLevel;
  subjectId: string;
  topicId: string;
  url: string;
  durationOrLength: string;
  provider: string;
  description: string;
}

export interface Topic {
  id: string;
  title: string;
  unitNumber: number;
  unitTitle: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  keyConcepts: string[];
  quizScore?: number; // 0 - 100 optional diagnostic score
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: InterestDomain;
  relatedInterests: InterestDomain[];
  careerRelevance: Record<CareerGoal, number>; // 0 to 100 relevance weight
  difficulty: DifficultyLevel;
  credits: number;
  prerequisites: string[]; // Array of Subject IDs required before taking this subject
  description: string;
  topics: Topic[];
}

export interface CompletedSubjectMark {
  subjectId: string;
  marks: number; // 0 to 100
  semesterTaken: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  enrollmentNo: string;
  program: string;
  branch: string;
  semester: number;
  tenthPercentage: number;
  twelfthPercentage: number;
  cgpa: number;
  completedSubjects: CompletedSubjectMark[];
  interests: Record<InterestDomain, number>; // 0 (not selected) or 1-5 slider value
  careerGoal: CareerGoal;
  learningStyle: LearningStyle;
  completedTopicIds: string[];
  topicQuizScores: Record<string, number>; // topicId -> 0-100 score
  bookmarkedResourceIds: string[];
  recommendationFeedback: Record<string, 'up' | 'down'>; // item id -> feedback
  onboardingCompleted: boolean;
  updatedAt: string;
}

export interface RecommendationScoreBreakdown {
  interestMatch: number; // 0 - 100
  academicReadiness: number; // 0 - 100
  careerGoalRelevance: number; // 0 - 100
  weakAreaBoost: number; // 0 - 100
  feedbackAdjustment: number; // -12 to +8
  totalWeightedScore: number; // 0 - 100
}

export interface RecommendationItem {
  id: string;
  targetType: 'subject' | 'topic';
  subject: Subject;
  topic?: Topic;
  score: number; // 0 - 100
  breakdown: RecommendationScoreBreakdown;
  whyRecommended: string[];
  primaryExplanation: string;
  prerequisitesMet: boolean;
  missingPrerequisites: Subject[];
  suggestedPrerequisiteFirst?: Subject;
  isWeakAreaRemediation: boolean;
  recommendedResources: LearningResource[];
}

export interface PeerStudent {
  id: string;
  name: string;
  program: string;
  branch: string;
  semester: number;
  cgpa: number;
  careerGoal: CareerGoal;
  topInterests: InterestDomain[];
  interestsVector: Record<InterestDomain, number>;
  completedSubjects: CompletedSubjectMark[];
  studiedSubjectIds: string[];
  highlightedTopics: string[];
  weakAreas: string[];
  progressPercentage: number;
  recentAchievement: string;
}

export interface MentorNote {
  id: string;
  studentId: string; // 'current' or peer student ID
  studentName: string;
  mentorName: string;
  mentorTitle: string;
  focusArea: string;
  note: string;
  priority: 'Nominal' | 'Elevated' | 'Critical';
  createdAt: string;
  acknowledged: boolean;
}

export interface AcademicNotification {
  id: string;
  title: string;
  message: string;
  category: 'reminder' | 'goal' | 'mentor' | 'prerequisite';
  createdAt: string;
  read: boolean;
  actionTab?: NavigationTab;
}

export type NavigationTab =
  | 'dashboard'
  | 'profile'
  | 'recommendations'
  | 'roadmap'
  | 'analytics'
  | 'resources'
  | 'collaborative'
  | 'mentor'
  | 'admin';
