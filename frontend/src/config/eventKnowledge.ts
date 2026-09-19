/**
 * CropIQ Grounded Agronomic Event Guidance Catalog
 * Grounded in FAO Irrigation & Drainage Papers and ICAR Field Crop Management Guides.
 * Strict Anti-Fabrication Rule: No fake arbitrary yield reduction percentages are claimed.
 */

import { ObservationType, EventImpactGuidance } from '../types/events';

export const EVENT_GUIDANCE_CATALOG: Record<ObservationType, EventImpactGuidance> = {
  HAIL: {
    type: 'HAIL',
    title: 'Hailstorm Impact Assessment',
    badgeLabel: 'Severe Weather Event',
    severity: 'critical',
    whatItMeans:
      'Hailstones cause direct physical trauma: tearing canopy leaves, breaking lateral branches, and bruising stems. Defoliation reduces active photosynthetic surface area, while open bark wounds create infection pathways for opportunistic fungal and bacterial pathogens. If hail hits during flowering or squaring, premature blossom drop can occur.',
    checklist: [
      'Inspect outer and upper canopy for leaf tearing and shredding',
      'Check main stems and branches for bruising or fractures',
      'Examine whether terminal buds or growing points are intact',
      'Check ground for premature flower, square, or pod drop',
      'Assess percentage of field area showing plant lodging (flattened plants)',
    ],
    recommendedActions: [
      'Conduct a thorough field walk 24 to 48 hours after the storm once plants dry',
      'Allow 3 to 5 days before deciding on pruning or drastic action, allowing surviving buds to sprout',
      'Clear blocked field ditches to prevent secondary waterlogging around damaged root crowns',
      'Consult local agricultural extension officer before applying protective foliar fungicides to open wounds',
    ],
    suggestedScenario: {
      feature: 'NDVI',
      deltaPercentage: -15,
      scenarioName: 'Hail Canopy Defoliation (-15% NDVI)',
      description: 'Simulate how a 15% reduction in green canopy index influences model yield expectations.',
    },
    uncertaintyDisclaimer:
      'CropIQ does not invent an arbitrary percentage yield loss for physical hail impact. Actual yield recovery depends on the crop growth stage, terminal bud survival, and post-storm disease management.',
  },

  FLOOD: {
    type: 'FLOOD',
    title: 'Flooding & Waterlogging Assessment',
    badgeLabel: 'Soil & Water Stress',
    severity: 'critical',
    whatItMeans:
      'Standing water fills soil pore spaces, driving out oxygen (hypoxia). Roots cannot respire, halting active uptake of nitrogen, potassium, and phosphorus. Leaves may wilt or yellow despite abundance of water. Prolonged waterlogging beyond 48–72 hours severely degrades root integrity and encourages Phytophthora and Pythium root rots.',
    checklist: [
      'Measure standing water depth and note lowest-lying field zones',
      'Check leaf color: look for lower-leaf chlorosis (yellowing) indicating nitrogen leaching',
      'Check root condition: gently dig a sample root to see if root tips are white (healthy) or brown/slimy (rotted)',
      'Inspect field runoff outlets and primary drainage furrows for blockages',
    ],
    recommendedActions: [
      'Immediately clear or deepen perimeter drainage furrows to facilitate gravity drainage',
      'Withhold all basal fertilizer and irrigation while soil remains saturated',
      'Once soil surface dries sufficiently to walk, aerate crusted topsoil if possible',
      'Consider a mild foliar urea or micronutrient spray once roots begin to recover to bypass damaged uptake systems',
    ],
    suggestedScenario: {
      feature: 'soil_moisture',
      deltaPercentage: 25,
      scenarioName: 'Saturated Soil Moisture (+25%)',
      description: 'Simulate the predictive effect of elevated soil moisture on current crop yield.',
    },
    uncertaintyDisclaimer:
      'Waterlogging impact varies drastically by crop tolerance (e.g., Rice tolerates standing water, whereas Cotton and Pulses are highly intolerant). Reassess after drainage is restored.',
  },

  HEAT_STRESS: {
    type: 'HEAT_STRESS',
    title: 'High Heat & Moisture Deficit Stress',
    badgeLabel: 'Thermal Stress',
    severity: 'watch',
    whatItMeans:
      'Prolonged ambient temperatures above optimal thresholds increase vapor pressure deficit (VPD). Plants close stomata to conserve water, which halts carbon dioxide assimilation and causes internal tissue heat buildup. During anthesis (flowering), temperatures above 35°C can desiccate pollen grains and reduce seed or boll set.',
    checklist: [
      'Observe midday canopy posture: are leaves rolling or drooping?',
      'Check soil surface and root zone at 10-15 cm depth for dry cracking',
      'Inspect flowers and small fruit: look for drying stigmas or premature drop',
      'Check leaf edges for marginal tip burn or scorching',
    ],
    recommendedActions: [
      'Schedule irrigation during early morning or night hours to minimize evaporation losses',
      'Maintain adequate root zone moisture to support natural evaporative cooling through transpiration',
      'Avoid high-nitrogen fertilizer applications during severe heat spikes',
      'Consider organic mulching between crop rows to reduce soil surface heating and water loss',
    ],
    suggestedScenario: {
      feature: 'temperature',
      deltaPercentage: 15,
      scenarioName: 'Ambient Temperature Spike (+15%)',
      description: 'Test how elevated ambient temperature affects the model yield projection.',
    },
    uncertaintyDisclaimer:
      'Model association captures broad historical temperature trends. Local microclimates, canopy shading, and wind speeds will moderate in-field thermal exposure.',
  },

  HEAVY_RAIN: {
    type: 'HEAVY_RAIN',
    title: 'Excess Rainfall & Infiltration Analysis',
    badgeLabel: 'Precipitation Event',
    severity: 'watch',
    whatItMeans:
      'Intense rain events rapidly saturate surface soil horizons. On heavy clay soils, this can lead to surface runoff, topsoil erosion, and compaction crusts once dried. On well-drained sandy or loamy soils, heavy rain provides a deep soil moisture recharge but risks leaching soluble nitrates below the active root zone.',
    checklist: [
      'Verify if standing water drains within 12 to 24 hours',
      'Inspect field boundaries for evidence of rill erosion or soil movement',
      'Check whether newly planted seeds have been washed out or buried too deep under silt',
      'Check for hard surface crusting as the topsoil begins to dry out',
    ],
    recommendedActions: [
      'Ensure field drainage exits are unrestricted to avoid backflow',
      'If a surface crust forms on newly emerged crops, perform light mechanical harrowing to aid seedling emergence',
      'Test soil moisture depth before planning the next scheduled irrigation',
    ],
    suggestedScenario: {
      feature: 'rainfall',
      deltaPercentage: 30,
      scenarioName: 'High Rainfall Spike (+30%)',
      description: 'Simulate the predictive impact of sustained increased precipitation.',
    },
    uncertaintyDisclaimer:
      'Rainfall effectiveness depends on soil infiltration capacity and slope. Runoff water does not contribute to root-zone crop moisture.',
  },

  PEST_NOTICED: {
    type: 'PEST_NOTICED',
    title: 'Pest Activity Field Observation',
    badgeLabel: 'Biological Factor',
    severity: 'watch',
    whatItMeans:
      'Pest populations (e.g. sucking pests like aphids, thrips, jassids or chewing larvae like bollworms/armyworms) cause direct tissue loss or sap depletion. Early detection at low population densities prevents economic threshold exceedance. Uncontrolled infestations reduce leaf photosynthesis and cause direct cosmetic or yield damage.',
    checklist: [
      'Inspect the undersides of young leaves and growing shoots',
      'Count affected plants across 10 random spots in an X or W pattern across the field',
      'Look for frass (pest droppings), curling leaves, or sticky honeydew residues',
      'Check whether natural predators (ladybird beetles, spiders, parasitoids) are present',
    ],
    recommendedActions: [
      'Determine whether the infestation is localized to field borders or uniform throughout',
      'Consult the official Economic Threshold Level (ETL) guidelines for your specific crop from local KVK/ICAR',
      'Take photos of the pests and damaged leaves for verification by your local agricultural officer',
      'Prioritize biological controls, neem-based formulations, or targeted selective sprays over broad-spectrum chemicals',
    ],
    suggestedScenario: null,
    uncertaintyDisclaimer:
      'CropIQ does NOT currently claim automated computer-vision pest detection. Your logged observation is recorded as human ground truth in your Farm Memory timeline for advisory and historical review.',
  },

  LEAF_COLOR: {
    type: 'LEAF_COLOR',
    title: 'Canopy Discoloration & Chlorosis Review',
    badgeLabel: 'Canopy Symptom',
    severity: 'watch',
    whatItMeans:
      'Color shifts in foliage signal metabolic stress. General pale yellowing of older lower leaves usually reflects nitrogen mobility under deficiency or waterlogging. Yellowing between veins of young leaves suggests iron, zinc, or magnesium deficiency. Purpling of stems and lower leaves can indicate phosphorus stress under cold or compacted soils.',
    checklist: [
      'Determine whether discoloration is primarily on older lower leaves or new upper leaves',
      'Check if veins remain dark green while interveinal tissue turns yellow',
      'Check root zone for compacted soil layers or standing water',
      'Review date and rate of last fertilizer or manure application',
    ],
    recommendedActions: [
      'Rule out root waterlogging first before applying additional fertilizers',
      'If nitrogen deficiency is suspected, consider a split urea application or light foliar spray',
      'If interveinal chlorosis appears on young leaves, check soil pH and consider zinc sulfate / iron chelate foliar spray',
      'Log an inspection photo in Farm Memory to track color recovery over 7 days',
    ],
    suggestedScenario: {
      feature: 'NDVI',
      deltaPercentage: -10,
      scenarioName: 'Reduced Canopy Greenness (-10% NDVI)',
      description: 'Observe how reduced greenness indices adjust baseline yield projections.',
    },
    uncertaintyDisclaimer:
      'Visual leaf discoloration cannot replace chemical leaf or soil laboratory analysis. Use observations to target field verification.',
  },

  UNUSUAL_GROWTH: {
    type: 'UNUSUAL_GROWTH',
    title: 'Unusual Crop Growth or Stunting Pattern',
    badgeLabel: 'Growth Anomaly',
    severity: 'watch',
    whatItMeans:
      'Uneven growth patterns across the field usually point to spatial variability in soil texture, subsoil hardpans, localized salinity, nematode activity, or uneven planting depth. Identifying patches early allows targeted field management instead of treating the entire field uniformly.',
    checklist: [
      'Walk field to map whether stunted plants occur in circular patches, linear rows, or low areas',
      'Dig gently around stunted plants to inspect root architecture (taproot curling, nematode galls)',
      'Compare soil moisture and softness between vigorous and stunted zones',
    ],
    recommendedActions: [
      'Mark the affected GPS or plot area in your field memory',
      'Avoid over-fertilizing stunted patches until root depth and soil drainage are confirmed',
      'Schedule a subsoil probe or soil test after the current season to address hardpan compaction',
    ],
    suggestedScenario: null,
    uncertaintyDisclaimer:
      'Spatial growth variability requires ground inspection. CropIQ provides satellite context but ground-level root checks remain essential.',
  },

  NORMAL: {
    type: 'NORMAL',
    title: 'Normal Crop Condition Confirmation',
    badgeLabel: 'Scouting Update',
    severity: 'normal',
    whatItMeans:
      'Routine scouting confirms that crop development is progressing normally for the current growth stage. Canopy coverage, vegetative vigor, and soil conditions remain aligned with expected seasonal growth benchmarks.',
    checklist: [
      'Uniform canopy development across the plot',
      'No significant pest or disease pressure above economic thresholds',
      'Moisture levels adequate for current vegetative or reproductive demand',
    ],
    recommendedActions: [
      'Maintain current irrigation and nutrient management schedule',
      'Continue routine weekly scouting to catch emerging stresses early',
    ],
    suggestedScenario: null,
    uncertaintyDisclaimer:
      'Periodic normal observations establish valuable baseline history in your Farm Memory for future season comparisons.',
  },

  PHOTO_LOG: {
    type: 'PHOTO_LOG',
    title: 'Field Photo Observation Record',
    badgeLabel: 'Visual Record',
    severity: 'normal',
    whatItMeans:
      'Photographic documentation creates an auditable visual record of crop progress, canopy density, and field conditions over time. Photos help agricultural extension officers provide accurate remote advice.',
    checklist: [
      'Take photos in good daylight without harsh glare or heavy shadows',
      'Include a close-up of leaves/fruit and a wide shot of the field row',
      'Ensure the lens is focused on the area of interest',
    ],
    recommendedActions: [
      'Log photos weekly or after any significant weather or management event',
      'Share the visual record with your local agricultural advisor or agronomist',
    ],
    suggestedScenario: null,
    uncertaintyDisclaimer:
      'Photographs are stored as field ground truth. Automated computer-vision disease diagnosis is scheduled for future roadmap phases and is not claimed as an active model in this version.',
  },

  CUSTOM_NOTE: {
    type: 'CUSTOM_NOTE',
    title: 'Farmer Field Observation Note',
    badgeLabel: 'Farmer Note',
    severity: 'normal',
    whatItMeans:
      'First-hand farmer knowledge captures micro-conditions that remote sensing and macro-weather stations cannot see—such as irrigation timing, localized pest activity, weeding dates, and soil workability.',
    checklist: [
      'Record specific plot or zone if applicable',
      'Note any recent inputs, spray applications, or tillage work',
    ],
    recommendedActions: [
      'Keep continuous notes throughout the crop cycle to build robust Farm Memory for next season',
    ],
    suggestedScenario: null,
    uncertaintyDisclaimer:
      'Farmer observations complement machine intelligence by providing real ground-truth context.',
  },

  HARVEST: {
    type: 'HARVEST',
    title: 'Actual Harvest Yield Record',
    badgeLabel: 'Harvest Outcome',
    severity: 'normal',
    whatItMeans:
      'Logging the actual harvest yield closes the intelligence loop: comparing pre-season and mid-season model estimates against real farm results. Over multiple seasons, this builds an irreplaceable personal field memory benchmark.',
    checklist: [
      'Confirm total harvested weight and area harvested',
      'Calculate yield in tonnes per hectare or standard regional units',
      'Note harvest quality, moisture content, and market grading if available',
    ],
    recommendedActions: [
      'Review model predictions against actual harvest to assess seasonal variances',
      'Archive this season’s log into Farm Memory as the baseline for next year’s crop rotation planning',
    ],
    suggestedScenario: null,
    uncertaintyDisclaimer:
      'Actual harvest data remains strictly private in your local farm record. Model retraining from farmer outcomes is a future multi-season capability.',
  },
};
