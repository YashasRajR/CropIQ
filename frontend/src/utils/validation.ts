import { FarmInput } from '../types/farm';

export interface FormValidationErrors {
  [key: string]: string;
}

// Fields a farmer can reasonably supply themselves. Satellite/soil-sensor
// readings (NDVI, GNDVI, NDWI, SAVI, soil_moisture) are never required —
// the form always ships a sensible regional estimate for them, and a
// farmer who doesn't have a soil probe or satellite feed can just leave
// that estimate in place.
export function validateFarmInput(input: Partial<FarmInput>): FormValidationErrors {
  const errors: FormValidationErrors = {};

  if (!input.crop_type || input.crop_type.trim() === '') {
    errors.crop_type = 'Please select a crop.';
  }

  if (input.latitude === undefined || isNaN(input.latitude)) {
    errors.latitude = 'Please set your farm location.';
  } else if (input.latitude < -90 || input.latitude > 90) {
    errors.latitude = 'Latitude must be between -90 and 90.';
  }

  if (input.longitude === undefined || isNaN(input.longitude)) {
    errors.longitude = 'Please set your farm location.';
  } else if (input.longitude < -180 || input.longitude > 180) {
    errors.longitude = 'Longitude must be between -180 and 180.';
  }

  if (input.temperature === undefined || isNaN(input.temperature)) {
    errors.temperature = 'Temperature is required.';
  } else if (input.temperature < -50 || input.temperature > 65) {
    errors.temperature = 'Temperature must be between -50°C and 65°C.';
  }

  if (input.rainfall === undefined || isNaN(input.rainfall) || input.rainfall < 0) {
    errors.rainfall = 'Rainfall cannot be negative.';
  }

  // Satellite/soil readings: sanity-check only if the farmer edited them
  // away from a plausible range - never block submission for "missing"
  // values, since a default estimate is always present.
  if (input.soil_moisture !== undefined && input.soil_moisture < 0) {
    errors.soil_moisture = 'Soil moisture cannot be negative.';
  }
  const indices: Array<keyof FarmInput> = ['NDVI', 'GNDVI', 'NDWI', 'SAVI'];
  for (const idx of indices) {
    const val = input[idx] as number | undefined;
    if (val !== undefined && (val < -2.0 || val > 2.0)) {
      errors[idx] = `${idx} must be between -2.0 and 2.0.`;
    }
  }

  return errors;
}
