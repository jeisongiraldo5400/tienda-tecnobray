'use client';

import { Form, Formik } from 'formik';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { SwitchField, TextAreaField, TextField } from '@/shared/ui/FormikFields';
import { Modal } from '@/shared/ui/Modal';
import { MAX_SECTION_PRODUCTS, sectionSchema, type AdminSection, type SectionFormValues } from '../adapters/section.adapter';
import { useSaveSection } from '../hooks/useSections';
import { ProductPicker } from './ProductPicker';

export function SectionFormModal({ open, onClose, section }: { open: boolean; onClose: () => void; section?: AdminSection }) {
  const save = useSaveSection();
  return (
    <Modal open={open} onClose={onClose} title={section ? 'Editar sección' : 'Nueva sección'} size="lg">
      <Formik<SectionFormValues>
        initialValues={{
          title: section?.title ?? '',
          subtitle: section?.subtitle ?? '',
          products: section?.products ?? [],
          sortOrder: section?.sortOrder ?? 0,
          active: section?.active ?? true,
        }}
        validationSchema={sectionSchema}
        onSubmit={async (values) => {
          try {
            await save.mutateAsync({ id: section?.id, values });
            toast.success(section ? 'Sección actualizada.' : 'Sección creada.');
            onClose();
          } catch (e) {
            toast.error(getErrorMessage(e));
          }
        }}
      >
        {({ isSubmitting, values, setFieldValue, errors, submitCount }) => (
          <Form noValidate className="space-y-3">
            <TextField name="title" label="Título" required placeholder="Lo más vendido en audio" />
            <TextAreaField name="subtitle" label="Subtítulo" rows={2} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Productos ({values.products.length}/{MAX_SECTION_PRODUCTS})
              </p>
              <ProductPicker value={values.products} onChange={(v) => setFieldValue('products', v)} />
              {submitCount > 0 && typeof errors.products === 'string' ? (
                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {errors.products}
                </p>
              ) : null}
            </div>
            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <TextField name="sortOrder" label="Orden" type="number" min={0} />
              <SwitchField name="active" label="Activa" hint="Visible en el inicio." className="sm:mt-7" />
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
