'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { StoreSettings } from '@/shared/types/domain';
import { DEFAULT_SETTINGS } from '../adapters/settings.adapter';

const StoreSettingsContext = createContext<StoreSettings>(DEFAULT_SETTINGS);

export function StoreSettingsProvider({ value, children }: { value: StoreSettings; children: ReactNode }) {
  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}
