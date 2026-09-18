import React from 'react';
import { ArrowDown, Cpu, Sparkles, TrendingUp, ShieldAlert, Sliders, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

interface HeroSectionProps {
  onAnalyzeClick: () => void;
  onSelectExample: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onAnalyzeClick,
  onSelectExample,
}) => {
  const steps = [
    {
      num: '01',
      title: 'INPUT',
      desc: 'Farm, satellite & weather features',
      icon: Cpu,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      num: '02',
      title: 'PREDICT',
      desc: 'Machine learning yield regression',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      num: '03',
      title: 'UNDERSTAND',
      desc: 'Local TreeSHAP feature attributions',
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      num: '04',
      title: 'ACT',
      desc: 'Prioritized agronomic guidance',
      icon: ShieldAlert,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      num: '05',
      title: 'SIMULATE',
      desc: 'Interactive what-if scenarios',
      icon: Sliders,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    },
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-800/60">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Predict • Understand • Optimize</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto mb-6">
          AI-Powered Crop Yield{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            Intelligence
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Transform agricultural observations, satellite indices, and weather conditions into
          validated yield forecasts, transparent feature attributions, multi-factor risk diagnostics,
          and actionable what-if scenario simulations.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="lg"
            variant="primary"
            onClick={onAnalyzeClick}
            rightIcon={<ArrowDown className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-xl shadow-emerald-950/60"
          >
            Analyze Your Farm
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={onSelectExample}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            className="w-full sm:w-auto"
          >
            Load Example Farm (Rice)
          </Button>
        </div>

        {/* 5-Step Process Visual Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 max-w-5xl mx-auto text-left">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {step.num}
                  </span>
                  <div className={`p-1.5 rounded-lg border ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-100 tracking-tight mb-1">
                  {step.title}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
