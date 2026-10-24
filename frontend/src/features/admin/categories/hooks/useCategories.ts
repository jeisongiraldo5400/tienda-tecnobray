'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '../services/categories.service';
import { formToCategoryPayload, type AdminCategory, type CategoryFormValues } from '../adapters/category.adapter';

export const categoryKeys = { all: ['admin', 'categories'] as const };

export function useAdminCategories() {
  return useQuery({ queryKey: categoryKeys.all, queryFn: categoriesService.list, staleTime: 60_000 });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation<AdminCategory, Error, { id?: string; values: CategoryFormValues; image?: File | null; removeImage?: boolean }>({
    mutationFn: async ({ id, values, image, removeImage }) => {
      const payload = formToCategoryPayload(values);
      let saved = id ? await categoriesService.update(id, payload) : await categoriesService.create(payload);
      if (image) saved = await categoriesService.uploadImage(saved.id, image);
      else if (removeImage && id) saved = await categoriesService.removeImage(saved.id);
      return saved;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => categoriesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
