'use client';

import { useField } from 'formik';
import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Field } from './Field';
import { Input, Select, Textarea } from './Input';
import { Switch } from './Switch';

interface BaseProps {
  name: string;
  label: string;
  hint?: ReactNode;
  className?: string;
}

function useFieldState(name: string) {
  const [field, meta, helpers] = useField(name);
  const error = meta.touched && meta.error ? meta.error : undefined;
  return { field, meta, helpers, error };
}

export function TextField({
  name,
  label,
  hint,
  className,
  required,
  ...rest
}: BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const { field, error } = useFieldState(name);
  const id = rest.id ?? `f-${name}`;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <Input
        id={id}
        {...field}
        value={field.value ?? ''}
        invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  className,
  required,
  ...rest
}: BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>) {
  const { field, error } = useFieldState(name);
  const id = rest.id ?? `f-${name}`;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <Textarea
        id={id}
        {...field}
        value={field.value ?? ''}
        invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  hint,
  className,
  required,
  children,
  ...rest
}: BaseProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'>) {
  const { field, error } = useFieldState(name);
  const id = rest.id ?? `f-${name}`;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <Select id={id} {...field} value={field.value ?? ''} invalid={!!error} {...rest}>
        {children}
      </Select>
    </Field>
  );
}

export function SwitchField({ name, label, hint, className }: BaseProps) {
  const { field, helpers } = useFieldState(name);
  return (
    <Switch
      id={`f-${name}`}
      checked={!!field.value}
      onChange={(v) => helpers.setValue(v)}
      label={label}
      description={hint}
      className={className}
    />
  );
}
