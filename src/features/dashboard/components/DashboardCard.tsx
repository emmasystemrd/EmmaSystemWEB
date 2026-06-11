interface DashboardCardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icono?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  tendencia?: {
    valor: number;
    positiva: boolean;
  };
}

export default function DashboardCard({
  titulo,
  valor,
  subtitulo,
  icono,
  color = 'blue',
  tendencia,
}: DashboardCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-DO', {
      style: num >= 1000 ? 'currency' : 'decimal',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{titulo}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {typeof valor === 'number' ? formatNumber(valor) : valor}
          </p>
          {subtitulo && (
            <p className="mt-1 text-sm text-gray-500">{subtitulo}</p>
          )}
          {tendencia && (
            <div className="mt-2 flex items-center text-sm">
              <span
                className={
                  tendencia.positiva ? 'text-green-600' : 'text-red-600'
                }
              >
                {tendencia.positiva ? '↑' : '↓'} {Math.abs(tendencia.valor)}%
              </span>
              <span className="ml-2 text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        {icono && (
          <div className={`ml-4 ${iconColorClasses[color]}`}>
            <svg
              className="h-12 w-12 opacity-50"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {icono === 'document' && (
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              )}
              {icono === 'user' && (
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              )}
              {icono === 'cash' && (
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}