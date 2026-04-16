import { NetworkMapView } from './NetworkMapView';
import { NetworkMapViewV2 } from '@/features-v2/network/NetworkMapViewV2';
import { UI_VERSION } from '@/config';

export function NetworkMapPage() {
  return (
    <div className="fixed inset-0 left-[256px] top-[64px]">
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg px-4 py-3">
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">Mapa de Red</h2>
        <p className="text-xs text-gray-500">Vista interactiva de sedes y permisos</p>
      </div>
      {UI_VERSION === 'v2' ? (
        <NetworkMapViewV2 embedded={false} />
      ) : (
        <NetworkMapView embedded={false} />
      )}
    </div>
  );
}
