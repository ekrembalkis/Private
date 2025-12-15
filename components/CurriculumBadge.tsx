/**
 * CurriculumBadge Component
 * Displays curriculum information for a specific day
 */

import React from 'react';
import { 
  Target, 
  Star, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Zap
} from 'lucide-react';

interface CurriculumInfo {
  weekNumber: number;
  weekTitle: string;
  primaryTopic: string;
  objectives: string[];
  difficulty: number;
  isKeyMilestone: boolean;
  prerequisiteDays: number[];
  completedPrereqs: number[];
  allPrereqsMet: boolean;
  suggestVisual: boolean;
  visualType?: string;
}

interface CurriculumBadgeProps {
  info: CurriculumInfo | null;
  isExpanded?: boolean;
  onToggle?: () => void;
}

// Difficulty indicator component
const DifficultyIndicator: React.FC<{ level: number }> = ({ level }) => {
  const colors = [
    'bg-emerald-500', // 1
    'bg-lime-500',    // 2
    'bg-yellow-500',  // 3
    'bg-orange-500',  // 4
    'bg-red-500'      // 5
  ];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-3 rounded-sm transition-all ${
            i <= level ? colors[level - 1] : 'bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );
};

export const CurriculumBadge: React.FC<CurriculumBadgeProps> = ({ 
  info, 
  isExpanded = false,
  onToggle 
}) => {
  if (!info) return null;

  return (
    <div className="border-t border-zinc-800/50 bg-zinc-950/30">
      {/* Compact Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Week Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
            <BookOpen className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-bold text-blue-400">
              HAFTA {info.weekNumber}
            </span>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-zinc-500" />
            <DifficultyIndicator level={info.difficulty} />
          </div>

          {/* Milestone Badge */}
          {info.isKeyMilestone && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-amber-400">MILESTONE</span>
            </div>
          )}

          {/* Prerequisites Warning */}
          {!info.allPrereqsMet && info.prerequisiteDays.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-bold text-red-400">
                {info.completedPrereqs.length}/{info.prerequisiteDays.length} ÖN KOŞUL
              </span>
            </div>
          )}
        </div>

        <ChevronRight 
          className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Week Theme */}
          <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                Hafta Teması
              </span>
            </div>
            <p className="text-sm text-zinc-300">{info.weekTitle}</p>
          </div>

          {/* Today's Topic */}
          <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                Müfredat Konusu
              </span>
            </div>
            <p className="text-sm text-zinc-300">{info.primaryTopic}</p>
          </div>

          {/* Learning Objectives */}
          {info.objectives.length > 0 && (
            <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                  Öğrenme Hedefleri
                </span>
              </div>
              <ul className="space-y-1.5">
                {info.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <CheckCircle2 className="w-3 h-3 text-zinc-600 mt-0.5 flex-shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {info.prerequisiteDays.length > 0 && (
            <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`w-3.5 h-3.5 ${info.allPrereqsMet ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                  Ön Koşul Günler
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {info.prerequisiteDays.map((dayNum) => {
                  const isCompleted = info.completedPrereqs.includes(dayNum);
                  return (
                    <span
                      key={dayNum}
                      className={`
                        px-2 py-0.5 rounded text-[10px] font-bold
                        ${isCompleted 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}
                      `}
                    >
                      Gün {dayNum}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual Suggestion */}
          {info.suggestVisual && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <span className="text-purple-400">📸</span>
              <span className="text-[11px] text-purple-300">
                Bu gün için görsel önerilir: <span className="font-medium">{info.visualType || 'foto'}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for list view
export const CurriculumBadgeCompact: React.FC<{ info: CurriculumInfo | null }> = ({ info }) => {
  if (!info) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Week Number */}
      <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold rounded">
        H{info.weekNumber}
      </span>

      {/* Difficulty Dots */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full ${
              i <= info.difficulty ? 'bg-amber-400' : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Milestone Star */}
      {info.isKeyMilestone && (
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
      )}

      {/* Prereq Warning */}
      {!info.allPrereqsMet && info.prerequisiteDays.length > 0 && (
        <AlertCircle className="w-3 h-3 text-red-400" />
      )}
    </div>
  );
};

export default CurriculumBadge;
