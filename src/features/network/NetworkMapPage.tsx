import { NetworkMapView } from './NetworkMapView';

export function NetworkMapPage() {
  return (
    <div className="h-[calc(100vh-64px)]">
      <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg px-4 py-3">
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">Mapa de Red</h2>
        <p className="text-xs text-gray-500">Vista interactiva de sedes y permisos</p>
      </div>
      <NetworkMapView embedded={false} />
    </div>
  );
}
