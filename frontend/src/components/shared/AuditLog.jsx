import { useState, useEffect, useMemo } from "react";
import { ScrollText, Inbox, Terminal, Download, Filter, ExternalLink, X } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";

const ACTION_LABELS = [
  "Doctor Registered",
  "Patient Registered",
  "Access Granted",
  "Access Revoked",
  "Record Created",
  "Record Viewed",
];

const ACTION_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-emerald-100 text-emerald-700",
  "bg-red-100 text-red-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
];

export default function AuditLog({ title = "Audit Log", showAll = false, variant = "default" }) {
  const isTerminal = variant === "terminal";
  const { account, contracts } = useWeb3();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [addrFilter, setAddrFilter] = useState("");

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter !== "all" && Number(e.actionType) !== Number(actionFilter)) return false;
      if (addrFilter) {
        const q = addrFilter.toLowerCase();
        if (!e.performer.toLowerCase().includes(q) && !e.subject.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, actionFilter, addrFilter]);

  const toCSV = (rows) => {
    const header = "index,action,performer,subject,details,timestamp,iso\n";
    const body = rows
      .map((e, i) => {
        const ts = Number(e.timestamp);
        const action = ACTION_LABELS[Number(e.actionType)] || "Unknown";
        const details = String(e.details || "").replace(/"/g, '""');
        return `${i + 1},"${action}",${e.performer},${e.subject},"${details}",${ts},"${new Date(ts * 1000).toISOString()}"`;
      })
      .join("\n");
    return header + body;
  };

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => download(toCSV(filtered), `audit-${Date.now()}.csv`, "text/csv");
  const exportJSON = () => {
    const data = filtered.map((e, i) => ({
      index: i + 1,
      action: ACTION_LABELS[Number(e.actionType)] || "Unknown",
      performer: e.performer,
      subject: e.subject,
      details: e.details,
      timestamp: Number(e.timestamp),
      iso: new Date(Number(e.timestamp) * 1000).toISOString(),
    }));
    download(JSON.stringify(data, null, 2), `audit-${Date.now()}.json`, "application/json");
  };

  useEffect(() => {
    if (!contracts || !account) return;
    const load = async () => {
      setLoading(true);
      try {
        let logs = [];

        if (showAll) {
          // Admin view: fetch ALL entries in the system
          const total = await contracts.auditTrail.getTotalEntries();
          const count = Number(total);
          for (let i = 0; i < count; i++) {
            const entry = await contracts.auditTrail.getEntry(i);
            logs.push(entry);
          }
        } else {
          // User view: fetch only entries involving this address
          const ids = await contracts.auditTrail.getUserAuditIds(account);
          for (const id of ids) {
            const entry = await contracts.auditTrail.getEntry(id);
            logs.push(entry);
          }
        }

        logs.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setEntries(logs);
      } catch (err) {
        console.error("Failed to load audit log:", err);
      }
      setLoading(false);
    };
    load();
  }, [contracts, account, showAll]);

  if (isTerminal) {
    return (
      <div className="hc-terminal p-6 relative">
        <div className="hc-scanline" />
        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-teal-300/30 bg-teal-400/5 flex items-center justify-center text-teal-200">
              <Terminal size={16} />
            </div>
            <div>
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--hc-text-mute)]">
                Action · 02 · Immutable Ledger
              </p>
              <h2 className="font-display text-xl text-white">{title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-dim)]">
            <span>
              <span className="text-teal-300">{filtered.length}</span>
              {filtered.length !== entries.length && <span className="text-[var(--hc-text-mute)]"> / {entries.length}</span>} entries
            </span>
            <span className="flex items-center gap-2">
              <span className="hc-dot" /> tail -f
            </span>
          </div>
        </div>

        {showAll && (
          <div className="relative flex flex-wrap items-center gap-2 mb-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-teal-300/20 bg-black/30">
              <Filter size={11} className="text-teal-300" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent font-mono-data text-[11px] text-teal-100 outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-[#050b15]">All Actions</option>
                {ACTION_LABELS.map((l, i) => (
                  <option key={i} value={i} className="bg-[#050b15]">{l}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-teal-300/20 bg-black/30">
              <input
                value={addrFilter}
                onChange={(e) => setAddrFilter(e.target.value)}
                placeholder="Filter by address (performer or subject)"
                className="bg-transparent font-mono-data text-[11px] text-teal-100 outline-none flex-1 placeholder:text-[var(--hc-text-mute)]"
              />
              {addrFilter && (
                <button
                  onClick={() => setAddrFilter("")}
                  className="text-[var(--hc-text-mute)] hover:text-rose-300"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <button
              onClick={exportCSV}
              disabled={!filtered.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-300/30 bg-teal-400/5 hover:bg-teal-400/10 font-mono-data text-[10px] uppercase tracking-[0.16em] text-teal-200 disabled:opacity-40 transition-all"
            >
              <Download size={11} /> CSV
            </button>
            <button
              onClick={exportJSON}
              disabled={!filtered.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-300/30 bg-teal-400/5 hover:bg-teal-400/10 font-mono-data text-[10px] uppercase tracking-[0.16em] text-teal-200 disabled:opacity-40 transition-all"
            >
              <Download size={11} /> JSON
            </button>
          </div>
        )}

        <div className="relative font-mono-data text-[12px]">
          <div className="text-teal-300/80 mb-3">
            <span className="text-emerald-300">root@healthchain</span>
            <span className="text-[var(--hc-text-mute)]">:</span>
            <span className="text-teal-200">~/audit</span>
            <span className="text-[var(--hc-text-mute)]">$ </span>
            <span className="hc-cursor">cat audit.ledger</span>
          </div>

          {loading ? (
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 rounded bg-teal-300/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-[var(--hc-text-mute)]">
              <Inbox size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-[11px] uppercase tracking-wider">
                {entries.length === 0 ? "No entries · stream idle" : "No entries match filters"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.16em] text-[var(--hc-text-mute)]">
                    <th className="pb-3 px-3 font-normal">#</th>
                    <th className="pb-3 px-3 font-normal">Action</th>
                    <th className="pb-3 px-3 font-normal">Performer</th>
                    <th className="pb-3 px-3 font-normal">Subject</th>
                    <th className="pb-3 px-3 font-normal">Details</th>
                    <th className="pb-3 px-3 font-normal">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="text-[12px]">
                  {filtered.map((e, i) => {
                    const idx = filtered.length - i;
                    return (
                      <tr
                        key={i}
                        className="border-t border-teal-300/5 hover:bg-teal-300/[0.03] transition-colors"
                      >
                        <td className="py-2.5 px-3 text-[var(--hc-text-mute)]">
                          {String(idx).padStart(4, "0")}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-emerald-300">
                            {ACTION_LABELS[Number(e.actionType)] || "UNKNOWN"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <a
                            href={`https://sepolia.etherscan.io/address/${e.performer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-200 hover:text-teal-100 hover:underline"
                          >
                            {e.performer.slice(0, 6)}…{e.performer.slice(-4)}
                            <ExternalLink size={9} className="opacity-60" />
                          </a>
                        </td>
                        <td className="py-2.5 px-3">
                          <a
                            href={`https://sepolia.etherscan.io/address/${e.subject}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-200 hover:text-teal-100 hover:underline"
                          >
                            {e.subject.slice(0, 6)}…{e.subject.slice(-4)}
                            <ExternalLink size={9} className="opacity-60" />
                          </a>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--hc-text-dim)] max-w-[260px] truncate">
                          {e.details || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--hc-text-mute)] whitespace-nowrap">
                          {new Date(Number(e.timestamp) * 1000).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-[var(--hc-text-mute)]">
            <span className="text-emerald-300">root@healthchain</span>
            <span className="text-[var(--hc-text-mute)]">:</span>
            <span className="text-teal-200">~/audit</span>
            <span className="text-[var(--hc-text-mute)]">$</span>
            <span className="hc-cursor" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
          <ScrollText size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-400">{entries.length} entries</p>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <Inbox size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">No audit entries found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3 px-2 font-medium">Action</th>
                <th className="pb-3 px-2 font-medium">Performer</th>
                <th className="pb-3 px-2 font-medium">Subject</th>
                <th className="pb-3 px-2 font-medium">Details</th>
                <th className="pb-3 px-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        ACTION_COLORS[Number(e.actionType)] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ACTION_LABELS[Number(e.actionType)] || "Unknown"}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono text-xs text-gray-600">
                    {e.performer.slice(0, 6)}...{e.performer.slice(-4)}
                  </td>
                  <td className="py-3 px-2 font-mono text-xs text-gray-600">
                    {e.subject.slice(0, 6)}...{e.subject.slice(-4)}
                  </td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{e.details}</td>
                  <td className="py-3 px-2 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(Number(e.timestamp) * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
