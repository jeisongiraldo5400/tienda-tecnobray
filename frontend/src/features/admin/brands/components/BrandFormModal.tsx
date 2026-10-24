'use client';

import { Form, Formik } from 'formik';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageInput } from '@/features/admin/shell/components/ImageInput';
import { getErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { SwitchField, TextField } from '@/shared/ui/FormikFields';
import { Modal } from '@/shared/ui/Modal';
import { brandSchema, type AdminBrand, type BrandFormValues } from '../adapters/brand.adapter';
import { useRemoveBrandLogo, useSaveBrand } from '../hooks/useBrands';
import { useConfirm } from '@/shared/ui/ConfirmDialog';

export function BrandFormModal({ open, onClose, brand }: { open: boolean; onClose: () => void; brand?: AdminBrand }) {
  const save = useSaveBrand();
  const removeLogo = useRemoveBrandLogo();
  const confirm = useConfirm();
  const [logo, setLogo] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState(brand?.logoUrl);
  return (
    <Modal open={open} onClose={onClose} title={brand ? 'Editar marca' : 'Nueva marca'}>
      <Formik<BrandFormValues>
        initialValues={{ name: brand?.name ?? '', slug: brand?.slug ?? '', active: brand?.active ?? true }}
        validationSchema={brandSchema}
        onSubmit={async (values) => {
          try {
            await save.mutateAsync({ id: brand?.id, values, logo });
            toast.success(brand ? 'Marca actualizada.' : 'Marca creada.');
            onClose();
          } catch (e) {
            toast.error(getErrorMessage(e));
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form noValidate className="space-y-3">
            <TextField name="name" label="Nombre" required />
            <TextField name="slug" label="Slug" hint="Opcional; se genera desde el nombre." />
            <SwitchField name="active" label="Activa" />
            <ImageInput
              label="Logo"
              currentUrl={currentLogo}
              file={logo}
              aspect="aspect-[3/1]"
              onFileChange={(f, err) => {
                if (err) toast.error(err);
                setLogo(f);
              }}
              onRemoveCurrent={
                brand && currentLogo
                  ? async () => {
                      if (!(await confirm({ title: '¿Quitar el logo de la marca?', message: 'La imagen se borrará del almacenamiento.', confirmText: 'Quitar' }))) return;
                      removeLogo.mutate(brand.id, {
                        onSuccess: () => {
                          setCurrentLogo(undefined);
                          toast.success('Logo eliminado.');
                        },
                        onError: (e) => toast.error(getErrorMessage(e)),
                      });
                    }
                  : undefined
              }
            />
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
