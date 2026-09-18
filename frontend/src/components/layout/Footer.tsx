import React from 'react';
import { Sprout, ExternalLink, ShieldAlert, Code2 } from 'lucide-react';

interface FooterProps {
  onOpenModelInfo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModelInfo }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 mt-20 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Sprout className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">CropIQ</span>
              <span className="text-xs text-slate-500 font-mono">— Predict. Understand. Optimize.</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 max-w-lg mb-4">
              CropIQ helps you estimate crop yield, understand what's driving it, spot risks early,
              and get practical steps to improve your harvest - all from a few details about your field.
            </p>
          </div>

          {/* Col 2: Navigation & Specs */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 font-mono">
              On this page
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#analysis-section" className="hover:text-emerald-400 transition-colors">
                  Your Farm
                </a>
              </li>
              <li>
                <a href="#prediction-section" className="hover:text-emerald-400 transition-colors">
                  Yield & Risk
                </a>
              </li>
              <li>
                <a href="#recommendations-section" className="hover:text-emerald-400 transition-colors">
                  What To Do
                </a>
              </li>
              <li>
                <a href="#simulator-section" className="hover:text-emerald-400 transition-colors">
                  Try What-Ifs
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 font-mono">
              For Developers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenModelInfo}
                  className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Model Specifications</span>
                </button>
              </li>
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <span>FastAPI Swagger UI</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/YashasRajR/CropIQ.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <Code2 className="w-3 h-3 text-slate-500" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Scientific Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] leading-relaxed text-slate-400 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Please note: </span>
            These are AI-generated estimates based on patterns in historical farm data, not guarantees. Use them
            alongside your own judgment and local agricultural advice. The exact unit for yield could not be
            confirmed from the source data.
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono">
          <div>© {new Date().getFullYear()} CropIQ. Built for TechNEXA Hackathon.</div>
          <div className="mt-2 sm:mt-0">Predict. Understand. Optimize.</div>
        </div>
      </div>
    </footer>
  );
};
