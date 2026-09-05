'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency } from '@/types/crm';
import { INITIAL_EXCHANGE_RATE } from '@/lib/mockData';
import { formatMoney, convertUsdToDzd, convertDzdToUsd } from '@/lib/calculations';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggleCurrency: () => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  format: (amountDzd: number, amountUsd?: number) => string;
  toCurrentValue: (amountDzd: number, amountUsd?: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('DZD');
  const [exchangeRate, setExchangeRateState] = useState<number>(INITIAL_EXCHANGE_RATE);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('crm_currency') as Currency;
    if (savedCurrency === 'DZD' || savedCurrency === 'USD') {
      setCurrencyState(savedCurrency);
    }
    const savedRate = localStorage.getItem('crm_exchange_rate');
    if (savedRate && !isNaN(Number(savedRate))) {
      setExchangeRateState(Number(savedRate));
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('crm_currency', c);
  };

  const toggleCurrency = () => {
    const next = currency === 'DZD' ? 'USD' : 'DZD';
    setCurrency(next);
  };

  const setExchangeRate = (rate: number) => {
    if (rate > 0) {
      setExchangeRateState(rate);
      localStorage.setItem('crm_exchange_rate', rate.toString());
    }
  };

  const toCurrentValue = (amountDzd: number, amountUsd?: number): number => {
    if (currency === 'DZD') {
      if (amountDzd !== undefined && !isNaN(amountDzd)) return amountDzd;
      return amountUsd ? convertUsdToDzd(amountUsd, exchangeRate) : 0;
    } else {
      if (amountUsd !== undefined && !isNaN(amountUsd)) return amountUsd;
      return amountDzd ? convertDzdToUsd(amountDzd, exchangeRate) : 0;
    }
  };

  const format = (amountDzd: number, amountUsd?: number): string => {
    const val = toCurrentValue(amountDzd, amountUsd);
    return formatMoney(val, currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        exchangeRate,
        setExchangeRate,
        format,
        toCurrentValue,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
