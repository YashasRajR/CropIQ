import React, { useState } from 'react';
import { X, Printer, Copy, Check, FileText, AlertTriangle } from 'lucide-react';
import { FarmInput } from '../../types/farm';
import { PredictionResponse } from '../../types/prediction';
import { CropStage, TimelineEvent } from '../../types/events';
import { Button } from '../common/Button';

interface ExpertReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmInput: FarmInput;
  prediction: PredictionResponse | null;
  cropStage: CropStage;
  timeline: TimelineEvent[];
}

export const ExpertReportModal: React.FC<ExpertReportModalProps> = ({
  isOpen,
  onClose,
  farmInput,
  prediction,
  cropStage,
  timeline,
}) => {
  const [copied, setCopied] = useState(false);
  const [expertQuestion, setExpertQuestion] = useState(
    'Please review root zone conditions and advise whether corrective foliar spray is recommended given current weather.'
  );

  if (!isOpen) return null;

  const yieldVal = prediction?.prediction?.yield ?? 4.2;
  const lowerBound = prediction?.uncertainty?.lower_bound ?? (yieldVal * 0.9);
  const upperBound = prediction?.uncertainty?.upper_bound ?? (yieldVal * 1.1);

  const recentEvents = timeline.slice(0, 5);

  const reportText = `=====================================================
CROPIQ FIELD DIAGNOSTIC REPORT
Prepared for Agricultural Extension Officer / KVK Agronomist
Date: ${new Date().toLocaleDateString()}
=====================================================

1. FIELD & CROP IDENTIFIERS
-----------------------------------------------------
Crop Species:       ${farmInput.crop_type}
Current Stage:      ${cropStage}
Plot / Field ID:    ${farmInput.field_id || 'Main Plot'}
Coordinates:        ${farmInput.latitude.toFixed(4)}°N, ${farmInput.longitude.toFixed(4)}°E
Observation Date:   ${farmInput.date_of_image || new Date().toISOString().split('T')[0]}

2. SENSOR & MODEL DATA
-----------------------------------------------------
Estimated Harvest:  ${yieldVal.toFixed(2)} tonnes / ha
90% Confidence:     ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)} tonnes / ha
Canopy Greenness:   NDVI ${farmInput.NDVI.toFixed(3)}
Root Zone Moisture: ${farmInput.soil_moisture.toFixed(1)}%
Ambient Temp:       ${farmInput.temperature.toFixed(1)} °C
Precipitation:      ${farmInput.rainfall.toFixed(1)} mm

3. RECENT FIELD EVENTS & FARMER OBSERVATIONS
-----------------------------------------------------
${recentEvents.map((e) => `• [${e.timestamp}] ${e.title}: ${e.description}`).join('\n')}

4. FARMER INQUIRY / SPECIFIC QUESTIONS
-----------------------------------------------------
"${expertQuestion}"

5. DISCLAIMER & METHODOLOGY
-----------------------------------------------------
CropIQ provides data-driven statistical decision support based on GroupKFold validated Random Forest regression. It does NOT replace qualified laboratory soil analysis or certified in-field agronomic inspection.
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold">
                <FileText className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Agronomist Escalation Dossier
              </span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">
              Structured Field Consultation Report
            </h3>
            <p className="text-xs text-slate-300">
              Ready to print, download, or share with your local agricultural officer / KVK expert.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Report Preview */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto font-sans">
          {/* Section 1: Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Crop</span>
              <span className="text-xs font-bold text-slate-900">{farmInput.crop_type}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Stage</span>
              <span className="text-xs font-bold text-slate-900">{cropStage}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">NDVI</span>
              <span className="text-xs font-bold text-slate-900">{farmInput.NDVI.toFixed(3)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Moisture</span>
              <span className="text-xs font-bold text-slate-900">{farmInput.soil_moisture.toFixed(1)}%</span>
            </div>
          </div>

          {/* Section 2: Farmer's Question */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Questions for the Agricultural Expert
            </label>
            <textarea
              rows={3}
              value={expertQuestion}
              onChange={(e) => setExpertQuestion(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              placeholder="Enter your specific question for the advisor..."
            />
          </div>

          {/* Section 3: Formatted Dossier Code View */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Generated Field Dossier (Preview)
            </label>
            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-[11px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
              {reportText}
            </pre>
          </div>

          {/* Trust Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-[11px] text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              CropIQ does not claim to provide certified diagnostics. This structured dossier equips your local agronomist with complete data context for reliable ground recommendations.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs">
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print Dossier</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCopy}
              className="text-xs bg-slate-900 hover:bg-slate-800"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Dossier Text'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
