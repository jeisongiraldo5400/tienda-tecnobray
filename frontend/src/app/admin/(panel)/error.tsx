'use client';

import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/States';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-4">
      <ErrorState title="Ocurrió un error en el panel" description={error.digest ? `Código: ${error.digest}` : error.message} />
      <div className="text-center">
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
