import { Link } from 'react-router-dom';
import type { QuickAction } from '../data/mockData'; // ✅ CAMBIO AQUÍ: import type

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const getColorClasses = (color: string) => {
    const classes: Record<string, string> = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      purple: 'bg-purple-600 hover:bg-purple-700',
      orange: 'bg-orange-600 hover:bg-orange-700',
    };
    return classes[color] || classes.blue;
  };

  const getIcono = (icono: string) => {
    switch (icono) {
      case 'document':
        return (
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        );
      case 'user':
        return (
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        );
      case 'chart':
        return (
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        );
      case 'cash':
        return (
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.id}
          to={action.ruta}
          className={`rounded-lg p-6 text-white transition-all duration-200 shadow-sm hover:shadow-md ${getColorClasses(
            action.color
          )}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Acceso Rápido</p>
              <p className="mt-1 text-lg font-semibold">{action.titulo}</p>
            </div>
            <svg className="h-8 w-8 opacity-75" fill="currentColor" viewBox="0 0 20 20">
              {getIcono(action.icono)}
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}