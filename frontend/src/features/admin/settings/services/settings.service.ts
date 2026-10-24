import { adminApi, apiRequest } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { formToSettingsPayload, toAdminPages, toAdminSettings, type AdminPolicyPage } from '../adapters/admin-settings.adapter';

async function upload(path: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return toAdminSettings(await apiRequest(path, { method: 'POST', body: form, auth: true }));
}

export const settingsService = {
  get: async () => toAdminSettings(await adminApi.get(endpoints.admin.settings)),
  update: async (payload: ReturnType<typeof formToSettingsPayload>) => toAdminSettings(await adminApi.patch(endpoints.admin.settings, payload)),
  uploadLogo: (file: File) => upload(endpoints.admin.settingsLogo, file),
  removeLogo: async () => toAdminSettings(await adminApi.delete(endpoints.admin.settingsLogo)),
  uploadFavicon: (file: File) => upload(endpoints.admin.settingsFavicon, file),
  removeFavicon: async () => toAdminSettings(await adminApi.delete(endpoints.admin.settingsFavicon)),
  pages: async (): Promise<AdminPolicyPage[]> => toAdminPages(await adminApi.get(endpoints.admin.pages)),
  updatePage: async (slug: string, data: { title: string; content: string }) => {
    const raw = await adminApi.patch(endpoints.admin.page(slug), data);
    return toAdminPages([raw])[0]!;
  },
};
