import React from 'react';
import { Loader2, Pause, Play, X, Zap } from 'lucide-react';

interface BatchProgressProps {
  isRunning: boolean;
  isPaused: boolean;
  completed: number;
  total: number;
  currentDay: number | null;
  eta: number; // saniye cinsinden
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({
  isRunning,
  isPaused,
  completed,
  total,
  currentDay,
  eta,
  onPause,
  onResume,
  onCancel
}) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const formatEta = (seconds: number): string => {
    if (seconds <= 0) return 'Hesaplanıyor...';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `~${mins} dk ${secs} sn`;
    }
    return `~${secs} sn`;
  };

  if (!isRunning && completed === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 min-w-[320px] max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Toplu Üretim</p>
              <p className="text-xs text-zinc-500">
                {isPaused ? 'Duraklatıldı' : isRunning ? `Gün ${currentDay} işleniyor...` : 'Tamamlandı'}
              </p>
            </div>
          </div>
          
          {isRunning && (
            <div className="flex items-center gap-1">
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-green-400"
                  title="Devam Et"
                >
                  <Play className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-yellow-400"
                  title="Duraklat"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onCancel}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-red-400"
                title="İptal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isPaused ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            {completed} / {total} gün tamamlandı
          </span>
          <span className="text-zinc-500 font-mono">
            {percent}%
          </span>
        </div>

        {/* ETA */}
        {isRunning && !isPaused && eta > 0 && (
          <div className="mt-2 text-xs text-zinc-600 text-center">
            Tahmini süre: {formatEta(eta)}
          </div>
        )}

        {/* Completed Message */}
        {!isRunning && completed > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800 text-center">
            <p className="text-sm text-green-400">
              ✓ {completed} gün başarıyla oluşturuldu
            </p>
          </div>
        )}
      </div>
    </div>
  );
};