import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckSquare,
  Square,
  ArrowRight,
  BookmarkCheck,
  Sliders,
  Camera,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { ObservationType, CropStage } from '../../types/events';
import { EVENT_GUIDANCE_CATALOG } from '../../config/eventKnowledge';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface EventImpactModalProps {
  isOpen: boolean;
  eventType: ObservationType | null;
  cropName: string;
  cropStage: CropStage;
  onClose: () => void;
  onSaveToTimeline: (eventData: {
    type: ObservationType;
    title: string;
    description: string;
    stage: CropStage;
    severity: 'normal' | 'watch' | 'critical';
    source: 'farmer';
    checklistState?: Record<string, boolean>;
    photoUrl?: string;
  }) => void;
  onTriggerScenario?: (feature: string, deltaPercentage: number, scenarioName: string) => void;
}

export const EventImpactModal: React.FC<EventImpactModalProps> = ({
  isOpen,
  eventType,
  cropName,
  cropStage,
  onClose,
  onSaveToTimeline,
  onTriggerScenario,
}) => {
  if (!isOpen || !eventType) return null;

  const guidance = EVENT_GUIDANCE_CATALOG[eventType] || EVENT_GUIDANCE_CATALOG.CUSTOM_NOTE;

  // Local state for interactive field checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const toggleChecklist = (item: string) => {
    setChecklist((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const completedCount = Object.values(checklist).filter(Boolean).length;
    const desc = notes.trim()
      ? `${notes.trim()} (${completedCount} of ${guidance.checklist.length} field inspection checks marked).`
      : `${guidance.title} recorded during ${cropStage} stage. ${completedCount} of ${guidance.checklist.length} inspection checks marked.`;

    onSaveToTimeline({
      type: eventType,
      title: `${guidance.title}: ${cropName}`,
      description: desc,
      stage: cropStage,
      severity: guidance.severity,
      source: 'farmer',
      checklistState: checklist,
      photoUrl: photoPreview || undefined,
    });
    onClose();
  };

  const handleRunSuggestedScenario = () => {
    if (guidance.suggestedScenario && onTriggerScenario) {
      onTriggerScenario(
        guidance.suggestedScenario.feature,
        guidance.suggestedScenario.deltaPercentage,
        guidance.suggestedScenario.scenarioName
      );
      handleSave();
    }
  };

  const badgeVariant =
    guidance.severity === 'critical'
      ? 'rose'
      : guidance.severity === 'watch'
      ? 'amber'
      : 'emerald';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div
          className={`p-6 border-b flex items-start justify-between ${
            guidance.severity === 'critical'
              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
              : guidance.severity === 'watch'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant}>
                {guidance.badgeLabel}
              </Badge>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current text-slate-700">
                {cropName} • {cropStage}
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight mt-1">{guidance.title}</h3>
            <p className="text-xs opacity-80">
              Grounded agronomic guidance &bull; No fabricated yield reduction numbers
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Section 1: What It Means */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>What Could This Mean for Your Crop?</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {guidance.whatItMeans}
            </div>
          </div>

          {/* Section 2: What to Check in Your Field (Interactive Checklist) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                <span>What to Check During Field Walk</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Tap items as you verify in field
              </span>
            </div>

            <div className="space-y-2">
              {guidance.checklist.map((item, idx) => {
                const isChecked = !!checklist[item];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleChecklist(item)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Recommended Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <span>Recommended Next Steps</span>
            </h4>
            <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              {guidance.recommendedActions.map((act, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-slate-800">{act}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Section 4: Optional Field Photo & Farmer Notes */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              Field Notes & Observations (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Northern corner of field observed 2 inches of standing water; leaves slightly yellowed..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Attach Field Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photoPreview && (
                <div className="flex items-center gap-2">
                  <img
                    src={photoPreview}
                    alt="Field Inspection Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                  />
                  <span className="text-[11px] text-emerald-700 font-medium">Photo attached</span>
                </div>
              )}

              <span className="text-[10px] text-slate-400 italic">
                Photos logged to Farm Memory timeline for advisor review.
              </span>
            </div>
          </div>

          {/* Uncertainty Notice */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-normal">{guidance.uncertaintyDisclaimer}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {guidance.suggestedScenario && onTriggerScenario ? (
            <button
              type="button"
              onClick={handleRunSuggestedScenario}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold border border-amber-300 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{guidance.suggestedScenario.scenarioName}</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Save to Farm Memory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
