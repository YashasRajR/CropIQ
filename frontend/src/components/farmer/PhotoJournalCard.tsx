import React, { useState } from 'react';
import { Camera, Calendar, AlertCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { TimelineEvent } from '../../types/events';

interface PhotoJournalCardProps {
  cropName: string;
  timeline: TimelineEvent[];
  onTriggerPhotoModal: () => void;
}

export const PhotoJournalCard: React.FC<PhotoJournalCardProps> = ({
  cropName,
  timeline,
  onTriggerPhotoModal,
}) => {
  // Extract all events that contain a photoUrl
  const photoEvents = timeline.filter((e) => !!e.photoUrl);

  // If no uploaded photos yet, supply default representative crop stages
  const samplePhotos = [
    {
      id: 'sample-1',
      date: 'Day 14 (Seedling)',
      label: 'Early Vegetative Emergence',
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
      note: 'Vigorous seedling emergence along crop lines.',
    },
    {
      id: 'sample-2',
      date: 'Day 38 (Canopy Closure)',
      label: 'Mid Vegetative Growth',
      url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&auto=format&fit=crop&q=80',
      note: 'Canopy closing; healthy dark green coloration.',
    },
  ];

  const displayList =
    photoEvents.length > 0
      ? photoEvents.map((e) => ({
          id: e.id,
          date: e.timestamp,
          label: e.title,
          url: e.photoUrl!,
          note: e.description,
        }))
      : samplePhotos;

  const [beforeIdx, setBeforeIdx] = useState<number>(0);
  const [afterIdx, setAfterIdx] = useState<number>(Math.min(1, displayList.length - 1));
  const [viewMode, setViewMode] = useState<'compare' | 'gallery'>('compare');

  const beforePhoto = displayList[beforeIdx] || displayList[0];
  const afterPhoto = displayList[afterIdx] || displayList[displayList.length - 1];

  return (
    <Card variant="bordered" className="p-6 bg-white rounded-3xl border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
              <Camera className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Field Photo Journal & Before-vs-Now
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Chronological visual inspection record for your <strong className="text-emerald-800">{cropName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'compare'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Before vs Now
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'gallery'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gallery ({displayList.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onTriggerPhotoModal}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Before vs Now Comparison */}
      {viewMode === 'compare' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Column */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Earlier Observation (Before)</span>
                </span>
                <select
                  value={beforeIdx}
                  onChange={(e) => setBeforeIdx(Number(e.target.value))}
                  aria-label="Select earlier observation date"
                  className="text-xs p-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
                >
                  {displayList.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.date} - {p.label.substring(0, 20)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 group">
                <img
                  src={beforePhoto.url}
                  alt={beforePhoto.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white space-y-0.5">
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>{beforePhoto.date}</span>
                  </p>
                  <p className="text-[11px] text-slate-200 line-clamp-1">{beforePhoto.note}</p>
                </div>
              </div>
            </div>

            {/* Now Column */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Recent Condition (Now)</span>
                </span>
                <select
                  value={afterIdx}
                  onChange={(e) => setAfterIdx(Number(e.target.value))}
                  aria-label="Select recent observation date"
                  className="text-xs p-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 focus:outline-none"
                >
                  {displayList.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.date} - {p.label.substring(0, 20)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-emerald-300 aspect-video bg-slate-100 group ring-2 ring-emerald-500/20">
                <img
                  src={afterPhoto.url}
                  alt={afterPhoto.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white space-y-0.5">
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>{afterPhoto.date}</span>
                  </p>
                  <p className="text-[11px] text-slate-200 line-clamp-1">{afterPhoto.note}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Gallery Grid */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayList.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 group">
              <div className="aspect-video overflow-hidden">
                <img
                  src={p.url}
                  alt={p.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 space-y-1 bg-white">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{p.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{p.date}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{p.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Honest AI Boundary Notice */}
      <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Visual Evidence Storage:</strong> Photographs are preserved as farmer-reported field evidence.
          Automated computer-vision disease diagnosis is scheduled for future releases; no unvalidated AI disease claims are made here.
        </p>
      </div>
    </Card>
  );
};
