/**
 * CropIQ Farm Memory & Timeline Persistence Service
 * Stores chronological crop journey events in browser localStorage.
 * Enables multi-season farm memory without requiring an external database.
 */

import { TimelineEvent, ObservationType, CropStage, SeverityLevel } from '../types/events';

const STORAGE_PREFIX = 'cropiq_farm_memory_v1_';

// Default chronological events tailored to presets
const getInitialEventsForCrop = (cropName: string): TimelineEvent[] => {
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  return [
    {
      id: 'init-1',
      timestamp: daysAgo(52),
      type: 'CUSTOM_NOTE',
      title: `${cropName} Sowing Completed`,
      description: `Field ploughed, basal manure incorporated, and certified seed sown with optimal seedbed moisture.`,
      stage: 'Sowing / Seedling',
      severity: 'normal',
      source: 'farmer',
    },
    {
      id: 'init-2',
      timestamp: daysAgo(38),
      type: 'NORMAL',
      title: 'Good Seedling Emergence',
      description: 'Even germination observed across 90%+ of the field. First weeding conducted.',
      stage: 'Vegetative / Growing',
      severity: 'normal',
      source: 'farmer',
    },
    {
      id: 'init-3',
      timestamp: daysAgo(21),
      type: 'HEAVY_RAIN',
      title: 'Moderate Seasonal Rainfall Recorded',
      description: '35 mm rainfall received over 24 hours. Soil moisture recharged without standing water.',
      stage: 'Vegetative / Growing',
      severity: 'normal',
      source: 'weather_service',
    },
    {
      id: 'init-4',
      timestamp: daysAgo(8),
      type: 'CUSTOM_NOTE',
      title: 'Mid-Season Field Scouting',
      description: 'Crop canopy closing between rows. Satellite NDVI indicates healthy vegetative vigor.',
      stage: 'Flowering / Squaring',
      severity: 'normal',
      source: 'satellite',
    },
  ];
};

export const farmMemoryService = {
  getStorageKey(farmKey: string): string {
    const cleanKey = farmKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return `${STORAGE_PREFIX}${cleanKey}`;
  },

  getTimeline(farmKey: string, cropName: string = 'Crop'): TimelineEvent[] {
    try {
      const key = this.getStorageKey(farmKey);
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as TimelineEvent[];
      }
      // Populate initial baseline if not present
      const initial = getInitialEventsForCrop(cropName);
      this.saveTimeline(farmKey, initial);
      return initial;
    } catch (e) {
      console.warn('Could not read farm memory from storage:', e);
      return getInitialEventsForCrop(cropName);
    }
  },

  saveTimeline(farmKey: string, events: TimelineEvent[]): void {
    try {
      const key = this.getStorageKey(farmKey);
      localStorage.setItem(key, JSON.stringify(events));
    } catch (e) {
      console.warn('Could not save farm memory to storage:', e);
    }
  },

  addEvent(
    farmKey: string,
    eventData: {
      type: ObservationType;
      title: string;
      description: string;
      stage: CropStage;
      severity: SeverityLevel;
      source: 'farmer' | 'satellite' | 'weather_service' | 'model';
      photoUrl?: string;
      checklistState?: Record<string, boolean>;
      actualYield?: number;
      timestamp?: string;
    }
  ): TimelineEvent {
    const current = this.getTimeline(farmKey);
    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: eventData.timestamp || new Date().toISOString().split('T')[0],
      ...eventData,
    };

    // Prepend new event so most recent appears first
    const updated = [newEvent, ...current];
    this.saveTimeline(farmKey, updated);
    return newEvent;
  },

  updateEventChecklist(farmKey: string, eventId: string, checklistState: Record<string, boolean>): void {
    const current = this.getTimeline(farmKey);
    const updated = current.map((evt) =>
      evt.id === eventId ? { ...evt, checklistState } : evt
    );
    this.saveTimeline(farmKey, updated);
  },

  deleteEvent(farmKey: string, eventId: string): void {
    const current = this.getTimeline(farmKey);
    const updated = current.filter((evt) => evt.id !== eventId);
    this.saveTimeline(farmKey, updated);
  },

  recordHarvest(farmKey: string, actualYield: number, notes?: string): TimelineEvent {
    return this.addEvent(farmKey, {
      type: 'HARVEST',
      title: `Harvest Outcome Recorded: ${actualYield.toFixed(2)} t/ha`,
      description: notes || `Actual harvested field yield confirmed at ${actualYield.toFixed(2)} tonnes per hectare. Intelligence loop closed for this growing season.`,
      stage: 'Maturity / Ripening',
      severity: 'normal',
      source: 'farmer',
      actualYield,
    });
  },

  resetTimeline(farmKey: string, cropName: string = 'Crop'): TimelineEvent[] {
    const initial = getInitialEventsForCrop(cropName);
    this.saveTimeline(farmKey, initial);
    return initial;
  },
};
