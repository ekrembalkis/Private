import React, { useState } from 'react';
import { signInWithGoogle } from '../services/authService';
import { Terminal, Loader2, AlertTriangle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await signInWithGoogle();
      if (user) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Giriş penceresi kapatıldı. Tekrar deneyin.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup engellendi. Lütfen popup izni verin.');
      } else {
        setError('Giriş yapılırken bir hata oluştu. Tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900/30">
            <Terminal className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Staj Defteri <span className="text-blue-500">Oluşturucu</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            AI destekli staj defteri içerik üretici
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            Hoş Geldiniz
          </h2>
          <p className="text-zinc-500 text-sm text-center mb-6">
            Devam etmek için giriş yapın
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-medium transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {isLoading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}
          </button>

          <p className="text-zinc-600 text-xs text-center mt-6">
            Giriş yaparak verileriniz güvenli bir şekilde
            <br />Firebase hesabınızda saklanır.
          </p>
        </div>

        {/* Footer */}
        <p className="text-zinc-700 text-xs text-center mt-6">
          Powered by Gemini AI • Haliç Üniversitesi
        </p>
      </div>
    </div>
  );
};