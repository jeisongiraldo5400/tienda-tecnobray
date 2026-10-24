import { ProductGridSkeleton } from '@/features/catalog/components/ProductGridSkeleton';
import { Container } from '@/shared/ui/Container';
import { Skeleton } from '@/shared/ui/Skeleton';

export default function Loading() {
  return (
    <Container className="space-y-6 py-8">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-64" />
      <ProductGridSkeleton />
    </Container>
  );
}
