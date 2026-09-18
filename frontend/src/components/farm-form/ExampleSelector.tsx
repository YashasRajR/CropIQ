import React from 'react';
import { MapPin, Check } from 'lucide-react';
import { EXAMPLE_FARM_PRESETS, ExampleFarmProfile } from '../../config/presets';
import { FarmInput } from '../../types/farm';

interface ExampleSelectorProps {
  onSelect: (input: FarmInput) => void;
  selectedCrop: string;
}

const CROP_ICONS: Record<string, string> = {
  Rice: '🌾',
  Bajra: '🌾',
  Jowar: '🌾',
  Soybean: '🌱',
  Sugarcane: '🎋',
};

export const ExampleSelector: React.FC<ExampleSelectorProps> = ({
  onSelect,
  selectedCrop,
}) => {
  return (
    <div className="mb-8 p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-base">🌾</span>
          <h3 className="text-sm font-bold text-emerald-950">
            Choose an Example Farm to Test
          </h3>
        </div>
        <span className="text-xs text-emerald-800 font-medium">
          Real verified field observations from research plots
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {EXAMPLE_FARM_PRESETS.map((p: ExampleFarmProfile) => {
          const isActive = selectedCrop.toLowerCase() === p.crop.toLowerCase();
          const icon = CROP_ICONS[p.crop] || '🌱';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.input)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm text-emerald-950'
                  : 'bg-white/80 border-slate-200 hover:border-emerald-300 hover:bg-white text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{icon}</span>
                  {isActive && (
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold mt-1 text-slate-900 truncate">
                  {p.crop}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{p.region}</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span>💧 {p.input.soil_moisture.toFixed(0)}%</span>
                <span>🌧️ {p.input.rainfall.toFixed(0)}mm</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
