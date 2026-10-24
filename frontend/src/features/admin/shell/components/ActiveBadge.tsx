import { Badge } from '@/shared/ui/Badge';

export function ActiveBadge({ active, on = 'Activo', off = 'Inactivo' }: { active: boolean; on?: string; off?: string }) {
  return <Badge tone={active ? 'success' : 'neutral'}>{active ? on : off}</Badge>;
}
