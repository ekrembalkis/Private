/**
 * Curriculum Service
 * Manages curriculum data, progress tracking, and Firebase integration
 */

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebaseService';
import { 
  LearningProgress, 
  GenerationContext,
  SkillLevel 
} from '../curriculumTypes';
import { DayEntry } from '../types';
import {
  ELECTRICAL_INTERNSHIP_CURRICULUM,
  getCurriculumDay,
  getWeekTheme,
  getAccumulatedSkills,
  getAccumulatedTools,
  calculateSkillLevel,
  CurriculumDay
} from '../curriculum';

// ============================================
// FIREBASE HELPERS
// ============================================

const getUserId = (): string => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
};

const getProgressDocRef = () => {
  const userId = getUserId();
  return doc(db, 'users', userId, 'data', 'progress');
};

// ============================================
// PROGRESS MANAGEMENT
// ============================================

/**
 * Initialize learning progress for a new user
 */
export const initializeLearningProgress = async (): Promise<LearningProgress> => {
  const initialProgress: LearningProgress = {
    userId: getUserId(),
    completedDays: [],
    completedSkills: [],
    usedTools: [],
    coveredTopics: [],
    currentSkillLevel: 'beginner',
    currentWeek: 1,
    lastCompletedDay: 0,
    totalProductionDays: 0,
    totalManagementDays: 0,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString()
  };

  try {
    await setDoc(getProgressDocRef(), initialProgress);
    console.log('[CurriculumService] Progress initialized');
    return initialProgress;
  } catch (error) {
    console.error('[CurriculumService] Error initializing progress:', error);
    throw error;
  }
};

/**
 * Load learning progress from Firebase
 */
export const loadLearningProgress = async (): Promise<LearningProgress | null> => {
  try {
    const docSnap = await getDoc(getProgressDocRef());
    if (docSnap.exists()) {
      return docSnap.data() as LearningProgress;
    }
    return null;
  } catch (error) {
    console.error('[CurriculumService] Error loading progress:', error);
    return null;
  }
};

/**
 * Get or create learning progress
 */
export const getOrCreateProgress = async (): Promise<LearningProgress> => {
  const existing = await loadLearningProgress();
  if (existing) return existing;
  return initializeLearningProgress();
};

/**
 * Update progress after completing a day
 */
export const updateProgressAfterDayComplete = async (
  day: DayEntry,
  curriculumDay: CurriculumDay
): Promise<void> => {
  try {
    const progress = await getOrCreateProgress();
    
    // Add day to completed list if not already there
    if (!progress.completedDays.includes(day.dayNumber)) {
      progress.completedDays.push(day.dayNumber);
    }

    // Add new skills
    curriculumDay.skillsToLearn.forEach(skill => {
      if (!progress.completedSkills.includes(skill)) {
        progress.completedSkills.push(skill);
      }
    });

    // Add new tools
    curriculumDay.toolsToUse.forEach(tool => {
      if (!progress.usedTools.includes(tool)) {
        progress.usedTools.push(tool);
      }
    });

    // Add topic
    if (!progress.coveredTopics.includes(curriculumDay.primaryTopic)) {
      progress.coveredTopics.push(curriculumDay.primaryTopic);
    }

    // Update counters
    if (day.type === 'Üretim/Tasarım') {
      progress.totalProductionDays++;
    } else {
      progress.totalManagementDays++;
    }

    // Update current state
    progress.lastCompletedDay = Math.max(progress.lastCompletedDay, day.dayNumber);
    progress.currentWeek = curriculumDay.weekNumber;
    progress.currentSkillLevel = calculateSkillLevel(progress.completedDays);
    progress.lastUpdatedAt = new Date().toISOString();

    await setDoc(getProgressDocRef(), progress);
    console.log('[CurriculumService] Progress updated for day', day.dayNumber);
  } catch (error) {
    console.error('[CurriculumService] Error updating progress:', error);
    throw error;
  }
};

// ============================================
// GENERATION CONTEXT
// ============================================

/**
 * Build generation context for AI content generation
 * This provides all the context AI needs to generate coherent content
 */
export const buildGenerationContext = async (
  dayNumber: number,
  savedDays: DayEntry[]
): Promise<GenerationContext> => {
  const curriculumDay = getCurriculumDay(dayNumber);
  if (!curriculumDay) {
    throw new Error(`Curriculum day ${dayNumber} not found`);
  }

  const weekTheme = getWeekTheme(curriculumDay.weekNumber);
  const progress = await getOrCreateProgress();

  // Get previous days summaries (only saved ones)
  const previousDaysSummary: string[] = savedDays
    .filter(d => d.isSaved && d.dayNumber < dayNumber)
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .slice(-5) // Last 5 days for context
    .map(d => `Day ${d.dayNumber}: ${d.workTitle || d.specificTopic}`);

  // Get last day's details for continuity
  const lastSavedDay = savedDays
    .filter(d => d.isSaved && d.dayNumber < dayNumber)
    .sort((a, b) => b.dayNumber - a.dayNumber)[0];

  // Get next day preview if exists
  const nextCurriculumDay = getCurriculumDay(dayNumber + 1);

  // Build topics to reference from curriculum
  const topicsToReference = curriculumDay.buildUponTopics;

  // Build topics to avoid
  const topicsToAvoid = curriculumDay.avoidTopics;

  const context: GenerationContext = {
    currentDay: dayNumber,
    currentWeek: curriculumDay.weekNumber,
    skillLevel: progress.currentSkillLevel,
    previousDaysSummary,
    learnedSkills: getAccumulatedSkills(dayNumber - 1),
    usedTools: getAccumulatedTools(dayNumber - 1),
    todayObjectives: curriculumDay.objectives,
    suggestedActivities: curriculumDay.suggestedActivities,
    topicsToReference,
    topicsToAvoid,
    lastDayTopic: lastSavedDay?.specificTopic || '',
    lastDayWorkTitle: lastSavedDay?.workTitle || '',
    nextDayPreview: nextCurriculumDay?.primaryTopic
  };

  return context;
};

/**
 * Generate context prompt for AI
 * This creates the context section that will be added to the AI prompt
 */
export const generateContextPrompt = (context: GenerationContext): string => {
  const lines: string[] = [];

  // Week and day info
  lines.push(`## CURRENT POSITION`);
  lines.push(`This is Day ${context.currentDay} of the internship (Week ${context.currentWeek}).`);
  lines.push(`Intern's current skill level: ${context.skillLevel.toUpperCase()}`);
  lines.push('');

  // Previous days summary
  if (context.previousDaysSummary.length > 0) {
    lines.push(`## PREVIOUS DAYS (for continuity)`);
    context.previousDaysSummary.forEach(summary => {
      lines.push(`- ${summary}`);
    });
    lines.push('');
  }

  // Last day details for direct continuity
  if (context.lastDayTopic) {
    lines.push(`## YESTERDAY (Day ${context.currentDay - 1})`);
    lines.push(`Topic: ${context.lastDayTopic}`);
    if (context.lastDayWorkTitle) {
      lines.push(`Work Title: ${context.lastDayWorkTitle}`);
    }
    lines.push('');
  }

  // Today's objectives
  if (context.todayObjectives.length > 0) {
    lines.push(`## TODAY'S LEARNING OBJECTIVES`);
    context.todayObjectives.forEach(obj => {
      lines.push(`- ${obj}`);
    });
    lines.push('');
  }

  // Suggested activities
  if (context.suggestedActivities.length > 0) {
    lines.push(`## SUGGESTED ACTIVITIES`);
    context.suggestedActivities.forEach(activity => {
      lines.push(`- ${activity}`);
    });
    lines.push('');
  }

  // Skills learned so far
  if (context.learnedSkills.length > 0) {
    lines.push(`## SKILLS ALREADY LEARNED (can reference these)`);
    lines.push(context.learnedSkills.slice(-10).join(', '));
    lines.push('');
  }

  // Topics to reference
  if (context.topicsToReference.length > 0) {
    lines.push(`## TOPICS TO BUILD UPON (reference previous learning)`);
    context.topicsToReference.forEach(topic => {
      lines.push(`- ${topic}`);
    });
    lines.push('');
  }

  // Topics to avoid
  if (context.topicsToAvoid.length > 0) {
    lines.push(`## TOPICS TO AVOID (already covered in detail)`);
    context.topicsToAvoid.forEach(topic => {
      lines.push(`- ${topic}`);
    });
    lines.push('');
  }

  // Next day preview
  if (context.nextDayPreview) {
    lines.push(`## TOMORROW'S PREVIEW`);
    lines.push(`Next topic: ${context.nextDayPreview}`);
    lines.push(`(Can foreshadow or set up for tomorrow's work)`);
    lines.push('');
  }

  // Important rules
  lines.push(`## CONTINUITY RULES`);
  lines.push(`1. DO NOT repeat detailed explanations of topics from previous days`);
  lines.push(`2. Reference previous learning naturally ("using the skills I learned earlier...")`);
  lines.push(`3. Show progression - today's work should feel like a natural next step`);
  lines.push(`4. If this is Day 1, treat it as true first day orientation`);
  lines.push(`5. Match the skill level: ${context.skillLevel} level explanations`);

  return lines.join('\n');
};

// ============================================
// CURRICULUM SYNC
// ============================================

/**
 * Sync curriculum day with DayEntry
 * Applies curriculum data to a day entry
 */
export const syncDayWithCurriculum = (
  day: DayEntry,
  overwriteTopic: boolean = false
): DayEntry => {
  const curriculumDay = getCurriculumDay(day.dayNumber);
  if (!curriculumDay) return day;

  const updatedDay = { ...day };

  // Apply curriculum topic if not set or if overwrite is requested
  if (!day.specificTopic || overwriteTopic) {
    updatedDay.specificTopic = curriculumDay.primaryTopic;
  }

  // Apply visual suggestion
  if (curriculumDay.suggestVisual && !day.hasVisual) {
    updatedDay.hasVisual = curriculumDay.suggestVisual;
    if (curriculumDay.visualDescription) {
      updatedDay.visualDescription = curriculumDay.visualDescription;
    }
  }

  // Apply type from curriculum
  updatedDay.type = curriculumDay.type;

  return updatedDay;
};

/**
 * Get curriculum info for a day (for UI display)
 */
export const getCurriculumInfo = (dayNumber: number) => {
  const curriculumDay = getCurriculumDay(dayNumber);
  if (!curriculumDay) return null;

  const weekTheme = getWeekTheme(curriculumDay.weekNumber);

  return {
    day: curriculumDay,
    week: weekTheme,
    isKeyMilestone: curriculumDay.isKeyMilestone,
    difficulty: curriculumDay.difficulty,
    objectives: curriculumDay.objectives,
    suggestedActivities: curriculumDay.suggestedActivities,
    prerequisiteDays: curriculumDay.prerequisiteDays
  };
};

/**
 * Get week progress summary
 */
export const getWeekProgress = async (weekNumber: number) => {
  const progress = await loadLearningProgress();
  const weekDays = ELECTRICAL_INTERNSHIP_CURRICULUM.days.filter(
    d => d.weekNumber === weekNumber
  );

  const completedInWeek = weekDays.filter(
    d => progress?.completedDays.includes(d.dayNumber)
  ).length;

  return {
    weekNumber,
    theme: getWeekTheme(weekNumber),
    totalDays: weekDays.length,
    completedDays: completedInWeek,
    percentage: Math.round((completedInWeek / weekDays.length) * 100)
  };
};

/**
 * Reset progress (for testing/reset)
 */
export const resetProgress = async (): Promise<void> => {
  await initializeLearningProgress();
};

// ============================================
// EXPORTS
// ============================================

export {
  ELECTRICAL_INTERNSHIP_CURRICULUM,
  getCurriculumDay,
  getWeekTheme,
  getAccumulatedSkills,
  getAccumulatedTools,
  calculateSkillLevel
};
