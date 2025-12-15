/**
 * WeekProgress Component
 * Displays weekly progress overview with curriculum themes
 */

import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import { WEEK_THEMES } from '../curriculum';

interface WeekData {
  weekNumber: number;
  title: string;
  totalDays: number;
  completedDays: number;
  percentage: number;
}

interface WeekProgressProps {
  completedDays: number[];
  currentWeek?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

// Calculate week data from completed days
const calculateWeekData = (completedDays: number[]): WeekData[] => {
  return WEEK_THEMES.map(week => {
    // Days in this week (5 days per week)
    const startDay = (week.weekNumber - 1) * 5 + 1;
    const endDay = week.weekNumber * 5;
    const daysInWeek = Array.from({ length: 5 }, (_, i) => startDay + i);
    
    const completedInWeek = daysInWeek.filter(d => completedDays.includes(d)).length;
    
    return {
      weekNumber: week.weekNumber,
      title: week.title,
      totalDays: 5,
      completedDays: completedInWeek,
      percentage: Math.round((completedInWeek / 5) * 100)
    };
  });
};

// Single week bar component
const WeekBar: React.FC<{ 
  week: WeekData; 
  isCurrentWeek: boolean;
}> = ({ week, isCurrentWeek }) => {
  const isComplete = week.completedDays === week.totalDays;
  const isStarted = week.completedDays > 0;

  return (
    <div 
      className={`
        p-3 rounded-lg border transition-all
        ${isCurrentWeek 
          ? 'bg-blue-500/10 border-blue-500/30' 
          : isComplete
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-zinc-900/50 border-zinc-800/50'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : isStarted ? (
            <Circle className="w-4 h-4 text-blue-400" />
          ) : (
            <Circle className="w-4 h-4 text-zinc-600" />
          )}
          <span className={`text-xs font-bold ${
            isCurrentWeek ? 'text-blue-400' : isComplete ? 'text-emerald-400' : 'text-zinc-400'
          }`}>
            Hafta {week.weekNumber}
          </span>
          {isCurrentWeek && (
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] font-bold rounded">
              AKTİF
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          {week.completedDays}/{week.totalDays}
        </span>
      </div>
      
      <p className="text-[11px] text-zinc-500 mb-2 truncate">{week.title}</p>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 rounded-full ${
            isComplete 
              ? 'bg-emerald-500' 
              : isCurrentWeek 
                ? 'bg-blue-500' 
                : 'bg-zinc-600'
          }`}
          style={{ width: `${week.percentage}%` }}
        />
      </div>
    </div>
  );
};

export const WeekProgress: React.FC<WeekProgressProps> = ({ 
  completedDays,
  currentWeek,
  isExpanded = true,
  onToggle
}) => {
  const weekData = calculateWeekData(completedDays);
  const totalCompleted = completedDays.length;
  const overallProgress = Math.round((totalCompleted / 30) * 100);

  // Determine current week if not provided
  const activeWeek = currentWeek || Math.ceil((Math.max(...completedDays, 1)) / 5);

  return (
    <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden">
      {/* Header */}
      <button 
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-zinc-200">Müfredat İlerlemesi</h3>
            <p className="text-[11px] text-zinc-500">6 Hafta, 30 Gün</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold text-white font-mono">{overallProgress}%</p>
            <p className="text-[10px] text-zinc-500">{totalCompleted}/30 gün</p>
          </div>
          {onToggle && (
            isExpanded 
              ? <ChevronUp className="w-4 h-4 text-zinc-500" />
              : <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-zinc-800/50">
          {/* Overall Progress Bar */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                Toplam İlerleme
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {totalCompleted} / 30
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Week Bars */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {weekData.map(week => (
              <WeekBar 
                key={week.weekNumber}
                week={week}
                isCurrentWeek={week.weekNumber === activeWeek}
              />
            ))}
          </div>

          {/* Current Week Theme */}
          {activeWeek && activeWeek <= 6 && (
            <div className="mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                  Aktif Hafta Odağı
                </span>
              </div>
              <p className="text-sm text-zinc-300">{WEEK_THEMES[activeWeek - 1]?.title}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {WEEK_THEMES[activeWeek - 1]?.focus.map((focus, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] rounded-full"
                  >
                    {focus}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for mobile/sidebar
export const WeekProgressCompact: React.FC<{ completedDays: number[] }> = ({ completedDays }) => {
  const totalCompleted = completedDays.length;
  const overallProgress = Math.round((totalCompleted / 30) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-zinc-500">Müfredat</span>
          <span className="text-[10px] font-mono text-zinc-400">{overallProgress}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6].map(week => {
          const startDay = (week - 1) * 5 + 1;
          const endDay = week * 5;
          const daysInWeek = Array.from({ length: 5 }, (_, i) => startDay + i);
          const completedInWeek = daysInWeek.filter(d => completedDays.includes(d)).length;
          const isComplete = completedInWeek === 5;
          const isStarted = completedInWeek > 0;

          return (
            <div
              key={week}
              className={`w-2 h-2 rounded-sm ${
                isComplete 
                  ? 'bg-emerald-500' 
                  : isStarted 
                    ? 'bg-blue-500' 
                    : 'bg-zinc-700'
              }`}
              title={`Hafta ${week}: ${completedInWeek}/5`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WeekProgress;
