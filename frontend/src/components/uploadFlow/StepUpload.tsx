"use client";
import { useRef, useState } from "react";
import { UploadCloud, Info, Loader2, CheckCircle, X } from "lucide-react";
import { uploadApi } from "@/services/api";

interface Props {
  onComplete: (extractedPath: string, files: any[]) => void;
  onBack?: () => void;
}

export default function StepUpload({ onComplete, onBack }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filePicked, setFilePicked] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFilePick = (file: File) => {
    setFilePicked(file);
    setError("");
  };

  const handleRemoveFile = () => {
    setFilePicked(null);
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleExtract = async () => {
    if (!filePicked) return;
    setUploading(true);
    setError("");

    try {
      const result = await uploadApi.discoverFiles(filePicked);

      onComplete(result.extractedPath, result.contractFiles);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="px-10 py-4 min-h-[520px] flex flex-col justify-between">
      {/* Title */}
      <div>
        <h2 className="text-[20px] font-normal text-[var(--text-primary)]">
          Upload Solana Program Snapshot
        </h2>
        <p className="text-sm font-normal text-[var(--text-secondary)] mt-1">
          Upload a zipped folder containing your smart contract files for
          analysis
        </p>

        {/* File Picked Display */}
        {filePicked && (
          <div className="mt-20 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {filePicked.name}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {formatFileSize(filePicked.size)} • Ready to upload
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              disabled={uploading}
              className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Dropzone */}
        {!filePicked && (
          <div
            className="mt-6 rounded-2xl border-2 border-dashed px-10 py-4 text-center cursor-pointer
                       border-[#3A8DFF]/40 bg-[#D9E8FF]/20 hover:bg-[#D9E8FF]/30 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F0FF]">
              <UploadCloud className="h-6 w-6 text-[var(--button-primary)]" />
            </div>

            <p className="text-[var(--text-primary)] font-normal mb-1">
              Drop your archive file here
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-0">
              Supports .zip, .tar.gz, .7z, .rar files up to 100MB
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              We compute a tree hash and encrypt locally with Arcium before
              upload.
            </p>
            <button
              type="button"
              className="rounded-xl px-6 py-2 bg-transparent text-[var(--button-primary)] border-2 border-[var(--button-primary)] cursor-pointer focus:outline-none hover:bg-[var(--button-primary)] hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Click to upload
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".zip,.tar.gz,.tgz,.7z,.rar"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFilePick(e.target.files[0])
              }
            />
          </div>
        )}

        {/* Instructions */}
        <div
          className={`${
            filePicked ? "mt-26" : "mt-6"
          } p-4 rounded-2xl bg-[#F5F3FF] border border-[#E2D9FF]`}
        >
          <div className="flex gap-2 items-center mb-2">
            <Info size={16} className="text-[var(--button-primary)]" />
            <span className="text-sm font-medium">Upload Instructions</span>
          </div>
          <ul className="text-xs text-[var(--text-secondary)] leading-5 space-y-1">
            <li>
              • Compress your smart contract project folder into a .zip,
              .tar.gz, .7z, or .rar file
            </li>
            <li>
              • Ensure your contracts are in common directories like /contracts,
              /src, or /programs
            </li>
            <li>• Supported contract types: Solidity (.sol) and Rust (.rs)</li>
            <li>• Maximum file size: 200MB</li>
          </ul>
        </div>
      </div>

      {/* Bottom Purple Disclosure */}
      <div className="mt-6 rounded-xl bg-[#E8E0FF] text-[#6B4EFF] text-xs px-4 py-3 flex items-center gap-2">
        <img src="/icons/arcium.svg" alt="arcium" className="w-4 h-4" />
        Arcum Disclosure: Encrypted in use. Only summaries leave compute.
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onBack}
          disabled={uploading}
          className="px-4 py-2 cursor-pointer rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--gray-light)] transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        <button
          disabled={!filePicked || uploading}
          onClick={handleExtract}
          className={`px-6 py-2 rounded-lg font-medium text-white transition-colors focus:outline-none flex items-center gap-2 ${
            filePicked && !uploading
              ? "bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload & Extract →"
          )}
        </button>
      </div>
    </div>
  );
}
