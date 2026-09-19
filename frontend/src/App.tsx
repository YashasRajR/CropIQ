import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/hero/HeroSection';
import { FarmInputForm } from './components/farm-form/FarmInputForm';
import { PredictionCard } from './components/prediction/PredictionCard';
import { RiskCard } from './components/prediction/RiskCard';
import { ReliabilityCard } from './components/prediction/ReliabilityCard';
import { FactorChart } from './components/explanation/FactorChart';
import { RecommendationList } from './components/recommendations/RecommendationList';
import { ScenarioSimulator } from './components/simulator/ScenarioSimulator';
import { ScenarioComparison } from './components/simulator/ScenarioComparison';
import { SensitivityChart } from './components/simulator/SensitivityChart';
import { ScenarioHistory } from './components/simulator/ScenarioHistory';
import { FarmSummaryCard } from './components/narrative/FarmSummaryCard';
import { FarmSnapshot } from './components/narrative/FarmSnapshot';
import { ModelPerformanceCard } from './components/transparency/ModelPerformanceCard';
import { ModelInfoModal } from './components/transparency/ModelInfoModal';
import { TechnicalDrawer } from './components/transparency/TechnicalDrawer';
import { Skeleton } from './components/common/Skeleton';
import { Card } from './components/common/Card';
import {
  AlertCircle,
  RefreshCw,
  Sprout,
  CheckCircle2,
  Sliders,
  LineChart,
  Cpu,
  TrendingUp,
} from 'lucide-react';

import { cropIQApi } from './services/api';
import { farmMemoryService } from './services/farmMemoryService';
import { EXAMPLE_FARM_PRESETS } from './config/presets';
import { FarmInput, ScenarioFeaturesCatalog } from './types/farm';
import { PredictionResponse } from './types/prediction';
import { ExplanationResponse } from './types/explanation';
import { RecommendationResponse } from './types/recommendation';
import { ScenarioResponse } from './types/scenario';
import { HealthResponse, ModelInfoResponse, APIErrorDetail } from './types/api';
import {
  ObservationType,
  CropStage,
  TimelineEvent,
  FarmDecision,
  PredictionHistoryPoint,
  FarmerFeedback,
} from './types/events';
import { Language, TRANSLATIONS } from './config/i18n';

// Import Continuous Intelligence Farmer Modules
import { MyCropToday } from './components/farmer/MyCropToday';
import { EventImpactModal } from './components/farmer/EventImpactModal';
import { FarmTimelineCard } from './components/farmer/FarmTimelineCard';
import { PredictionHistoryCard } from './components/farmer/PredictionHistoryCard';
import { FarmDecisionLog } from './components/farmer/FarmDecisionLog';
import { PhotoJournalCard } from './components/farmer/PhotoJournalCard';
import { ExpertReportModal } from './components/farmer/ExpertReportModal';

type TabType = 'cockpit' | 'journey' | 'simulator' | 'technical';

export const App: React.FC = () => {
  // --- View Mode & Localization State ---
  const [viewMode, setViewMode] = useState<'farmer' | 'technical'>('farmer');
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<TabType>('cockpit');
  const [journeySubTab, setJourneySubTab] = useState<'all' | 'trajectory' | 'photos' | 'decisions' | 'timeline'>('all');
  const [techSubTab, setTechSubTab] = useState<'input' | 'metrics'>('input');
  const t = TRANSLATIONS[language];

  // --- Form & Input State ---
  const defaultFarmInput: FarmInput = EXAMPLE_FARM_PRESETS[0].input;
  const [currentInput, setCurrentInput] = useState<FarmInput>(defaultFarmInput);
  const [cropStage, setCropStage] = useState<CropStage>('Vegetative / Growing');

  // --- Farm Memory, Decisions, History & Feedback State ---
  const farmKey = currentInput.field_id || currentInput.crop_type || 'default_plot';
  const [timeline, setTimeline] = useState<TimelineEvent[]>(() =>
    farmMemoryService.getTimeline(farmKey, currentInput.crop_type)
  );
  const [decisions, setDecisions] = useState<FarmDecision[]>(() =>
    farmMemoryService.getDecisions(farmKey, currentInput.crop_type)
  );
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryPoint[]>(() =>
    farmMemoryService.getPredictionHistory(farmKey, 4.2)
  );
  const [farmerFeedback, setFarmerFeedback] = useState<FarmerFeedback | null>(() =>
    farmMemoryService.getFarmerFeedback(farmKey)
  );

  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [selectedEventType, setSelectedEventType] = useState<ObservationType | null>(null);
  const [isExpertModalOpen, setIsExpertModalOpen] = useState<boolean>(false);

  // Sync state when farm preset or field changes
  useEffect(() => {
    const key = currentInput.field_id || currentInput.crop_type || 'default_plot';
    setTimeline(farmMemoryService.getTimeline(key, currentInput.crop_type));
    setDecisions(farmMemoryService.getDecisions(key, currentInput.crop_type));
    setPredictionHistory(farmMemoryService.getPredictionHistory(key, 4.2));
    setFarmerFeedback(farmMemoryService.getFarmerFeedback(key));
  }, [currentInput.field_id, currentInput.crop_type]);

  // --- API Responses State ---
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<APIErrorDetail | null>(null);

  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [recMode, setRecMode] = useState<'farmer' | 'technical'>('farmer');

  // --- What-If Scenario State ---
  const [scenarioCatalog, setScenarioCatalog] = useState<ScenarioFeaturesCatalog | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioResponse | null>(null);
  const [isScenarioLoading, setIsScenarioLoading] = useState<boolean>(false);
  const [scenarioTargetFeature, setScenarioTargetFeature] = useState<string | undefined>(undefined);
  const [scenarioHistory, setScenarioHistory] = useState<ScenarioResponse[]>([]);

  // --- Transparency & Diagnostics State ---
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [isModelInfoOpen, setIsModelInfoOpen] = useState<boolean>(false);
  const [isTechnicalDrawerOpen, setIsTechnicalDrawerOpen] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // --- Backend Health Check & Metadata Fetch ---
  const initializeMetadata = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const [hRes, catRes, mInfoRes] = await Promise.allSettled([
        cropIQApi.checkHealth(),
        cropIQApi.getScenarioFeatures(),
        cropIQApi.getModelInfo(),
      ]);

      if (hRes.status === 'fulfilled') setHealth(hRes.value);
      if (catRes.status === 'fulfilled') setScenarioCatalog(catRes.value);
      if (mInfoRes.status === 'fulfilled') setModelInfo(mInfoRes.value);
    } catch {
      // Backend offline or starting
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  // --- Full Farm Analysis Pipeline Run ---
  const runFullPipeline = useCallback(async (input: FarmInput) => {
    setCurrentInput(input);
    setIsPredicting(true);
    setIsExplaining(true);
    setIsRecommending(true);
    setPredictionError(null);

    // Reset scenario view on new farm input
    setActiveScenario(null);

    try {
      const [predResult, expResult, recResult] = await Promise.allSettled([
        cropIQApi.predictFarm(input, recMode, 5),
        cropIQApi.explainFarm(input),
        cropIQApi.getRecommendations(input, recMode, 5),
      ]);

      if (predResult.status === 'fulfilled') {
        const val = predResult.value;
        setPrediction(val);

        // Update prediction history with new point estimate
        const currentYield = val.prediction?.yield ?? 4.2;
        const key = input.field_id || input.crop_type || 'default_plot';
        const newHist = farmMemoryService.getPredictionHistory(key, currentYield);
        setPredictionHistory(newHist);
      } else {
        const errDetail: APIErrorDetail = {
          code: 'ESTIMATE_FAILED',
          message: "CropIQ couldn't complete the estimate right now. Please check backend status and try again.",
        };
        setPredictionError(errDetail);
      }

      if (expResult.status === 'fulfilled') {
        setExplanation(expResult.value);
      }

      if (recResult.status === 'fulfilled') {
        setRecommendations(recResult.value);
      }

      setLastUpdated(new Date());
    } finally {
      setIsPredicting(false);
      setIsExplaining(false);
      setIsRecommending(false);
    }
  }, [recMode]);

  // Initial Load Effect
  useEffect(() => {
    initializeMetadata();
    runFullPipeline(defaultFarmInput);
  }, [initializeMetadata, runFullPipeline]);

  // Synchronize view mode with recommendation mode
  const handleToggleViewMode = (mode: 'farmer' | 'technical') => {
    setViewMode(mode);
    setRecMode(mode);
    if (mode === 'technical') {
      setTechSubTab('metrics');
      setActiveTab('technical');
    } else {
      setActiveTab('cockpit');
    }
    if (currentInput) {
      cropIQApi.getRecommendations(currentInput, mode, 5).then(setRecommendations);
    }
  };

  // --- Scenario Execution Handler ---
  const handleRunScenario = async (changes: Record<string, number>, scenarioName: string) => {
    setIsScenarioLoading(true);
    try {
      const response = await cropIQApi.runScenario({
        current_input: currentInput,
        changes,
        scenario_name: scenarioName,
      });
      setActiveScenario(response);
      setScenarioHistory((prev) => [response, ...prev.slice(0, 9)]);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error('Scenario execution failed:', err);
    } finally {
      setIsScenarioLoading(false);
    }
  };

  // --- Explore Scenario Trigger from Recommendation or Event ---
  const handleExploreScenario = (featureName: string) => {
    setScenarioTargetFeature(featureName);
    setActiveTab('simulator');
    const element = document.getElementById('scenario-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- Trigger Scenario from Event Modal ---
  const handleTriggerScenarioFromEvent = (
    feature: string,
    deltaPercentage: number,
    scenarioName: string
  ) => {
    setActiveTab('simulator');
    setScenarioTargetFeature(feature);

    const baseVal = (currentInput as unknown as Record<string, unknown>)[feature];
    if (typeof baseVal === 'number') {
      const targetVal = baseVal * (1 + deltaPercentage / 100);
      handleRunScenario({ [feature]: targetVal }, scenarioName);
    }
  };

  // --- Farmer Observation & Event Handlers ---
  const handleOpenEventModal = (type: ObservationType = 'CUSTOM_NOTE') => {
    setSelectedEventType(type);
    setIsEventModalOpen(true);
  };

  const handleSaveEventToTimeline = (eventData: {
    type: ObservationType;
    title: string;
    description: string;
    stage: CropStage;
    severity: 'normal' | 'watch' | 'critical';
    source: 'farmer';
    checklistState?: Record<string, boolean>;
    photoUrl?: string;
  }) => {
    const key = currentInput.field_id || currentInput.crop_type || 'default_plot';
    const newEvt = farmMemoryService.addEvent(key, eventData);
    setTimeline((prev) => [newEvt, ...prev]);
  };

  const handleDeleteTimelineEvent = (eventId: string) => {
    const key = currentInput.field_id || currentInput.crop_type || 'default_plot';
    farmMemoryService.deleteEvent(key, eventId);
    setTimeline((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleRecordHarvest = (actualYield: number, notes?: string) => {
    const key = currentInput.field_id || currentInput.crop_type || 'default_plot';
    const harvestEvt = farmMemoryService.recordHarvest(key, actualYield, notes);
    setTimeline((prev) => [harvestEvt, ...prev]);
  };

  const handleResetTimeline = () => {
    const key = currentInput.field_id || currentInput.crop_type || 'default_plot';
    const resetList = farmMemoryService.resetTimeline(key, currentInput.crop_type);
    setTimeline(resetList);
  };

  // --- Farmer Decisions Handlers ---
  const handleAddDecision = (
    decisionData: Omit<FarmDecision, 'id' | 'timestamp'> & { timestamp?: string }
  ) => {
    const key = currentInput.field_id || currentInput.crop_type || 'default_plot';
    const newDec = farmMemoryService.addDecision(key, decisionData);
    setDecisions((prev) => [newDec, ...prev]);
    // Refresh timeline because decision is mirrored into timeline
    setTimeline(farmMemoryService.getTimeline(key, currentInput.crop_type));
  };

  const handleDeleteDecision = (decisionId: string) => {
    const key = currentInput.field_id || currentInput.crop_type || 'default_plot';
    farmMemoryService.deleteDecision(key, decisionId);
    setDecisions((prev) => prev.filter((d) => d.id !== decisionId));
  };

  // --- Farmer Feedback & Ground Truth Handler ---
  const handleSaveFarmerFeedback = (agreement: 'agrees' | 'unsure' | 'disagrees', notes?: string) => {
    const key = currentInput.field_id || currentInput.crop_type || 'default_plot';
    const saved = farmMemoryService.saveFarmerFeedback(key, {
      agreement,
      farmerNotes: notes,
    });
    setFarmerFeedback(saved);
    // Refresh timeline if note was recorded
    setTimeline(farmMemoryService.getTimeline(key, currentInput.crop_type));
  };

  // Toggle recommendation mode
  const handleToggleRecMode = (mode: 'farmer' | 'technical') => {
    setRecMode(mode);
    if (currentInput) {
      cropIQApi.getRecommendations(currentInput, mode, 5).then(setRecommendations);
    }
  };

  const currentYieldVal = prediction?.prediction?.yield ?? 4.2;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7faf7] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar */}
      <Navbar
        health={health}
        isCheckingHealth={isCheckingHealth}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        language={language}
        onChangeLanguage={setLanguage}
        onOpenModelInfo={() => setIsModelInfoOpen(true)}
        onOpenTechnicalDrawer={() => setIsTechnicalDrawerOpen(true)}
      />

      {/* Hero Section */}
      <HeroSection
        onAnalyzeClick={() => setActiveTab('cockpit')}
        onSelectSimulator={() => setActiveTab('simulator')}
      />

      {/* Primary 4-Hub Navigation Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar text-xs font-semibold">
            {/* Hub 1: My Field Cockpit */}
            <button
              type="button"
              onClick={() => setActiveTab('cockpit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'cockpit'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>{t.fieldCockpit || 'My Field Cockpit'}</span>
            </button>

            {/* Hub 2: Field Journey & Timeline */}
            <button
              type="button"
              onClick={() => setActiveTab('journey')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'journey'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t.fieldJourney || 'Field Journey & Timeline'}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'journey' ? 'bg-emerald-950/40 text-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {timeline.length + decisions.length}
              </span>
            </button>

            {/* Hub 3: What-If Simulator */}
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{t.whatIfSimulator}</span>
            </button>

            {/* Hub 4: Field Data & Technical Hub */}
            <button
              type="button"
              onClick={() => setActiveTab('technical')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ml-auto ${
                activeTab === 'technical'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>{t.fieldDataAndTech || 'Field Data & Technical Hub'}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* HUB 1: MY FIELD COCKPIT (Core Continuous Intelligence & Daily Loop) */}
        {activeTab === 'cockpit' && (
          <div className="space-y-8">
            <MyCropToday
              currentInput={currentInput}
              prediction={prediction}
              explanation={explanation}
              recommendations={recommendations}
              presets={EXAMPLE_FARM_PRESETS}
              onSelectPreset={(p) => {
                setCurrentInput(p.input);
                runFullPipeline(p.input);
              }}
              cropStage={cropStage}
              farmerFeedback={farmerFeedback}
              onChangeCropStage={setCropStage}
              onOpenEventModal={handleOpenEventModal}
              onSaveFeedback={handleSaveFarmerFeedback}
              onOpenExpertReport={() => setIsExpertModalOpen(true)}
              onNavigateToTab={(tabId) => {
                if (tabId === 'history' || tabId === 'decisions' || tabId === 'timeline') {
                  setActiveTab('journey');
                } else if (tabId === 'why-estimate' || tabId === 'predictor' || tabId === 'model-specs') {
                  setActiveTab('technical');
                } else if (tabId === 'simulator') {
                  setActiveTab('simulator');
                } else {
                  setActiveTab('cockpit');
                }
              }}
              onExploreScenario={handleExploreScenario}
            />

            {/* Field Journey Preview */}
            <div className="pt-2">
              <FarmTimelineCard
                timeline={timeline.slice(0, 4)}
                cropName={currentInput.crop_type}
                onOpenObservationModal={handleOpenEventModal}
                onDeleteEvent={handleDeleteTimelineEvent}
                onRecordHarvest={handleRecordHarvest}
                onResetTimeline={handleResetTimeline}
              />
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('journey')}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Complete Field Journey & Management Timeline ({timeline.length + decisions.length} entries) &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HUB 2: FIELD JOURNEY & TIMELINE (Trajectory, Photos, Decisions, & Memory) */}
        {activeTab === 'journey' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Journey Header & Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <span>Field Journey & Season Memory</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trajectory outlook, photo journal, management actions, and chronological timeline for your {currentInput.crop_type}.
                </p>
              </div>

              {/* Sub-Filters */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setJourneySubTab('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    journeySubTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setJourneySubTab('trajectory')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    journeySubTab === 'trajectory'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📈 Trajectory
                </button>
                <button
                  type="button"
                  onClick={() => setJourneySubTab('photos')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    journeySubTab === 'photos'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📷 Photos
                </button>
                <button
                  type="button"
                  onClick={() => setJourneySubTab('decisions')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    journeySubTab === 'decisions'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 Decisions ({decisions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJourneySubTab('timeline')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    journeySubTab === 'timeline'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📅 Timeline ({timeline.length})
                </button>
              </div>
            </div>

            {/* 1. Multi-Week Prediction Outlook Trajectory */}
            {(journeySubTab === 'all' || journeySubTab === 'trajectory') && (
              <PredictionHistoryCard
                cropName={currentInput.crop_type}
                history={predictionHistory}
                currentYield={currentYieldVal}
              />
            )}

            {/* 2. Field Photo Journal (Before vs Now) */}
            {(journeySubTab === 'all' || journeySubTab === 'photos') && (
              <PhotoJournalCard
                cropName={currentInput.crop_type}
                timeline={timeline}
                onTriggerPhotoModal={() => handleOpenEventModal('PHOTO_LOG')}
              />
            )}

            {/* 3. Farm Decisions Log & Actionable Recommendations */}
            {(journeySubTab === 'all' || journeySubTab === 'decisions') && (
              <div className="space-y-6">
                <FarmDecisionLog
                  cropName={currentInput.crop_type}
                  decisions={decisions}
                  onAddDecision={handleAddDecision}
                  onDeleteDecision={handleDeleteDecision}
                />

                {isRecommending ? (
                  <Skeleton className="h-72 rounded-2xl" />
                ) : recommendations ? (
                  <RecommendationList
                    recommendations={recommendations.recommendations}
                    executiveSummary={recommendations.summary.executive_summary}
                    onExploreScenario={handleExploreScenario}
                    onToggleMode={handleToggleRecMode}
                    currentMode={recMode}
                  />
                ) : null}
              </div>
            )}

            {/* 4. Farm Timeline & Harvest Outcome Recorder */}
            {(journeySubTab === 'all' || journeySubTab === 'timeline') && (
              <FarmTimelineCard
                timeline={timeline}
                cropName={currentInput.crop_type}
                onOpenObservationModal={handleOpenEventModal}
                onDeleteEvent={handleDeleteTimelineEvent}
                onRecordHarvest={handleRecordHarvest}
                onResetTimeline={handleResetTimeline}
              />
            )}
          </div>
        )}

        {/* HUB 3: WHAT-IF SCENARIO SIMULATOR (Interactive Sliders & Sensitivity) */}
        {activeTab === 'simulator' && (
          <section id="scenario-section" className="space-y-6 animate-in fade-in duration-300">
            <ScenarioSimulator
              currentInput={currentInput}
              catalog={scenarioCatalog}
              onRunScenario={handleRunScenario}
              isLoading={isScenarioLoading}
              activeScenarioResult={activeScenario}
              onReset={() => setActiveScenario(null)}
              targetFeature={scenarioTargetFeature}
            />

            {/* Active Scenario Comparison Results */}
            {activeScenario && (
              <ScenarioComparison scenario={activeScenario} />
            )}

            {/* 1D Sensitivity Curve */}
            <SensitivityChart currentInput={currentInput} />

            {/* Tested Situations History */}
            <ScenarioHistory
              history={scenarioHistory}
              onClear={() => setScenarioHistory([])}
              onSelectScenario={(scen) => setActiveScenario(scen)}
            />
          </section>
        )}

        {/* HUB 4: FIELD DATA & TECHNICAL HUB (Form, GroupKFold, SHAP, API) */}
        {activeTab === 'technical' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Technical Hub Header with Sub-Toggle */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-900 text-amber-400">
                    <Cpu className="w-4 h-4" />
                  </span>
                  <span>Field Data & Technical Hub</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input calibration, live telemetry, SHAP waterfall decompositions, and 10-fold spatial GroupKFold validation.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setTechSubTab('input')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    techSubTab === 'input'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌱 Input Form & Overview
                </button>
                <button
                  type="button"
                  onClick={() => setTechSubTab('metrics')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    techSubTab === 'metrics'
                      ? 'bg-slate-900 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚙️ Model Specs & Spatial CV
                </button>
              </div>
            </div>

            {techSubTab === 'input' && (
              <div className="space-y-8">
                {/* Farm Conditions Input Form */}
                <FarmInputForm
                  initialInput={currentInput}
                  onSubmit={runFullPipeline}
                  isLoading={isPredicting}
                  scenarioCatalog={scenarioCatalog}
                  onReset={() => {
                    setCurrentInput(defaultFarmInput);
                    runFullPipeline(defaultFarmInput);
                  }}
                />

                {/* Farm Overview & Metric Cards */}
                <section id="overview-section" className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                          <Sprout className="w-5 h-5" />
                        </span>
                        <span>Farm Telemetry & Yield Model Outcomes</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Detailed model breakdown and calibration for your{' '}
                        <strong className="text-emerald-800">{currentInput.crop_type}</strong> crop.
                      </p>
                    </div>

                    {lastUpdated && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Error Notice */}
                  {predictionError && (
                    <Card variant="bordered" className="p-5 border-rose-300 bg-rose-50 text-rose-900">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-rose-950">Could not complete estimate</h4>
                          <p className="text-xs mt-1 text-rose-800">{predictionError.message}</p>
                          <button
                            type="button"
                            onClick={() => runFullPipeline(currentInput)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-xs font-semibold text-white transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Try Again</span>
                          </button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Metric Cards Grid */}
                  {isPredicting ? (
                    <div className="space-y-6">
                      <Skeleton className="h-44 rounded-2xl" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-64 rounded-2xl" />
                        <Skeleton className="h-64 rounded-2xl" />
                        <Skeleton className="h-64 rounded-2xl" />
                      </div>
                    </div>
                  ) : prediction ? (
                    <div className="space-y-6">
                      <FarmSnapshot
                        prediction={prediction}
                        farmInput={currentInput}
                        scenarioCatalog={scenarioCatalog}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <PredictionCard
                          prediction={prediction.prediction}
                          context={prediction.context}
                          modelVersion={prediction.metadata?.model_version}
                          topPositive={prediction.explanation?.top_positive_factors?.[0]}
                          topNegative={prediction.explanation?.top_negative_factors?.[0]}
                        />
                        <RiskCard risk={prediction.risk} />
                        <ReliabilityCard
                          uncertainty={prediction.uncertainty}
                          dataQuality={prediction.data_quality}
                        />
                      </div>

                      {/* Full SHAP Breakdown */}
                      {isExplaining ? (
                        <Skeleton className="h-80 rounded-2xl" />
                      ) : explanation ? (
                        <FactorChart explanation={explanation} cropName={currentInput.crop_type} />
                      ) : null}

                      <FarmSummaryCard
                        prediction={prediction}
                        farmInput={currentInput}
                        onScrollToRecommendations={() => setActiveTab('journey')}
                        onScrollToFactors={() => {}}
                      />
                    </div>
                  ) : null}
                </section>
              </div>
            )}

            {techSubTab === 'metrics' && (
              <div className="space-y-8">
                {/* Architecture & Pipeline Integrity Card */}
                <Card variant="bordered" className="p-6 bg-slate-900 text-white rounded-3xl border-slate-800 space-y-4 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400">
                      <LineChart className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold">CropIQ Model Architecture & Pipeline Integrity</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                    CropIQ uses a spatial <strong>GroupKFold</strong> validated Random Forest regressor with TreeExplainer SHAP decompositions,
                    strict non-causal associations, RFC 7807 problem details, and deterministic feature encoders.
                    Zero simulated LLMs or fabricated percentages are used in inference.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModelInfoOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Full Model Specs & Training Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTechnicalDrawerOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      Inspect Live API Payload
                    </button>
                  </div>
                </Card>

                <ModelPerformanceCard
                  metrics={modelInfo?.metrics}
                  datasetSummary={modelInfo?.dataset_summary}
                  modelVersion={prediction?.metadata?.model_version || modelInfo?.model_version}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onOpenModelInfo={() => setIsModelInfoOpen(true)} />

      {/* Event Impact Modal */}
      <EventImpactModal
        isOpen={isEventModalOpen}
        eventType={selectedEventType}
        cropName={currentInput.crop_type}
        cropStage={cropStage}
        onClose={() => setIsEventModalOpen(false)}
        onSaveToTimeline={handleSaveEventToTimeline}
        onTriggerScenario={handleTriggerScenarioFromEvent}
      />

      {/* Expert Escalation Report Modal */}
      <ExpertReportModal
        isOpen={isExpertModalOpen}
        onClose={() => setIsExpertModalOpen(false)}
        farmInput={currentInput}
        prediction={prediction}
        cropStage={cropStage}
        timeline={timeline}
      />

      {/* Modals & Technical Audit Drawer */}
      <ModelInfoModal
        isOpen={isModelInfoOpen}
        onClose={() => setIsModelInfoOpen(false)}
        modelInfo={modelInfo}
      />

      <TechnicalDrawer
        isOpen={isTechnicalDrawerOpen}
        onClose={() => setIsTechnicalDrawerOpen(false)}
        predictData={prediction}
        explainData={explanation}
        recommendationsData={recommendations}
        scenarioData={activeScenario}
        currentInput={currentInput}
        lastUpdated={lastUpdated}
      />
    </div>
  );
};

export default App;
