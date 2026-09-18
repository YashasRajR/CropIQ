import React from 'react';
import { ArrowDown, Sprout, TrendingUp, HelpCircle, CheckCircle2, Sliders } from 'lucide-react';
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
      num: '1',
      title: 'Your Farm',
      desc: 'Enter your crop and field conditions',
      icon: Sprout,
    },
    {
      num: '2',
      title: 'Estimated Yield',
      desc: 'See expected yield and crop risk',
      icon: TrendingUp,
    },
    {
      num: '3',
      title: "What's Affecting It",
      desc: 'See which conditions matter most',
      icon: HelpCircle,
    },
    {
      num: '4',
      title: 'What You Can Do',
      desc: 'Get practical advisory actions',
      icon: CheckCircle2,
    },
    {
      num: '5',
      title: 'Try Scenarios',
      desc: 'Test what happens if conditions change',
      icon: Sliders,
    },
  ];

  return (
    <section className="relative overflow-hidden pt-10 pb-12 sm:pt-16 sm:pb-18 bg-gradient-to-b from-emerald-50/70 via-[#f7faf7] to-[#f7faf7] border-b border-emerald-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Agricultural Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-normal mb-5 shadow-2xs">
          <Sprout className="w-4 h-4 text-emerald-700" />
          <span>Smart Yield Assistant for Farmers</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-3xl mx-auto mb-4">
          Know your crop.{' '}
          <span className="text-emerald-800">
            Plan your next step.
          </span>
        </h1>

        {/* Farmer-friendly Subheading */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          CropIQ helps you understand your expected crop yield, important farm conditions,
          and what may need attention — before harvest arrives.
        </p>

        {/* Primary and Secondary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
          <Button
            size="lg"
            variant="primary"
            onClick={onAnalyzeClick}
            rightIcon={<ArrowDown className="w-4 h-4" />}
            className="w-full sm:w-auto text-base px-7 py-3.5"
          >
            Check My Farm
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onSelectExample}
            leftIcon={<Sprout className="w-4 h-4 text-emerald-700" />}
            className="w-full sm:w-auto text-base px-6 py-3.5"
          >
            Choose an Example Farm
          </Button>
        </div>

        {/* 5-Step Simple Flow Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto text-left">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                    {step.num}
                  </span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-bold text-sm text-slate-900 mb-1">
                  {step.title}
                </div>
                <p className="text-xs text-slate-500 leading-snug">
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
