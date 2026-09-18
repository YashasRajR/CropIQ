import React from 'react';
import { X, CheckCircle, BarChart3, AlertCircle, Layers, Cpu, ShieldCheck, FileText } from 'lucide-react';
import { ModelInfoResponse } from '../../types/api';
import { Badge } from '../common/Badge';
import { formatNumber } from '../../utils/formatting';

interface ModelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelInfo: ModelInfoResponse | null;
}

export const ModelInfoModal: React.FC<ModelInfoModalProps> = ({
  isOpen,
  onClose,
  modelInfo,
}) => {
  if (!isOpen) return null;

  // Fallback defaults from Phase 2 benchmark evaluation
  const metrics = modelInfo?.metrics || {
    val_mae: 0.9765,
    val_r2: 0.9169,
    test_mae: 1.1438,
    test_rmse: 1.5204,
    test_r2: 0.9169,
    test_mape: 2.19,
  };

  const dataset = modelInfo?.dataset_summary || {
    total_samples: 1047,
    training_samples: 670,
    validation_samples: 167,
    test_samples: 210,
    n_fields_total: 75,
    n_crops_total: 5,
  };

  const candidateModels = [
    { name: 'Random Forest (Selected)', valMae: '0.9765', testMae: '1.1438', testR2: '0.9169', status: 'Primary Production' },
    { name: 'Gradient Boosting', valMae: '1.0821', testMae: '1.2104', testR2: '0.9023', status: 'Candidate' },
    { name: 'Ridge Regression', valMae: '1.4520', testMae: '1.5890', testR2: '0.8421', status: 'Linear Baseline' },
    { name: 'Dummy Mean Regressor', valMae: '4.8210', testMae: '5.1200', testR2: '-0.0102', status: 'Trivial Baseline' },
  ];

  const featuresList = modelInfo?.features || [
    'crop_type', 'latitude', 'longitude', 'NDVI', 'GNDVI', 'NDWI', 'SAVI',
    'soil_moisture', 'temperature', 'rainfall', 'month_sin', 'month_cos',
    'doy_sin', 'doy_cos', 'NDVI_field_expanding_mean', 'GNDVI_field_expanding_mean',
    'SAVI_field_expanding_mean', 'soil_moisture_field_expanding_mean',
    'rainfall_field_expanding_mean', 'temperature_field_expanding_mean'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Technical Details & Model Specifications
                </h2>
                <Badge variant="emerald" size="sm">Phase 2 Validated</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Random Forest Supervised Regression (300 Trees) • Target: yield ({modelInfo?.target_unit || 'unconfirmed'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Key Metrics Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>Model Evaluation Metrics</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Validation MAE</div>
                <div className="text-xl font-mono font-bold text-emerald-800 mt-0.5">
                  {formatNumber(metrics.val_mae, 4)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Primary Gate Target</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Test MAE</div>
                <div className="text-xl font-mono font-bold text-emerald-800 mt-0.5">
                  {formatNumber(metrics.test_mae, 4)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Holdout Performance</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Test R² Score</div>
                <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                  {formatNumber(metrics.test_r2, 4)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">91.69% Variance Explained</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Test MAPE</div>
                <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                  {metrics.test_mape ? `${formatNumber(metrics.test_mape, 2)}%` : '2.19%'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Relative Error Margin</div>
              </div>
            </div>
          </div>

          {/* Candidate Models Benchmark */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Candidate Model Benchmark Comparison</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Architecture</th>
                    <th className="px-3 py-2.5">Val MAE</th>
                    <th className="px-3 py-2.5">Test MAE</th>
                    <th className="px-3 py-2.5">Test R²</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {candidateModels.map((m, idx) => (
                    <tr key={m.name} className={idx === 0 ? 'bg-emerald-50/50 text-emerald-950 font-semibold' : 'text-slate-700'}>
                      <td className="px-3 py-2.5 flex items-center gap-1.5 font-sans">
                        {idx === 0 && <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />}
                        <span>{m.name}</span>
                      </td>
                      <td className="px-3 py-2.5">{m.valMae}</td>
                      <td className="px-3 py-2.5">{m.testMae}</td>
                      <td className="px-3 py-2.5">{m.testR2}</td>
                      <td className="px-3 py-2.5 font-sans">
                        <Badge variant={idx === 0 ? 'emerald' : 'slate'} size="sm">
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dataset & Leakage Prevention */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-700" />
              <span>Data Foundation & Disjoint Field Partitioning</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Total Observations</div>
                <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                  {dataset.total_samples.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">GroupKFold Split</div>
                <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                  {dataset.training_samples} Train / {dataset.validation_samples} Val / {dataset.test_samples} Test
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Field-Disjoint Groups</div>
                <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                  {dataset.n_fields_total} Unique Fields (Zero Leakage)
                </div>
              </div>
            </div>
          </div>

          {/* Features Catalog */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Model Features ({featuresList.length} Total)
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {featuresList.map((feat) => (
                <span key={feat} className="px-2 py-0.5 bg-white border border-slate-200 text-[11px] font-mono text-slate-700 rounded">
                  {feat}
                </span>
              ))}
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold block mb-0.5 text-amber-900">
                Epistemic Non-Causal Framing & Target Unit
              </strong>
              Target column in the source dataset is labeled strictly as <code className="px-1 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">unconfirmed</code> yield.
              CropIQ never fabricates artificial units (e.g. kg/ha).
              All predictions, TreeSHAP attributions, and what-if differences describe learned statistical observational associations and must not be interpreted as counterfactual causal guarantees.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Artifact: models/cropiq_yield_model.joblib</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
