'use client';

import { Form, Formik } from 'formik';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageInput } from '@/features/admin/shell/components/ImageInput';
import { getErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { SwitchField, TextAreaField, TextField } from '@/shared/ui/FormikFields';
import { Modal } from '@/shared/ui/Modal';
import { bannerSchema, bannerToForm, type AdminBanner, type BannerFormValues } from '../adapters/banner.adapter';
import { useRemoveBannerImage, useSaveBanner } from '../hooks/useBanners';
import { useConfirm } from '@/shared/ui/ConfirmDialog';

export function BannerFormModal({ open, onClose, banner }: { open: boolean; onClose: () => void; banner?: AdminBanner }) {
  const save = useSaveBanner();
  const removeImage = useRemoveBannerImage();
  const confirm = useConfirm();
  const [image, setImage] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState(banner?.imageUrl);
  const [imageError, setImageError] = useState<string | null>(null);
  return (
    <Modal open={open} onClose={onClose} title={banner ? 'Editar banner' : 'Nuevo banner'} size="lg">
      <Formik<BannerFormValues>
        initialValues={bannerToForm(banner)}
        validationSchema={bannerSchema}
        onSubmit={async (values) => {
          if (!banner && !image) {
            setImageError('Selecciona una imagen para el banner.');
            return;
          }
          try {
            await save.mutateAsync({ id: banner?.id, values, image });
            toast.success(banner ? 'Banner actualizado.' : 'Banner creado.');
            onClose();
          } catch (e) {
            toast.error(getErrorMessage(e));
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form noValidate className="space-y-3">
            <ImageInput
              label="Imagen (recomendado 1920×720)"
              currentUrl={currentImage}
              file={image}
              onFileChange={(f, err) => {
                setImageError(err ?? null);
                setImage(f);
              }}
              onRemoveCurrent={
                banner && currentImage
                  ? async () => {
                      const ok = await confirm({
                        title: '¿Quitar la imagen del banner?',
                        message: 'Sin imagen el banner no se mostrará en la tienda hasta que subas otra.',
                        confirmText: 'Quitar',
                      });
                      if (!ok) return;
                      removeImage.mutate(banner.id, {
                        onSuccess: () => {
                          setCurrentImage(undefined);
                          toast.success('Imagen eliminada.');
                        },
                        onError: (e) => toast.error(getErrorMessage(e)),
                      });
                    }
                  : undefined
              }
              hint="JPG, PNG o WebP de hasta 5 MB."
            />
            {imageError ? (
              <p role="alert" className="text-xs font-medium text-red-600">
                {imageError}
              </p>
            ) : null}
            <TextField name="title" label="Título" required />
            <TextAreaField name="text" label="Texto" rows={2} />
            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <TextField name="linkUrl" label="Enlace" placeholder="/productos?categoria=celulares" />
              <TextField name="buttonText" label="Texto del botón" placeholder="Ver ofertas" />
            </div>
            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <TextField name="sortOrder" label="Orden" type="number" min={0} />
              <SwitchField name="active" label="Activo" hint="Se muestra en el slider del inicio." className="sm:mt-7" />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Guardar
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
