/**
 * Curriculum Types
 * Type definitions for the progressive learning curriculum system
 */

import { InternshipType } from './types';

// Skill levels for tracking progression
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

// Difficulty level for each day
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// Week theme definition
export interface WeekTheme {
  weekNumber: number;
  title: string;
  titleEN: string;
  description: string;
  focus: string[];
  expectedSkillLevel: SkillLevel;
}

// Single day curriculum entry
export interface CurriculumDay {
  dayNumber: number;
  weekNumber: number;
  type: InternshipType;
  
  // Topic information
  primaryTopic: string;
  primaryTopicEN: string;
  alternativeTopics: string[];
  
  // Learning objectives
  objectives: string[];
  objectivesEN: string[];
  
  // Skills and prerequisites
  prerequisiteDays: number[];      // Days that must be completed first
  skillsToLearn: string[];         // Skills gained this day
  toolsToUse: string[];            // Tools/equipment used
  
  // Progression
  difficulty: DifficultyLevel;
  isKeyMilestone: boolean;         // Important checkpoint day
  
  // Content hints for AI
  suggestedActivities: string[];
  avoidTopics: string[];           // Topics NOT to cover (already covered)
  buildUponTopics: string[];       // Topics to reference from previous days
  
  // Visual recommendation
  suggestVisual: boolean;
  visualType?: 'diagram' | 'photo' | 'schematic' | 'document';
  visualDescription?: string;
}

// Complete curriculum structure
export interface Curriculum {
  version: string;
  totalDays: number;
  totalWeeks: number;
  weeks: WeekTheme[];
  days: CurriculumDay[];
  
  // Metadata
  createdAt: string;
  description: string;
}

// Learning progress tracking
export interface LearningProgress {
  userId: string;
  
  // Completed items
  completedDays: number[];
  completedSkills: string[];
  usedTools: string[];
  coveredTopics: string[];
  
  // Current state
  currentSkillLevel: SkillLevel;
  currentWeek: number;
  lastCompletedDay: number;
  
  // Statistics
  totalProductionDays: number;
  totalManagementDays: number;
  
  // Timestamps
  startedAt: string;
  lastUpdatedAt: string;
}

// Context for AI generation
export interface GenerationContext {
  currentDay: number;
  currentWeek: number;
  skillLevel: SkillLevel;
  
  // History summary
  previousDaysSummary: string[];
  learnedSkills: string[];
  usedTools: string[];
  
  // Curriculum guidance
  todayObjectives: string[];
  suggestedActivities: string[];
  topicsToReference: string[];
  topicsToAvoid: string[];
  
  // Continuity hints
  lastDayTopic: string;
  lastDayWorkTitle: string;
  nextDayPreview?: string;
}
