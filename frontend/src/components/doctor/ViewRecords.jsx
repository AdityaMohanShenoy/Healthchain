import { useState, useEffect } from "react";
import { FolderOpen, FileText } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import RecordCard from "../shared/RecordCard";

export default function ViewRecords({ patient }) {
  const { contracts } = useWeb3();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contracts || !patient) return;
    const load = async () => {
      setLoading(true);
      try {
        const ids = await contracts.recordStorage.getPatientRecordIds(patient);
        const recs = [];
        for (const id of ids) {
          const rec = await contracts.recordStorage.getRecord(id);
          recs.push(rec);
        }
        recs.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
        setRecords(recs);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [contracts, patient]);

  return (
    <div className="hc-card p-7">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl border border-violet-300/30 bg-violet-400/10 flex items-center justify-center text-violet-200">
            <FileText size={18} />
          </div>
          <div>
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--hc-text-mute)]">
              Ledger · 03
            </p>
            <h2 className="font-display text-xl text-white">Patient Records</h2>
          </div>
        </div>
        <span className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-violet-200 px-2.5 py-1 rounded-md border border-violet-300/30 bg-violet-400/5">
          {records.length} on-chain
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-white/[0.03] border border-[var(--hc-border)] animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[var(--hc-border)] rounded-xl">
          <FolderOpen size={28} className="mx-auto mb-3 text-[var(--hc-text-mute)]" />
          <p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-mute)]">
            No records for this patient yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec, i) => (
            <RecordCard key={i} record={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
