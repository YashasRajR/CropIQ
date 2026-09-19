/**
 * CropIQ Farmer Events, Observations, Decisions & Farm Memory Domain Models
 */

export type ObservationType =
  | 'HAIL'
  | 'FLOOD'
  | 'HEAT_STRESS'
  | 'HEAVY_RAIN'
  | 'PEST_NOTICED'
  | 'LEAF_COLOR'
  | 'UNUSUAL_GROWTH'
  | 'NORMAL'
  | 'PHOTO_LOG'
  | 'CUSTOM_NOTE'
  | 'HARVEST';

export type CropStage =
  | 'Sowing / Seedling'
  | 'Vegetative / Growing'
  | 'Flowering / Squaring'
  | 'Grain / Pod Filling'
  | 'Maturity / Ripening';

export type SeverityLevel = 'normal' | 'watch' | 'critical';

export interface EventImpactGuidance {
  type: ObservationType;
  title: string;
  badgeLabel: string;
  severity: SeverityLevel;
  whatItMeans: string;
  checklist: string[];
  recommendedActions: string[];
  suggestedScenario: {
    feature: string;
    deltaPercentage: number;
    scenarioName: string;
    description: string;
  } | null;
  uncertaintyDisclaimer: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: ObservationType;
  title: string;
  description: string;
  stage: CropStage;
  severity: SeverityLevel;
  source: 'farmer' | 'satellite' | 'weather_service' | 'model';
  photoUrl?: string;
  checklistState?: Record<string, boolean>;
  actualYield?: number;
}

export interface HarvestRecord {
  harvestDate: string;
  actualYieldTonnes: number;
  notes?: string;
}

export type DecisionCategory = 'IRRIGATION' | 'FERTILIZER' | 'PEST_CONTROL' | 'WEEDING' | 'INSPECTION';

export interface FarmDecision {
  id: string;
  timestamp: string;
  category: DecisionCategory;
  title: string;
  details: string;
  costEstimate?: string;
  notes?: string;
}

export interface PredictionHistoryPoint {
  weekLabel: string;
  date: string;
  yieldEstimate: number;
  contextEvent?: string;
  trajectory: 'improving' | 'stable' | 'concern';
}

export interface FarmerFeedback {
  id: string;
  timestamp: string;
  agreement: 'agrees' | 'unsure' | 'disagrees';
  farmerNotes?: string;
}

export interface DataAvailabilityItem {
  category: string;
  label: string;
  available: boolean;
  status: 'verified' | 'unverified' | 'unavailable';
  source: string;
  details: string;
}
