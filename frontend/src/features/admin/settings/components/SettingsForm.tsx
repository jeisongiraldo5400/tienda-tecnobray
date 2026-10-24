'use client';

import { Form, Formik } from 'formik';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { ApiError, getErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/shared/ui/Card';
import { TextAreaField, TextField } from '@/shared/ui/FormikFields';
import {
  formToSettingsPayload,
  settingsSchema,
  settingsToForm,
  SOCIAL_KEYS,
  SOCIAL_LABELS,
  type AdminSettings,
  type SettingsFormValues,
} from '../adapters/admin-settings.adapter';
import { useSettingsMutation } from '../hooks/useSettings';
import { settingsService } from '../services/settings.service';
import { ColorField } from './ColorField';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

export function SettingsForm({ settings, canEdit }: { settings: AdminSettings; canEdit: boolean }) {
  const save = useSettingsMutation(settingsService.update);
  return (
    <Formik<SettingsFormValues>
      initialValues={settingsToForm(settings)}
      validationSchema={settingsSchema}
      onSubmit={async (values, helpers) => {
        try {
          const saved = await save.mutateAsync(formToSettingsPayload(values));
          helpers.resetForm({ values: settingsToForm(saved) });
          toast.success('Configuración guardada. La tienda se actualizará en unos segundos.');
        } catch (e) {
          toast.error(e instanceof ApiError && e.details.length ? e.details.join(' · ') : getErrorMessage(e));
        }
      }}
    >
      {({ isSubmitting, dirty }) => (
        <Form noValidate className="space-y-6">
          <fieldset disabled={!canEdit} className="space-y-6">
            <Section title="Identidad">
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <TextField name="storeName" label="Nombre de la tienda" required />
                <TextField name="tagline" label="Eslogan" />
              </div>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-3">
                <ColorField name="primaryColor" label="Color principal" disabled={!canEdit} />
                <ColorField name="secondaryColor" label="Color secundario" disabled={!canEdit} />
                <ColorField name="accentColor" label="Color de acento" disabled={!canEdit} />
              </div>
              <p className="text-xs text-slate-500">El acento se usa en “Comprar ahora”, descuentos y el contador del carrito.</p>
              <TextField
                name="announcement"
                label="Barra de anuncio"
                maxLength={200}
                placeholder="Envío gratis en Medellín por compras desde $ 200.000"
                hint="Se muestra arriba del encabezado. Déjalo vacío para ocultarla."
              />
            </Section>
            <Section title="SEO del inicio">
              <TextField name="seoTitle" label="Título SEO" maxLength={70} hint="Máx. 70 caracteres. Vacío = título por defecto." />
              <TextAreaField name="seoDescription" label="Descripción SEO" rows={2} maxLength={170} hint="Máx. 170 caracteres. Se usa en Google y al compartir en redes." />
            </Section>
            <Section title="Contacto">
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <TextField name="whatsapp" label="WhatsApp" inputMode="tel" placeholder="573001234567" hint="Con indicativo del país, solo dígitos." />
                <TextField name="phone" label="Teléfono" />
                <TextField name="email" label="Correo" type="email" />
                <TextField name="address" label="Dirección" />
              </div>
            </Section>
            <Section title="Redes sociales">
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {SOCIAL_KEYS.map((k) => (
                  <TextField key={k} name={`social.${k}`} label={SOCIAL_LABELS[k]} placeholder="https://" />
                ))}
              </div>
            </Section>
            <Section title="Envíos e inventario">
              <TextAreaField name="shippingInfo" label="Información de envíos" rows={4} hint="La primera línea se muestra en la barra superior de la tienda." />
              <TextField name="lowStockThreshold" label="Umbral de stock bajo" type="number" min={0} className="sm:max-w-xs" />
            </Section>
          </fieldset>
          {canEdit ? (
            <div className="sticky bottom-[max(1rem,var(--safe-bottom))] z-10 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
              <Button type="submit" size="lg" className="max-sm:w-full" loading={isSubmitting} disabled={!dirty}>
                Guardar configuración
              </Button>
            </div>
          ) : null}
        </Form>
      )}
    </Formik>
  );
}
