'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminSettings } from '../adapters/admin-settings.adapter';
import { settingsService } from '../services/settings.service';

export const settingsKeys = { settings: ['admin', 'settings'] as const, pages: ['admin', 'pages'] as const };

export function useAdminSettings() {
  return useQuery({ queryKey: settingsKeys.settings, queryFn: settingsService.get });
}

export function useSettingsMutation<V>(fn: (v: V) => Promise<AdminSettings>) {
  const qc = useQueryClient();
  return useMutation<AdminSettings, Error, V>({
    mutationFn: fn,
    onSuccess: (s) => qc.setQueryData(settingsKeys.settings, s),
  });
}

export function useAdminPages() {
  return useQuery({ queryKey: settingsKeys.pages, queryFn: settingsService.pages });
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: { title: string; content: string } }) => settingsService.updatePage(slug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.pages }),
  });
}
