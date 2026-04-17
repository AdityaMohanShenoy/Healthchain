import { useEffect, useState } from "react";
import { Stethoscope, Users, Copy, Check, ExternalLink, Eye } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import RegistryDetailModal from "./RegistryDetailModal";

function AddressRow({ addr, index, accent, onInspect }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <li
      onClick={onInspect}
      className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--hc-border)] bg-black/30 hover:border-[var(--hc-border-strong)] hover:bg-black/40 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="font-mono-data text-[10px] w-7 text-center py-1 rounded border"
          style={{ borderColor: `${accent}44`, color: accent, background: `${accent}10` }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-mono-data text-[12px] text-teal-100 truncate">
          {addr}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="hidden group-hover:flex items-center gap-1 font-mono-data text-[10px] uppercase tracking-[0.16em] text-[var(--hc-text-dim)]">
          <Eye size={11} /> inspect
        </span>
        <button
          onClick={copy}
          className="w-8 h-8 rounded-md border border-[var(--hc-border)] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[var(--hc-border-strong)] flex items-center justify-center text-[var(--hc-text-dim)] hover:text-teal-200 transition-all"
          title="Copy address"
        >
          {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
        </button>
        <a
          href={`https://sepolia.etherscan.io/address/${addr}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded-md border border-[var(--hc-border)] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[var(--hc-border-strong)] flex items-center justify-center text-[var(--hc-text-dim)] hover:text-teal-200 transition-all"
          title="View on Etherscan"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </li>
  );
}

function RegistryPanel({ title, code, icon: Icon, accent, addresses, loading, emptyLabel, onInspect }) {
  return (
    <div className="hc-card p-7">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl border flex items-center justify-center"
            style={{ borderColor: `${accent}44`, color: accent, background: `${accent}10` }}
          >
            <Icon size={18} />
          </div>
          <div>
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--hc-text-mute)]">
              {code}
            </p>
            <h3 className="font-display text-xl text-white">{title}</h3>
          </div>
        </div>
        <span
          className="font-mono-data text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-md border"
          style={{ borderColor: `${accent}44`, color: accent, background: `${accent}08` }}
        >
          {addresses.length} total
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/[0.03] border border-[var(--hc-border)] animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[var(--hc-border)] rounded-xl">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-mute)]">
            {emptyLabel}
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[360px] overflow-y-auto pr-1 hc-scroll">
          {addresses.map((addr, i) => (
            <AddressRow key={addr} addr={addr} index={i} accent={accent} onInspect={() => onInspect(addr)} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Registry() {
  const { contracts } = useWeb3();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inspect, setInspect] = useState(null);

  useEffect(() => {
    if (!contracts) return;
    (async () => {
      try {
        const [d, p] = await Promise.all([
          contracts.roleManager.getDoctors(),
          contracts.roleManager.getPatients(),
        ]);
        setDoctors([...d]);
        setPatients([...p]);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, [contracts]);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <RegistryPanel
          title="Clinicians"
          code="Registry · 01"
          icon={Stethoscope}
          accent="#5eead4"
          addresses={doctors}
          loading={loading}
          emptyLabel="No doctors registered"
          onInspect={(addr) => setInspect({ addr, kind: "doctor" })}
        />
        <RegistryPanel
          title="Patients"
          code="Registry · 02"
          icon={Users}
          accent="#86efac"
          addresses={patients}
          loading={loading}
          emptyLabel="No patients registered"
          onInspect={(addr) => setInspect({ addr, kind: "patient" })}
        />
      </div>
      {inspect && (
        <RegistryDetailModal
          address={inspect.addr}
          kind={inspect.kind}
          onClose={() => setInspect(null)}
        />
      )}
    </>
  );
}
