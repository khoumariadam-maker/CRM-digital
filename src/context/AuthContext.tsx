'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PartnerName } from '@/types/crm';

export interface PartnerAccount {
  name: PartnerName;
  pin: string;
  role: string;
  color: 'blue' | 'emerald';
}

export const PARTNER_ACCOUNTS: Record<PartnerName, PartnerAccount> = {
  Adem: {
    name: 'Adem',
    pin: '1234',
    role: 'Partner & Seller',
    color: 'blue',
  },
  Abdou: {
    name: 'Abdou',
    pin: '5678',
    role: 'Partner & Seller',
    color: 'emerald',
  },
};

interface AuthContextType {
  partner: PartnerName | null;
  isAuthenticated: boolean;
  loginWithPin: (pin: string) => { success: boolean; partner?: PartnerName; error?: string };
  verifyPin: (pin: string) => { success: boolean; partner?: PartnerName; error?: string };
  completeLogin: (partner: PartnerName) => void;
  logout: () => void;
  switchPartner: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<PartnerName | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_auth_partner') as PartnerName;
      if (saved === 'Adem' || saved === 'Abdou') {
        setPartner(saved);
      }
    } catch {
      // ignore
    } finally {
      setIsReady(true);
    }
  }, []);

  const verifyPin = (pin: string) => {
    const cleanPin = pin.trim();
    if (cleanPin === PARTNER_ACCOUNTS.Adem.pin) {
      return { success: true, partner: 'Adem' as PartnerName };
    }
    if (cleanPin === PARTNER_ACCOUNTS.Abdou.pin) {
      return { success: true, partner: 'Abdou' as PartnerName };
    }
    return { success: false, error: 'Incorrect 4-digit code. Please try again.' };
  };

  const completeLogin = (partnerName: PartnerName) => {
    setPartner(partnerName);
    try {
      localStorage.setItem('crm_auth_partner', partnerName);
    } catch {
      // ignore
    }
  };

  const loginWithPin = (pin: string) => {
    const res = verifyPin(pin);
    if (res.success && res.partner) {
      completeLogin(res.partner);
    }
    return res;
  };

  const logout = () => {
    setPartner(null);
    try {
      localStorage.removeItem('crm_auth_partner');
    } catch {
      // ignore
    }
  };

  const switchPartner = () => {
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        partner,
        isAuthenticated: isReady && !!partner,
        loginWithPin,
        verifyPin,
        completeLogin,
        logout,
        switchPartner,
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
