'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, PARTNER_ACCOUNTS } from '@/context/AuthContext';
import { Lock, ShieldCheck, Delete, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function PinLoginScreen() {
  const { verifyPin, completeLogin } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successPartner, setSuccessPartner] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 4 || successPartner) return;
      setErrorMsg('');
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 4) {
        // Evaluate immediately
        const res = verifyPin(newPin);
        if (res.success && res.partner) {
          setSuccessPartner(res.partner);
          // Allow 450ms for the celebration / confirmation feedback before unmounting
          setTimeout(() => {
            completeLogin(res.partner!);
          }, 450);
        } else {
          setIsShaking(true);
          setErrorMsg(res.error || 'Incorrect 4-digit code. Please try again.');
          setTimeout(() => {
            setPin('');
            setIsShaking(false);
          }, 600);
        }
      }
    },
    [pin, successPartner, verifyPin, completeLogin]
  );

  const handleDelete = useCallback(() => {
    if (pin.length > 0 && !successPartner) {
      setErrorMsg('');
      setPin((prev) => prev.slice(0, -1));
    }
  }, [pin, successPartner]);

  const handleClear = useCallback(() => {
    if (!successPartner) {
      setErrorMsg('');
      setPin('');
    }
  }, [successPartner]);

  // Support physical keyboard (desktop, laptop & tablet)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F17] px-4 py-6 overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm mx-auto flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-xl shadow-blue-500/20 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span>DzDigital CRM</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PRO
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Enter your 4-digit security PIN to log in</p>
        </div>

        {/* Success Feedback Card */}
        {successPartner ? (
          <div className="w-full p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center animate-fade-in space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/30 text-emerald-300 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-white">Welcome back, {successPartner}!</h2>
            <p className="text-xs text-emerald-300">Unlocking shared sales & inventory...</p>
          </div>
        ) : (
          <>
            {/* PIN Dots Display */}
            <div
              className={`flex items-center justify-center gap-3.5 mb-6 py-2 transition-transform ${
                isShaking ? 'animate-bounce' : ''
              }`}
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50'
                        : isShaking
                        ? 'bg-red-500/50 border border-red-500'
                        : 'bg-slate-800 border border-white/20'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 text-xs font-semibold text-red-400 flex items-center gap-1.5 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mobile-Optimized Phone Keypad (3x4 Grid) */}
            <div className="w-full grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="h-14 sm:h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 active:scale-95 border border-white/10 text-xl font-bold text-white flex items-center justify-center shadow-md transition-all cursor-pointer select-none"
                >
                  {d}
                </button>
              ))}

              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 sm:h-16 rounded-2xl bg-slate-950/60 hover:bg-slate-900 active:bg-slate-800 active:scale-95 border border-white/5 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
              >
                Clear
              </button>

              {/* Digit 0 */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-14 sm:h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 active:scale-95 border border-white/10 text-xl font-bold text-white flex items-center justify-center shadow-md transition-all cursor-pointer select-none"
              >
                0
              </button>

              {/* Backspace button */}
              <button
                type="button"
                onClick={handleDelete}
                className="h-14 sm:h-16 rounded-2xl bg-slate-950/60 hover:bg-slate-900 active:bg-slate-800 active:scale-95 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
                aria-label="Delete"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Discreet Partner Credentials Indicator (No bypass buttons) */}
            <div className="w-full pt-3 border-t border-white/10 text-center">
              <div className="inline-flex items-center gap-3 text-[11px] text-slate-400 bg-slate-950/80 px-3.5 py-1.5 rounded-full border border-white/5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <strong className="text-slate-300">Adem:</strong> 1234
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong className="text-slate-300">Abdou:</strong> 5678
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
