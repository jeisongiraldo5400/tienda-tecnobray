'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getErrorMessage } from '@/shared/api/errors';
import { ErrorState, LoadingState } from '@/shared/ui/States';

/** Renderiza carga / error / contenido para una consulta de TanStack Query. */
export function QueryStates<T>({
  query,
  children,
  loadingLabel,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  loadingLabel?: string;
}) {
  if (query.isPending) return <LoadingState label={loadingLabel} />;
  if (query.isError) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  return <>{children(query.data)}</>;
}
