import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { RiskPayload } from '../../types/prediction';
import { getRiskColor } from '../../utils/formatting';

interface RiskCardProps {
  risk: RiskPayload;
}

export const RiskCard: React.FC<RiskCardProps> = ({ risk }) => {
  const styles = getRiskColor(risk.level);

  return (
    <Card variant="elevated" className="p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
      {/* Background glow accent */}
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none -z-10 ${styles.bg}`} />

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${styles.badge}`}>
              {risk.level === 'HIGH' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : risk.level === 'MODERATE' ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Risk of a poor harvest
              </h3>
              <p className="text-[11px] text-slate-500">
                Based on weather, soil, and crop conditions
              </p>
            </div>
          </div>

          <Badge
            variant={
              risk.level === 'HIGH' ? 'rose' : risk.level === 'MODERATE' ? 'amber' : 'emerald'
            }
          >
            {risk.level} RISK
          </Badge>
        </div>

        {/* Score and Bar */}
        <div className="my-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Risk Score</span>
            <span className={`text-2xl font-bold font-mono ${styles.text}`}>
              {risk.score !== undefined ? `${risk.score} / 100` : 'Assessed'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                risk.level === 'HIGH'
                  ? 'bg-rose-500'
                  : risk.level === 'MODERATE'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, risk.score || 20))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Drivers / Protective factors */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        {risk.protective_factors.length > 0 && (
          <div className="text-[11px] flex items-start gap-1.5 text-emerald-300/90 leading-tight">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Working in your favor: </strong> {risk.protective_factors.slice(0, 2).join('; ')}
            </span>
          </div>
        )}

        {risk.drivers.length > 0 ? (
          <div className="text-[11px] flex items-start gap-1.5 text-rose-300/90 leading-tight">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Watch out for: </strong> {risk.drivers.slice(0, 2).join('; ')}
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">
            No major risk factors detected for these conditions.
          </div>
        )}
      </div>
    </Card>
  );
};
