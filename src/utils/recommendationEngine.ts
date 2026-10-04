import {
  Subject,
  Topic,
  StudentProfile,
  LearningResource,
  RecommendationItem,
  RecommendationScoreBreakdown,
  PeerStudent,
  CareerGoal,
  InterestDomain,
} from '../types/academic';

export function isSubjectCompletedOrMastered(
  subject: Subject,
  profile: StudentProfile
): boolean {
  const completedEntry = profile.completedSubjects.find(
    (c) => c.subjectId === subject.id && c.marks >= 40
  );
  if (completedEntry) return true;

  if (subject.topics.length === 0) return false;
  const completedCount = subject.topics.filter((t) =>
    profile.completedTopicIds.includes(t.id)
  ).length;
  return completedCount / subject.topics.length >= 0.6;
}

export function getSubjectProgressPercentage(
  subject: Subject,
  profile: StudentProfile
): number {
  if (subject.topics.length === 0) return 0;
  const completedCount = subject.topics.filter((t) =>
    profile.completedTopicIds.includes(t.id)
  ).length;
  return Math.round((completedCount / subject.topics.length) * 100);
}

export function computeSubjectRecommendations(
  subjects: Subject[],
  resources: LearningResource[],
  profile: StudentProfile
): RecommendationItem[] {
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));

  const items: RecommendationItem[] = subjects.map((subject) => {
    // 1. Interest Match (0 - 100)
    const primaryInterestLevel = profile.interests[subject.category] || 0;
    const relatedLevels = subject.relatedInterests.map(
      (dom) => profile.interests[dom] || 0
    );
    const maxRelated = relatedLevels.length > 0 ? Math.max(...relatedLevels) : 0;
    const avgRelated =
      relatedLevels.length > 0
        ? relatedLevels.reduce((a, b) => a + b, 0) / relatedLevels.length
        : 0;
    const blendedInterest = Math.max(
      primaryInterestLevel,
      primaryInterestLevel * 0.65 + maxRelated * 0.25 + avgRelated * 0.1
    );
    const interestMatch = Math.min(100, Math.round((blendedInterest / 5) * 100));

    // 2. Prerequisites & Academic Readiness (0 - 100)
    const missingPrerequisites: Subject[] = [];
    const prereqScores: number[] = [];

    subject.prerequisites.forEach((prereqId) => {
      const prereqSubj = subjectMap.get(prereqId);
      if (!prereqSubj) return;
      const completedEntry = profile.completedSubjects.find(
        (c) => c.subjectId === prereqId
      );
      const mastered = isSubjectCompletedOrMastered(prereqSubj, profile);
      if (!mastered) {
        missingPrerequisites.push(prereqSubj);
      }
      if (completedEntry) {
        prereqScores.push(completedEntry.marks);
      } else if (mastered) {
        prereqScores.push(75);
      } else {
        prereqScores.push(40);
      }
    });

    const prerequisitesMet = missingPrerequisites.length === 0;
    const cgpaNormalized = Math.min(100, (profile.cgpa / 10) * 100);
    const boardAvg = (profile.tenthPercentage + profile.twelfthPercentage) / 2;
    const baseReadiness = cgpaNormalized * 0.65 + boardAvg * 0.35;

    let academicReadiness = baseReadiness;
    if (prereqScores.length > 0) {
      const avgPrereqScore =
        prereqScores.reduce((a, b) => a + b, 0) / prereqScores.length;
      academicReadiness = avgPrereqScore * 0.65 + baseReadiness * 0.35;
    }

    if (!prerequisitesMet) {
      academicReadiness = Math.max(25, academicReadiness * 0.55);
    }
    academicReadiness = Math.round(Math.min(100, Math.max(0, academicReadiness)));

    // 3. Career-Goal Relevance (0 - 100)
    const careerGoalRelevance =
      subject.careerRelevance[profile.careerGoal] ?? 65;

    // 4. Weak-Area Boost (0 - 100)
    const existingMarkEntry = profile.completedSubjects.find(
      (c) => c.subjectId === subject.id
    );
    const topicQuizRatings = subject.topics
      .map((t) => profile.topicQuizScores[t.id])
      .filter((val): val is number => val !== undefined);
    const lowestTopicQuiz =
      topicQuizRatings.length > 0 ? Math.min(...topicQuizRatings) : undefined;

    let weakAreaBoost = 25;
    let isWeakAreaRemediation = false;

    if (existingMarkEntry && existingMarkEntry.marks < 70) {
      weakAreaBoost = Math.min(
        100,
        Math.round(65 + (70 - existingMarkEntry.marks) * 1.4)
      );
      isWeakAreaRemediation = true;
    } else if (lowestTopicQuiz !== undefined && lowestTopicQuiz < 68) {
      weakAreaBoost = Math.min(
        100,
        Math.round(60 + (68 - lowestTopicQuiz) * 1.3)
      );
      isWeakAreaRemediation = true;
    } else if (!existingMarkEntry && prerequisitesMet) {
      const progress = getSubjectProgressPercentage(subject, profile);
      if (progress < 100 && careerGoalRelevance >= 85) {
        weakAreaBoost = 58;
      }
    }

    // Feedback Adjustment (thumbs up / down)
    const feedback = profile.recommendationFeedback[subject.id];
    const feedbackAdjustment = feedback === 'up' ? 8 : feedback === 'down' ? -12 : 0;

    // Exact formula: 0.35*interest + 0.25*readiness + 0.25*career + 0.15*weakArea
    const rawWeighted =
      0.35 * interestMatch +
      0.25 * academicReadiness +
      0.25 * careerGoalRelevance +
      0.15 * weakAreaBoost;

    const totalWeightedScore = Math.max(
      1,
      Math.min(99, Math.round(rawWeighted + feedbackAdjustment))
    );

    const breakdown: RecommendationScoreBreakdown = {
      interestMatch,
      academicReadiness,
      careerGoalRelevance,
      weakAreaBoost,
      feedbackAdjustment,
      totalWeightedScore,
    };

    const whyRecommended: string[] = [];

    if (primaryInterestLevel >= 4) {
      whyRecommended.push(
        `Matches your strong interest in ${subject.category} (${primaryInterestLevel}/5 rating)`
      );
    } else if (maxRelated >= 4) {
      const topRel = subject.relatedInterests.find(
        (d) => (profile.interests[d] || 0) === maxRelated
      );
      if (topRel) {
        whyRecommended.push(
          `Aligns with your interest in ${topRel} (${maxRelated}/5 rating)`
        );
      }
    }

    if (subject.prerequisites.length > 0 && prerequisitesMet) {
      const prereqDetails = subject.prerequisites
        .map((pid) => {
          const pSubj = subjectMap.get(pid);
          const mark = profile.completedSubjects.find((c) => c.subjectId === pid);
          if (pSubj && mark) return `scored ${mark.marks}% in ${pSubj.name}`;
          if (pSubj) return `completed ${pSubj.name}`;
          return null;
        })
        .filter(Boolean);
      if (prereqDetails.length > 0) {
        whyRecommended.push(`Academic readiness verified: you ${prereqDetails.join(' and ')}`);
      }
    } else if (subject.prerequisites.length === 0) {
      whyRecommended.push(
        `Core foundation course supported by your ${profile.cgpa.toFixed(2)} CGPA`
      );
    }

    if (careerGoalRelevance >= 85) {
      whyRecommended.push(
        `${careerGoalRelevance}% relevance benchmark for your ${profile.careerGoal} career goal`
      );
    }

    if (isWeakAreaRemediation) {
      if (existingMarkEntry && existingMarkEntry.marks < 70) {
        whyRecommended.push(
          `Weak-area boost triggered: remediates your ${existingMarkEntry.marks}% score in ${subject.code}`
        );
      } else if (lowestTopicQuiz !== undefined) {
        whyRecommended.push(
          `Targeted weak-area boost: topic diagnostic score (${lowestTopicQuiz}%) needs reinforcement`
        );
      }
    }

    if (!prerequisitesMet && missingPrerequisites.length > 0) {
      whyRecommended.unshift(
        `Prerequisite pending: Complete ${missingPrerequisites
          .map((m) => `${m.code} (${m.name})`)
          .join(', ')} first to unlock full readiness`
      );
    }

    const primaryExplanation =
      whyRecommended.slice(0, 2).join(', and ') ||
      `Recommended for your ${profile.careerGoal} pathway.`;

    const subjectResources = resources
      .filter((r) => r.subjectId === subject.id)
      .sort((a, b) => {
        const aStyleMatch = a.type === profile.learningStyle ? 1 : 0;
        const bStyleMatch = b.type === profile.learningStyle ? 1 : 0;
        return bStyleMatch - aStyleMatch;
      });

    return {
      id: subject.id,
      targetType: 'subject',
      subject,
      score: totalWeightedScore,
      breakdown,
      whyRecommended,
      primaryExplanation,
      prerequisitesMet,
      missingPrerequisites,
      suggestedPrerequisiteFirst: missingPrerequisites[0],
      isWeakAreaRemediation,
      recommendedResources: subjectResources,
    };
  });

  return items.sort((a, b) => {
    if (a.prerequisitesMet !== b.prerequisitesMet) {
      return a.prerequisitesMet ? -1 : 1;
    }
    return b.score - a.score;
  });
}

export function computeTopicRecommendations(
  subjects: Subject[],
  resources: LearningResource[],
  profile: StudentProfile
): RecommendationItem[] {
  const subjectRecs = computeSubjectRecommendations(subjects, resources, profile);
  const subjectRecMap = new Map(subjectRecs.map((r) => [r.subject.id, r]));

  const topicItems: RecommendationItem[] = [];

  subjects.forEach((subject) => {
    const parentRec = subjectRecMap.get(subject.id);
    if (!parentRec) return;

    subject.topics.forEach((topic) => {
      const isCompleted = profile.completedTopicIds.includes(topic.id);
      const quizScore = profile.topicQuizScores[topic.id];
      const isWeakTopic = quizScore !== undefined && quizScore < 68;

      if (isCompleted && !isWeakTopic) return;

      const interestMatch = parentRec.breakdown.interestMatch;
      const careerGoalRelevance = parentRec.breakdown.careerGoalRelevance;

      let academicReadiness = parentRec.breakdown.academicReadiness;
      if (topic.difficulty === 'Beginner') academicReadiness = Math.min(100, academicReadiness + 8);
      if (topic.difficulty === 'Advanced' && !isCompleted) {
        academicReadiness = Math.max(30, academicReadiness - 6);
      }

      let weakAreaBoost = parentRec.breakdown.weakAreaBoost;
      if (isWeakTopic && quizScore !== undefined) {
        weakAreaBoost = Math.min(100, Math.round(70 + (68 - quizScore) * 1.4));
      }

      const feedback = profile.recommendationFeedback[topic.id];
      const feedbackAdjustment = feedback === 'up' ? 8 : feedback === 'down' ? -12 : 0;

      const rawScore =
        0.35 * interestMatch +
        0.25 * academicReadiness +
        0.25 * careerGoalRelevance +
        0.15 * weakAreaBoost;

      const totalWeightedScore = Math.max(
        1,
        Math.min(99, Math.round(rawScore + feedbackAdjustment))
      );

      const reasons: string[] = [];
      if (isWeakTopic && quizScore !== undefined) {
        reasons.push(
          `Diagnostic quiz score of ${quizScore}% in Unit ${topic.unitNumber} indicates a high-priority concept gap`
        );
      }
      reasons.push(...parentRec.whyRecommended.slice(0, 2));

      const matchingResources = resources
        .filter((r) => r.topicId === topic.id || r.subjectId === subject.id)
        .sort((a, b) => {
          const aExact = a.topicId === topic.id ? 2 : 0;
          const bExact = b.topicId === topic.id ? 2 : 0;
          const aStyle = a.type === profile.learningStyle ? 1 : 0;
          const bStyle = b.type === profile.learningStyle ? 1 : 0;
          return bExact + bStyle - (aExact + aStyle);
        });

      topicItems.push({
        id: topic.id,
        targetType: 'topic',
        subject,
        topic,
        score: totalWeightedScore,
        breakdown: {
          interestMatch,
          academicReadiness,
          careerGoalRelevance,
          weakAreaBoost,
          feedbackAdjustment,
          totalWeightedScore,
        },
        whyRecommended: reasons,
        primaryExplanation: reasons[0] || parentRec.primaryExplanation,
        prerequisitesMet: parentRec.prerequisitesMet,
        missingPrerequisites: parentRec.missingPrerequisites,
        suggestedPrerequisiteFirst: parentRec.suggestedPrerequisiteFirst,
        isWeakAreaRemediation: isWeakTopic || parentRec.isWeakAreaRemediation,
        recommendedResources: matchingResources.slice(0, 3),
      });
    });
  });

  return topicItems.sort((a, b) => {
    if (a.prerequisitesMet !== b.prerequisitesMet) {
      return a.prerequisitesMet ? -1 : 1;
    }
    return b.score - a.score;
  });
}

export interface RoadmapStep {
  stepNumber: number;
  subject: Subject;
  topic: Topic;
  status: 'Completed' | 'Current' | 'Locked';
  lockReason?: string;
  prerequisiteSubject?: Subject;
  adaptiveDifficultyNote: string;
}

export function generateLearningRoadmap(
  subjects: Subject[],
  profile: StudentProfile,
  targetMode: { type: 'career'; career: CareerGoal } | { type: 'subject'; subjectId: string }
): RoadmapStep[] {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const selectedSubjectIds = new Set<string>();

  const addWithPrereqs = (subjId: string) => {
    if (selectedSubjectIds.has(subjId)) return;
    const subj = subjectMap.get(subjId);
    if (!subj) return;
    subj.prerequisites.forEach((pId) => addWithPrereqs(pId));
    selectedSubjectIds.add(subjId);
  };

  if (targetMode.type === 'subject') {
    addWithPrereqs(targetMode.subjectId);
  } else {
    subjects
      .filter((s) => (s.careerRelevance[targetMode.career] || 0) >= 78)
      .sort(
        (a, b) =>
          (b.careerRelevance[targetMode.career] || 0) -
          (a.careerRelevance[targetMode.career] || 0)
      )
      .forEach((s) => addWithPrereqs(s.id));
  }

  const diffRank: Record<string, number> = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
  };

  const orderedSubjects: Subject[] = [];
  const visited = new Set<string>();

  const visit = (subjId: string) => {
    if (visited.has(subjId)) return;
    const subj = subjectMap.get(subjId);
    if (!subj) return;
    subj.prerequisites
      .filter((p) => selectedSubjectIds.has(p))
      .sort(
        (a, b) =>
          diffRank[subjectMap.get(a)?.difficulty || 'Beginner'] -
          diffRank[subjectMap.get(b)?.difficulty || 'Beginner']
      )
      .forEach(visit);
    visited.add(subjId);
    orderedSubjects.push(subj);
  };

  Array.from(selectedSubjectIds)
    .sort(
      (a, b) =>
        diffRank[subjectMap.get(a)?.difficulty || 'Beginner'] -
        diffRank[subjectMap.get(b)?.difficulty || 'Beginner']
    )
    .forEach(visit);

  const steps: RoadmapStep[] = [];
  let stepCounter = 1;
  let currentActiveAssigned = false;

  orderedSubjects.forEach((subj) => {
    const missingPrereqs = subj.prerequisites
      .map((pid) => subjectMap.get(pid))
      .filter(
        (p): p is Subject =>
          p !== undefined && !isSubjectCompletedOrMastered(p, profile)
      );

    const subjLocked = missingPrereqs.length > 0;
    const sortedTopics = [...subj.topics].sort(
      (a, b) => a.unitNumber - b.unitNumber
    );

    sortedTopics.forEach((topic, idx) => {
      const isCompleted = profile.completedTopicIds.includes(topic.id);
      const prevTopic = idx > 0 ? sortedTopics[idx - 1] : undefined;
      const prevTopicDone = prevTopic
        ? profile.completedTopicIds.includes(prevTopic.id)
        : true;

      let status: 'Completed' | 'Current' | 'Locked' = 'Locked';
      let lockReason: string | undefined;

      if (isCompleted) {
        status = 'Completed';
      } else if (subjLocked) {
        status = 'Locked';
        lockReason = `Requires prerequisite subject: ${missingPrereqs
          .map((m) => `${m.code} (${m.name})`)
          .join(', ')}`;
      } else if (!prevTopicDone && !currentActiveAssigned) {
        status = 'Locked';
        lockReason = `Complete Unit ${prevTopic?.unitNumber}: "${prevTopic?.title}" first`;
      } else if (!currentActiveAssigned) {
        status = 'Current';
        currentActiveAssigned = true;
      } else {
        status = prevTopicDone ? 'Current' : 'Locked';
        if (status === 'Locked' && prevTopic) {
          lockReason = `Sequenced after Unit ${prevTopic.unitNumber}: ${prevTopic.title}`;
        }
      }

      const adaptiveDifficultyNote =
        topic.difficulty === 'Beginner'
          ? 'Stage 1 Foundation · Builds core conceptual fluency'
          : topic.difficulty === 'Intermediate'
          ? 'Stage 2 Applied Systems · Bridges theory to architecture'
          : 'Stage 3 Mastery · Production-grade optimization & synthesis';

      steps.push({
        stepNumber: stepCounter++,
        subject: subj,
        topic,
        status,
        lockReason,
        prerequisiteSubject: missingPrereqs[0],
        adaptiveDifficultyNote,
      });
    });
  });

  return steps;
}

export function computeCollaborativeSuggestions(
  profile: StudentProfile,
  peers: PeerStudent[],
  subjects: Subject[]
): Array<{
  peer: PeerStudent;
  similarityScore: number;
  sharedInterests: InterestDomain[];
  recommendedSubjectsFromPeer: Subject[];
}> {
  const domains = Object.keys(profile.interests) as InterestDomain[];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return peers
    .map((peer) => {
      let dot = 0;
      let magA = 0;
      let magB = 0;
      const sharedInterests: InterestDomain[] = [];

      domains.forEach((d) => {
        const a = profile.interests[d] || 0;
        const b = peer.interestsVector[d] || 0;
        dot += a * b;
        magA += a * a;
        magB += b * b;
        if (a >= 3 && b >= 3) {
          sharedInterests.push(d);
        }
      });

      const cosine =
        magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0.5;
      const careerBonus = peer.careerGoal === profile.careerGoal ? 0.12 : 0;
      const cgpaProximity =
        1 - Math.min(0.25, Math.abs(profile.cgpa - peer.cgpa) / 10);

      const similarityScore = Math.min(
        98,
        Math.round((cosine * 0.75 + cgpaProximity * 0.15 + careerBonus) * 100)
      );

      const recommendedSubjectsFromPeer = peer.studiedSubjectIds
        .map((id) => subjectMap.get(id))
        .filter((s): s is Subject => s !== undefined);

      return {
        peer,
        similarityScore,
        sharedInterests,
        recommendedSubjectsFromPeer,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

export function calculateProfileCompleteness(profile: StudentProfile): {
  percentage: number;
  missingFields: string[];
} {
  const checks: Array<{ label: string; valid: boolean }> = [
    { label: 'Full Name', valid: profile.name.trim().length >= 2 },
    { label: 'Program & Branch', valid: profile.program.trim().length > 0 && profile.branch.trim().length > 0 },
    { label: 'Current Semester (1–8)', valid: profile.semester >= 1 && profile.semester <= 8 },
    {
      label: '10th & 12th Board Percentages',
      valid:
        profile.tenthPercentage >= 35 &&
        profile.tenthPercentage <= 100 &&
        profile.twelfthPercentage >= 35 &&
        profile.twelfthPercentage <= 100,
    },
    { label: 'Current CGPA (0–10)', valid: profile.cgpa > 0 && profile.cgpa <= 10 },
    {
      label: 'Completed Subject Marks (at least 2)',
      valid: profile.completedSubjects.length >= 2,
    },
    {
      label: 'Active Interest Ratings (at least 3 domains rated)',
      valid: Object.values(profile.interests).filter((v) => v >= 1).length >= 3,
    },
    { label: 'Career Goal & Learning Style', valid: Boolean(profile.careerGoal && profile.learningStyle) },
  ];

  const passed = checks.filter((c) => c.valid).length;
  const percentage = Math.round((passed / checks.length) * 100);
  const missingFields = checks.filter((c) => !c.valid).map((c) => c.label);

  return { percentage, missingFields };
}
