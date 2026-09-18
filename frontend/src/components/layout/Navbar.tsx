import React from 'react';
import { Sprout, Activity, Database, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';
import { HealthResponse } from '../../types/api';

interface NavbarProps {
  health: HealthResponse | null;
  isCheckingHealth: boolean;
  onOpenModelInfo: () => void;
  onOpenTechnicalDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  isCheckingHealth,
  onOpenModelInfo,
  onOpenTechnicalDrawer,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 border border-emerald-400/40">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">CropIQ</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
              Know your yield before harvest
            </p>
          </div>
        </div>

        {/* Navigation Anchors & Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live Backend Health Indicator */}
          <div className="flex items-center">
            {isCheckingHealth ? (
              <Badge variant="slate" size="sm">
                <Activity className="w-3 h-3 animate-spin text-slate-400" />
                <span className="hidden sm:inline">Connecting...</span>
              </Badge>
            ) : health?.model_loaded ? (
              <Badge variant="emerald" size="sm" className="bg-emerald-950/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Ready</span>
                
              </Badge>
            ) : (
              <Badge variant="amber" size="sm" className="bg-amber-950/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Having trouble connecting</span>
              </Badge>
            )}
          </div>

          {/* Model Card & Specs */}
          <button
            type="button"
            onClick={onOpenModelInfo}
            className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-750 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Model Specs</span>
          </button>

          {/* Audit / Technical Drawer Trigger */}
          {onOpenTechnicalDrawer && (
            <button
              type="button"
              onClick={onOpenTechnicalDrawer}
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-750 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Audit raw model predictions and backend responses"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Audit Data</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
