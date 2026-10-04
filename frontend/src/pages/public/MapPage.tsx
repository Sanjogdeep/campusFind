import React from 'react';
import { CampusMapVisualizer } from '../../components/map/CampusMapVisualizer';

export const MapPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Lost & Found Zone Map
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore campus report clusters and designated safe public meeting points for item handovers.
        </p>
      </div>

      <CampusMapVisualizer />
    </div>
  );
};
