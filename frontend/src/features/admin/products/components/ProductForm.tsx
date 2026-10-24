'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Form, Formik, useFormikContext } from 'formik';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { sortAsTree } from '@/features/admin/categories/adapters/category.adapter';
import { useAdminCategories } from '@/features/admin/categories/hooks/useCategories';
import { useAdminBrands } from '@/features/admin/brands/hooks/useBrands';
import { ApiError, getErrorMessage } from '@/shared/api/errors';
import { discountPercent, formatCOP, slugify } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/shared/ui/Card';
import { SelectField, SwitchField, TextAreaField, TextField } from '@/shared/ui/FormikFields';
import {
  emptyProductForm,
  formToProductPayload,
  productToForm,
  type AdminProduct,
  type ProductFormValues,
} from '../adapters/product.adapter';
import { productSchema } from '../adapters/product.schema';
import { productKeys, useSaveProduct } from '../hooks/useProducts';
import { productsService } from '../services/products.service';
import { PendingImagesPicker } from './PendingImagesPicker';
import { ProductImagesManager } from './ProductImagesManager';
import { SpecsEditor } from './SpecsEditor';

function Section({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

function PricePreview() {
  const { values } = useFormikContext<ProductFormValues>();
  const price = Number(values.price) || 0;
  const compare = values.compareAtPrice === '' ? null : Number(values.compareAtPrice);
  const pct = discountPercent(price, compare);
  if (!price) return null;
  return (
    <p className="text-sm text-slate-600">
      Se mostrará como <strong>{formatCOP(price)}</strong>
      {pct > 0 ? (
        <>
          {' '}
          antes <s>{formatCOP(compare)}</s> (<span className="font-semibold text-accent">-{pct}%</span>)
        </>
      ) : null}
    </p>
  );
}

function SlugField() {
  const { values } = useFormikContext<ProductFormValues>();
  return (
    <TextField
      name="slug"
      label="Slug (URL)"
      placeholder={slugify(values.name) || 'se-genera-desde-el-nombre'}
      hint="Opcional. Si lo dejas vacío se genera desde el nombre."
    />
  );
}

function CharCount({ name, max }: { name: keyof ProductFormValues; max: number }) {
  const { values } = useFormikContext<ProductFormValues>();
  const len = String(values[name] ?? '').length;
  return (
    <span className={len > max ? 'text-red-600' : 'text-slate-400'}>
      {len}/{max}
    </span>
  );
}

/** Aplica errores de validación del backend (details) como error general legible. */
function backendMessage(error: unknown): string {
  if (error instanceof ApiError && error.details.length > 0) return error.details.join(' · ');
  return getErrorMessage(error, 'No se pudo guardar el producto.');
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const save = useSaveProduct(product?.id);
  const categories = useAdminCategories();
  const brands = useAdminBrands();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <Formik<ProductFormValues>
      initialValues={product ? productToForm(product) : emptyProductForm}
      validationSchema={productSchema}
      enableReinitialize={false}
      onSubmit={async (values, helpers) => {
        setFormError(null);
        try {
          const saved = await save.mutateAsync(formToProductPayload(values));
          if (!product) {
            if (pendingFiles.length > 0) {
              try {
                const images = await productsService.uploadImages(saved.id, pendingFiles);
                // useSaveProduct ya guardó en caché el producto sin imágenes: actualizarlo para que la
                // pantalla de edición muestre las recién subidas sin recargar.
                queryClient.setQueryData<AdminProduct>(productKeys.detail(saved.id), (prev) => (prev ? { ...prev, images } : prev));
                queryClient.invalidateQueries({ queryKey: [...productKeys.all, 'list'] });
              } catch (e) {
                toast.error(`Producto creado, pero falló la carga de imágenes: ${getErrorMessage(e)}`);
              }
            }
            toast.success('Producto creado.');
            router.replace(`/admin/productos/${saved.id}`);
          } else {
            toast.success('Cambios guardados.');
            helpers.resetForm({ values: productToForm(saved) });
          }
        } catch (e) {
          const msg = backendMessage(e);
          setFormError(msg);
          toast.error(msg);
        }
      }}
    >
      {({ isSubmitting, dirty }) => (
        <Form noValidate className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]" aria-label="Formulario de producto">
          <div className="space-y-6">
            <Section title="Información general">
              <TextField name="name" label="Nombre" required maxLength={200} />
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <TextField name="sku" label="SKU" required placeholder="TB-CEL-001" />
                <SlugField />
              </div>
              <TextAreaField name="shortDescription" label="Descripción corta" rows={2} hint={<CharCount name="shortDescription" max={500} />} />
              <TextAreaField
                name="description"
                label="Descripción completa"
                rows={10}
                hint="Admite Markdown: **negrita**, listas con “-”, títulos con “##”."
              />
            </Section>

            <Section title="Imágenes" description={product ? undefined : 'Puedes agregarlas ahora o después de crear el producto.'}>
              {product ? (
                <ProductImagesManager productId={product.id} images={product.images} />
              ) : (
                <PendingImagesPicker files={pendingFiles} onChange={setPendingFiles} />
              )}
            </Section>

            <Section title="Especificaciones técnicas">
              <SpecsEditor />
            </Section>

            <Section title="SEO" description="Cómo se verá el producto en Google y redes sociales.">
              <TextField name="seoTitle" label="Título SEO" maxLength={70} hint={<CharCount name="seoTitle" max={70} />} />
              <TextAreaField name="seoDescription" label="Descripción SEO" rows={3} maxLength={170} hint={<CharCount name="seoDescription" max={170} />} />
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Visibilidad">
              <SwitchField name="active" label="Activo" hint="Visible en la tienda." />
              <SwitchField name="featured" label="Destacado" hint="Aparece en la sección de destacados del inicio." />
            </Section>
            <Section title="Precio e inventario">
              <TextField name="price" label="Precio de venta (COP)" type="number" inputMode="numeric" min={0} step={1} required />
              <TextField name="compareAtPrice" label="Precio anterior (COP)" type="number" inputMode="numeric" min={0} step={1} hint="Opcional. Se muestra tachado." />
              <PricePreview />
              <TextField name="stock" label="Stock disponible" type="number" inputMode="numeric" min={0} step={1} required />
            </Section>
            <Section title="Organización">
              <SelectField name="categoryId" label="Categoría" disabled={categories.isPending}>
                <option value="">Sin categoría</option>
                {sortAsTree(categories.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.depth ? '— ' : ''}
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <SelectField name="brandId" label="Marca" disabled={brands.isPending}>
                <option value="">Sin marca</option>
                {(brands.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </SelectField>
            </Section>
            <div className="sticky bottom-[max(1rem,var(--safe-bottom))] z-10 space-y-2 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              {formError ? (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" size="lg" loading={isSubmitting} disabled={product ? !dirty : false}>
                {product ? 'Guardar cambios' : 'Crear producto'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push('/admin/productos')}>
                Volver al listado
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
