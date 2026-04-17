import { useEffect, useState } from "react";
import { X, Copy, Check, ExternalLink, FileText, Stethoscope, Users } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";

export default function RegistryDetailModal({ address, kind, onClose }) {
  const { contracts } = useWeb3();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ records: [], doctors: [], patients: [] });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!contracts || !address) return;
    (async () => {
      setLoading(true);
      try {
        if (kind === "patient") {
          const [ids, docs] = await Promise.all([
            contracts.recordStorage.getPatientRecordIds(address),
            contracts.accessControl.getPatientDoctors(address),
          ]);
          const records = [];
          for (const id of ids) {
            const rec = await contracts.recordStorage.getRecord(id);
            records.push(rec);
          }
          records.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
          setData({ records, doctors: [...docs], patients: [] });
        } else {
          const patients = await contracts.accessControl.getDoctorPatients(address);
          setData({ records: [], doctors: [], patients: [...patients] });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, [contracts, address, kind]);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const accent = kind === "patient" ? "#86efac" : "#5eead4";
  const Icon = kind === "patient" ? Users : Stethoscope;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hc-card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--hc-border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl border flex items-center justify-center"
              style={{ borderColor: `${accent}44`, color: accent, background: `${accent}10` }}
            >
              <Icon size={18} />
            </div>
            <div>
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--hc-text-mute)]">
                {kind === "patient" ? "Patient Profile" : "Clinician Profile"}
              </p>
              <h3 className="font-display text-xl text-white">
                {address.slice(0, 6)}…{address.slice(-4)}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-[var(--hc-border)] bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-[var(--hc-text-dim)] hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[var(--hc-border)] flex items-center gap-2">
          <span className="font-mono-data text-[11px] text-teal-100 truncate flex-1">{address}</span>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-[0.16em] px-2.5 py-1.5 rounded-md border border-[var(--hc-border)] bg-white/[0.02] hover:bg-white/[0.06] text-[var(--hc-text-dim)] hover:text-teal-200 transition-all"
          >
            {copied ? <Check size={11} className="text-emerald-300" /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            href={`https://sepolia.etherscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-[0.16em] px-2.5 py-1.5 rounded-md border border-teal-300/30 bg-teal-400/5 hover:bg-teal-400/10 text-teal-200 transition-all"
          >
            Etherscan <ExternalLink size={11} />
          </a>
        </div>

        <div className="p-6 overflow-y-auto hc-scroll">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-[var(--hc-border)] animate-pulse" />
              ))}
            </div>
          ) : kind === "patient" ? (
            <div className="space-y-6">
              <Section
                title="Authorized Doctors"
                count={data.doctors.length}
                icon={Stethoscope}
                accent="#5eead4"
              >
                {data.doctors.length === 0 ? (
                  <Empty label="No doctors have access" />
                ) : (
                  <ul className="space-y-2">
                    {data.doctors.map((d) => <AddrRow key={d} addr={d} accent="#5eead4" />)}
                  </ul>
                )}
              </Section>

              <Section
                title="Medical Records"
                count={data.records.length}
                icon={FileText}
                accent="#a78bfa"
              >
                {data.records.length === 0 ? (
                  <Empty label="No records on chain" />
                ) : (
                  <ul className="space-y-2">
                    {data.records.map((r, i) => (
                      <li
                        key={i}
                        className="px-4 py-3 rounded-xl border border-[var(--hc-border)] bg-black/30"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display text-sm text-white">{r.diagnosis}</span>
                          <span className="font-mono-data text-[10px] text-[var(--hc-text-mute)]">
                            {new Date(Number(r.createdAt) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-mono-data text-[10px] uppercase tracking-[0.16em] text-[var(--hc-text-mute)]">
                          Dr · {r.doctor.slice(0, 6)}…{r.doctor.slice(-4)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          ) : (
            <Section
              title="Patients with Access"
              count={data.patients.length}
              icon={Users}
              accent="#86efac"
            >
              {data.patients.length === 0 ? (
                <Empty label="No patients have granted access" />
              ) : (
                <ul className="space-y-2">
                  {data.patients.map((p) => <AddrRow key={p} addr={p} accent="#86efac" />)}
                </ul>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, count, icon: Icon, accent, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: accent }} />
          <h4 className="font-mono-data text-[11px] uppercase tracking-[0.18em] text-[var(--hc-text-dim)]">
            {title}
          </h4>
        </div>
        <span
          className="font-mono-data text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded-md border"
          style={{ borderColor: `${accent}44`, color: accent, background: `${accent}08` }}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function AddrRow({ addr, accent }) {
  return (
    <li className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--hc-border)] bg-black/30">
      <span className="font-mono-data text-[12px] text-teal-100">
        {addr.slice(0, 10)}…{addr.slice(-6)}
      </span>
      <a
        href={`https://sepolia.etherscan.io/address/${addr}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--hc-text-dim)] hover:text-teal-200 transition-colors"
        style={{ color: accent }}
      >
        <ExternalLink size={12} />
      </a>
    </li>
  );
}

function Empty({ label }) {
  return (
    <div className="text-center py-6 border border-dashed border-[var(--hc-border)] rounded-xl">
      <p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-mute)]">
        {label}
      </p>
    </div>
  );
}
