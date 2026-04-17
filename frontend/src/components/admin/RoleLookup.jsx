import { useState } from "react";
import { Search, ExternalLink, ShieldCheck } from "lucide-react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";

const ROLE_META = [
  { label: "None", color: "#94a3b8", desc: "Not registered" },
  { label: "Admin", color: "#fbbf24", desc: "Protocol operator" },
  { label: "Doctor", color: "#5eead4", desc: "Registered clinician" },
  { label: "Patient", color: "#86efac", desc: "Registered patient" },
];

export default function RoleLookup() {
  const { contracts } = useWeb3();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const trimmed = input.trim();
    if (!ethers.utils.isAddress(trimmed)) {
      setError("Invalid Ethereum address");
      return;
    }

    setLoading(true);
    try {
      const role = Number(await contracts.roleManager.getRole(trimmed));
      let extras = { recordCount: null, doctorCount: null, patientCount: null };

      if (role === 2) {
        const patients = await contracts.accessControl.getDoctorPatients(trimmed);
        extras.patientCount = patients.length;
      } else if (role === 3) {
        const [recs, docs] = await Promise.all([
          contracts.recordStorage.getPatientRecordIds(trimmed),
          contracts.accessControl.getPatientDoctors(trimmed),
        ]);
        extras.recordCount = recs.length;
        extras.doctorCount = docs.length;
      }

      setResult({ address: trimmed, role, ...extras });
    } catch (err) {
      console.error(err);
      setError("Lookup failed — check console");
    }
    setLoading(false);
  };

  const meta = result ? ROLE_META[result.role] : null;

  return (
    <div className="hc-card p-7">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl border border-amber-300/30 bg-amber-400/10 flex items-center justify-center text-amber-200">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--hc-text-mute)]">
            Utility · 01
          </p>
          <h2 className="font-display text-xl text-white">Role Lookup</h2>
        </div>
      </div>

      <form onSubmit={lookup} className="flex gap-2 mb-5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x… address to inspect"
          className="hc-input flex-1"
        />
        <button type="submit" disabled={loading} className="hc-btn shrink-0">
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
          ) : (
            <><Search size={14} /> Lookup</>
          )}
        </button>
      </form>

      {error && (
        <div className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-rose-300 px-3 py-2 rounded-md border border-rose-400/30 bg-rose-400/5">
          {error}
        </div>
      )}

      {result && meta && (
        <div className="rounded-xl border border-[var(--hc-border)] bg-black/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono-data text-[11px] text-teal-100 truncate">
              {result.address}
            </span>
            <a
              href={`https://sepolia.etherscan.io/address/${result.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--hc-text-dim)] hover:text-teal-200 transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-mono-data text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-md border"
              style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}10` }}
            >
              {meta.label}
            </span>
            <span className="font-mono-data text-[11px] text-[var(--hc-text-dim)]">
              {meta.desc}
            </span>
          </div>
          {(result.recordCount !== null || result.patientCount !== null) && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--hc-border)]">
              {result.role === 3 && (
                <>
                  <Stat label="Records" value={result.recordCount} accent="#a78bfa" />
                  <Stat label="Doctors" value={result.doctorCount} accent="#5eead4" />
                </>
              )}
              {result.role === 2 && (
                <Stat label="Patients" value={result.patientCount} accent="#86efac" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="px-4 py-3 rounded-lg border border-[var(--hc-border)] bg-white/[0.02]">
      <p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-mute)]">
        {label}
      </p>
      <p className="font-display text-2xl mt-1 tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
