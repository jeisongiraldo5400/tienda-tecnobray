import { adminApi, apiRequest } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { formToBannerPayload, toAdminBanner, toAdminBanners, type AdminBanner } from '../adapters/banner.adapter';

type Payload = ReturnType<typeof formToBannerPayload>;

export const bannersService = {
  list: async (): Promise<AdminBanner[]> => toAdminBanners(await adminApi.get(endpoints.admin.banners)),
  create: async (p: Payload) => toAdminBanner(await adminApi.post(endpoints.admin.banners, p)),
  update: async (id: string, p: Partial<Payload>) => toAdminBanner(await adminApi.patch(endpoints.admin.banner(id), p)),
  remove: (id: string) => adminApi.delete<void>(endpoints.admin.banner(id)),
  uploadImage: async (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return toAdminBanner(await apiRequest(endpoints.admin.bannerImage(id), { method: 'POST', body: form, auth: true }));
  },
  removeImage: async (id: string) => toAdminBanner(await adminApi.delete(endpoints.admin.bannerImage(id))),
};
