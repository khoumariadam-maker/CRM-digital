'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { parseNumericInput } from '@/lib/calculations';
import {
  Settings,
  Flame,
  TrendingUp,
  Download,
  Upload,
  CheckCircle2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  CloudUpload,
  Landmark,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    cloudSyncStatus,
    cloudSyncError,
    lastSyncedAt,
    firebaseConfig,
    updateExchangeRate,
    syncAllDataToCloud,
    sales,
    products,
    expenses,
    dailyAdSpends,
    dailyCaisses,
    showToast,
    startingCapitalDzd,
    updateStartingCapital,
    openInitialSetup,
    resetBusinessSetup,
  } = useCRMData();
  const { exchangeRate, format } = useCurrency();
  const { logout } = useAuth();

  const [rateInput, setRateInput] = useState(exchangeRate.toString());
  const [capitalInput, setCapitalInput] = useState(startingCapitalDzd.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [capitalSuccess, setCapitalSuccess] = useState(false);
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

  const handleSaveCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNumericInput(capitalInput);
    if (val >= 0) {
      await updateStartingCapital(val);
      setCapitalSuccess(true);
      setTimeout(() => setCapitalSuccess(false), 2500);
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
      startingCapitalDzd,
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
    showToast('Backup téléchargé avec succès');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.sales && Array.isArray(data.sales)) {
          localStorage.setItem('crm_sales_v3', JSON.stringify(data.sales));
        }
        if (data.products && Array.isArray(data.products)) {
          localStorage.setItem('crm_products_v3', JSON.stringify(data.products));
        }
        if (data.startingCapitalDzd !== undefined) {
          localStorage.setItem('crm_starting_capital', String(data.startingCapitalDzd));
        }
        if (data.exchangeRate) {
          updateExchangeRate(Number(data.exchangeRate));
        }
        showToast('Sauvegarde restaurée ! Rechargement...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        alert('Fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-16 max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>PARAMÈTRES & SYNC CLOUD</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Configuration du Business</h1>
        <p className="text-xs text-slate-400">
          Capital initial BaridiMob, cours Square, base Firebase et sécurité par code PIN.
        </p>
      </div>

      {/* 1. Capital Initial BaridiMob */}
      <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20 space-y-4 bg-gradient-to-b from-emerald-950/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300 uppercase tracking-wide">
            <Landmark className="w-4 h-4 text-emerald-400" />
            <span>Capital Initial BaridiMob</span>
          </div>
          <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            {startingCapitalDzd.toLocaleString()} DA
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Le solde affiché en haut de l&apos;écran correspond au <strong>Capital Initial + Tous les Bénéfices Nets encaissés - Dépenses - Ads</strong>. Les paiements différés (crédits) ne sont comptabilisés que lorsqu&apos;ils sont confirmés.
        </p>

        <form onSubmit={handleSaveCapital} className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Solde Base :</span>
            <input
              type="number"
              inputMode="numeric"
              step="any"
              required
              value={capitalInput}
              onChange={(e) => setCapitalInput(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-28 pr-12 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">DA</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Mettre à jour le Capital</span>
          </button>
        </form>

        {capitalSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Capital BaridiMob synchronisé !</span>
          </div>
        )}

        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">Besoin de reconfigurer le produit ou de redéfinir les bases ?</span>
          <button
            type="button"
            onClick={openInitialSetup}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lancer l&apos;Assistant de Configuration</span>
          </button>
        </div>
      </div>

      {/* 2. Security & Unified Master PIN */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Accès Sécurisé par Code PIN Unique</span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
            Session Active
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Le CRM fonctionne sur un compte business unifié pour toute l&apos;équipe. Vous pouvez déverrouiller la caisse avec le code PIN master principal :
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black text-sm flex items-center justify-center">
              🔑
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Code PIN Master Business</span>
              <span className="text-[11px] text-slate-400">Accès caisse rapide & sécurisé</span>
            </div>
          </div>
          <code className="text-sm font-bold font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 tracking-widest">
            1234
          </code>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Verrouiller la session</span>
          </button>
        </div>
      </div>

      {/* 3. Centralized Shared Firebase Cloud Sync */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Synchronisation Cloud Firebase</span>
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
              ? 'Cloud Actif'
              : cloudSyncStatus === 'syncing'
              ? 'Connexion en cours...'
              : 'Mode Hors-Ligne'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Toutes les ventes, liens de stock et mouvements de caisse sont synchronisés en temps réel sur Google Cloud Firestore.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Base de Données :</span>
            <span className="font-mono text-emerald-400 font-bold">
              Google Firestore (Temps Réel)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Projet Firebase :</span>
            <span className="font-mono text-white font-semibold">
              {firebaseConfig.projectId || 'crm-digital-d9106'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">État du Réseau :</span>
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
                ? `En ligne (${lastSyncedAt || 'Actif'})`
                : cloudSyncStatus === 'syncing'
                ? 'Connexion à Firestore...'
                : 'Hors-ligne / Cache Local'}
            </span>
          </div>
        </div>

        {cloudSyncError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Remarque Cloud :</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              {cloudSyncError}
            </p>
          </div>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={handlePushCloud}
            disabled={isPushingCloud}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4 text-emerald-400" />
            <span>{isPushingCloud ? 'Synchronisation...' : 'Forcer la synchronisation vers le Cloud'}</span>
          </button>
        </div>
      </div>

      {/* 4. Parallel Market Rate */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Taux du Marché Parallèle (Square)</span>
        </div>
        <p className="text-xs text-slate-400">
          Utilisé pour calculer avec précision le coût d&apos;achat et les dépenses Meta Ads en Dinar algérien.
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
            Enregistrer le Taux
          </button>
        </form>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Taux de change enregistré !</span>
          </div>
        )}
      </div>

      {/* 5. Data Management & Backups */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="text-xs font-bold text-white">Gestion des Données & Sauvegardes</div>
        <p className="text-xs text-slate-400">
          Téléchargez un snapshot JSON complet de toutes vos ventes et liens de stock pour archivage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Télécharger la Sauvegarde JSON</span>
          </button>

          <label className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Restaurer une Sauvegarde JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              if (confirm('⚠️ ATTENTION : Cette action va effacer TOUTES les ventes, dépenses et caisses actuelles et relancer la configuration initiale. Cette action est irréversible. Continuer ?')) {
                resetBusinessSetup();
              }
            }}
            className="py-2.5 px-4 rounded-xl bg-red-950/30 hover:bg-red-950/60 border border-red-500/20 text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Réinitialiser & Nouveau Démarrage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
