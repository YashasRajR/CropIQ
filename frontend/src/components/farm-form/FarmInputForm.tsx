import React, { useState } from 'react';
import { Play, RotateCcw, CloudSun, Sprout, Satellite, MapPin, Locate, ChevronDown } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { ExampleSelector } from './ExampleSelector';
import { FarmInput, ScenarioFeaturesCatalog, SUPPORTED_CROPS } from '../../types/farm';
import { FEATURE_DICTIONARY } from '../../config/constants';
import { validateFarmInput, FormValidationErrors } from '../../utils/validation';

interface FarmInputFormProps {
  initialInput: FarmInput;
  onSubmit: (input: FarmInput) => void;
  isLoading: boolean;
  onReset?: () => void;
  scenarioCatalog?: ScenarioFeaturesCatalog | null;
}

// Fields a farmer typically cannot read off a device or knows only roughly.
// We always send a sensible estimate for these so a prediction never blocks
// on data the farmer doesn't have.
const SATELLITE_SOIL_FIELDS: Array<keyof FarmInput> = ['NDVI', 'GNDVI', 'NDWI', 'SAVI', 'soil_moisture'];

export const FarmInputForm: React.FC<FarmInputFormProps> = ({
  initialInput,
  onSubmit,
  isLoading,
  onReset,
  scenarioCatalog,
}) => {
  const [formData, setFormData] = useState<FarmInput>(initialInput);
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

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

  const typicalValue = (field: keyof FarmInput): number | undefined =>
    scenarioCatalog?.features[field]?.training_stats?.median;

  const resetFieldToTypical = (field: keyof FarmInput) => {
    const median = typicalValue(field);
    if (median !== undefined) {
      setFormData((prev) => ({ ...prev, [field]: median }));
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Math.round(pos.coords.latitude * 10000) / 10000,
          longitude: Math.round(pos.coords.longitude * 10000) / 10000,
        }));
        setLocating(false);
      },
      () => {
        setLocateError("Couldn't get your location - allow location access, or type coordinates below.");
        setLocating(false);
      }
    );
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
            <span>Tell us about your farm</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fill in what you know. We'll estimate the rest and you can adjust it later.
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
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Crop & Location</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Crop Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                Crop <span className="text-emerald-400">*</span>
              </label>
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
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                Latitude <span className="text-emerald-400">*</span>
              </label>
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
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                Longitude <span className="text-emerald-400">*</span>
              </label>
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

            {/* Use my location */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:border-emerald-500/60 hover:text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Locate className="w-3.5 h-3.5" />
                {locating ? 'Locating…' : "Use my location"}
              </button>
              {locateError && (
                <p className="text-[10px] text-rose-400 mt-1">{locateError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Weather (what a farmer typically knows) */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-1">
            <CloudSun className="w-3.5 h-3.5 text-sky-400" />
            <span>Weather</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Temperature (°C) <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content="Typical daytime temperature in your area right now." />
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
                  Recent rainfall (mm) <span className="text-emerald-400">*</span>
                </label>
                <Tooltip content="Roughly how much rain the field has received recently. A rough estimate is fine." />
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
          </div>
        </div>

        {/* Section 3: Satellite & soil data - optional, always pre-filled with a typical estimate */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-xs font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-1"
          >
            <span className="flex items-center gap-2">
              <Satellite className="w-3.5 h-3.5 text-purple-400" />
              Soil & satellite data (optional)
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          <p className="text-[11px] text-slate-500 -mt-2 mb-3">
            Don't have a soil probe or satellite feed for your field? Leave these as they are -
            we've already filled in typical values for your crop. Only change them if you have
            better numbers.
          </p>

          {showAdvanced && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {SATELLITE_SOIL_FIELDS.map((field) => (
                <div key={field}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      {FEATURE_DICTIONARY[field]?.label ?? field}
                    </label>
                    <Tooltip content={FEATURE_DICTIONARY[field]?.description ?? ''} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[field] as number}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                      errors[field] ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {typicalValue(field) !== undefined && (
                    <button
                      type="button"
                      onClick={() => resetFieldToTypical(field)}
                      className="text-[10px] text-slate-500 hover:text-emerald-400 mt-1"
                    >
                      Use typical value
                    </button>
                  )}
                  {errors[field] && (
                    <p className="text-[10px] text-rose-400 mt-1">{errors[field]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Submission Button */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end">
          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isLoading}
            rightIcon={<Play className="w-4 h-4 fill-current" />}
            className="w-full sm:w-auto px-8"
          >
            {isLoading ? 'Getting your prediction…' : 'Get Yield Prediction'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
