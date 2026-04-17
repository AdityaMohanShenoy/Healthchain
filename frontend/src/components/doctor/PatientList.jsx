import { useState, useEffect } from "react";
import { Users, ShieldOff } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";

export default function PatientList({ onSelectPatient, selected }) {
  const { account, contracts } = useWeb3();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contracts || !account) return;
    const load = async () => {
      try {
        const list = await contracts.accessControl.getDoctorPatients(account);
        setPatients([...list]);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [contracts, account]);

  return (
    <div className="hc-card p-7 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl border border-emerald-300/30 bg-emerald-400/10 flex items-center justify-center text-emerald-200">
            <Users size={18} />
          </div>
          <div>
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--hc-text-mute)]">
              Roster · 01
            </p>
            <h2 className="font-display text-xl text-white">My Patients</h2>
          </div>
        </div>
        <span className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-emerald-200 px-2.5 py-1 rounded-md border border-emerald-300/30 bg-emerald-400/5">
          {patients.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-[var(--hc-border)] animate-pulse" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[var(--hc-border)] rounded-xl">
          <ShieldOff size={28} className="mx-auto mb-3 text-[var(--hc-text-mute)]" />
          <p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-mute)]">
            No access granted yet
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {patients.map((p) => {
            const isActive = selected === p;
            return (
              <li key={p}>
                <button
                  onClick={() => onSelectPatient(p)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 border ${
                    isActive
                      ? "bg-teal-400/10 border-teal-300/50 shadow-[0_0_20px_rgba(94,234,212,0.15)]"
                      : "bg-black/30 border-[var(--hc-border)] hover:border-[var(--hc-border-strong)] hover:bg-black/40"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-data text-[10px] border ${
                      isActive
                        ? "border-teal-300/60 bg-teal-400/15 text-teal-100"
                        : "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                    }`}
                  >
                    PT
                  </div>
                  <span className={`font-mono-data text-[12px] ${isActive ? "text-teal-100" : "text-teal-100/80"}`}>
                    {p.slice(0, 6)}…{p.slice(-4)}
                  </span>
                  {isActive && <span className="ml-auto hc-dot" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
