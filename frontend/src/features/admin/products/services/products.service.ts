import { adminApi, apiRequest } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { toQueryString, type QueryValue } from '@/shared/lib/query-string';
import type { Paginated } from '@/shared/types/domain';
import {
  toAdminProduct,
  toAdminProductImages,
  toAdminProductsPage,
  type AdminProduct,
  type AdminProductImage,
  type ProductPayload,
} from '../adapters/product.adapter';

export interface AdminProductFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: string;
  brandId?: string;
  active?: boolean;
  featured?: boolean;
  lowStock?: boolean;
  sort?: string;
}

export const productsService = {
  async list(filters: AdminProductFilters): Promise<Paginated<AdminProduct>> {
    const raw = await adminApi.get(`${endpoints.admin.products}${toQueryString(filters as Record<string, QueryValue>)}`);
    return toAdminProductsPage(raw);
  },
  async get(id: string): Promise<AdminProduct> {
    return toAdminProduct(await adminApi.get(endpoints.admin.product(id)));
  },
  async create(payload: ProductPayload): Promise<AdminProduct> {
    return toAdminProduct(await adminApi.post(endpoints.admin.products, payload));
  },
  async update(id: string, payload: Partial<ProductPayload>): Promise<AdminProduct> {
    return toAdminProduct(await adminApi.patch(endpoints.admin.product(id), payload));
  },
  async remove(id: string): Promise<void> {
    await adminApi.delete(endpoints.admin.product(id));
  },
  async uploadImages(id: string, files: File[]): Promise<AdminProductImage[]> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const raw = await apiRequest(endpoints.admin.productImages(id), { method: 'POST', body: form, auth: true });
    return toAdminProductImages(raw);
  },
  async reorderImages(id: string, imageIds: string[]): Promise<AdminProductImage[]> {
    return toAdminProductImages(await adminApi.patch(endpoints.admin.productImagesOrder(id), { imageIds }));
  },
  async updateImage(id: string, imageId: string, data: { alt?: string; isMain?: boolean }): Promise<AdminProductImage[]> {
    return toAdminProductImages(await adminApi.patch(endpoints.admin.productImage(id, imageId), data));
  },
  async removeImage(id: string, imageId: string): Promise<AdminProductImage[]> {
    return toAdminProductImages(await adminApi.delete(endpoints.admin.productImage(id, imageId)));
  },
};
