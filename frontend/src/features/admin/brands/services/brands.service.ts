import { adminApi, apiRequest } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { formToBrandPayload, toAdminBrand, toAdminBrands, type AdminBrand } from '../adapters/brand.adapter';

type Payload = ReturnType<typeof formToBrandPayload>;

export const brandsService = {
  list: async (): Promise<AdminBrand[]> => toAdminBrands(await adminApi.get(endpoints.admin.brands)),
  create: async (p: Payload) => toAdminBrand(await adminApi.post(endpoints.admin.brands, p)),
  update: async (id: string, p: Partial<Payload>) => toAdminBrand(await adminApi.patch(endpoints.admin.brand(id), p)),
  remove: (id: string) => adminApi.delete<void>(endpoints.admin.brand(id)),
  uploadLogo: async (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return toAdminBrand(await apiRequest(endpoints.admin.brandLogo(id), { method: 'POST', body: form, auth: true }));
  },
  removeLogo: async (id: string) => toAdminBrand(await adminApi.delete(endpoints.admin.brandLogo(id))),
};
