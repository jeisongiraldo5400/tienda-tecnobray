import { adminApi, apiRequest } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { toAdminCategories, toAdminCategory, type AdminCategory, formToCategoryPayload } from '../adapters/category.adapter';

type Payload = ReturnType<typeof formToCategoryPayload>;

export const categoriesService = {
  list: async (): Promise<AdminCategory[]> => toAdminCategories(await adminApi.get(endpoints.admin.categories)),
  create: async (p: Payload) => toAdminCategory(await adminApi.post(endpoints.admin.categories, p)),
  update: async (id: string, p: Partial<Payload>) => toAdminCategory(await adminApi.patch(endpoints.admin.category(id), p)),
  remove: (id: string) => adminApi.delete<void>(endpoints.admin.category(id)),
  uploadImage: async (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return toAdminCategory(await apiRequest(endpoints.admin.categoryImage(id), { method: 'POST', body: form, auth: true }));
  },
  removeImage: async (id: string) => toAdminCategory(await adminApi.delete(endpoints.admin.categoryImage(id))),
};
