import { adminApi } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { formToSectionPayload, toAdminSection, toAdminSections, type AdminSection } from '../adapters/section.adapter';

type Payload = ReturnType<typeof formToSectionPayload>;

export const sectionsService = {
  list: async (): Promise<AdminSection[]> => toAdminSections(await adminApi.get(endpoints.admin.sections)),
  create: async (p: Payload) => toAdminSection(await adminApi.post(endpoints.admin.sections, p)),
  update: async (id: string, p: Partial<Payload>) => toAdminSection(await adminApi.patch(endpoints.admin.section(id), p)),
  remove: (id: string) => adminApi.delete<void>(endpoints.admin.section(id)),
};
