import React from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import { EXAMPLE_FARM_PRESETS, ExampleFarmProfile } from '../../config/presets';
import { FarmInput } from '../../types/farm';

interface ExampleSelectorProps {
  onSelect: (input: FarmInput) => void;
  selectedCrop: string;
}

export const ExampleSelector: React.FC<ExampleSelectorProps> = ({
  onSelect,
  selectedCrop,
}) => {
  return (
    <div className="mb-8 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-tight">
            1-Click Dataset Observation Presets:
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          Real records from Phase 1 processed data
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {EXAMPLE_FARM_PRESETS.map((p: ExampleFarmProfile) => {
          const isActive = selectedCrop === p.crop;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.input)}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/40 text-white'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <div>
                <div className="text-xs font-bold truncate">{p.crop}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{p.region}</span>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Moist: {p.input.soil_moisture.toFixed(1)}</span>
                <span>Rain: {p.input.rainfall.toFixed(1)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
