'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ImageInput } from '@/features/admin/shell/components/ImageInput';
import { getErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { useConfirm } from '@/shared/ui/ConfirmDialog';
import type { AdminSettings } from '../adapters/admin-settings.adapter';
import { useSettingsMutation } from '../hooks/useSettings';
import { settingsService } from '../services/settings.service';

/** Logo y favicon: se suben de inmediato (endpoints propios). */
export function BrandingImages({ settings, canEdit }: { settings: AdminSettings; canEdit: boolean }) {
  const [logo, setLogo] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);
  const uploadLogo = useSettingsMutation(settingsService.uploadLogo);
  const removeLogo = useSettingsMutation(() => settingsService.removeLogo());
  const uploadFavicon = useSettingsMutation(settingsService.uploadFavicon);
  const removeFavicon = useSettingsMutation(() => settingsService.removeFavicon());
  const confirm = useConfirm();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <ImageInput
          label="Logo"
          currentUrl={settings.logoUrl}
          file={logo}
          aspect="aspect-[3/1]"
          hint="PNG o WebP con fondo transparente, ideal 512 px de ancho."
          onFileChange={(f, err) => {
            if (err) toast.error(err);
            setLogo(f);
          }}
          onRemoveCurrent={
            canEdit && settings.logoUrl
              ? async () => {
                  if (await confirm({ title: '¿Quitar el logo?', message: 'La tienda mostrará el nombre en su lugar.', confirmText: 'Quitar' })) {
                    removeLogo.mutate(undefined, { onSuccess: () => toast.success('Logo eliminado.'), onError: (e) => toast.error(getErrorMessage(e)) });
                  }
                }
              : undefined
          }
        />
        {logo && canEdit ? (
          <Button
            size="sm"
            loading={uploadLogo.isPending}
            onClick={() =>
              uploadLogo.mutate(logo, {
                onSuccess: () => {
                  setLogo(null);
                  toast.success('Logo actualizado.');
                },
                onError: (e) => toast.error(getErrorMessage(e)),
              })
            }
          >
            Subir logo
          </Button>
        ) : null}
      </div>
      <div className="space-y-2">
        <ImageInput
          label="Favicon"
          currentUrl={settings.faviconUrl}
          file={favicon}
          aspect="aspect-square max-w-[8rem]"
          hint="Imagen cuadrada (mín. 180×180)."
          onFileChange={(f, err) => {
            if (err) toast.error(err);
            setFavicon(f);
          }}
          onRemoveCurrent={
            canEdit && settings.faviconUrl
              ? async () => {
                  if (await confirm({ title: '¿Quitar el favicon?', message: 'Se usará el ícono por defecto.', confirmText: 'Quitar' })) {
                    removeFavicon.mutate(undefined, { onSuccess: () => toast.success('Favicon eliminado.'), onError: (e) => toast.error(getErrorMessage(e)) });
                  }
                }
              : undefined
          }
        />
        {favicon && canEdit ? (
          <Button
            size="sm"
            loading={uploadFavicon.isPending}
            onClick={() =>
              uploadFavicon.mutate(favicon, {
                onSuccess: () => {
                  setFavicon(null);
                  toast.success('Favicon actualizado.');
                },
                onError: (e) => toast.error(getErrorMessage(e)),
              })
            }
          >
            Subir favicon
          </Button>
        ) : null}
      </div>
    </div>
  );
}
