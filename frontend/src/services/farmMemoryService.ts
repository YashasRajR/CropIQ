/**
 * CropIQ Farm Memory, Decisions, Prediction History & Feedback Persistence Service
 * Stores chronological crop journey events in browser localStorage.
 * Enables multi-season farm memory without requiring an external database.
 */

import {
  TimelineEvent,
  ObservationType,
  CropStage,
  SeverityLevel,
  FarmDecision,
  PredictionHistoryPoint,
  FarmerFeedback,
} from '../types/events';

const STORAGE_PREFIX = 'cropiq_farm_memory_v1_';
const DECISIONS_PREFIX = 'cropiq_decisions_v1_';
const PREDICTION_HISTORY_PREFIX = 'cropiq_pred_history_v1_';
const FEEDBACK_PREFIX = 'cropiq_feedback_v1_';

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

const getInitialDecisions = (cropName: string): FarmDecision[] => {
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  return [
    {
      id: 'dec-1',
      timestamp: daysAgo(48),
      category: 'FERTILIZER',
      title: 'Basal Nutrition Application',
      details: 'Applied 50 kg DAP and well-decomposed farmyard manure prior to sowing.',
      notes: 'Soil incorporated evenly across rows.',
    },
    {
      id: 'dec-2',
      timestamp: daysAgo(35),
      category: 'WEEDING',
      title: 'First Manual Inter-Row Weeding',
      details: 'Manual hand weeding along crop lines to remove early broadleaf competition.',
    },
    {
      id: 'dec-3',
      timestamp: daysAgo(18),
      category: 'IRRIGATION',
      title: 'Scheduled Furrow Irrigation',
      details: 'Applied light 4-hour furrow irrigation following 10-day dry interval.',
      notes: 'Good water infiltration observed; no surface ponding.',
    },
    {
      id: 'dec-4',
      timestamp: daysAgo(6),
      category: 'PEST_CONTROL',
      title: 'Preventive Neem Botanical Spray',
      details: 'Applied 1500 ppm neem seed kernel extract for early sucking pest prevention on ' + cropName + '.',
    },
  ];
};

const getInitialPredictionHistory = (baselineYield: number = 4.2): PredictionHistoryPoint[] => {
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  return [
    {
      weekLabel: 'Week 1 (Sowing)',
      date: daysAgo(50),
      yieldEstimate: Number((baselineYield * 0.96).toFixed(2)),
      contextEvent: 'Initial pre-season baseline based on sowing date and soil indices',
      trajectory: 'stable',
    },
    {
      weekLabel: 'Week 3 (Emergence)',
      date: daysAgo(36),
      yieldEstimate: Number((baselineYield * 1.02).toFixed(2)),
      contextEvent: 'Even germination recorded across 90%+ plot area',
      trajectory: 'improving',
    },
    {
      weekLabel: 'Week 5 (Rainfall Event)',
      date: daysAgo(20),
      yieldEstimate: Number((baselineYield * 1.05).toFixed(2)),
      contextEvent: '35 mm rainfall received; favorable root moisture recharge',
      trajectory: 'improving',
    },
    {
      weekLabel: 'Week 7 (Dry Interval)',
      date: daysAgo(6),
      yieldEstimate: Number((baselineYield * 0.98).toFixed(2)),
      contextEvent: 'Elevated ambient temperature; mild soil moisture dip',
      trajectory: 'concern',
    },
    {
      weekLabel: 'Current Observation',
      date: daysAgo(0),
      yieldEstimate: Number(baselineYield.toFixed(2)),
      contextEvent: 'Latest satellite pass and current farm conditions',
      trajectory: 'stable',
    },
  ];
};

export const farmMemoryService = {
  getStorageKey(prefix: string, farmKey: string): string {
    const cleanKey = farmKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return `${prefix}${cleanKey}`;
  },

  // --- Timeline Events ---
  getTimeline(farmKey: string, cropName: string = 'Crop'): TimelineEvent[] {
    try {
      const key = this.getStorageKey(STORAGE_PREFIX, farmKey);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as TimelineEvent[];

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
      const key = this.getStorageKey(STORAGE_PREFIX, farmKey);
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

  // --- Farm Decisions Log ---
  getDecisions(farmKey: string, cropName: string = 'Crop'): FarmDecision[] {
    try {
      const key = this.getStorageKey(DECISIONS_PREFIX, farmKey);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as FarmDecision[];

      const initial = getInitialDecisions(cropName);
      this.saveDecisions(farmKey, initial);
      return initial;
    } catch {
      return getInitialDecisions(cropName);
    }
  },

  saveDecisions(farmKey: string, decisions: FarmDecision[]): void {
    try {
      const key = this.getStorageKey(DECISIONS_PREFIX, farmKey);
      localStorage.setItem(key, JSON.stringify(decisions));
    } catch (e) {
      console.warn('Could not save decisions:', e);
    }
  },

  addDecision(
    farmKey: string,
    decisionData: Omit<FarmDecision, 'id' | 'timestamp'> & { timestamp?: string }
  ): FarmDecision {
    const current = this.getDecisions(farmKey);
    const newDecision: FarmDecision = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: decisionData.timestamp || new Date().toISOString().split('T')[0],
      ...decisionData,
    };

    const updated = [newDecision, ...current];
    this.saveDecisions(farmKey, updated);

    // Also link decision into timeline
    this.addEvent(farmKey, {
      type: 'CUSTOM_NOTE',
      title: `Field Decision: ${newDecision.title}`,
      description: `${newDecision.details} (${newDecision.category})`,
      stage: 'Vegetative / Growing',
      severity: 'normal',
      source: 'farmer',
      timestamp: newDecision.timestamp,
    });

    return newDecision;
  },

  deleteDecision(farmKey: string, decisionId: string): void {
    const current = this.getDecisions(farmKey);
    const updated = current.filter((d) => d.id !== decisionId);
    this.saveDecisions(farmKey, updated);
  },

  // --- Prediction Outlook History ---
  getPredictionHistory(farmKey: string, baselineYield: number = 4.2): PredictionHistoryPoint[] {
    try {
      const key = this.getStorageKey(PREDICTION_HISTORY_PREFIX, farmKey);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as PredictionHistoryPoint[];

      const initial = getInitialPredictionHistory(baselineYield);
      this.savePredictionHistory(farmKey, initial);
      return initial;
    } catch {
      return getInitialPredictionHistory(baselineYield);
    }
  },

  savePredictionHistory(farmKey: string, history: PredictionHistoryPoint[]): void {
    try {
      const key = this.getStorageKey(PREDICTION_HISTORY_PREFIX, farmKey);
      localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save prediction history:', e);
    }
  },

  // --- Farmer Feedback & Agreement ---
  getFarmerFeedback(farmKey: string): FarmerFeedback | null {
    try {
      const key = this.getStorageKey(FEEDBACK_PREFIX, farmKey);
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as FarmerFeedback) : null;
    } catch {
      return null;
    }
  },

  saveFarmerFeedback(
    farmKey: string,
    feedback: Omit<FarmerFeedback, 'id' | 'timestamp'>
  ): FarmerFeedback {
    const key = this.getStorageKey(FEEDBACK_PREFIX, farmKey);
    const feedbackObj: FarmerFeedback = {
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...feedback,
    };
    try {
      localStorage.setItem(key, JSON.stringify(feedbackObj));

      // Also record to timeline if farmer disagreed or provided notes
      if (feedback.agreement === 'disagrees' || feedback.farmerNotes) {
        this.addEvent(farmKey, {
          type: 'CUSTOM_NOTE',
          title: 'Farmer Ground-Truth Feedback Recorded',
          description: feedback.farmerNotes
            ? `Farmer reported: "${feedback.farmerNotes}"`
            : `Farmer indicated current model outlook does not align with field condition.`,
          stage: 'Vegetative / Growing',
          severity: 'watch',
          source: 'farmer',
        });
      }
    } catch (e) {
      console.warn('Could not save feedback:', e);
    }
    return feedbackObj;
  },
};
