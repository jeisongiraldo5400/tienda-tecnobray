'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formToBannerPayload, type AdminBanner, type BannerFormValues } from '../adapters/banner.adapter';
import { bannersService } from '../services/banners.service';

export const bannerKeys = { all: ['admin', 'banners'] as const };

export function useAdminBanners() {
  return useQuery({ queryKey: bannerKeys.all, queryFn: bannersService.list });
}

export function useSaveBanner() {
  const qc = useQueryClient();
  return useMutation<AdminBanner, Error, { id?: string; values: BannerFormValues; image?: File | null }>({
    mutationFn: async ({ id, values, image }) => {
      const payload = formToBannerPayload(values);
      let saved = id ? await bannersService.update(id, payload) : await bannersService.create(payload);
      if (image) saved = await bannersService.uploadImage(saved.id, image);
      return saved;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bannerKeys.all }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation<AdminBanner, Error, { id: string; data: Partial<ReturnType<typeof formToBannerPayload>> }>({
    mutationFn: ({ id, data }) => bannersService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bannerKeys.all }),
  });
}

export function useRemoveBannerImage() {
  const qc = useQueryClient();
  return useMutation<AdminBanner, Error, string>({
    mutationFn: (id) => bannersService.removeImage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bannerKeys.all }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => bannersService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bannerKeys.all }),
  });
}
