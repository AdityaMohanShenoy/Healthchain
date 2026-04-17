import { useState } from "react";
import toast from "react-hot-toast";
import { Paperclip, Check } from "lucide-react";
import { uploadToIPFS } from "../../utils/ipfs";

export default function FileUpload({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    try {
      const cid = await uploadToIPFS(file);
      onUploaded(cid);
    } catch (err) {
      console.error("IPFS upload failed:", err);
      toast.error("File upload failed. Check Pinata API keys in .env");
    }
    setUploading(false);
  };

  return (
    <div>
      <label className="block font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--hc-text-dim)] mb-2">
        Attach File <span className="text-[var(--hc-text-mute)] normal-case tracking-normal">(optional)</span>
      </label>
      <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[var(--hc-border-strong)] bg-black/20 hover:bg-black/40 hover:border-teal-300/50 transition-all cursor-pointer">
        <Paperclip size={14} className="text-teal-300" />
        <span className="font-mono-data text-[11px] text-[var(--hc-text-dim)] truncate">
          {fileName || "Click to select a file · uploads to IPFS"}
        </span>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {uploading && (
        <div className="flex items-center gap-2 mt-2 font-mono-data text-[10px] uppercase tracking-[0.16em] text-teal-200">
          <span className="w-3 h-3 border-2 border-teal-300/30 border-t-teal-200 rounded-full animate-spin" />
          Uploading to IPFS…
        </div>
      )}
      {fileName && !uploading && (
        <div className="flex items-center gap-2 mt-2 font-mono-data text-[10px] uppercase tracking-[0.16em] text-emerald-300">
          <Check size={11} /> Uploaded · {fileName}
        </div>
      )}
    </div>
  );
}
