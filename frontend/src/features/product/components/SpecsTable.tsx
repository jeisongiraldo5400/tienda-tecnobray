import type { ProductSpec } from '@/shared/types/domain';

export function SpecsTable({ specs }: { specs: ProductSpec[] }) {
  if (specs.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-sm">
        <caption className="sr-only">Especificaciones técnicas</caption>
        <tbody>
          {specs.map((s, i) => (
            <tr key={`${s.key}-${i}`} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
              <th scope="row" className="w-2/5 px-4 py-3 text-left font-medium text-slate-600">
                {s.key}
              </th>
              <td className="px-4 py-3 text-slate-900">{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
