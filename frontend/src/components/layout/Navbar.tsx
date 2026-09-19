import React from 'react';
import { Sprout, Activity, SlidersHorizontal, FileText, Globe, Eye, Code } from 'lucide-react';
import { Badge } from '../common/Badge';
import { HealthResponse } from '../../types/api';
import { Language } from '../../config/i18n';

interface NavbarProps {
  health: HealthResponse | null;
  isCheckingHealth: boolean;
  viewMode: 'farmer' | 'technical';
  onToggleViewMode: (mode: 'farmer' | 'technical') => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  onOpenModelInfo: () => void;
  onOpenTechnicalDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  isCheckingHealth,
  viewMode,
  onToggleViewMode,
  language,
  onChangeLanguage,
  onOpenModelInfo,
  onOpenTechnicalDrawer,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-900/10 shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-emerald-950 tracking-tight">CropIQ</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 rounded-md border border-emerald-200">
                Crop Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">
              Understand your crop &bull; What changed? &bull; What to do
            </p>
          </div>
        </div>

        {/* Center / Right: View Mode Toggle + Language Selector + Tools */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* View Mode Toggle: Farmer View vs Judge View */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onToggleViewMode('farmer')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'farmer'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Farmer-friendly, natural language interface"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Farmer View</span>
              <span className="sm:hidden">Farmer</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('technical')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'technical'
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exposes raw features, SHAP, GroupKFold validation, and API contracts"
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Judge / Technical</span>
              <span className="sm:hidden">Judge</span>
            </button>
          </div>

          {/* Regional Language Extensibility Selector */}
          <div className="relative flex items-center">
            <label htmlFor="language-select" className="sr-only">Select Language</label>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                id="language-select"
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
                aria-label="Language selection"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </div>
          </div>

          {/* Live Backend Health Indicator */}
          <div className="hidden lg:flex items-center">
            {isCheckingHealth ? (
              <Badge variant="slate" size="sm">
                <Activity className="w-3 h-3 animate-spin text-slate-500" />
                <span>Connecting...</span>
              </Badge>
            ) : health?.model_loaded ? (
              <Badge variant="emerald" size="sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Model Online</span>
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
            className="text-xs font-medium text-slate-700 hover:text-emerald-900 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Inspect full model architecture, metrics, and training data"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden md:inline">Specs</span>
          </button>

          {/* Raw Data Audit Drawer */}
          {onOpenTechnicalDrawer && (
            <button
              type="button"
              onClick={onOpenTechnicalDrawer}
              className="text-xs font-medium text-slate-700 hover:text-emerald-900 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Inspect raw backend API responses"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">API</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
