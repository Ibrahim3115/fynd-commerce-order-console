import React, { useEffect, useState } from 'react';
import {
  Server, CheckCircle2, AlertCircle, RefreshCw,
  Cpu, GitBranch, Layers, ShieldCheck, Terminal, HardDrive
} from 'lucide-react';
import { api } from '../api/client';

export const Settings: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [healthDetails, setHealthDetails] = useState<any>(null);

  const checkHealth = async () => {
    try {
      setHealthStatus('checking');
      const res = await api.get('/health');
      setHealthDetails(res.data);
      setHealthStatus('healthy');
    } catch (err: any) {
      setHealthStatus('unhealthy');
      setHealthDetails(err.message);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
          <Terminal className="w-5 h-5 text-brand-orange" />
          System Architecture & Console Telemetry
        </h2>
        <p className="text-xs text-brand-muted mt-0.5">
          Operational telemetry, backend API health status, and state transition specifications
        </p>
      </div>

      {/* Connection & Health Card */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-card">
        <div className="flex items-center justify-between pb-3.5 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-surface-raised text-brand-orange border border-brand-border">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-brand-text">Backend Operations Gateway</h3>
              <p className="text-xs text-brand-muted font-mono">{backendUrl}</p>
            </div>
          </div>
          <button
            onClick={checkHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface-raised hover:bg-brand-border border border-brand-border rounded-lg text-xs font-semibold text-brand-muted hover:text-brand-orange transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthStatus === 'checking' ? 'animate-spin' : ''}`} />
            Probe Gateway Health
          </button>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-lg bg-brand-dark border border-brand-border">
          {healthStatus === 'healthy' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-mono font-bold text-emerald-400">REST API Gateway Operational</p>
                <p className="text-[11px] font-mono text-brand-muted mt-0.5">
                  Payload: {JSON.stringify(healthDetails)}
                </p>
              </div>
            </>
          ) : healthStatus === 'unhealthy' ? (
            <>
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-mono font-bold text-red-400">Gateway Offline / Unreachable</p>
                <p className="text-[11px] font-mono text-brand-muted mt-0.5">
                  Ensure backend FastAPI daemon is listening on port 8000.
                </p>
              </div>
            </>
          ) : (
            <p className="text-xs font-mono text-brand-muted">Probing /health endpoint...</p>
          )}
        </div>
      </div>

      {/* State Machine Specification */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-card">
        <div className="flex items-center gap-2.5 pb-3 border-b border-brand-border">
          <GitBranch className="w-4 h-4 text-brand-orange" />
          <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-brand-text">
            Fulfilment State Machine Specification
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-brand-dark border border-brand-border font-mono text-xs text-brand-muted space-y-3">
          <div>
            <p className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Permitted State Transitions (Guaranteed ACID Atomic)
            </p>
            <ul className="space-y-1 pl-4 list-disc text-[11px]">
              <li>
                <span className="text-blue-400 font-bold">PLACED</span> ➔{' '}
                <span className="text-amber-400 font-bold">PACKED</span> (Warehouse staff picks, packages, and verifies inventory)
              </li>
              <li>
                <span className="text-amber-400 font-bold">PACKED</span> ➔{' '}
                <span className="text-emerald-400 font-bold">SHIPPED</span> (Courier consignment handover & dispatch)
              </li>
              <li>
                <span className="text-blue-400 font-bold">PLACED</span> ➔{' '}
                <span className="text-red-400 font-bold">CANCELLED</span> (Atomic rollback: restores stock to inventory catalogue)
              </li>
              <li>
                <span className="text-amber-400 font-bold">PACKED</span> ➔{' '}
                <span className="text-red-400 font-bold">CANCELLED</span> (Atomic rollback: unpacks order & restores stock)
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-brand-border/60">
            <p className="text-red-400 font-bold uppercase tracking-wider text-[11px] mb-1">
              Strictly Prohibited Illegal Transitions (HTTP 422 Rejection)
            </p>
            <p className="text-[11px] text-brand-muted/80">
              PLACED ➔ SHIPPED (forbidden without packaging verification) · SHIPPED ➔ CANCELLED (cannot recall dispatched parcel consignments) · CANCELLED ➔ ANY (terminal state)
            </p>
          </div>
        </div>
      </div>

      {/* Engineering Architecture Details */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-card">
        <div className="flex items-center gap-2.5 pb-3 border-b border-brand-border">
          <Layers className="w-4 h-4 text-brand-orange" />
          <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-brand-text">
            Technical Architecture Stack
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-4 bg-brand-dark rounded-xl border border-brand-border">
            <p className="font-bold text-brand-text mb-1.5 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-orange" /> Frontend Core
            </p>
            <p className="text-brand-muted text-[11px]">React 18 + Vite + TypeScript + Tailwind CSS</p>
            <p className="text-brand-muted/70 text-[10px] mt-1 font-mono">
              Lucide Icons · Recharts Analytics · Collapsible Navigation
            </p>
          </div>

          <div className="p-4 bg-brand-dark rounded-xl border border-brand-border">
            <p className="font-bold text-brand-text mb-1.5 flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-orange" /> Backend Services
            </p>
            <p className="text-brand-muted text-[11px]">Python 3.13 + FastAPI + Pydantic v2</p>
            <p className="text-brand-muted/70 text-[10px] mt-1 font-mono">
              Eager loading · Custom exception handling · Pytest
            </p>
          </div>

          <div className="p-4 bg-brand-dark rounded-xl border border-brand-border">
            <p className="font-bold text-brand-text mb-1.5 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-brand-orange" /> Persistence Layer
            </p>
            <p className="text-brand-muted text-[11px]">SQLAlchemy 2.0 ORM + SQLite Persistent DB</p>
            <p className="text-brand-muted/70 text-[10px] mt-1 font-mono">
              Foreign keys · Cascade rules · Atomic commits & rollbacks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};