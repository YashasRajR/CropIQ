import { FarmInput } from '../types/farm';

export interface ExampleFarmProfile {
  id: string;
  name: string;
  crop: string;
  region: string;
  description: string;
  input: FarmInput;
}

export const EXAMPLE_FARM_PRESETS: ExampleFarmProfile[] = [
  {
    id: 'sample_rice',
    name: 'Rice (Field 1 - West Bengal)',
    crop: 'Rice',
    region: 'Eastern Alluvial Plains',
    description: 'Humid alluvial conditions with early vegetative canopy development.',
    input: {
      crop_type: 'Rice',
      latitude: 22.625,
      longitude: 88.498,
      NDVI: 0.511,
      GNDVI: 0.467,
      NDWI: -0.467,
      SAVI: 0.767,
      soil_moisture: 21.98,
      temperature: 14.6,
      rainfall: 17.5,
      field_id: 'Field_1',
      date_of_image: '2023-01-04',
    },
  },
  {
    id: 'sample_bajra',
    name: 'Bajra / Pearl Millet (Rajasthan)',
    crop: 'Bajra',
    region: 'Semi-Arid Western Zone',
    description: 'Dry climate with moderate canopy vigor and water stress vulnerability.',
    input: {
      crop_type: 'Bajra',
      latitude: 26.856,
      longitude: 75.975,
      NDVI: 0.440,
      GNDVI: 0.503,
      NDWI: -0.503,
      SAVI: 0.660,
      soil_moisture: 20.87,
      temperature: 6.56,
      rainfall: 6.98,
      field_id: 'Field_14',
      date_of_image: '2023-01-08',
    },
  },
  {
    id: 'sample_jowar',
    name: 'Jowar / Sorghum (Maharashtra)',
    crop: 'Jowar',
    region: 'Deccan Plateau',
    description: 'Black soil region with high vegetative index and lower soil moisture.',
    input: {
      crop_type: 'Jowar',
      latitude: 19.095,
      longitude: 74.868,
      NDVI: 0.566,
      GNDVI: 0.571,
      NDWI: -0.571,
      SAVI: 0.849,
      soil_moisture: 16.11,
      temperature: 16.65,
      rainfall: 7.95,
      field_id: 'Field_32',
      date_of_image: '2023-01-12',
    },
  },
  {
    id: 'sample_soybean',
    name: 'Soybean (Madhya Pradesh)',
    crop: 'Soybean',
    region: 'Central Plateau',
    description: 'Moderate canopy density with balanced soil moisture levels.',
    input: {
      crop_type: 'Soybean',
      latitude: 23.324,
      longitude: 77.397,
      NDVI: 0.455,
      GNDVI: 0.425,
      NDWI: -0.425,
      SAVI: 0.683,
      soil_moisture: 24.71,
      temperature: 14.20,
      rainfall: 7.30,
      field_id: 'Field_45',
      date_of_image: '2023-01-15',
    },
  },
  {
    id: 'sample_sugarcane',
    name: 'Sugarcane (Uttar Pradesh)',
    crop: 'Sugarcane',
    region: 'Upper Gangetic Plain',
    description: 'Intensive cultivation zone with robust crop vigor.',
    input: {
      crop_type: 'Sugarcane',
      latitude: 26.707,
      longitude: 80.861,
      NDVI: 0.402,
      GNDVI: 0.439,
      NDWI: -0.439,
      SAVI: 0.603,
      soil_moisture: 24.56,
      temperature: 7.52,
      rainfall: 9.62,
      field_id: 'Field_60',
      date_of_image: '2023-01-18',
    },
  },
];
