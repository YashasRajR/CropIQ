import React from 'react';
import { ArrowDown, Sprout, Sliders, ShieldCheck, Satellite, Users } from 'lucide-react';
import { Button } from '../common/Button';

interface HeroSectionProps {
  onAnalyzeClick: () => void;
  onSelectSimulator: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onAnalyzeClick,
  onSelectSimulator,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-8 sm:pt-10 sm:pb-10 bg-gradient-to-b from-emerald-50/80 via-emerald-50/30 to-[#f7faf7] border-b border-emerald-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-left">
          {/* Left Column: Headline & Mission */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-normal shadow-2xs">
              <Sprout className="w-3.5 h-3.5 text-emerald-700" />
              <span>Continuous Crop Intelligence & Decision Support</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Know your crop.{' '}
              <span className="text-emerald-800">
                Plan your next step.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              CropIQ combines satellite greenness, live soil moisture, ambient weather, and your ground-truth observations into a continuous decision-support loop throughout the growing season.
            </p>

            {/* 3 Trust Pillars */}
            <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Satellite className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sentinel-2 Satellite Grounded</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>FAO & ICAR Agronomic Rules</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Farmer Ground-Truth Verified</span>
              </span>
            </div>
          </div>

          {/* Right Column: Quick Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 self-start lg:self-center">
            <Button
              size="md"
              variant="primary"
              onClick={onAnalyzeClick}
              rightIcon={<ArrowDown className="w-4 h-4" />}
              className="text-xs sm:text-sm px-5 py-2.5 font-bold shadow-xs"
            >
              Go to Today&apos;s Field Cockpit
            </Button>

            <Button
              size="md"
              variant="outline"
              onClick={onSelectSimulator}
              leftIcon={<Sliders className="w-4 h-4 text-emerald-700" />}
              className="text-xs sm:text-sm px-5 py-2.5 font-semibold bg-white"
            >
              Try What-If Simulator
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
