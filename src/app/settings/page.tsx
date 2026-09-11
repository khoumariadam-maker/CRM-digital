'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth, PARTNER_ACCOUNTS } from '@/context/AuthContext';
import { parseNumericInput } from '@/lib/calculations';
import {
  Settings,
  Flame,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  CloudUpload,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    isFirebaseConnected,
    cloudSyncStatus,
    cloudSyncError,
    lastSyncedAt,
    firebaseConfig,
    resetToDefault,
    resetToFresh,
    updateExchangeRate,
    syncAllDataToCloud,
    sales,
    products,
    expenses,
    dailyAdSpends,
    dailyCaisses,
    showToast,
  } = useCRMData();
  const { exchangeRate } = useCurrency();
  const { partner, logout } = useAuth();

  const [rateInput, setRateInput] = useState(exchangeRate.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNumericInput(rateInput);
    if (val > 0) {
      await updateExchangeRate(val);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handlePushCloud = async () => {
    setIsPushingCloud(true);
    await syncAllDataToCloud();
    setIsPushingCloud(false);
  };

  const handleDownloadBackup = () => {
    const backup = {
      version: 3,
      date: new Date().toISOString(),
      exchangeRate,
      sales,
      products,
      expenses,
      dailyAdSpends,
      dailyCaisses,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup downloaded');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.sales && Array.isArray(data.sales)) {
          localStorage.setItem('crm_sales_v2', JSON.stringify(data.sales));
        }
        if (data.products && Array.isArray(data.products)) {
          localStorage.setItem('crm_products_v2', JSON.stringify(data.products));
        }
        if (data.exchangeRate) {
          updateExchangeRate(Number(data.exchangeRate));
        }
        showToast('Backup restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>CONFIG & CLOUD</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Settings & Cloud Sync</h1>
        <p className="text-xs text-slate-400">
          Parallel market rate, shared Firebase cloud sync, and 4-digit PIN security.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved and synced to cloud!</span>
        </div>
      )}

      {/* 1. Security & 4-Digit PIN Access */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Security & 4-Digit PIN Access</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
            Active: {partner || 'Guest'}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          DzDigital CRM is protected by 4-digit PIN codes. To log in on your phone, enter your code:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Adem */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                A
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Adem</span>
                <span className="text-[10px] text-slate-400">{PARTNER_ACCOUNTS.Adem.role}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">PIN Code</span>
              <code className="text-xs font-bold font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                1234
              </code>
            </div>
          </div>

          {/* Abdou */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                A
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Abdou</span>
                <span className="text-[10px] text-slate-400">{PARTNER_ACCOUNTS.Abdou.role}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">PIN Code</span>
              <code className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                5678
              </code>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Lock Session & Switch Partner</span>
          </button>
        </div>
      </div>

      {/* 2. Centralized Shared Firebase Cloud Sync (No credentials forms) */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Shared Firebase Cloud Sync</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
              cloudSyncStatus === 'connected'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : cloudSyncStatus === 'syncing'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {cloudSyncStatus === 'connected'
              ? 'Shared Cloud Active'
              : cloudSyncStatus === 'syncing'
              ? 'Connecting / Syncing...'
              : 'Offline Cache Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          All data is <strong>automatically shared between Adem and Abdou</strong>. Firebase credentials are configured in code (<code className="text-amber-400 font-mono">src/lib/firebaseConfig.ts</code> and <code className="text-amber-400 font-mono">.env.local</code>) so neither of you ever needs to enter credentials on your phone.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Cloud Database:</span>
            <span className="font-mono text-emerald-400 font-bold">
              Google Firestore (Real-Time)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Shared Project ID:</span>
            <span className="font-mono text-white font-semibold">
              {firebaseConfig.projectId || 'dzdigital-crm'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Connection Status:</span>
            <span className="text-white font-semibold flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  cloudSyncStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-blue-400 animate-ping'
                    : 'bg-amber-400'
                }`}
              />
              {cloudSyncStatus === 'connected'
                ? `Online (Last synced: ${lastSyncedAt || 'Active'})`
                : cloudSyncStatus === 'syncing'
                ? 'Connecting to Firestore...'
                : 'Offline / Using Local Cache'}
            </span>
          </div>
        </div>

        {cloudSyncError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cloud Sync Notice:</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              {cloudSyncError.includes('permission-denied')
                ? 'Firestore permission denied. If using live Firebase, ensure Firestore security rules in the Firebase Console allow read/write.'
                : cloudSyncError}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handlePushCloud}
            disabled={isPushingCloud}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4 text-emerald-400" />
            <span>{isPushingCloud ? 'Syncing...' : 'Push Local Catalog & Sales to Cloud'}</span>
          </button>
        </div>
      </div>

      {/* 3. Parallel Market Rate */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Algerian Parallel Market Exchange Rate</span>
        </div>
        <p className="text-xs text-slate-400">
          Used to calculate exact product sourcing costs and Meta ad spend in Algerian Dinar. Synced to cloud in real time.
        </p>

        <form onSubmit={handleSaveRate} className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="relative w-full sm:w-60">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">1 USD =</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              required
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-20 pr-10 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">DA</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Update & Share Rate
          </button>
        </form>
      </div>

      {/* 4. Data Backup & Restore */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="text-xs font-bold text-white">Data Management & Offline Backups</div>
        <p className="text-xs text-slate-400">
          Download a complete JSON snapshot of all digital sales and product keys anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download JSON Backup</span>
          </button>

          <label className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Restore JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Start completely fresh? This will clear all test/demo sales and start with clean production records.')) {
                resetToFresh();
              }
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:text-white transition-colors cursor-pointer w-full sm:w-auto"
          >
            ✨ Start Fresh (Clean Production Slate)
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to reset demo data?')) {
                resetToDefault();
              }
            }}
            className="py-2.5 px-4 text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Reset default templates
          </button>
        </div>
      </div>
    </div>
  );
}
