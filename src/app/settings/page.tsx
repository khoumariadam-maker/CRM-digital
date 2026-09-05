'use client';

import React, { useState, useEffect } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { FirebaseConfig } from '@/types/crm';
import {
  Settings,
  Flame,
  TrendingUp,
  Users,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    isFirebaseConnected,
    firebaseConfig,
    saveConfig,
    resetToDefault,
    sales,
    products,
  } = useCRMData();
  const { exchangeRate, setExchangeRate } = useCurrency();

  const [rateInput, setRateInput] = useState(exchangeRate.toString());
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [appId, setAppId] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (firebaseConfig) {
      setApiKey(firebaseConfig.apiKey || '');
      setProjectId(firebaseConfig.projectId || '');
      setAuthDomain(firebaseConfig.authDomain || '');
      setAppId(firebaseConfig.appId || '');
    }
  }, [firebaseConfig]);

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(rateInput);
    if (!isNaN(val) && val > 0) {
      setExchangeRate(val);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    const cfg: FirebaseConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: `${projectId.trim()}.appspot.com`,
      messagingSenderId: '',
      appId: appId.trim(),
    };
    saveConfig(cfg);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDownloadBackup = () => {
    const backup = {
      version: 2,
      date: new Date().toISOString(),
      exchangeRate,
      sales,
      products,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>CONFIG & CLOUD</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Settings & Google Firebase</h1>
        <p className="text-xs text-slate-400">
          Parallel market rate, Google Firebase cloud sync, and backup settings.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* 1. Partners Overview */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Active Business Partners</span>
        </div>
        <p className="text-xs text-slate-400">
          This CRM is tailored for <strong>Adem</strong> & <strong>Abdou</strong>. Switch between partners from the top bar when logging sales.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/30 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              A
            </span>
            <div>
              <span className="text-xs font-bold text-white block">Adem</span>
              <span className="text-[10px] text-slate-400">Partner & Seller</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              A
            </span>
            <div>
              <span className="text-xs font-bold text-white block">Abdou</span>
              <span className="text-[10px] text-slate-400">Partner & Seller</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Parallel Market Rate */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Algerian Parallel Market Exchange Rate</span>
        </div>
        <p className="text-xs text-slate-400">
          Used to calculate exact product sourcing costs and Meta ad spend in Algerian Dinar.
        </p>

        <form onSubmit={handleSaveRate} className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="relative w-full sm:w-60">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">1 USD =</span>
            <input
              type="number"
              step="0.5"
              required
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-20 pr-10 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">DA</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Update Rate
          </button>
        </form>
      </div>

      {/* 3. Google Firebase Cloud Sync */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Google Firebase Setup (100% Free)</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
              isFirebaseConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {isFirebaseConnected ? 'Firebase Active' : 'Offline Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Firebase Spark plan gives you <strong>1GB free Firestore storage</strong> and 50,000 free reads/day so both Adem and Abdou can sync sales in real-time.
        </p>

        <form onSubmit={handleSaveFirebase} className="space-y-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Firebase Project ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. digital-crm-dz"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Firebase API Key *
            </label>
            <input
              type="password"
              required
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Firebase App ID (Optional)
            </label>
            <input
              type="text"
              placeholder="1:123456789:web:..."
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 cursor-pointer"
          >
            Connect Firebase Database
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-950 text-[11px] text-slate-400 space-y-1">
          <span className="font-semibold text-white block">Free Hosting with Firebase:</span>
          <span>You can deploy this Next.js app to Firebase Hosting for free using:</span>
          <code className="block text-amber-300 font-mono bg-slate-900 p-2 rounded-lg mt-1">
            npm install -g firebase-tools && firebase login && firebase deploy
          </code>
        </div>
      </div>

      {/* 4. Backup & Export */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <span className="text-xs font-bold text-white block">Data Backup</span>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export JSON Backup</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset sales and products to default demo data?')) {
                resetToDefault();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-red-400 border border-red-500/20 text-xs font-bold cursor-pointer ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
