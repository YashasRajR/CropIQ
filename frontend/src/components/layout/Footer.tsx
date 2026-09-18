import React from 'react';
import { Sprout, ExternalLink, ShieldCheck, FileText, Code2 } from 'lucide-react';

interface FooterProps {
  onOpenModelInfo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModelInfo }) => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 mt-20 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-emerald-950 tracking-tight">CropIQ</span>
              <span className="text-xs text-slate-500 font-medium">— Know your crop. Plan your next step.</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 max-w-lg mb-4">
              CropIQ helps farmers understand their expected crop yield, key soil and weather conditions,
              spot crop risks early, and evaluate practical management options using verified data.
            </p>
            <div className="text-xs text-slate-500">
              Agriculture-first decision support • Powered by validated historical field data
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Jump To Section
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#farm-input-section" className="hover:text-emerald-700 transition-colors">
                  1. Farm Information
                </a>
              </li>
              <li>
                <a href="#overview-section" className="hover:text-emerald-700 transition-colors">
                  2. Your Farm Overview
                </a>
              </li>
              <li>
                <a href="#factors-section" className="hover:text-emerald-700 transition-colors">
                  3. What's Affecting Your Crop
                </a>
              </li>
              <li>
                <a href="#recommendations-section" className="hover:text-emerald-700 transition-colors">
                  4. What You Can Do
                </a>
              </li>
              <li>
                <a href="#scenario-section" className="hover:text-emerald-700 transition-colors">
                  5. Try a Different Situation
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: For Evaluators */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              For Evaluators & Judges
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={onOpenModelInfo}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Technical Details & Metrics</span>
                </button>
              </li>
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-700 text-slate-600 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>FastAPI Swagger Docs</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/YashasRajR/CropIQ.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-700 text-slate-600 transition-colors flex items-center gap-1.5"
                >
                  <Code2 className="w-4 h-4 text-slate-500" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Agricultural Trust & Transparency Note */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs leading-relaxed text-emerald-950 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-emerald-900 block mb-0.5">Trust & Transparency Note</strong>
            CropIQ provides model-based estimates to assist farm planning using historical observational data.
            Actual yields depend on local weather, field management, and pest conditions.
            The target yield unit is labeled strictly as <code className="px-1.5 py-0.5 bg-emerald-100/80 text-emerald-900 rounded font-mono text-[11px]">unconfirmed</code> in accordance with dataset integrity.
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>© {new Date().getFullYear()} CropIQ. Built for agricultural yield intelligence.</div>
          <div className="mt-2 sm:mt-0 font-medium">Predict. Understand. Optimize.</div>
        </div>
      </div>
    </footer>
  );
};
