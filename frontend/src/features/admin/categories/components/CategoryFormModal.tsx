'use client';

import { Form, Formik } from 'formik';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageInput } from '@/features/admin/shell/components/ImageInput';
import { getErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { SelectField, SwitchField, TextAreaField, TextField } from '@/shared/ui/FormikFields';
import { Modal } from '@/shared/ui/Modal';
import { categorySchema, categoryToForm, type AdminCategory, type CategoryFormValues } from '../adapters/category.adapter';
import { useSaveCategory } from '../hooks/useCategories';
import { useConfirm } from '@/shared/ui/ConfirmDialog';

export function CategoryFormModal({
  open,
  onClose,
  category,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  category?: AdminCategory;
  categories: AdminCategory[];
}) {
  const save = useSaveCategory();
  const confirm = useConfirm();
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  // Solo un nivel de anidación: el padre debe ser raíz y distinto de sí misma.
  const parents = categories.filter((c) => !c.parentId && c.id !== category?.id);
  const hasChildren = !!category && categories.some((c) => c.parentId === category.id);

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Editar categoría' : 'Nueva categoría'} size="lg">
      <Formik<CategoryFormValues>
        initialValues={categoryToForm(category)}
        validationSchema={categorySchema}
        onSubmit={async (values) => {
          try {
            await save.mutateAsync({ id: category?.id, values, image, removeImage });
            toast.success(category ? 'Categoría actualizada.' : 'Categoría creada.');
            onClose();
          } catch (e) {
            toast.error(getErrorMessage(e));
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form noValidate className="space-y-3">
            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <TextField name="name" label="Nombre" required />
              <TextField name="slug" label="Slug" hint="Opcional; se genera desde el nombre." />
            </div>
            <TextAreaField name="description" label="Descripción" rows={3} />
            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <SelectField name="parentId" label="Categoría padre" disabled={hasChildren} hint={hasChildren ? 'Tiene subcategorías; no puede tener padre.' : undefined}>
                <option value="">Ninguna (principal)</option>
                {parents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <TextField name="sortOrder" label="Orden" type="number" min={0} />
            </div>
            <SwitchField name="active" label="Activa" hint="Visible en la tienda." />
            <ImageInput
              label="Imagen"
              currentUrl={removeImage ? null : category?.imageUrl}
              file={image}
              aspect="aspect-square"
              onFileChange={(f, err) => {
                if (err) toast.error(err);
                setImage(f);
                if (f) setRemoveImage(false);
              }}
              onRemoveCurrent={
                category?.imageUrl
                  ? async () => {
                      if (await confirm({ title: '¿Quitar la imagen de la categoría?', message: 'Se eliminará al guardar.', confirmText: 'Quitar' })) setRemoveImage(true);
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
