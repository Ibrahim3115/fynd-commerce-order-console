import React, { useEffect, useState } from 'react';
import {
  Server, Database, CheckCircle2, AlertCircle, RefreshCw, Cpu, GitBranch, Layers
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
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">System Architecture & Node Info</h2>
        <p className="text-sm text-slate-400">
          Operational console telemetry and platform configurations
        </p>
      </div>

      {/* Connection & Health Card */}
      <div className="bg-brand-panel border border-brand-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-brand-orange" />
            <div>
              <h3 className="font-semibold text-slate-100">Backend API Gateway</h3>
              <p className="text-xs text-slate-400 font-mono">{backendUrl}</p>
            </div>
          </div>
          <button
            onClick={checkHealth}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-card hover:bg-slate-800 border border-brand-border rounded-lg text-xs text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthStatus === 'checking' ? 'animate-spin' : ''}`} />
            Probe Health
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-card/70 border border-brand-border">
          {healthStatus === 'healthy' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-400">REST API Operational</p>
                <p className="text-[11px] text-slate-400">
                  {JSON.stringify(healthDetails)}
                </p>
              </div>
            </>
          ) : healthStatus === 'unhealthy' ? (
            <>
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-400">API Gateway Disconnected</p>
                <p className="text-[11px] text-slate-400">
                  Verify backend server running on port 8000
                </p>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Checking health endpoint /health...</p>
          )}
        </div>
      </div>

      {/* State Machine Specification */}
      <div className="bg-brand-panel border border-brand-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-brand-border">
          <GitBranch className="w-5 h-5 text-brand-orange" />
          <h3 className="font-semibold text-slate-100">Fulfilment State Machine Specification</h3>
        </div>

        <div className="p-4 rounded-lg bg-brand-dark border border-brand-border font-mono text-xs text-slate-300 space-y-2">
          <p className="text-emerald-400 font-bold">ALLOWED TRANSITIONS (ACID Guaranteed):</p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><span className="text-blue-400 font-bold">PLACED</span> ➔ <span className="text-amber-400 font-bold">PACKED</span> (Warehouse staff picks and packs inventory)</li>
            <li><span className="text-amber-400 font-bold">PACKED</span> ➔ <span className="text-emerald-400 font-bold">SHIPPED</span> (Handover to courier dispatch)</li>
            <li><span className="text-blue-400 font-bold">PLACED</span> ➔ <span className="text-red-400 font-bold">CANCELLED</span> (Restores stock automatically)</li>
            <li><span className="text-amber-400 font-bold">PACKED</span> ➔ <span className="text-red-400 font-bold">CANCELLED</span> (Restores stock automatically)</li>
          </ul>

          <p className="text-red-400 font-bold pt-2">BLOCKED / ILLEGAL TRANSITIONS (HTTP 422 Rejection):</p>
          <p className="text-slate-400">
            PLACED ➔ SHIPPED (forbidden without packaging) | SHIPPED ➔ CANCELLED (cannot recall dispatched parcels) | CANCELLED ➔ ANY (terminal state)
          </p>
        </div>
      </div>

      {/* Stack Details */}
      <div className="bg-brand-panel border border-brand-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-brand-border">
          <Layers className="w-5 h-5 text-brand-orange" />
          <h3 className="font-semibold text-slate-100">Engineering Specification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-brand-card rounded-lg border border-brand-border">
            <p className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-orange" /> Frontend
            </p>
            <p className="text-slate-400">React 18 + Vite + TypeScript + Tailwind CSS</p>
            <p className="text-slate-500 mt-1">Dark Industrial Warehouse theme with high-contrast status feedback</p>
          </div>

          <div className="p-3 bg-brand-card rounded-lg border border-brand-border">
            <p className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-brand-orange" /> Backend & Database
            </p>
            <p className="text-slate-400">FastAPI + SQLAlchemy 2.0 + SQLite/PostgreSQL</p>
            <p className="text-slate-500 mt-1">ACID transactions for stock allocation with atomic rollbacks</p>
          </div>
        </div>
      </div>
    </div>
  );
};
