export interface FarmInput {
  crop_type: string;
  latitude: number;
  longitude: number;
  NDVI: number;
  GNDVI: number;
  NDWI: number;
  SAVI: number;
  soil_moisture: number;
  temperature: number;
  rainfall: number;
  field_id?: string;
  date_of_image?: string;
}

export interface FeatureMetadataItem {
  display_name: string;
  unit: string;
  classification: 'ACTIONABLE_SIMULATABLE' | 'CONTEXTUAL_SIMULATABLE' | 'MONITORING_ONLY' | 'NOT_SUPPORTED';
  controllability: 'full' | 'partial' | 'contextual' | 'none';
  slider: {
    min: number;
    max: number;
    step: number;
    default: number;
  };
  physical_bounds?: [number, number];
  training_stats?: {
    min: number;
    max: number;
    p01: number;
    p05: number;
    p25: number;
    median: number;
    p75: number;
    p95: number;
    p99: number;
  };
}

export interface ScenarioFeaturesCatalog {
  features: Record<string, FeatureMetadataItem>;
  blocked_targets: string[];
  blocked_identifiers: string[];
}

export const SUPPORTED_CROPS = [
  'Rice',
  'Maize',
  'Chickpea',
  'Cotton',
  'Wheat',
  'Bajra',
  'Jowar',
  'Soybean',
  'Sugarcane',
  'Groundnut',
  'Mustard',
  'Barley',
  'Moong',
  'Lentil',
  'Blackgram',
  'Pigeonpeas',
  'Mothbeans',
  'Jute',
  'Onion',
  'Potato',
  'Banana',
  'Mango',
  'Grapes',
  'Apple',
  'Orange',
  'Papaya',
  'Coconut',
  'Coffee',
  'Pomegranate',
  'Ragi',
  'Saffron',
] as const;
