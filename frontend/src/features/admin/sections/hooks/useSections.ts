'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formToSectionPayload, type AdminSection, type SectionFormValues } from '../adapters/section.adapter';
import { sectionsService } from '../services/sections.service';

const key = ['admin', 'sections'] as const;

export function useAdminSections() {
  return useQuery({ queryKey: key, queryFn: sectionsService.list });
}

export function useSaveSection() {
  const qc = useQueryClient();
  return useMutation<AdminSection, Error, { id?: string; values: SectionFormValues }>({
    mutationFn: ({ id, values }) => {
      const payload = formToSectionPayload(values);
      return id ? sectionsService.update(id, payload) : sectionsService.create(payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => sectionsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
