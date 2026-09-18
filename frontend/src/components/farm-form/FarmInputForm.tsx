import React, { useState } from 'react';
import { Play, RotateCcw, CloudSun, Sprout, Satellite, MapPin, AlertCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { ExampleSelector } from './ExampleSelector';
import { FarmInput, SUPPORTED_CROPS } from '../../types/farm';
import { FEATURE_DICTIONARY } from '../../config/constants';
import { validateFarmInput, FormValidationErrors } from '../../utils/validation';

interface FarmInputFormProps {
  initialInput: FarmInput;
  onSubmit: (input: FarmInput) => void;
  isLoading: boolean;
  onReset?: () => void;
}

export const FarmInputForm: React.FC<FarmInputFormProps> = ({
  initialInput,
  onSubmit,
  isLoading,
  onReset,
}) => {
  const [formData, setFormData] = useState<FarmInput>(initialInput);
  const [errors, setErrors] = useState<FormValidationErrors>({});

  const handleSelectPreset = (preset: FarmInput) => {
    setFormData(preset);
    setErrors({});
  };

  const handleChange = (field: keyof FarmInput, value: string) => {
    let parsed: string | number = value;
    if (field !== 'crop_type' && field !== 'field_id' && field !== 'date_of_image') {
      const num = parseFloat(value);
      parsed = isNaN(num) ? 0 : num;
    }

    setFormData((prev) => ({ ...prev, [field]: parsed }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateFarmInput(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(formData);
  };

  const handleClear = () => {
    if (onReset) onReset();
    setErrors({});
  };

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="analysis-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <span>Farm Conditions & Input Parameters</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Specify plot conditions to execute the machine learning prediction pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Form
          </Button>
        </div>
      </div>

      {/* Real Observation Presets */}
      <ExampleSelector
        onSelect={handleSelectPreset}
        selectedCrop={formData.crop_type}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Crop & Location */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-3 border-b border-slate-800 pb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Crop & Geographic Coordinates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Crop Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Crop Species <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.crop_type.description} />
              </div>
              <select
                value={formData.crop_type}
                onChange={(e) => handleChange('crop_type', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.crop_type ? 'border-rose-500' : 'border-slate-800'
                }`}
              >
                {SUPPORTED_CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.crop_type && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.crop_type}</p>
              )}
            </div>

            {/* Latitude */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Latitude (°N) <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.latitude.description} />
              </div>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.latitude ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.latitude && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.latitude}</p>
              )}
            </div>

            {/* Longitude */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Longitude (°E) <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.longitude.description} />
              </div>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.longitude ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.longitude && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.longitude}</p>
              )}
            </div>

            {/* Field Plot ID (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Plot ID <span className="text-[10px] text-slate-500">(Metadata)</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="e.g. Field_101"
                value={formData.field_id || ''}
                onChange={(e) => handleChange('field_id', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Weather & Soil */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold mb-3 border-b border-slate-800 pb-1">
            <CloudSun className="w-3.5 h-3.5" />
            <span>Weather & Soil Conditions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Temperature (°C) <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.temperature.description} />
              </div>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.temperature ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.temperature && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.temperature}</p>
              )}
            </div>

            {/* Rainfall */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Rainfall (mm) <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.rainfall.description} />
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.rainfall}
                onChange={(e) => handleChange('rainfall', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.rainfall ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.rainfall && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.rainfall}</p>
              )}
            </div>

            {/* Soil Moisture */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Soil Moisture <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.soil_moisture.description} />
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.soil_moisture}
                onChange={(e) => handleChange('soil_moisture', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.soil_moisture ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.soil_moisture && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.soil_moisture}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Satellite Vegetation Indices */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold mb-3 border-b border-slate-800 pb-1">
            <Satellite className="w-3.5 h-3.5" />
            <span>Remote Sensing Vegetation Indices</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* NDVI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  NDVI <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.NDVI.description} />
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.NDVI}
                onChange={(e) => handleChange('NDVI', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.NDVI ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.NDVI && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.NDVI}</p>
              )}
            </div>

            {/* GNDVI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  GNDVI <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.GNDVI.description} />
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.GNDVI}
                onChange={(e) => handleChange('GNDVI', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.GNDVI ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.GNDVI && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.GNDVI}</p>
              )}
            </div>

            {/* NDWI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  NDWI <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.NDWI.description} />
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.NDWI}
                onChange={(e) => handleChange('NDWI', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.NDWI ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.NDWI && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.NDWI}</p>
              )}
            </div>

            {/* SAVI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  SAVI <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content={FEATURE_DICTIONARY.SAVI.description} />
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.SAVI}
                onChange={(e) => handleChange('SAVI', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  errors.SAVI ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.SAVI && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.SAVI}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Submission Button */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Sends real request to FastAPI endpoint <code className="text-emerald-300 font-mono">POST /predict</code>.</span>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isLoading}
            rightIcon={<Play className="w-4 h-4 fill-current" />}
            className="w-full sm:w-auto px-8"
          >
            {isLoading ? 'Executing Intelligence Pipeline...' : 'Analyze Farm Conditions'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
