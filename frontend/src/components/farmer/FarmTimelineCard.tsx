import React, { useState } from 'react';
import {
  Calendar,
  Sprout,
  CloudRain,
  CloudLightning,
  Waves,
  Sun,
  Bug,
  Palette,
  Camera,
  FileText,
  Award,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { TimelineEvent, ObservationType } from '../../types/events';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface FarmTimelineCardProps {
  timeline: TimelineEvent[];
  cropName: string;
  onOpenObservationModal: (type?: ObservationType) => void;
  onDeleteEvent: (eventId: string) => void;
  onRecordHarvest: (actualYield: number, notes?: string) => void;
  onResetTimeline: () => void;
}

export const FarmTimelineCard: React.FC<FarmTimelineCardProps> = ({
  timeline,
  cropName,
  onOpenObservationModal,
  onDeleteEvent,
  onRecordHarvest,
  onResetTimeline,
}) => {
  const [filter, setFilter] = useState<'all' | 'farmer' | 'weather' | 'harvest'>('all');
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [harvestYieldInput, setHarvestYieldInput] = useState<string>('');
  const [harvestNotesInput, setHarvestNotesInput] = useState<string>('');

  const filteredEvents = timeline.filter((evt) => {
    if (filter === 'farmer') return evt.source === 'farmer' && evt.type !== 'HARVEST';
    if (filter === 'weather') return evt.source === 'weather_service' || evt.source === 'satellite';
    if (filter === 'harvest') return evt.type === 'HARVEST';
    return true;
  });

  const getEventIcon = (type: ObservationType) => {
    switch (type) {
      case 'HAIL':
        return <CloudLightning className="w-4 h-4 text-purple-600" />;
      case 'FLOOD':
        return <Waves className="w-4 h-4 text-blue-600" />;
      case 'HEAT_STRESS':
        return <Sun className="w-4 h-4 text-amber-600" />;
      case 'HEAVY_RAIN':
        return <CloudRain className="w-4 h-4 text-cyan-600" />;
      case 'PEST_NOTICED':
        return <Bug className="w-4 h-4 text-rose-600" />;
      case 'LEAF_COLOR':
      case 'UNUSUAL_GROWTH':
        return <Palette className="w-4 h-4 text-amber-700" />;
      case 'PHOTO_LOG':
        return <Camera className="w-4 h-4 text-indigo-600" />;
      case 'HARVEST':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'NORMAL':
        return <Sprout className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getSourceBadge = (source: TimelineEvent['source']) => {
    switch (source) {
      case 'farmer':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            👨‍🌾 Farmer Reported
          </span>
        );
      case 'satellite':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            📡 Satellite Remote Sensing
          </span>
        );
      case 'weather_service':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            🌦 Weather Station
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            🤖 Model Pipeline
          </span>
        );
    }
  };

  const handleSaveHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    const yieldNum = parseFloat(harvestYieldInput);
    if (!isNaN(yieldNum) && yieldNum > 0) {
      onRecordHarvest(yieldNum, harvestNotesInput.trim() || undefined);
      setIsHarvestModalOpen(false);
      setHarvestYieldInput('');
      setHarvestNotesInput('');
    }
  };

  return (
    <Card variant="bordered" className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Farm Memory & Crop Journey
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Chronological field history for your{' '}
            <strong className="text-emerald-800">{cropName}</strong> season. Persisted in your browser
            so your observations and events build multi-season intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenObservationModal()}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Observation</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsHarvestModalOpen(true)}
            className="text-xs font-semibold bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
          >
            <Award className="w-3.5 h-3.5 mr-1 text-amber-600" />
            <span>Record Harvest Outcome</span>
          </Button>

          <button
            type="button"
            onClick={onResetTimeline}
            title="Reset to default timeline"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Entries ({timeline.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('farmer')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            filter === 'farmer'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Farmer Observations
        </button>
        <button
          type="button"
          onClick={() => setFilter('weather')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            filter === 'weather'
              ? 'bg-cyan-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Weather & Satellite
        </button>
        <button
          type="button"
          onClick={() => setFilter('harvest')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            filter === 'harvest'
              ? 'bg-amber-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Harvest Records
        </button>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            No entries found in this category. Click &quot;Add Observation&quot; to record what you see in the field.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Timeline Marker */}
              <div
                className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                  evt.type === 'HARVEST'
                    ? 'bg-amber-100 ring-2 ring-amber-400'
                    : evt.severity === 'critical'
                    ? 'bg-rose-100 ring-2 ring-rose-400'
                    : evt.severity === 'watch'
                    ? 'bg-amber-100 ring-2 ring-amber-300'
                    : 'bg-emerald-100 ring-2 ring-emerald-300'
                }`}
              >
                {getEventIcon(evt.type)}
              </div>

              {/* Event Content Box */}
              <div className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-4 border border-slate-200 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                    {getSourceBadge(evt.source)}
                    <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {evt.stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {evt.timestamp}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteEvent(evt.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{evt.description}</p>

                {/* Actual Yield Highlight (for harvest entries) */}
                {evt.actualYield !== undefined && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Harvest Yield: {evt.actualYield.toFixed(2)} tonnes / hectare</span>
                  </div>
                )}

                {/* Photo Preview if attached */}
                {evt.photoUrl && (
                  <div className="mt-3">
                    <img
                      src={evt.photoUrl}
                      alt="Field Observation"
                      className="max-h-48 rounded-lg border border-slate-200 object-cover shadow-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Harvest Outcome Record Modal */}
      {isHarvestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Award className="w-5 h-5" />
                </span>
                <h4 className="text-base font-bold text-slate-900">Record Actual Harvest</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsHarvestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHarvest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Actual Measured Yield (tonnes / hectare)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="100"
                  required
                  value={harvestYieldInput}
                  onChange={(e) => setHarvestYieldInput(e.target.value)}
                  placeholder="e.g. 4.15"
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter the finalized harvest result after threshing or weighing.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Season Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={harvestNotesInput}
                  onChange={(e) => setHarvestNotesInput(e.target.value)}
                  placeholder="e.g. Good harvest quality; early November rain supported boll filling..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsHarvestModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-amber-600 hover:bg-amber-700">
                  Save Harvest Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};
