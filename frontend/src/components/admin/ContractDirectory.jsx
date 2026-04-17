import { useState } from "react";
import { Box, Copy, Check, ExternalLink } from "lucide-react";
import CONTRACT_ADDRESSES from "../../config/contracts";

const CONTRACTS = [
  { name: "RoleManager",   code: "C/01", addr: CONTRACT_ADDRESSES.ROLE_MANAGER,    desc: "Roles & registrations" },
  { name: "AccessControl", code: "C/02", addr: CONTRACT_ADDRESSES.ACCESS_CONTROL,  desc: "Grant / revoke consent" },
  { name: "RecordStorage", code: "C/03", addr: CONTRACT_ADDRESSES.RECORD_STORAGE,  desc: "Medical records ledger" },
  { name: "AuditTrail",    code: "C/04", addr: CONTRACT_ADDRESSES.AUDIT_TRAIL,     desc: "Immutable audit log" },
];

function ContractRow({ name, code, addr, desc }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <li className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--hc-border)] bg-black/30 hover:border-[var(--hc-border-strong)] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono-data text-[10px] px-2 py-1 rounded border border-teal-300/30 bg-teal-400/5 text-teal-300">
          {code}
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm text-white">{name}</p>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.16em] text-[var(--hc-text-mute)]">
            {desc}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="hidden md:inline font-mono-data text-[11px] text-teal-100">
          {addr.slice(0, 6)}…{addr.slice(-4)}
        </span>
        <button
          onClick={copy}
          className="w-8 h-8 rounded-md border border-[var(--hc-border)] bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-[var(--hc-text-dim)] hover:text-teal-200 transition-all"
          title="Copy address"
        >
          {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
        </button>
        <a
          href={`https://sepolia.etherscan.io/address/${addr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-md border border-[var(--hc-border)] bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-[var(--hc-text-dim)] hover:text-teal-200 transition-all"
          title="View on Etherscan"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </li>
  );
}

export default function ContractDirectory() {
  return (
    <div className="hc-card p-7">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl border border-teal-300/30 bg-teal-400/10 flex items-center justify-center text-teal-200">
            <Box size={18} />
          </div>
          <div>
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--hc-text-mute)]">
              Utility · 02
            </p>
            <h2 className="font-display text-xl text-white">Deployed Contracts</h2>
          </div>
        </div>
        <span className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-teal-200 px-2.5 py-1 rounded-md border border-teal-300/30 bg-teal-400/5">
          Sepolia · 11155111
        </span>
      </div>

      <ul className="space-y-2">
        {CONTRACTS.map((c) => <ContractRow key={c.code} {...c} />)}
      </ul>
    </div>
  );
}
