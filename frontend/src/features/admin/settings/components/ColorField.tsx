'use client';

import { useField } from 'formik';
import { Field } from '@/shared/ui/Field';
import { Input } from '@/shared/ui/Input';

export function ColorField({ name, label, disabled }: { name: string; label: string; disabled?: boolean }) {
  const [field, meta, helpers] = useField<string>(name);
  const error = meta.touched && meta.error ? meta.error : undefined;
  return (
    <Field id={`f-${name}`} label={label} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (selector)`}
          value={/^#[0-9a-fA-F]{6}$/.test(field.value) ? field.value : '#000000'}
          onChange={(e) => helpers.setValue(e.target.value)}
          disabled={disabled}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 md:h-10"
        />
        <Input id={`f-${name}`} {...field} invalid={!!error} disabled={disabled} className="font-mono uppercase" maxLength={7} />
      </div>
    </Field>
  );
}
