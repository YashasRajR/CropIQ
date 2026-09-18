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
import { ModelInfoModal } from './components/transparency/ModelInfoModal';
import { TechnicalDrawer } from './components/transparency/TechnicalDrawer';
import { Skeleton } from './components/common/Skeleton';
import { Card } from './components/common/Card';
import { AlertTriangle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

import { cropIQApi } from './services/api';
import { EXAMPLE_FARM_PRESETS } from './config/presets';
import { FarmInput, ScenarioFeaturesCatalog } from './types/farm';
import { PredictionResponse } from './types/prediction';
import { ExplanationResponse } from './types/explanation';
import { RecommendationResponse } from './types/recommendation';
import { ScenarioResponse } from './types/scenario';
import { HealthResponse, ModelInfoResponse, APIErrorDetail } from './types/api';

export const App: React.FC = () => {
  // --- Form & Input State ---
  const defaultFarmInput: FarmInput = EXAMPLE_FARM_PRESETS[0].input;
  const [currentInput, setCurrentInput] = useState<FarmInput>(defaultFarmInput);

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
      // Backend may be offline or starting up
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

    // Reset scenario view on new farm input to maintain consistency
    setActiveScenario(null);

    try {
      // Execute 3 core intelligence endpoints concurrently
      const [predResult, expResult, recResult] = await Promise.allSettled([
        cropIQApi.predictFarm(input, recMode, 5),
        cropIQApi.explainFarm(input),
        cropIQApi.getRecommendations(input, recMode, 5),
      ]);

      if (predResult.status === 'fulfilled') {
        setPrediction(predResult.value);
      } else {
        const errDetail: APIErrorDetail = {
          code: 'PREDICTION_FAILED',
          message: predResult.reason?.message || 'Failed to complete yield prediction.',
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

  // Initial Load Effect: Check health and execute baseline analysis on default farm
  useEffect(() => {
    initializeMetadata();
    runFullPipeline(defaultFarmInput);
  }, [initializeMetadata, runFullPipeline]);

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

  // --- Explore Scenario Trigger from Recommendation ---
  const handleExploreScenario = (featureName: string) => {
    setScenarioTargetFeature(featureName);
    const element = document.getElementById('simulator-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- Toggle Recommendation Mode (Farmer vs Technical) ---
  const handleToggleRecMode = (mode: 'farmer' | 'technical') => {
    setRecMode(mode);
    // Refresh recommendations with new mode
    if (currentInput) {
      cropIQApi.getRecommendations(currentInput, mode, 5).then(setRecommendations);
    }
  };

  const handleScrollToAnalysis = () => {
    const el = document.getElementById('analysis-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navbar */}
      <Navbar
        health={health}
        isCheckingHealth={isCheckingHealth}
        onOpenModelInfo={() => setIsModelInfoOpen(true)}
        onOpenTechnicalDrawer={() => setIsTechnicalDrawerOpen(true)}
      />

      {/* Hero Section */}
      <HeroSection
        onAnalyzeClick={handleScrollToAnalysis}
        onSelectExample={handleScrollToAnalysis}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Section 1: Farm Conditions Input Form */}
        <FarmInputForm
          initialInput={currentInput}
          onSubmit={runFullPipeline}
          isLoading={isPredicting}
          onReset={() => {
            setCurrentInput(defaultFarmInput);
            runFullPipeline(defaultFarmInput);
          }}
        />

        {/* Section 2: Core Prediction & Diagnostic Dashboard */}
        <section id="prediction-section" className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Yield Prediction & Intelligence Dashboard</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation across 30 agro-climatic and satellite features for crop:{' '}
                <span className="text-emerald-400 font-mono font-semibold">{currentInput.crop_type}</span>
              </p>
            </div>

            {lastUpdated && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Synced: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Prediction Error Alert */}
          {predictionError && (
            <Card variant="bordered" className="p-5 border-rose-500/40 bg-rose-950/20 text-rose-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-rose-300">{predictionError.code}</h4>
                  <p className="text-xs mt-1 text-rose-200/90">{predictionError.message}</p>
                  <button
                    type="button"
                    onClick={() => runFullPipeline(currentInput)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Pipeline</span>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Prediction Metric Cards Grid */}
          {isPredicting ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : prediction ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PredictionCard
                prediction={prediction.prediction}
                context={prediction.context}
                modelVersion={prediction.metadata?.model_version}
              />
              <RiskCard risk={prediction.risk} />
              <ReliabilityCard
                uncertainty={prediction.uncertainty}
                dataQuality={prediction.data_quality}
              />
            </div>
          ) : null}
        </section>

        {/* Section 3: Explainability — Local TreeSHAP Feature Attributions */}
        {isExplaining ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : explanation ? (
          <FactorChart explanation={explanation} />
        ) : null}

        {/* Section 4: Actionable Recommendations */}
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

        {/* Section 5: What-If Scenario Simulator & Sensitivity Engine */}
        <section id="simulator-section" className="space-y-6">
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

          {/* 1D Sensitivity Response Curve */}
          <SensitivityChart currentInput={currentInput} />

          {/* Session Trial History Table */}
          <ScenarioHistory
            history={scenarioHistory}
            onClear={() => setScenarioHistory([])}
            onSelectScenario={(scen) => setActiveScenario(scen)}
          />
        </section>
      </main>

      {/* Footer */}
      <Footer onOpenModelInfo={() => setIsModelInfoOpen(true)} />

      {/* Modals & Drawers */}
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
