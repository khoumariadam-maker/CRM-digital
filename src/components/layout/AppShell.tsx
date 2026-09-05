'use client';

import React, { useState } from 'react';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CRMDataProvider } from '@/context/CRMDataContext';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import FastSaleModal from '@/components/modals/FastSaleModal';
import CreateProductModal from '@/components/modals/CreateProductModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  return (
    <CurrencyProvider>
      <CRMDataProvider>
        <div className="flex min-h-screen bg-[#0B0F17] text-slate-100">
          {/* Desktop Sidebar (hidden on mobile) */}
          <Sidebar />

          {/* Main App Content */}
          <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-6">
            <TopHeader
              onOpenAddSale={() => setIsSaleModalOpen(true)}
              onOpenNewProduct={() => setIsProductModalOpen(true)}
            />

            <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>

          {/* Mobile Bottom Navigation (visible on mobile, hidden on lg) */}
          <MobileNav onOpenAddSale={() => setIsSaleModalOpen(true)} />
        </div>

        {/* Global Modals */}
        <FastSaleModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
        />
        <CreateProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
        />
      </CRMDataProvider>
    </CurrencyProvider>
  );
}
