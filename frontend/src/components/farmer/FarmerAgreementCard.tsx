import React, { useState } from 'react';
import { ThumbsUp, HelpCircle, ThumbsDown, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { Card } from '../common/Card';
import { FarmerFeedback } from '../../types/events';

interface FarmerAgreementCardProps {
  cropName: string;
  initialFeedback: FarmerFeedback | null;
  onSaveFeedback: (agreement: 'agrees' | 'unsure' | 'disagrees', notes?: string) => void;
}

export const FarmerAgreementCard: React.FC<FarmerAgreementCardProps> = ({
  cropName,
  initialFeedback,
  onSaveFeedback,
}) => {
  const [selected, setSelected] = useState<'agrees' | 'unsure' | 'disagrees' | null>(
    initialFeedback?.agreement ?? null
  );
  const [farmerNotes, setFarmerNotes] = useState<string>(initialFeedback?.farmerNotes ?? '');
  const [isSaved, setIsSaved] = useState<boolean>(!!initialFeedback);

  const handleSelect = (choice: 'agrees' | 'unsure' | 'disagrees') => {
    setSelected(choice);
    setIsSaved(false);
  };

  const handleConfirm = () => {
    if (selected) {
      onSaveFeedback(selected, farmerNotes.trim() || undefined);
      setIsSaved(true);
    }
  };

  return (
    <Card variant="bordered" className="p-5 sm:p-6 bg-white rounded-3xl border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              What Do You See in Your Field?
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Does CropIQ&apos;s outlook match what you are seeing with your own eyes on your {cropName}?
          </p>
        </div>

        {isSaved && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Field Truth Recorded</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Choice 1: Agrees */}
        <button
          type="button"
          onClick={() => handleSelect('agrees')}
          className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
            selected === 'agrees'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-950'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <ThumbsUp className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-bold block text-slate-900">Yes, looks right</span>
            <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
              Canopy and moisture match my field condition.
            </span>
          </div>
        </button>

        {/* Choice 2: Unsure */}
        <button
          type="button"
          onClick={() => handleSelect('unsure')}
          className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
            selected === 'unsure'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 text-amber-950'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <span className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <HelpCircle className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-bold block text-slate-900">Not sure yet</span>
            <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
              Haven&apos;t completed a full field walk this week.
            </span>
          </div>
        </button>

        {/* Choice 3: Disagrees */}
        <button
          type="button"
          onClick={() => handleSelect('disagrees')}
          className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
            selected === 'disagrees'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 text-rose-950'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <span className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <ThumbsDown className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-bold block text-slate-900">Field looks different</span>
            <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
              Actual condition is better or worse than estimated.
            </span>
          </div>
        </button>
      </div>

      {/* Observation Input (Expands when selected or notes exist) */}
      {selected && (
        <div className="pt-2 space-y-2.5 animate-in fade-in duration-200">
          <label className="block text-xs font-bold text-slate-800">
            {selected === 'disagrees'
              ? 'What is different in your field? (Your ground truth)'
              : 'Add field context note (Optional)'}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={farmerNotes}
              onChange={(e) => {
                setFarmerNotes(e.target.value);
                setIsSaved(false);
              }}
              placeholder={
                selected === 'disagrees'
                  ? 'e.g. Recent furrow irrigation improved soil moisture, canopy is greener than satellite index...'
                  : 'e.g. Plants looking healthy, weeded 3 days ago...'
              }
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Update Response' : 'Confirm Field Truth'}</span>
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
