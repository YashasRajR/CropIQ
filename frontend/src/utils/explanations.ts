import { FeatureContribution } from '../types/explanation';
import { PredictionResponse, RiskPayload, UncertaintyPayload, ContextPayload } from '../types/prediction';
import { ScenarioResponse } from '../types/scenario';
import { FarmInput } from '../types/farm';
import { formatNumber, formatDiff } from './formatting';

/**
 * Human-friendly names for model features.
 */
export const FEATURE_FRIENDLY_NAMES: Record<string, string> = {
  NDVI: 'Canopy Greenness & Plant Health',
  GNDVI: 'Canopy Chlorophyll & Vigor',
  SAVI: 'Plant Cover & Density',
  NDWI: 'Canopy Water Status',
  soil_moisture: 'Root-Zone Soil Moisture',
  rainfall: 'Recent Rainfall',
  temperature: 'Air Temperature',
  latitude: 'Field Location (Latitude)',
  longitude: 'Field Location (Longitude)',
  crop_type: 'Crop Species',
};

/**
 * Returns a clean, farmer-friendly display name for any model feature.
 */
export function getFriendlyFeatureName(feature: string): string {
  if (FEATURE_FRIENDLY_NAMES[feature]) {
    return FEATURE_FRIENDLY_NAMES[feature];
  }
  // Fallback: replace underscores and capitalize words
  return feature
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Categorize feature contribution into 4 distinct influence tiers.
 */
export interface InfluenceTier {
  tier: 'STRONG' | 'IMPORTANT' | 'SOME' | 'LOWER';
  label: string;
  badgeVariant: 'emerald' | 'amber' | 'sky' | 'slate';
  description: string;
}

export function getInfluenceTier(magnitude: number): InfluenceTier {
  const abs = Math.abs(magnitude);
  if (abs >= 2.0) {
    return {
      tier: 'STRONG',
      label: 'Strong influence',
      badgeVariant: 'emerald',
      description: 'Major driver with large impact on your estimate',
    };
  }
  if (abs >= 1.0) {
    return {
      tier: 'IMPORTANT',
      label: 'Important influence',
      badgeVariant: 'sky',
      description: 'Notable factor meaningfully shaping yield',
    };
  }
  if (abs >= 0.4) {
    return {
      tier: 'SOME',
      label: 'Some influence',
      badgeVariant: 'amber',
      description: 'Moderate factor contributing to results',
    };
  }
  return {
    tier: 'LOWER',
    label: 'Lower influence',
    badgeVariant: 'slate',
    description: 'Minor secondary influence',
  };
}

/**
 * Generates a plain-language sentence explaining a specific factor's role.
 */
export function getFactorExplanation(
  factor: FeatureContribution,
  cropName = 'crop'
): {
  headline: string;
  sentence: string;
  actionText: string;
  isHelping: boolean;
} {
  const isHelping = factor.contribution >= 0;
  const friendlyName = getFriendlyFeatureName(factor.feature || factor.display_name);
  const val = factor.observed_value !== undefined ? formatNumber(factor.observed_value, 2) : null;
  const absCont = formatNumber(Math.abs(factor.contribution), 2);

  // Positive interpretations
  if (isHelping) {
    switch (factor.feature) {
      case 'NDVI':
      case 'GNDVI':
      case 'SAVI':
        return {
          headline: 'Healthy Green Canopy',
          sentence: `Strong canopy greenness${val ? ` (index ${val})` : ''} indicates robust vegetative vigor, actively supporting higher yield potential for your ${cropName}.`,
          actionText: `Boosts estimate by ~${absCont}`,
          isHelping: true,
        };
      case 'NDWI':
        return {
          headline: 'Adequate Canopy Hydration',
          sentence: `Favorable plant water index${val ? ` (${val})` : ''} indicates healthy internal foliage moisture and good transpiration.`,
          actionText: `Boosts estimate by ~${absCont}`,
          isHelping: true,
        };
      case 'soil_moisture':
        return {
          headline: 'Favorable Soil Moisture',
          sentence: `Root-zone soil moisture${val ? ` (${val})` : ''} is in a healthy range, sustaining continuous nutrient uptake.`,
          actionText: `Boosts estimate by ~${absCont}`,
          isHelping: true,
        };
      case 'rainfall':
        return {
          headline: 'Beneficial Recent Rainfall',
          sentence: `Precipitation levels${val ? ` (~${val} mm)` : ''} have provided steady hydration for growth.`,
          actionText: `Boosts estimate by ~${absCont}`,
          isHelping: true,
        };
      case 'temperature':
        return {
          headline: 'Optimal Air Temperature',
          sentence: `Air temperature${val ? ` (~${val}°C)` : ''} is well within the favorable thermal window for ${cropName}.`,
          actionText: `Boosts estimate by ~${absCont}`,
          isHelping: true,
        };
      default:
        return {
          headline: `Favorable ${friendlyName}`,
          sentence: `Current reading for ${friendlyName}${val ? ` (${val})` : ''} aligns with higher yielding plots in model training data.`,
          actionText: `Boosts estimate by ~${absCont}`,
          isHelping: true,
        };
    }
  }

  // Negative / Restricting interpretations
  switch (factor.feature) {
    case 'soil_moisture':
      return {
        headline: 'Moisture Deficit in Soil',
        sentence: `Root-zone moisture${val ? ` (${val})` : ''} is lower than ideal, which may cause water stress and hold potential yield back.`,
        actionText: `Pulls down estimate by ~${absCont}`,
        isHelping: false,
      };
    case 'rainfall':
      return {
        headline: 'Limited Rainfall Accumulation',
        sentence: `Low recent precipitation${val ? ` (~${val} mm)` : ''} is restricting yield potential unless supplemented by irrigation.`,
        actionText: `Pulls down estimate by ~${absCont}`,
        isHelping: false,
      };
    case 'NDVI':
    case 'GNDVI':
    case 'SAVI':
      return {
        headline: 'Reduced Canopy Greenness',
        sentence: `Canopy greenness${val ? ` (${val})` : ''} is lower than top-performing fields, suggesting thinner leaf cover or stress.`,
        actionText: `Pulls down estimate by ~${absCont}`,
        isHelping: false,
      };
    case 'NDWI':
      return {
        headline: 'Canopy Water Deficit',
        sentence: `Satellite water index${val ? ` (${val})` : ''} suggests mild foliage dehydration under current sunshine or wind.`,
        actionText: `Pulls down estimate by ~${absCont}`,
        isHelping: false,
      };
    case 'temperature':
      return {
        headline: 'Suboptimal Air Temperature',
        sentence: `Temperature${val ? ` (~${val}°C)` : ''} deviates from ideal growth rates for ${cropName}, increasing respiration or stress.`,
        actionText: `Pulls down estimate by ~${absCont}`,
        isHelping: false,
      };
    default:
      return {
        headline: `Constraining ${friendlyName}`,
        sentence: `Current level for ${friendlyName}${val ? ` (${val})` : ''} is holding back maximum yield in comparison to optimal benchmarks.`,
        actionText: `Pulls down estimate by ~${absCont}`,
        isHelping: false,
      };
  }
}

/**
 * Natural language explanation for the primary yield prediction.
 */
export function explainPrediction(
  yieldVal: number,
  unit = 'unconfirmed',
  context?: ContextPayload,
  topPos?: FeatureContribution,
  topNeg?: FeatureContribution
): {
  headline: string;
  meaning: string;
  whyEstimate: string;
} {
  const crop = context?.crop || 'this crop';
  const formattedVal = formatNumber(yieldVal, 1);
  const headline = `Around ${formattedVal} ${unit}`;
  const meaning = `CropIQ estimates that your farm could produce around ${formattedVal} ${unit} of ${crop} based on the field conditions and satellite data provided.`;

  let whyEstimate = `CropIQ evaluated your field against historical records. `;
  if (topPos && topNeg) {
    const posName = getFriendlyFeatureName(topPos.feature || topPos.display_name);
    const negName = getFriendlyFeatureName(topNeg.feature || topNeg.display_name);
    whyEstimate += `Strong ${posName.toLowerCase()} is actively supporting your yield, while ${negName.toLowerCase()} is currently keeping it from reaching its full potential.`;
  } else if (topPos) {
    const posName = getFriendlyFeatureName(topPos.feature || topPos.display_name);
    whyEstimate += `Favorable ${posName.toLowerCase()} is the primary driver lifting your yield estimate.`;
  } else if (topNeg) {
    const negName = getFriendlyFeatureName(topNeg.feature || topNeg.display_name);
    whyEstimate += `Lower ${negName.toLowerCase()} is the primary factor limiting your yield estimate.`;
  } else {
    whyEstimate += `Observed soil moisture, weather, and canopy readings combine to produce this balanced forecast.`;
  }

  return { headline, meaning, whyEstimate };
}

/**
 * Natural language explanation for risk status.
 */
export function explainRisk(risk: RiskPayload): {
  title: string;
  badgeLabel: string;
  meaning: string;
  summary: string;
} {
  switch (risk.level) {
    case 'LOW':
      return {
        title: 'Crop Risk: Low',
        badgeLabel: 'Low Risk',
        meaning: 'Growing conditions look favorable. No critical yield threats detected in current readings.',
        summary: 'Field indicators show strong vigor and adequate moisture for sustained growth.',
      };
    case 'MODERATE':
      return {
        title: 'Crop Risk: Moderate',
        badgeLabel: 'Moderate Risk',
        meaning: 'Your crop looks generally healthy, but a few conditions could reduce yield if left unmanaged.',
        summary: 'Targeted field attention can help prevent minor stress from impacting final harvest.',
      };
    case 'HIGH':
    default:
      return {
        title: 'Crop Risk: High',
        badgeLabel: 'High Risk',
        meaning: 'Significant stress factors detected. Yield potential is substantially at risk without management intervention.',
        summary: 'Immediate field scouting and protective measures are recommended to protect the crop.',
      };
  }
}

/**
 * Natural language explanation for prediction reliability.
 */
export function explainReliability(
  uncertainty: UncertaintyPayload,
  dataQuality?: { out_of_distribution?: boolean; extrapolation_warning?: boolean }
): {
  badgeLabel: string;
  badgeVariant: 'emerald' | 'amber' | 'rose';
  meaning: string;
  likelyRangeText: string;
  oodNotice?: string;
} {
  const isOod = dataQuality?.out_of_distribution || dataQuality?.extrapolation_warning;

  let badgeLabel = 'High Reliability';
  let badgeVariant: 'emerald' | 'amber' | 'rose' = 'emerald';
  let meaning = 'CropIQ has high confidence in this estimate because your farm conditions closely match patterns in thousands of real farm records.';

  if (isOod) {
    badgeLabel = 'Outside Usual Range';
    badgeVariant = 'amber';
    meaning = 'Some field conditions you entered deviate from typical patterns in our regional database, which increases estimation uncertainty.';
  } else if (uncertainty.classification === 'MODERATE') {
    badgeLabel = 'Moderate Reliability';
    badgeVariant = 'amber';
    meaning = 'Confidence is reasonable, though slight variability across model decision trees suggests variable local conditions.';
  } else if (uncertainty.classification === 'HIGH') {
    badgeLabel = 'Lower Reliability';
    badgeVariant = 'rose';
    meaning = 'There is higher variance in model trees for these specific conditions; use this estimate as general guidance.';
  }

  const hasBounds = uncertainty.lower_bound !== undefined && uncertainty.upper_bound !== undefined;
  const likelyRangeText = hasBounds
    ? `Your actual harvest will likely fall between ${formatNumber(uncertainty.lower_bound, 1)} and ${formatNumber(uncertainty.upper_bound, 1)} under similar conditions.`
    : `Expected variation is within ±${formatNumber(uncertainty.std_yield ?? 0.5, 2)} under similar conditions.`;

  const oodNotice = isOod
    ? 'Heads up: Some conditions you entered (like extreme temperature or unusual soil moisture) are outside what CropIQ typically sees. This means our estimate is less certain than usual.'
    : undefined;

  return {
    badgeLabel,
    badgeVariant,
    meaning,
    likelyRangeText,
    oodNotice,
  };
}

/**
 * Natural language explanation for scenario what-if comparisons.
 */
export function explainScenarioComparison(scenario: ScenarioResponse): {
  headline: string;
  whatChanged: string;
  whatDoesItMean: string;
  disclaimer: string;
} {
  const { comparison, baseline, scenario: scen } = scenario;
  const diff = comparison.absolute_change;
  const isPositive = diff > 0;
  const isMaterial = comparison.is_material;
  const changedFeatures = scenario.explanation?.changed_features || Object.keys(scen.changes || {});

  const friendlyFeatureNames = changedFeatures
    .map((f) => getFriendlyFeatureName(f).toLowerCase())
    .join(' and ');

  const formattedDiff = formatDiff(diff, baseline.unit);
  const headline = isMaterial
    ? isPositive
      ? `Noticeable Potential Gain (${formattedDiff})`
      : `Potential Yield Reduction (${formattedDiff})`
    : `Modest Statistical Fluctuation (${formattedDiff})`;

  const whatChanged = `When ${friendlyFeatureNames || 'field conditions'} were adjusted in the model, estimated yield shifted from ${formatNumber(baseline.predicted_yield, 2)} to ${formatNumber(scen.predicted_yield, 2)} ${baseline.unit}.`;

  let whatDoesItMean = '';
  if (isMaterial) {
    if (isPositive) {
      whatDoesItMean = `This suggests that improving ${friendlyFeatureNames || 'these conditions'} could noticeably help yield potential under similar field settings.`;
    } else {
      whatDoesItMean = `This indicates that a drop in ${friendlyFeatureNames || 'these conditions'} is associated with lower yield outcomes in historical data.`;
    }
  } else {
    whatDoesItMean = `This small difference (${formattedDiff}) is within normal model variation margins (${formatNumber(comparison.material_threshold, 2)} ${baseline.unit}) and may not reflect a meaningful difference in the field.`;
  }

  const disclaimer =
    'When conditions were changed in the model, the estimated yield changed. This reflects mathematical model associations based on historical data, not a guaranteed causal field outcome.';

  return {
    headline,
    whatChanged,
    whatDoesItMean,
    disclaimer,
  };
}

/**
 * Generates the unified "Bottom Line for Your Farm" summary card content.
 */
export interface FarmSummaryNarrative {
  title: string;
  yieldSentence: string;
  driversSentence: string;
  riskSentence: string;
  actionSentence: string;
  overallStatus: 'favorable' | 'watch' | 'attention';
  statusBadge: string;
}

export function generateFarmSummary(
  predictionResp: PredictionResponse,
  farmInput: FarmInput
): FarmSummaryNarrative {
  const crop = farmInput.crop_type || predictionResp.context?.crop || 'crop';
  const yieldVal = predictionResp.prediction.yield;
  const unit = predictionResp.prediction.unit || 'unconfirmed';
  const risk = predictionResp.risk;
  const topPos = predictionResp.explanation?.top_positive_factors?.[0];
  const topNeg = predictionResp.explanation?.top_negative_factors?.[0];
  const recs = predictionResp.recommendations || [];
  const topRec = recs.find((r) => r.priority === 'HIGH') || recs[0];

  // 1. Yield Outlook Sentence
  const yieldSentence = `Your estimated yield for this ${crop} plot is around ${formatNumber(yieldVal, 1)} ${unit}.`;

  // 2. Main Drivers Sentence
  let driversSentence = '';
  if (topPos && topNeg) {
    const posName = getFriendlyFeatureName(topPos.feature || topPos.display_name);
    const negName = getFriendlyFeatureName(topNeg.feature || topNeg.display_name);
    driversSentence = `Yield potential is supported by strong ${posName.toLowerCase()}, but held back by ${negName.toLowerCase()}.`;
  } else if (topPos) {
    const posName = getFriendlyFeatureName(topPos.feature || topPos.display_name);
    driversSentence = `Healthy ${posName.toLowerCase()} is the primary positive factor lifting your forecast.`;
  } else if (topNeg) {
    const negName = getFriendlyFeatureName(topNeg.feature || topNeg.display_name);
    driversSentence = `Lower ${negName.toLowerCase()} is the primary factor limiting higher yield.`;
  } else {
    driversSentence = `Current vegetative vigor and environmental readings provide a stable growth baseline.`;
  }

  // 3. Risk Sentence
  let riskSentence = '';
  let overallStatus: 'favorable' | 'watch' | 'attention' = 'favorable';
  let statusBadge = 'Favorable Outlook';

  if (risk.level === 'LOW') {
    riskSentence = 'Overall crop risk is low, with favorable field indicators protecting development.';
    overallStatus = 'favorable';
    statusBadge = 'Favorable Outlook';
  } else if (risk.level === 'MODERATE') {
    const driverMention = risk.drivers?.[0] ? ` — keep an eye on ${risk.drivers[0].toLowerCase()}` : '';
    riskSentence = `Overall crop risk is moderate${driverMention}.`;
    overallStatus = 'watch';
    statusBadge = 'Watch Closely';
  } else {
    const driverMention = risk.drivers?.[0] ? `: ${risk.drivers[0]}` : '';
    riskSentence = `Crop risk is elevated${driverMention}, indicating notable stress on the plot.`;
    overallStatus = 'attention';
    statusBadge = 'Attention Needed';
  }

  // 4. Action Sentence
  let actionSentence = '';
  if (topRec) {
    actionSentence = `Consider: ${topRec.action || topRec.title}.`;
  } else {
    actionSentence = 'Continue routine scouting and maintain consistent moisture management.';
  }

  return {
    title: 'The Bottom Line for Your Farm',
    yieldSentence,
    driversSentence,
    riskSentence,
    actionSentence,
    overallStatus,
    statusBadge,
  };
}
