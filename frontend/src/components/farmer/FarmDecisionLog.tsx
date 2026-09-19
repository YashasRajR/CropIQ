import React, { useState } from 'react';
import {
  Droplets,
  Sprout,
  ShieldAlert,
  Scissors,
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FarmDecision, DecisionCategory } from '../../types/events';

interface FarmDecisionLogProps {
  cropName: string;
  decisions: FarmDecision[];
  onAddDecision: (decision: Omit<FarmDecision, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  onDeleteDecision: (decisionId: string) => void;
}

export const FarmDecisionLog: React.FC<FarmDecisionLogProps> = ({
  cropName,
  decisions,
  onAddDecision,
  onDeleteDecision,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [category, setCategory] = useState<DecisionCategory>('IRRIGATION');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [notes, setNotes] = useState('');

  const getCategoryIcon = (cat: DecisionCategory) => {
    switch (cat) {
      case 'IRRIGATION':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'FERTILIZER':
        return <Sprout className="w-4 h-4 text-emerald-600" />;
      case 'PEST_CONTROL':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'WEEDING':
        return <Scissors className="w-4 h-4 text-amber-600" />;
      default:
        return <ClipboardList className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBadge = (cat: DecisionCategory) => {
    switch (cat) {
      case 'IRRIGATION':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Irrigation</span>;
      case 'FERTILIZER':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Nutrition</span>;
      case 'PEST_CONTROL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Crop Protection</span>;
      case 'WEEDING':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Weeding</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">Scouting</span>;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && details.trim()) {
      onAddDecision({
        category,
        title: title.trim(),
        details: details.trim(),
        notes: notes.trim() || undefined,
      });
      setTitle('');
      setDetails('');
      setNotes('');
      setIsFormOpen(false);
    }
  };

  return (
    <Card variant="bordered" className="p-6 bg-white rounded-3xl border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <ClipboardList className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              My Farm Decisions Log
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Record management actions applied to your <strong className="text-emerald-800">{cropName}</strong> to connect management with outcomes.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="text-xs self-start sm:self-auto"
        >
          {isFormOpen ? <X className="w-3.5 h-3.5 mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
          <span>{isFormOpen ? 'Cancel' : 'Log New Action'}</span>
        </Button>
      </div>

      {/* New Decision Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Action Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DecisionCategory)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="IRRIGATION">💧 Irrigation / Water Management</option>
                <option value="FERTILIZER">🌾 Fertilizer / Nutrient Application</option>
                <option value="PEST_CONTROL">🛡️ Crop Protection / Pest Spray</option>
                <option value="WEEDING">✂️ Weeding / Inter-Cultivation</option>
                <option value="INSPECTION">📋 Formal Field Scouting Walk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Action Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Applied 2nd split Urea top-dressing"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Details & Dosage</label>
            <textarea
              rows={2}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Applied 30 kg/ha broadcasted ahead of planned irrigation..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Action to Record
            </Button>
          </div>
        </form>
      )}

      {/* Decisions List */}
      <div className="space-y-3">
        {decisions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No management actions logged yet. Click &quot;Log New Action&quot; to begin building your decision record.
          </div>
        ) : (
          decisions.map((dec) => (
            <div
              key={dec.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <span className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                  {getCategoryIcon(dec.category)}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{dec.title}</span>
                    {getCategoryBadge(dec.category)}
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dec.timestamp}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{dec.details}</p>
                  {dec.notes && (
                    <p className="text-[11px] text-slate-500 italic">Note: {dec.notes}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDeleteDecision(dec.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                title="Delete action"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
