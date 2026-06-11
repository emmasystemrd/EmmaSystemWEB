import type { RecentActivity as ActivityType } from '../data/mockData'; // ✅ CAMBIO AQUÍ: import type

interface RecentActivityProps {
  activities: ActivityType[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getTipoIcono = (tipo: ActivityType['tipo']) => {
    switch (tipo) {
      case 'factura':
        return 'bg-blue-100 text-blue-600';
      case 'pago':
        return 'bg-green-100 text-green-600';
      case 'cliente':
        return 'bg-purple-100 text-purple-600';
      case 'ajuste':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // ✅ REMOVIDO: getTipoLabel no se usa en el JSX

  const formatDate = (fecha: string) => {
    const date = new Date(fecha);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-DO');
  };

  const formatMonto = (monto?: number) => {
    if (!monto) return null;
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(monto);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Actividad Reciente
      </h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-start space-x-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${getTipoIcono(
                  activity.tipo
                )}`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  {activity.tipo === 'factura' && (
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  )}
                  {activity.tipo === 'pago' && (
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  )}
                  {activity.tipo === 'cliente' && (
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  )}
                  {activity.tipo === 'ajuste' && (
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {activity.descripcion}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.usuario} • {formatDate(activity.fecha)}
                </p>
              </div>
            </div>
            {activity.monto && (
              <span className="text-sm font-semibold text-gray-900">
                {formatMonto(activity.monto)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}