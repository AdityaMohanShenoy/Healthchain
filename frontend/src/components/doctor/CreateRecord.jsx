import { useState } from "react";
import toast from "react-hot-toast";
import { FilePlus2, ArrowRight } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import FileUpload from "../shared/FileUpload";

export default function CreateRecord({ patient, onCreated }) {
  const { contracts } = useWeb3();
  const [form, setForm] = useState({ diagnosis: "", prescription: "", notes: "" });
  const [ipfsHash, setIpfsHash] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("pending");
    const tid = toast.loading("Creating record on-chain...");
    try {
      const tx = await contracts.recordStorage.createRecord(
        patient,
        form.diagnosis,
        form.prescription,
        form.notes,
        ipfsHash
      );
      await tx.wait();
      setStatus("success");
      setForm({ diagnosis: "", prescription: "", notes: "" });
      setIpfsHash("");
      onCreated?.();
      toast.success("Record created!", { id: tid });
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error(err?.reason || err?.data?.message || "Failed to create record", { id: tid });
    }
  };

  return (
    <div className="hc-card p-7">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl border border-teal-300/30 bg-teal-400/10 flex items-center justify-center text-teal-200">
          <FilePlus2 size={18} />
        </div>
        <div>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--hc-text-mute)]">
            Action · 02
          </p>
          <h2 className="font-display text-xl text-white">Create Record</h2>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.16em] text-teal-300 mt-0.5">
            Patient · {patient.slice(0, 6)}…{patient.slice(-4)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-dim)] mb-2">
            Diagnosis
          </label>
          <input
            type="text"
            placeholder="e.g. Common Cold, Hypertension…"
            value={form.diagnosis}
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            className="hc-input"
            required
          />
        </div>
        <div>
          <label className="block font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-dim)] mb-2">
            Prescription
          </label>
          <input
            type="text"
            placeholder="e.g. Paracetamol 500mg, Rest…"
            value={form.prescription}
            onChange={(e) => setForm({ ...form, prescription: e.target.value })}
            className="hc-input"
            required
          />
        </div>
        <div>
          <label className="block font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-dim)] mb-2">
            Notes <span className="text-[var(--hc-text-mute)] normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            placeholder="Additional notes or observations…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="hc-input resize-none"
            rows={3}
          />
        </div>

        <FileUpload onUploaded={setIpfsHash} />

        {ipfsHash && (
          <div className="px-3 py-2 rounded-md border border-teal-300/30 bg-teal-400/5 font-mono-data text-[10px] text-teal-200 break-all">
            <span className="uppercase tracking-[0.16em] text-[var(--hc-text-mute)] mr-2">IPFS CID</span>
            {ipfsHash}
          </div>
        )}

        <button type="submit" disabled={status === "pending"} className="hc-btn w-full">
          {status === "pending" ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
              Broadcasting
            </>
          ) : (
            <>Create Record <ArrowRight size={15} /></>
          )}
        </button>

        {status === "success" && (
          <div className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-emerald-300 flex items-center gap-2">
            <span className="hc-dot" /> Record committed on-chain
          </div>
        )}
      </form>
    </div>
  );
}
