import { FarmInput } from '../types/farm';

export interface FormValidationErrors {
  [key: string]: string;
}

export function validateFarmInput(input: Partial<FarmInput>): FormValidationErrors {
  const errors: FormValidationErrors = {};

  if (!input.crop_type || input.crop_type.trim() === '') {
    errors.crop_type = 'Please select a crop species.';
  }

  if (input.latitude === undefined || isNaN(input.latitude)) {
    errors.latitude = 'Latitude is required.';
  } else if (input.latitude < -90 || input.latitude > 90) {
    errors.latitude = 'Latitude must be between -90 and 90.';
  }

  if (input.longitude === undefined || isNaN(input.longitude)) {
    errors.longitude = 'Longitude is required.';
  } else if (input.longitude < -180 || input.longitude > 180) {
    errors.longitude = 'Longitude must be between -180 and 180.';
  }

  if (input.temperature === undefined || isNaN(input.temperature)) {
    errors.temperature = 'Temperature is required.';
  } else if (input.temperature < -50 || input.temperature > 65) {
    errors.temperature = 'Temperature must be between -50°C and 65°C.';
  }

  if (input.rainfall === undefined || isNaN(input.rainfall)) {
    errors.rainfall = 'Rainfall is required.';
  } else if (input.rainfall < 0) {
    errors.rainfall = 'Rainfall cannot be negative.';
  }

  if (input.soil_moisture === undefined || isNaN(input.soil_moisture)) {
    errors.soil_moisture = 'Soil moisture is required.';
  } else if (input.soil_moisture < 0) {
    errors.soil_moisture = 'Soil moisture cannot be negative.';
  }

  // Vegetation indices
  const indices: Array<keyof FarmInput> = ['NDVI', 'GNDVI', 'NDWI', 'SAVI'];
  for (const idx of indices) {
    const val = input[idx];
    if (val === undefined || isNaN(val as number)) {
      errors[idx] = `${idx} is required.`;
    } else if ((val as number) < -2.0 || (val as number) > 2.0) {
      errors[idx] = `${idx} must be between -2.0 and 2.0.`;
    }
  }

  return errors;
}
