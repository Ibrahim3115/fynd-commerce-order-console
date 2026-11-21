import React, { useEffect, useState } from 'react';
import {
  Server, CheckCircle2, AlertCircle, RefreshCw,
  Cpu, GitBranch, Layers, ShieldCheck, HardDrive
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
        <h2 className="text-[22px] font-semibold text-brand-text tracking-tight">
          Settings
        </h2>
        <p className="text-[13px] text-brand-secondary mt-0.5">
          System configuration, API service health and fulfilment rules
        </p>
      </div>

      {/* Gateway Health Card */}
      <div className="bg-brand-surface border border-brand-border rounded-lg p-5 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between pb-3.5 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-brand-accent-subtle text-brand-accent border border-brand-accent-border">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-[14px] text-brand-text">Backend API Gateway</h3>
              <p className="text-[12px] text-brand-secondary font-mono">{backendUrl}</p>
            </div>
          </div>
          <button
            onClick={checkHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface hover:bg-brand-surface-subtle border border-brand-border rounded-md text-[13px] font-medium text-brand-secondary hover:text-brand-text transition-colors shadow-subtle"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthStatus === 'checking' ? 'animate-spin' : ''}`} />
            Check Connection
          </button>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-md bg-brand-surface-subtle border border-brand-border">
          {healthStatus === 'healthy' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-emerald-800">API Gateway Connected</p>
                <p className="text-[12px] font-mono text-brand-secondary mt-0.5">
                  Response: {JSON.stringify(healthDetails)}
                </p>
              </div>
            </>
          ) : healthStatus === 'unhealthy' ? (
            <>
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-rose-800">Gateway Offline</p>
                <p className="text-[12px] font-mono text-brand-secondary mt-0.5">
                  Verify the backend FastAPI server is listening on port 8000.
                </p>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-brand-secondary">Checking service status...</p>
          )}
        </div>
      </div>

      {/* State Machine Specification */}
      <div className="bg-brand-surface border border-brand-border rounded-lg p-5 space-y-4 shadow-subtle">
        <div className="flex items-center gap-2 pb-3 border-b border-brand-border">
          <GitBranch className="w-4 h-4 text-brand-accent" />
          <h3 className="font-medium text-[14px] text-brand-text">
            Fulfilment State Machine
          </h3>
        </div>

        <div className="p-4 rounded-md bg-brand-surface-subtle border border-brand-border text-[13px] text-brand-secondary space-y-3">
          <div>
            <p className="text-emerald-800 font-medium text-[12px] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Permitted State Transitions
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-[13px]">
              <li>
                <span className="text-blue-700 font-medium font-mono text-[12px]">PLACED</span> ➔{' '}
                <span className="text-amber-800 font-medium font-mono text-[12px]">PACKED</span> (Warehouse picks and packages inventory)
              </li>
              <li>
                <span className="text-amber-800 font-medium font-mono text-[12px]">PACKED</span> ➔{' '}
                <span className="text-emerald-800 font-medium font-mono text-[12px]">SHIPPED</span> (Order dispatched to courier)
              </li>
              <li>
                <span className="text-blue-700 font-medium font-mono text-[12px]">PLACED</span> ➔{' '}
                <span className="text-rose-700 font-medium font-mono text-[12px]">CANCELLED</span> (Restores stock automatically)
              </li>
              <li>
                <span className="text-amber-800 font-medium font-mono text-[12px]">PACKED</span> ➔{' '}
                <span className="text-rose-700 font-medium font-mono text-[12px]">CANCELLED</span> (Restores stock automatically)
              </li>
            </ul>
          </div>

          <div className="pt-2.5 border-t border-brand-border">
            <p className="text-rose-800 font-medium text-[12px] mb-1">
              Prohibited Transitions
            </p>
            <p className="text-[12px] text-brand-secondary">
              PLACED ➔ SHIPPED (forbidden without packing) · SHIPPED ➔ CANCELLED (cannot recall dispatched parcels) · CANCELLED ➔ ANY (terminal state)
            </p>
          </div>
        </div>
      </div>

      {/* Technical Architecture Stack */}
      <div className="bg-brand-surface border border-brand-border rounded-lg p-5 space-y-4 shadow-subtle">
        <div className="flex items-center gap-2 pb-3 border-b border-brand-border">
          <Layers className="w-4 h-4 text-brand-accent" />
          <h3 className="font-medium text-[14px] text-brand-text">
            Technical Architecture
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-[13px]">
          <div className="p-3.5 bg-brand-surface-subtle rounded-md border border-brand-border">
            <p className="font-medium text-brand-text mb-1 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-brand-accent" /> Frontend
            </p>
            <p className="text-brand-secondary text-[12px]">React 18, Vite, TypeScript, Tailwind CSS</p>
            <p className="text-brand-secondary text-[11px] mt-1">
              Inter typography, Lucide icons, Recharts
            </p>
          </div>

          <div className="p-3.5 bg-brand-surface-subtle rounded-md border border-brand-border">
            <p className="font-medium text-brand-text mb-1 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-brand-accent" /> Backend
            </p>
            <p className="text-brand-secondary text-[12px]">Python 3.13, FastAPI, Pydantic v2</p>
            <p className="text-brand-secondary text-[11px] mt-1">
              Eager loading, exception handlers, automated tests
            </p>
          </div>

          <div className="p-3.5 bg-brand-surface-subtle rounded-md border border-brand-border">
            <p className="font-medium text-brand-text mb-1 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-brand-accent" /> Database
            </p>
            <p className="text-brand-secondary text-[12px]">SQLAlchemy 2.0 ORM, SQLite DB</p>
            <p className="text-brand-secondary text-[11px] mt-1">
              Atomic transactions, foreign key cascades
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};