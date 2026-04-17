import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Activity, Copy, Check, Stethoscope, Cpu, FolderOpen } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import PatientList from "../components/doctor/PatientList";
import CreateRecord from "../components/doctor/CreateRecord";
import ViewRecords from "../components/doctor/ViewRecords";
import AuditLog from "../components/shared/AuditLog";

function useFakeBlockHeight() {
  const [h, setH] = useState(7_482_193);
  useEffect(() => {
    const t = setInterval(() => setH((v) => v + 1), 12000);
    return () => clearInterval(t);
  }, []);
  return h;
}

export default function DoctorDashboard() {
  const { account } = useWeb3();
  const location = useLocation();
  const block = useFakeBlockHeight();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedPatient(null);
  }, [location.state]);

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
        {/* HERO */}
        <header className="hc-rise hc-d-1 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--hc-border)] bg-white/[0.02]">
                <Stethoscope size={12} className="text-teal-300" />
                <span className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-teal-300">
                  Clinician Console
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
                Clinical Suite,
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                On-Chain.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-[var(--hc-text-dim)] text-sm leading-relaxed">
              Review authorized patients, author immutable medical records, and attach files via IPFS.
            </p>
          </div>

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

        {/* TWO COLUMN */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="hc-rise hc-d-2 md:col-span-1">
            <PatientList onSelectPatient={setSelectedPatient} selected={selectedPatient} />
          </div>
          <div className="md:col-span-2 space-y-6">
            {selectedPatient ? (
              <>
                <div className="hc-rise hc-d-3">
                  <CreateRecord
                    patient={selectedPatient}
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                </div>
                <div className="hc-rise hc-d-4">
                  <ViewRecords patient={selectedPatient} key={refreshKey} />
                </div>
              </>
            ) : (
              <div className="hc-card p-12 text-center hc-rise hc-d-3">
                <FolderOpen size={36} className="mx-auto mb-4 text-[var(--hc-text-mute)]" />
                <h3 className="font-display text-xl text-white mb-2">No Patient Selected</h3>
                <p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-mute)]">
                  Select a patient to author or review records
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AUDIT */}
        <div className="hc-rise hc-d-5">
          <AuditLog title="My Audit Log" variant="terminal" />
        </div>

        {/* FOOTER */}
        <footer className="hc-rise hc-d-6 mt-10 border-t border-[var(--hc-border)] pt-5 flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] font-mono-data text-[var(--hc-text-mute)]">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2"><span className="hc-dot" /> RPC Healthy</span>
            <span>Chain · 11155111</span>
          </div>
          <span className="text-teal-300">Healthchain Protocol</span>
        </footer>
      </div>
    </div>
  );
}
