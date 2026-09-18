import React, { useState } from 'react';
import { Sprout, CloudSun, MapPin, Locate, ChevronDown, RotateCcw, ArrowRight, Layers, Droplets } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { ExampleSelector } from './ExampleSelector';
import { FarmInput, SUPPORTED_CROPS, ScenarioFeaturesCatalog } from '../../types/farm';
import { FEATURE_DICTIONARY } from '../../config/constants';
import { validateFarmInput, FormValidationErrors } from '../../utils/validation';

interface FarmInputFormProps {
  initialInput: FarmInput;
  onSubmit: (input: FarmInput) => void;
  isLoading: boolean;
  onReset?: () => void;
  scenarioCatalog?: ScenarioFeaturesCatalog | null;
}

const SATELLITE_FIELDS: Array<keyof FarmInput> = ['NDVI', 'GNDVI', 'NDWI', 'SAVI'];

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

  const typicalValue = (field: string) =>
    scenarioCatalog?.features[field]?.training_stats?.median;

  const resetFieldToTypical = (field: keyof FarmInput) => {
    const median = typicalValue(field as string);
    if (median !== undefined) {
      setFormData((prev) => ({ ...prev, [field]: median }));
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Location is not supported by your browser.');
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
        setLocateError('Could not fetch GPS coordinates. Please enter them manually.');
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
    <Card variant="elevated" className="p-6 sm:p-8" id="farm-input-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Sprout className="w-5 h-5" />
            </span>
            <span>Tell Us About Your Farm</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose an example plot or enter your crop and field conditions to see your yield estimate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Form
          </Button>
        </div>
      </div>

      {/* 1-Click Example Presets */}
      <ExampleSelector
        onSelect={handleSelectPreset}
        selectedCrop={formData.crop_type}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Crop & Location */}
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>1. Crop & Plot Location</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Crop Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Crop Species <span className="text-emerald-700">*</span>
              </label>
              <select
                value={formData.crop_type}
                onChange={(e) => handleChange('crop_type', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${
                  errors.crop_type ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              >
                {SUPPORTED_CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.crop_type && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.crop_type}</p>
              )}
            </div>

            {/* Latitude */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Latitude <span className="text-emerald-700">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
                placeholder="e.g. 22.6250"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${
                  errors.latitude ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.latitude && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.latitude}</p>
              )}
            </div>

            {/* Longitude */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Longitude <span className="text-emerald-700">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
                placeholder="e.g. 88.4980"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${
                  errors.longitude ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.longitude && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.longitude}</p>
              )}
            </div>

            {/* Use My Location Button */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 text-xs font-semibold text-slate-700 hover:text-emerald-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[42px]"
              >
                <Locate className="w-4 h-4 text-emerald-700" />
                <span>{locating ? 'Locating...' : 'Use My GPS Location'}</span>
              </button>
              {locateError && (
                <p className="text-[11px] text-rose-600 mt-1">{locateError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Farm Conditions (Soil Moisture & Weather) */}
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
            <CloudSun className="w-4 h-4 text-emerald-700" />
            <span>2. Soil Moisture & Weather Conditions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Soil Moisture */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Soil Moisture (%)</span>
                  <span className="text-emerald-700">*</span>
                </label>
                <Tooltip content="Volumetric water content in the root zone (typically 15% to 45%)." />
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.soil_moisture}
                onChange={(e) => handleChange('soil_moisture', e.target.value)}
                placeholder="e.g. 22.0"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${
                  errors.soil_moisture ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Root-zone water content</span>
              {errors.soil_moisture && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.soil_moisture}</p>
              )}
            </div>

            {/* Rainfall */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <span>🌧️ Recent Rainfall (mm)</span>
                  <span className="text-emerald-700">*</span>
                </label>
                <Tooltip content="Cumulative precipitation recorded recently over your field." />
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.rainfall}
                onChange={(e) => handleChange('rainfall', e.target.value)}
                placeholder="e.g. 17.5"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${
                  errors.rainfall ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Rainfall received</span>
              {errors.rainfall && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.rainfall}</p>
              )}
            </div>

            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <span>☀️ Temperature (°C)</span>
                  <span className="text-emerald-700">*</span>
                </label>
                <Tooltip content="Average ambient air temperature at the farm." />
              </div>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', e.target.value)}
                placeholder="e.g. 14.6"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${
                  errors.temperature ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Average field temperature</span>
              {errors.temperature && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.temperature}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Expandable Advanced Farm Data (Satellite & Sensor Readings) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Advanced Farm Data: Satellite Vegetation Indices</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-800 font-semibold hidden sm:inline">
                {showAdvanced ? 'Hide Details' : 'View / Edit (4 Indices)'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            These 4 indices (NDVI, GNDVI, NDWI, SAVI) are measured by earth-observation satellites
            to assess canopy greenness, chlorophyll, and leaf water content.
            They are automatically pre-filled from your selected example field.
          </p>

          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-200">
              {SATELLITE_FIELDS.map((field) => (
                <div key={field} className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      {field}
                    </label>
                    <Tooltip content={FEATURE_DICTIONARY[field]?.description ?? ''} />
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1.5">
                    {field === 'NDVI' && 'Canopy Greenness'}
                    {field === 'GNDVI' && 'Chlorophyll Vigor'}
                    {field === 'NDWI' && 'Canopy Water Index'}
                    {field === 'SAVI' && 'Soil-Adjusted Vigor'}
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={formData[field] as number}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg bg-slate-50 border text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      errors[field] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  {typicalValue(field as string) !== undefined && (
                    <button
                      type="button"
                      onClick={() => resetFieldToTypical(field)}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 hover:underline mt-1.5 block cursor-pointer"
                    >
                      Reset to median ({typicalValue(field as string)?.toFixed(2)})
                    </button>
                  )}
                  {errors[field] && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors[field]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit CTA */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Calculated live using the trained Phase 2 machine learning model.
          </p>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto px-8 py-3.5 text-base"
          >
            {isLoading ? 'Checking your farm and estimating yield...' : 'Estimate My Yield'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
