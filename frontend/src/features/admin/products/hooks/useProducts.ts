'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminProduct, AdminProductImage, ProductPayload } from '../adapters/product.adapter';
import { productsService, type AdminProductFilters } from '../services/products.service';

export const productKeys = {
  all: ['admin', 'products'] as const,
  list: (f: AdminProductFilters) => ['admin', 'products', 'list', f] as const,
  detail: (id: string) => ['admin', 'products', 'detail', id] as const,
};

export function useAdminProducts(filters: AdminProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsService.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProduct(id: string) {
  return useQuery({ queryKey: productKeys.detail(id), queryFn: () => productsService.get(id) });
}

export function useSaveProduct(id?: string) {
  const qc = useQueryClient();
  return useMutation<AdminProduct, Error, ProductPayload>({
    mutationFn: (payload) => (id ? productsService.update(id, payload) : productsService.create(payload)),
    onSuccess: (product) => {
      qc.setQueryData(productKeys.detail(product.id), product);
      qc.invalidateQueries({ queryKey: [...productKeys.all, 'list'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => productsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useToggleProduct() {
  const qc = useQueryClient();
  return useMutation<AdminProduct, Error, { id: string; data: Partial<ProductPayload> }>({
    mutationFn: ({ id, data }) => productsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

/** Mutaciones de imágenes: todas devuelven la lista actualizada y la escriben en caché. */
export function useProductImages(productId: string) {
  const qc = useQueryClient();
  const setImages = (images: AdminProductImage[]) => {
    qc.setQueryData<AdminProduct>(productKeys.detail(productId), (prev) => (prev ? { ...prev, images } : prev));
    qc.invalidateQueries({ queryKey: [...productKeys.all, 'list'] });
  };
  return {
    upload: useMutation({ mutationFn: (files: File[]) => productsService.uploadImages(productId, files), onSuccess: setImages }),
    reorder: useMutation({ mutationFn: (ids: string[]) => productsService.reorderImages(productId, ids), onSuccess: setImages }),
    update: useMutation({
      mutationFn: ({ imageId, data }: { imageId: string; data: { alt?: string; isMain?: boolean } }) =>
        productsService.updateImage(productId, imageId, data),
      onSuccess: setImages,
    }),
    remove: useMutation({ mutationFn: (imageId: string) => productsService.removeImage(productId, imageId), onSuccess: setImages }),
  };
}
