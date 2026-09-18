export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface FieldHelpInfo {
  label: string;
  unit: string;
  category: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

export const FEATURE_DICTIONARY: Record<string, FieldHelpInfo> = {
  crop_type: {
    label: 'Crop Species',
    unit: '',
    category: 'Crop',
    description: 'Target crop variety cultivated on the observation plot.',
    min: 0,
    max: 0,
    step: 1,
  },
  latitude: {
    label: 'Latitude',
    unit: '°N',
    category: 'Location',
    description: 'Geographic coordinate representing north-south position.',
    min: 8.0,
    max: 37.0,
    step: 0.001,
  },
  longitude: {
    label: 'Longitude',
    unit: '°E',
    category: 'Location',
    description: 'Geographic coordinate representing east-west position.',
    min: 68.0,
    max: 97.0,
    step: 0.001,
  },
  NDVI: {
    label: 'NDVI',
    unit: 'index',
    category: 'Vegetation',
    description: 'Normalized Difference Vegetation Index (measures live green plant biomass and canopy vigor).',
    min: -1.0,
    max: 1.0,
    step: 0.01,
  },
  GNDVI: {
    label: 'GNDVI',
    unit: 'index',
    category: 'Vegetation',
    description: 'Green Normalized Difference Vegetation Index (sensitive to chlorophyll concentration in dense canopies).',
    min: -1.0,
    max: 1.0,
    step: 0.01,
  },
  NDWI: {
    label: 'NDWI',
    unit: 'index',
    category: 'Vegetation',
    description: 'Normalized Difference Water Index (satellite indicator of canopy water content).',
    min: -1.0,
    max: 1.0,
    step: 0.01,
  },
  SAVI: {
    label: 'SAVI',
    unit: 'index',
    category: 'Vegetation',
    description: 'Soil Adjusted Vegetation Index (corrects for background soil reflectance in early growth stages).',
    min: -1.0,
    max: 1.5,
    step: 0.01,
  },
  soil_moisture: {
    label: 'Soil Moisture',
    unit: '%',
    category: 'Soil',
    description: 'In-situ volumetric root-zone soil moisture measurement (0-100%).',
    min: 0.0,
    max: 105.0,
    step: 0.5,
  },
  temperature: {
    label: 'Temperature',
    unit: '°C (approx)',
    category: 'Weather',
    description: 'Ambient 2-meter air temperature at field location.',
    min: -10.0,
    max: 50.0,
    step: 0.1,
  },
  rainfall: {
    label: 'Rainfall',
    unit: 'mm (approx)',
    category: 'Weather',
    description: 'Cumulative precipitation depth received in observation window.',
    min: 0.0,
    max: 300.0,
    step: 0.5,
  },
};
