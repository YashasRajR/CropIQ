import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { DataAvailabilityItem } from '../../types/events';

interface WhatWeDontKnowPanelProps {
  cropName: string;
}

export const WhatWeDontKnowPanel: React.FC<WhatWeDontKnowPanelProps> = ({ cropName }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const dataItems: DataAvailabilityItem[] = [
    {
      category: 'Remote Sensing',
      label: 'Canopy Spectral Greenness (NDVI, GNDVI)',
      available: true,
      status: 'verified',
      source: 'Sentinel-2 Satellite (10m Resolution)',
      details: 'Measures multi-spectral light reflection to assess photosynthetic leaf density.',
    },
    {
      category: 'Soil & Climate',
      label: 'Soil Moisture & Ambient Temperature',
      available: true,
      status: 'verified',
      source: 'Sensor Grid & Surface Meteorological Observations',
      details: 'Calibrated volumetric moisture and 2m ambient air temperature.',
    },
    {
      category: 'Biological',
      label: 'Specific Pest Species & Economic Threshold Counts',
      available: false,
      status: 'unverified',
      source: 'Human Scouting (CV Model on Roadmap)',
      details: 'Pest sightings are logged by the farmer. CropIQ does not yet run automated image diagnosis.',
    },
    {
      category: 'Agronomic Soil',
      label: 'Subsoil Hardpan & Root Aeration Depth',
      available: false,
      status: 'unavailable',
      source: 'Requires Physical Shovel / Penetrometer Walk',
      details: 'Satellite indices see only top canopy, not subsurface compaction or hardpan impedance.',
    },
    {
      category: 'Physical Trauma',
      label: 'Hail Bruising & Stem Lacerations',
      available: false,
      status: 'unavailable',
      source: 'Requires Visual Ground Scouting Walk',
      details: 'Physical hail trauma cannot be determined from spectral indices alone until foliage reacts.',
    },
  ];

  return (
    <Card variant="bordered" className="p-5 sm:p-6 bg-slate-50/70 rounded-3xl border-slate-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0">
            <Shield className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              What CropIQ Does NOT Know Yet
            </h4>
            <p className="text-xs text-slate-500">
              Honest data availability matrix &bull; No fabricated confidence scores
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Data Matrix' : 'Inspect Information Matrix'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900 font-bold block mb-1">
          Why We Show What We Don&apos;t Know
        </strong>
        CropIQ combines machine learning, satellite data, and weather measurements for your{' '}
        <strong className="text-emerald-800">{cropName}</strong>. But remote sensors cannot replace
        your boots in the field. When physical trauma, pests, or root diseases strike, only ground-level
        inspections confirm field reality.
      </div>

      {isExpanded && (
        <div className="space-y-2.5 pt-2 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 gap-2">
            {dataItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {item.status === 'verified' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : item.status === 'unverified' ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-900">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6">{item.details}</p>
                </div>

                <div className="pl-6 sm:pl-0 shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                      item.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : item.status === 'unverified'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
