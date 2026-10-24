'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formToBrandPayload, type AdminBrand, type BrandFormValues } from '../adapters/brand.adapter';
import { brandsService } from '../services/brands.service';

export const brandKeys = { all: ['admin', 'brands'] as const };

export function useAdminBrands() {
  return useQuery({ queryKey: brandKeys.all, queryFn: brandsService.list, staleTime: 60_000 });
}

export function useSaveBrand() {
  const qc = useQueryClient();
  return useMutation<AdminBrand, Error, { id?: string; values: BrandFormValues; logo?: File | null }>({
    mutationFn: async ({ id, values, logo }) => {
      const payload = formToBrandPayload(values);
      let saved = id ? await brandsService.update(id, payload) : await brandsService.create(payload);
      if (logo) saved = await brandsService.uploadLogo(saved.id, logo);
      return saved;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: brandKeys.all }),
  });
}

export function useRemoveBrandLogo() {
  const qc = useQueryClient();
  return useMutation<AdminBrand, Error, string>({
    mutationFn: (id) => brandsService.removeLogo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: brandKeys.all }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => brandsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: brandKeys.all }),
  });
}
