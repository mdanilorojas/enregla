import { useState } from 'react';
import { NetworkMapViewV2 } from './NetworkMapViewV2';
import { NetworkMapV3 } from './NetworkMapV3';

export function NetworkMapPage() {
  const [useV3, setUseV3] = useState(true);

  return (
    <div className="relative h-full">
      {/* Version toggle (top-right, temporary for testing) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-200">
        <span className="text-xs font-medium text-gray-600">Versión:</span>
        <button
          onClick={() => setUseV3(false)}
          className={`px-2 py-1 text-xs rounded ${
            !useV3
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          V2
        </button>
        <button
          onClick={() => setUseV3(true)}
          className={`px-2 py-1 text-xs rounded ${
            useV3
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          V3
        </button>
      </div>

      {/* Render selected version */}
      {useV3 ? <NetworkMapV3 /> : <NetworkMapViewV2 />}
    </div>
  );
}
