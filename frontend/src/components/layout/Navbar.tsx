import React from 'react';
import { Sprout, Activity, SlidersHorizontal, FileText } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-900/10">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-emerald-950 tracking-tight">CropIQ</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 rounded-md border border-emerald-200">
                Farm Assistant
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">
              Know your crop. Plan your next step.
            </p>
          </div>
        </div>

        {/* Navigation Anchors & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Backend Health Indicator */}
          <div className="flex items-center">
            {isCheckingHealth ? (
              <Badge variant="slate" size="sm">
                <Activity className="w-3 h-3 animate-spin text-slate-500" />
                <span className="hidden sm:inline">Connecting...</span>
              </Badge>
            ) : health?.model_loaded ? (
              <Badge variant="emerald" size="sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>System Online</span>
              </Badge>
            ) : (
              <Badge variant="amber" size="sm">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Offline</span>
              </Badge>
            )}
          </div>

          {/* Technical Details for Evaluators / Judges */}
          <button
            type="button"
            onClick={onOpenModelInfo}
            className="text-xs font-medium text-slate-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Inspect full model architecture, metrics, and training data"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden md:inline">Technical Details</span>
            <span className="md:hidden">Specs</span>
          </button>

          {/* Raw Data Audit Drawer */}
          {onOpenTechnicalDrawer && (
            <button
              type="button"
              onClick={onOpenTechnicalDrawer}
              className="text-xs font-medium text-slate-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Inspect raw backend API responses"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">API Audit</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
