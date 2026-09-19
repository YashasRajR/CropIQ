/**
 * CropIQ Localization Dictionary
 * Supports English (en), Hindi (hi), and Gujarati (gu) for accessible regional farmer UX.
 */

export type Language = 'en' | 'hi' | 'gu';

export interface Translations {
  appName: string;
  tagline: string;
  farmerView: string;
  technicalView: string;
  myCropToday: string;
  yieldPredictor: string;
  whyThisEstimate: string;
  whatIfSimulator: string;
  farmMemory: string;
  modelAndMetrics: string;
  outlookHistory: string;
  farmDecisions: string;
  expectedYield: string;
  yieldUnit: string;
  confidenceRange: string;
  modelEstimateBadge: string;
  farmerReportedBadge: string;
  scenarioEstimateBadge: string;
  futureRoadmapBadge: string;
  hasAnythingChanged: string;
  whatAreYouSeeing: string;
  whatShouldICheck: string;
  whatDoesItMean: string;
  whatActionToTake: string;
  saveToTimeline: string;
  testInSimulator: string;
  growthStage: string;
  plantingDate: string;
  vitalSigns: string;
  canopyHealth: string;
  rootMoisture: string;
  weatherOutlook: string;
  recordHarvest: string;
  actualYield: string;
  harvestRecorded: string;
  emptyTimeline: string;
  close: string;
  cancel: string;
  confirm: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'CropIQ',
    tagline: 'Continuous Crop Intelligence & Decision Support',
    farmerView: 'Farmer View',
    technicalView: 'Technical / Judge View',
    myCropToday: 'My Crop Today',
    yieldPredictor: 'Yield Predictor',
    whyThisEstimate: 'Why This Estimate?',
    whatIfSimulator: 'What-If Simulator',
    farmMemory: 'Farm Memory & Journey',
    modelAndMetrics: 'Model & Architecture',
    outlookHistory: 'Outlook History & Photos',
    farmDecisions: 'Farm Decisions',
    expectedYield: 'Estimated Harvest Yield',
    yieldUnit: 'tonnes / hectare',
    confidenceRange: 'Expected Range',
    modelEstimateBadge: 'Model Estimate',
    farmerReportedBadge: 'Farmer Reported',
    scenarioEstimateBadge: 'Scenario Simulation',
    futureRoadmapBadge: 'Future Capability',
    hasAnythingChanged: 'Has anything changed in your field?',
    whatAreYouSeeing: 'What are you seeing in your field?',
    whatShouldICheck: 'What should I check next?',
    whatDoesItMean: 'What could this change mean?',
    whatActionToTake: 'Recommended Action',
    saveToTimeline: 'Save to Farm Timeline',
    testInSimulator: 'Test Impact in What-If Simulator',
    growthStage: 'Growth Stage',
    plantingDate: 'Sowing / Planting Date',
    vitalSigns: 'Field Vital Signs',
    canopyHealth: 'Canopy Greenness',
    rootMoisture: 'Root Zone Moisture',
    weatherOutlook: 'Ambient Climate',
    recordHarvest: 'Record Harvest Outcome',
    actualYield: 'Actual Harvest Yield (t/ha)',
    harvestRecorded: 'Harvest Result Logged',
    emptyTimeline: 'No events logged yet. Use the buttons above to record your first field event or observation.',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm & Save',
  },
  hi: {
    appName: 'CropIQ',
    tagline: 'निरंतर फसल बुद्धिमत्ता और निर्णय सहायता',
    farmerView: 'किसान दृश्य (सरल)',
    technicalView: 'तकनीकी / परीक्षक दृश्य',
    myCropToday: 'मेरी फसल आज',
    yieldPredictor: 'उपज अनुमानक',
    whyThisEstimate: 'यह अनुमान क्यों?',
    whatIfSimulator: 'क्या-अगर सिम्युलेटर',
    farmMemory: 'खेत का इतिहास और यात्रा',
    modelAndMetrics: 'मॉडल और तकनीक',
    outlookHistory: 'पूर्वानुमान इतिहास और तस्वीरें',
    farmDecisions: 'खेत के निर्णय',
    expectedYield: 'अनुमानित फसल उपज',
    yieldUnit: 'टन / हेक्टेयर',
    confidenceRange: 'संभावित सीमा',
    modelEstimateBadge: 'मॉडल अनुमान',
    farmerReportedBadge: 'किसान द्वारा दर्ज',
    scenarioEstimateBadge: 'परिदृश्य परीक्षण',
    futureRoadmapBadge: 'आगामी सुविधा',
    hasAnythingChanged: 'क्या आपके खेत में कुछ बदला है?',
    whatAreYouSeeing: 'आप अपने खेत में क्या देख रहे हैं?',
    whatShouldICheck: 'आगे क्या जांचें?',
    whatDoesItMean: 'इस बदलाव का क्या असर हो सकता है?',
    whatActionToTake: 'सुझाया गया कदम',
    saveToTimeline: 'खेत की समयरेखा में सहेजें',
    testInSimulator: 'सिम्युलेटर में प्रभाव जांचें',
    growthStage: 'फसल की अवस्था',
    plantingDate: 'बुवाई की तारीख',
    vitalSigns: 'खेत के मुख्य संकेत',
    canopyHealth: 'फसल की हरियाली',
    rootMoisture: 'जड़ों की नमी',
    weatherOutlook: 'मौसम और तापमान',
    recordHarvest: 'कटाई परिणाम दर्ज करें',
    actualYield: 'वास्तविक कटाई उपज (टन/हेक्टेयर)',
    harvestRecorded: 'कटाई का परिणाम सहेजा गया',
    emptyTimeline: 'अभी तक कोई घटना दर्ज नहीं की गई है। पहला फील्ड अवलोकन दर्ज करने के लिए ऊपर दिए गए बटनों का उपयोग करें।',
    close: 'बंद करें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें और सहेजें',
  },
  gu: {
    appName: 'CropIQ',
    tagline: 'સતત પાક બુદ્ધિ અને નિર્ણય સહાય',
    farmerView: 'ખેડૂત દૃશ્ય (સરળ)',
    technicalView: 'ટેકનિકલ / નિર્ણાયક દૃશ્ય',
    myCropToday: 'મારો પાક આજે',
    yieldPredictor: 'ઉત્પાદન અનુમાનક',
    whyThisEstimate: 'આ અંદાજ શા માટે?',
    whatIfSimulator: 'શું-જો સિમ્યુલેટર',
    farmMemory: 'ખેતરનો ઇતિહાસ',
    modelAndMetrics: 'મોડેલ અને આર્કિટેક્ચર',
    outlookHistory: 'આગાહી ઇતિહાસ અને ફોટા',
    farmDecisions: 'ખેતરના નિર્ણયો',
    expectedYield: 'અંદાજિત પાક ઉત્પાદન',
    yieldUnit: 'ટન / હેક્ટર',
    confidenceRange: 'સંભવિત રેન્જ',
    modelEstimateBadge: 'મોડેલ અંદાજ',
    farmerReportedBadge: 'ખેડૂત દ્વારા નોંધાયેલ',
    scenarioEstimateBadge: 'સિનારિયો સિમ્યુલેશન',
    futureRoadmapBadge: 'આગામી ક્ષમતા',
    hasAnythingChanged: 'શું તમારા ખેતરમાં કંઈ બદલાયું છે?',
    whatAreYouSeeing: 'તમે ખેતરમાં શું જોઈ રહ્યા છો?',
    whatShouldICheck: 'આગળ શું તપાસવું?',
    whatDoesItMean: 'આ ફેરફારનો શું અર્થ થાય?',
    whatActionToTake: 'ભલામણ કરેલ પગલું',
    saveToTimeline: 'ખેતરની ટાઈમલાઈનમાં સાચવો',
    testInSimulator: 'સિમ્યુલેટરમાં અસર તપાસો',
    growthStage: 'પાકનો તબક્કો',
    plantingDate: 'વાવણીની તારીખ',
    vitalSigns: 'ખેતરના મુખ્ય સંકેતો',
    canopyHealth: 'પાકની હરિયાળી',
    rootMoisture: 'જમીનમાં ભેજ',
    weatherOutlook: 'વાતાવરણ અને તાપમાન',
    recordHarvest: 'લણણી પરિણામ નોંધો',
    actualYield: 'વાસ્તવિક ઉત્પાદન (ટન/હેક્ટર)',
    harvestRecorded: 'લણણી પરિણામ નોંધાયું',
    emptyTimeline: 'હજુ સુધી કોઈ ઘટના નોંધાઈ નથી. પહેલું અવલોકન ઉમેરવા ઉપરના બટનો વાપરો.',
    close: 'બંધ કરો',
    cancel: 'રદ કરો',
    confirm: 'ખાતરી કરો અને સાચવો',
  },
};
