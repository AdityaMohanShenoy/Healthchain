import { useEffect, useState } from "react";
import { Activity, Copy, Check, Shield, Cpu } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import RegisterDoctor from "../components/admin/RegisterDoctor";
import SystemStats from "../components/admin/SystemStats";
import Registry from "../components/admin/Registry";
import RoleLookup from "../components/admin/RoleLookup";
import ContractDirectory from "../components/admin/ContractDirectory";
import AuditLog from "../components/shared/AuditLog";

function useFakeBlockHeight() {
  const [h, setH] = useState(7_482_193);
  useEffect(() => {
    const t = setInterval(() => setH((v) => v + 1), 12000);
    return () => clearInterval(t);
  }, []);
  return h;
}

export default function AdminDashboard() {
  const { account } = useWeb3();
  const block = useFakeBlockHeight();
  const [copied, setCopied] = useState(false);

  const copyAddr = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative min-h-[calc(100vh-68px)] overflow-hidden">
      <div className="hc-aurora" />
      <div className="hc-aurora-grid" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* ============ HERO ============ */}
        <header className="hc-rise hc-d-1 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--hc-border)] bg-white/[0.02]">
                <Shield size={12} className="text-teal-300" />
                <span className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-teal-300">
                  Admin Console
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--hc-border)] bg-white/[0.02]">
                <span className="hc-dot" />
                <span className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                  Sepolia · Online
                </span>
              </div>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-[0.95]">
              <span className="bg-gradient-to-br from-white via-teal-100 to-teal-300 bg-clip-text text-transparent">
                Healthchain
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Operator Suite
              </span>
            </h1>
            <p className="mt-3 max-w-md text-[var(--hc-text-dim)] text-sm leading-relaxed">
              Provision clinicians, monitor protocol activity, and inspect the immutable audit ledger.
            </p>
          </div>

          {/* wallet pill + block ticker */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <button
              onClick={copyAddr}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-full border border-[var(--hc-border-strong)] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              <span className="hc-dot" />
              <span className="font-mono-data text-xs text-teal-100">
                {account?.slice(0, 6)}…{account?.slice(-4)}
              </span>
              {copied ? (
                <Check size={14} className="text-emerald-300" />
              ) : (
                <Copy size={14} className="text-[var(--hc-text-dim)] group-hover:text-teal-200" />
              )}
            </button>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--hc-border)] bg-black/30">
              <Cpu size={14} className="text-teal-300" />
              <div className="flex flex-col leading-tight">
                <span className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-mute)]">
                  Block Height
                </span>
                <span className="font-mono-data text-sm text-teal-200 tabular-nums">
                  #{block.toLocaleString()}
                </span>
              </div>
              <Activity size={14} className="text-emerald-300 animate-pulse" />
            </div>
          </div>
        </header>

        {/* ============ TWO COLUMN ============ */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="hc-rise hc-d-2 lg:col-span-2">
            <RegisterDoctor />
          </div>
          <div className="hc-rise hc-d-3 lg:col-span-3">
            <SystemStats />
          </div>
        </div>

        {/* ============ REGISTRY ============ */}
        <div className="hc-rise hc-d-4">
          <Registry />
        </div>

        {/* ============ LOOKUP + CONTRACTS ============ */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="hc-rise hc-d-5">
            <RoleLookup />
          </div>
          <div className="hc-rise hc-d-5">
            <ContractDirectory />
          </div>
        </div>

        {/* ============ AUDIT LOG ============ */}
        <div className="hc-rise hc-d-6">
          <AuditLog title="System Audit Log" showAll={true} variant="terminal" />
        </div>

        {/* ============ FOOTER STATUS BAR ============ */}
        <footer className="hc-rise hc-d-6 mt-10 border-t border-[var(--hc-border)] pt-5 flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] font-mono-data text-[var(--hc-text-mute)]">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2"><span className="hc-dot" /> RPC Healthy</span>
            <span>Chain · 11155111</span>
            <span>Latency · 124ms</span>
          </div>
          <div className="flex items-center gap-5">
            <span>v1.0.0</span>
            <span className="text-teal-300">Healthchain Protocol</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
