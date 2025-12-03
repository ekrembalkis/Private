import React from 'react';
import { GenerationStats } from '../types';
import { Briefcase, Calendar, CheckCircle2, User, Building2, GraduationCap, Activity } from 'lucide-react';
import { STUDENT_INFO, COMPANY_INFO } from '../constants';

interface StatsProps {
  stats: GenerationStats;
}

export const Stats: React.FC<StatsProps> = ({ stats }) => {
  const progress = Math.round((stats.completed / stats.totalDays) * 100);
  const circumference = 2 * Math.PI * 36; // Radius 36
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6 sticky top-24">
      {/* Student ID Card */}
      <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden relative group">
         {/* Tech pattern overlay */}
         <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
         
         <div className="h-28 bg-gradient-to-r from-blue-900/80 to-zinc-900 relative border-b border-zinc-800">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
            <div className="absolute -bottom-8 left-6">
               <div className="w-16 h-16 rounded-xl bg-zinc-900 p-1.5 shadow-xl border border-zinc-700">
                  <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                     <User className="w-8 h-8" />
                  </div>
               </div>
            </div>
            <div className="absolute top-4 right-4">
                <div className="px-2 py-1 rounded bg-zinc-950/50 border border-zinc-800 text-[10px] font-mono text-zinc-500 backdrop-blur-sm">
                    ID: {STUDENT_INFO.studentId}
                </div>
            </div>
         </div>
         <div className="pt-10 px-6 pb-6 relative z-10">
            <h2 className="text-lg font-bold text-white tracking-tight">{STUDENT_INFO.name}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Stajyer Mühendis</p>
            </div>
            
            <div className="mt-5 space-y-3 pt-4 border-t border-zinc-800/50">
               <div className="flex items-start gap-3">
                  <GraduationCap className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <p className="text-sm text-zinc-400 leading-tight">{STUDENT_INFO.department}</p>
               </div>
               <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">{COMPANY_INFO.name}</p>
                    <p className="text-xs text-zinc-600 leading-tight mt-0.5">2. Staj (Üretim/İşletme)</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Progress HUD */}
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg border border-zinc-800">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          İlerleme Durumu
        </h3>

        <div className="flex items-center gap-6">
           {/* Circular Progress */}
           <div className="relative w-24 h-24 flex-shrink-0">
             <div className="absolute inset-0 rounded-full border border-zinc-800"></div>
             <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
               <circle
                 cx="48" cy="48" r="36"
                 className="stroke-zinc-800"
                 strokeWidth="6"
                 fill="none"
               />
               <circle
                 cx="48" cy="48" r="36"
                 className="stroke-blue-500 transition-all duration-1000 ease-out"
                 strokeWidth="6"
                 fill="none"
                 strokeLinecap="round"
                 strokeDasharray={circumference}
                 strokeDashoffset={strokeDashoffset}
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white font-mono">{progress}%</span>
             </div>
           </div>

           <div className="space-y-1">
              <div className="text-3xl font-bold text-white font-mono tracking-tighter">
                 {stats.completed}<span className="text-lg text-zinc-600 font-medium">/{stats.totalDays}</span>
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Gün Kaydedildi</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 hover:border-amber-900/50 transition-colors">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
               <Briefcase className="w-3.5 h-3.5" />
               <span className="text-[10px] font-bold uppercase tracking-wider">Üretim</span>
            </div>
            <p className="text-lg font-bold text-zinc-200 font-mono">{stats.productionDays}</p>
          </div>
          <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 hover:border-blue-900/50 transition-colors">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
               <Calendar className="w-3.5 h-3.5" />
               <span className="text-[10px] font-bold uppercase tracking-wider">İşletme</span>
            </div>
            <p className="text-lg font-bold text-zinc-200 font-mono">{stats.managementDays}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
        <div className="h-px bg-zinc-800 w-8"></div>
        <span className="text-[10px] text-zinc-500 font-mono">SYSTEM_READY</span>
        <div className="h-px bg-zinc-800 w-8"></div>
      </div>
    </div>
  );
};