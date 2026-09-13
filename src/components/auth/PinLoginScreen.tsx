'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Delete, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

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
        const res = verifyPin(newPin);
        if (res.success && res.partner) {
          setSuccessPartner(res.partner);
          setTimeout(() => {
            completeLogin(res.partner!);
          }, 500);
        } else {
          setIsShaking(true);
          setErrorMsg('Code PIN incorrect. Réessayez.');
          setTimeout(() => {
            setPin('');
            setIsShaking(false);
          }, 650);
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

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090b10] px-4 py-8 overflow-y-auto">
      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[320px] mx-auto flex flex-col items-center gap-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">DzDigital CRM</h1>
            <p className="text-xs text-slate-400 mt-0.5">Entrez votre code PIN à 4 chiffres</p>
          </div>
        </div>

        {/* Success state */}
        {successPartner ? (
          <div className="w-full p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/25 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-base font-bold text-white">Bienvenue, {successPartner} !</p>
            <p className="text-xs text-emerald-400/80">Ouverture du CRM...</p>
          </div>
        ) : (
          <>
            {/* PIN dots */}
            <div
              className={`flex items-center justify-center gap-4 transition-transform duration-100 ${
                isShaking ? 'translate-x-0 animate-shake' : ''
              }`}
              style={isShaking ? { animation: 'shake 0.5s ease-in-out' } : {}}
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/60'
                        : isShaking
                        ? 'bg-red-500/60 border border-red-500/60'
                        : 'bg-slate-800 border border-white/15'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-red-400 font-medium animate-fade-in -mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Keypad 3×4 */}
            <div className="w-full grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="h-[60px] rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 active:scale-95 border border-white/8 text-xl font-semibold text-white flex items-center justify-center shadow-sm transition-all duration-150 cursor-pointer select-none touch-manipulation"
                >
                  {d}
                </button>
              ))}

              {/* Clear */}
              <button
                type="button"
                onClick={handleClear}
                className="h-[60px] rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-95 border border-white/5 text-[11px] font-bold text-slate-500 hover:text-slate-300 flex items-center justify-center transition-all duration-150 cursor-pointer select-none touch-manipulation"
              >
                Effacer
              </button>

              {/* 0 */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-[60px] rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 active:scale-95 border border-white/8 text-xl font-semibold text-white flex items-center justify-center shadow-sm transition-all duration-150 cursor-pointer select-none touch-manipulation"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Supprimer dernier chiffre"
                className="h-[60px] rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-95 border border-white/5 text-slate-500 hover:text-slate-300 flex items-center justify-center transition-all duration-150 cursor-pointer select-none touch-manipulation"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Discreet footer — NO PIN shown */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <Lock className="w-3 h-3" />
              <span>Connexion sécurisée — PIN confidentiel</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
