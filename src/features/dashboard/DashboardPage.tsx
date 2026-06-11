import { useAuthStore } from '../../store/authStore';
import DashboardCard from './components/DashboardCard';
import RecentActivity from './components/RecentActivity';
import QuickActions from './components/QuickActions';
import {
  mockMetrics,
  mockRecentActivity,
  mockQuickActions,
} from './data/mockData';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('es-DO', options);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user?.nombreEmpleado || 'Usuario'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{formatDate()}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            Sistema Activo
          </span>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          titulo="Facturas Hoy"
          valor={mockMetrics.facturasHoy}
          subtitulo={`${mockMetrics.facturasMes} este mes`}
          icono="document"
          color="blue"
          tendencia={{ valor: 12, positiva: true }}
        />
        <DashboardCard
          titulo="Clientes Activos"
          valor={mockMetrics.clientesActivos}
          subtitulo="Últimos 30 días"
          icono="user"
          color="green"
          tendencia={{ valor: 5, positiva: true }}
        />
        <DashboardCard
          titulo="Ingresos del Mes"
          valor={mockMetrics.ingresosMes}
          subtitulo="RD$ en facturas"
          icono="cash"
          color="purple"
          tendencia={{ valor: 8, positiva: true }}
        />
        <DashboardCard
          titulo="Pendientes de Cobro"
          valor={mockMetrics.pendientesCobro}
          subtitulo="Por vencer"
          icono="cash"
          color="yellow"
          tendencia={{ valor: 3, positiva: false }}
        />
      </div>

      {/* Acciones Rápidas */}
      <QuickActions actions={mockQuickActions} />

      {/* Estado DGII */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cumplimiento DGII
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Certificado Digital
              </p>
              <p className="text-sm text-green-700 font-semibold mt-1">
                Vigente
              </p>
            </div>
            <svg
              className="h-8 w-8 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Secuencia NCF
              </p>
              <p className="text-sm text-blue-700 font-semibold mt-1">
                F01-000001234
              </p>
            </div>
            <svg
              className="h-8 w-8 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Última Sincronización
              </p>
              <p className="text-sm text-purple-700 font-semibold mt-1">
                Hace 5 min
              </p>
            </div>
            <svg
              className="h-8 w-8 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <RecentActivity activities={mockRecentActivity} />
    </div>
  );
}