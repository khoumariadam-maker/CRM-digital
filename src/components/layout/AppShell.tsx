'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CRMDataProvider, useCRMData } from '@/context/CRMDataContext';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import FastSaleModal from '@/components/modals/FastSaleModal';
import CreateProductModal from '@/components/modals/CreateProductModal';
import PinLoginScreen from '@/components/auth/PinLoginScreen';
import { CheckCircle2, Sparkles } from 'lucide-react';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const {
    isSaleModalOpen,
    closeSaleModal,
    isProductModalOpen,
    closeProductModal,
    toastMessage,
  } = useCRMData();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 animate-pulse flex items-center justify-center font-black text-white text-xs">
            DZ
          </div>
          <span className="text-xs text-slate-400 font-medium">Loading DzDigital CRM...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLoginScreen />;
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F17] text-slate-100 relative">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main App Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-6">
        <TopHeader />

        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (visible on mobile, hidden on lg) */}
      <MobileNav />

      {/* Global Modals (Single instance driven by context) */}
      <FastSaleModal
        isOpen={isSaleModalOpen}
        onClose={closeSaleModal}
      />
      <CreateProductModal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-fade-in">
          <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-white shadow-2xl shadow-emerald-500/20 flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CRMDataProvider>
          <AppShellInner>{children}</AppShellInner>
        </CRMDataProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
