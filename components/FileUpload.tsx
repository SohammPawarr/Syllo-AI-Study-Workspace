"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useDrivePicker from "react-google-drive-picker";
import { useCredits } from "@/app/dashboard/layout";

interface FileUploadProps {
  onUploadComplete: (workspaceId: string) => void;
  onJobStarted: (workspaceId: string) => void;
  compact?: boolean;
}

export default function FileUpload({
  onUploadComplete,
  onJobStarted,
  compact = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshCredits } = useCredits();

  const [openPicker, authResponse] = useDrivePicker();

  const handleOpenPicker = () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
      viewId: "DOCS",
      appId: process.env.NEXT_PUBLIC_GOOGLE_APP_ID || "",
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: true,
      callbackFunction: async (data: any) => {
        if (data.action === "picked") {
          setIsUploading(true);
          setUploadError("");
          try {
            const token = authResponse?.access_token;
            if (!token) throw new Error("Missing OAuth token.");

            // 1. Create Workspace
            const fileNames = data.docs.map((doc: any) => doc.name);
            const wsRes = await fetch("/api/workspaces", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileNames }),
            });
            if (!wsRes.ok) {
              const e = await wsRes.json();
              throw new Error(e.error || "Failed to create workspace");
            }
            const { workspaceId } = await wsRes.json();

            // 2. Upload each file
            for (const pickedFile of data.docs) {
              const res = await fetch("/api/upload-drive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileId: pickedFile.id,
                  fileName: pickedFile.name,
                  accessToken: token,
                }),
              });
              if (!res.ok) throw new Error(`Failed to process ${pickedFile.name}`);
              const { fileUri } = await res.json();
              
              // Register document
              await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: pickedFile.name, fileUri, workspaceId }),
              });

              // Trigger job
              await fetch("/api/jobs/trigger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId, fileUrl: fileUri }),
              });
            }

            onUploadComplete(workspaceId);
            onJobStarted(workspaceId);
            refreshCredits();
          } catch (err: any) {
            setUploadError(err.message || "Failed to import from Google Drive.");
          } finally {
            setIsUploading(false);
          }
        }
      },
    });
  };

  const processFiles = (newFiles: FileList | File[]) => {
    const validFiles: File[] = [];
    let hasError = false;

    Array.from(newFiles).forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        setUploadError("One or more files exceed 20MB limit.");
        hasError = true;
      } else {
        validFiles.push(file);
      }
    });

    if (hasError) return;
    
    if (files.length + validFiles.length > 5) {
      setUploadError("You can only upload up to 5 files per workspace.");
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    setUploadError("");
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadError("");

    try {
      // 1. Create Workspace
      const fileNames = files.map(f => f.name);
      const wsRes = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileNames }),
      });
      if (!wsRes.ok) {
        const e = await wsRes.json();
        throw new Error(e.error || "Failed to create workspace");
      }
      const { workspaceId } = await wsRes.json();

      // 2. Upload files one by one
      const backendUrl = (process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860').replace(/\/$/, '');
      const uploadUrl = `${backendUrl}/v1/upload`;

      for (const file of files) {
        const formData = new FormData();
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, '_');
        const cleanBlob = new Blob([file], { type: file.type });
        formData.append("file", cleanBlob, safeName);

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Backend upload failed for " + file.name);

        const backendData = await uploadRes.json();
        const fileUri = backendData.file_path;

        // Register document
        const registerRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileUri, workspaceId }),
        });

        if (!registerRes.ok) throw new Error("Failed to register document");

        // Trigger job
        const triggerRes = await fetch("/api/jobs/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, fileUrl: fileUri }),
        });
        
        if (!triggerRes.ok) throw new Error("Failed to trigger processing");
      }

      onUploadComplete(workspaceId);
      onJobStarted(workspaceId);
      refreshCredits();
      setFiles([]);

    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 rounded-2xl ${compact ? "p-4 border-solid" : "p-8 border-dashed"} text-center cursor-pointer transition-all duration-200 shadow-sm
          ${
            isDragging
              ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/5 scale-[1.02]"
              : files.length > 0
                ? "border-[var(--brand-light-blue)] bg-[var(--gray-50)]"
                : compact
                  ? "border-[var(--brand-blue)] bg-[var(--brand-yellow)] hover:bg-[#EAB308] shadow-solid hover:translate-y-[-2px]"
                  : "border-[var(--gray-300)] hover:border-[var(--brand-light-blue)] bg-[var(--white)]"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {files.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-[var(--white)] p-2 rounded-xl border border-[var(--gray-200)] shadow-sm">
                <div className="w-8 h-8 bg-[var(--brand-yellow)] rounded-lg border border-[var(--black)]/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[var(--gray-900)]" />
                </div>
                <div className="min-w-0 text-left flex-1">
                  <p className="text-sm font-bold text-[var(--gray-900)] truncate">{file.name}</p>
                  <p className="text-xs font-medium text-[var(--gray-500)]">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {files.length < 5 && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 py-1.5 text-xs font-bold text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10 rounded-lg transition-colors border border-dashed border-[var(--brand-blue)]"
              >
                + Add Another File
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${compact ? "bg-[var(--white)] border-2 border-[var(--brand-blue)] shadow-sm" : "bg-[var(--brand-light-blue)]/10"}`}>
              <Upload className={`w-6 h-6 ${compact ? "text-[var(--brand-blue)]" : "text-[var(--brand-light-blue)]"}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${compact ? "text-[var(--brand-blue)]" : "text-[var(--gray-700)]"}`}>
                Drop files or Browse
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${compact ? "text-[var(--brand-blue)]/70" : "text-[var(--gray-400)]"}`}>
                PDF, DOCX, PPTX (Max 20MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Google Drive & Classroom import (Sidebar Only) */}
      {files.length === 0 && compact && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleOpenPicker();
            }}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[var(--brand-blue)] text-[var(--brand-blue)] text-sm font-bold rounded-xl hover:bg-[var(--brand-blue)] hover:text-[var(--white)] transition-all shadow-sm"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" className="w-5 h-5 opacity-90" alt="Drive" />
            Drive
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              handleOpenPicker();
            }}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[var(--brand-blue)] text-[var(--brand-blue)] text-sm font-bold rounded-xl hover:bg-[var(--brand-blue)] hover:text-[var(--white)] transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/classroom_32dp.png" className="w-5 h-5 opacity-90" alt="Classroom" />
            Classroom
          </button>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {uploadError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[var(--white)] text-xs font-bold text-center bg-red-500 py-2 rounded-lg"
          >
            {uploadError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      {files.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--brand-blue)] text-[var(--white)] font-bold text-sm rounded-2xl hover:bg-[var(--brand-light-blue)] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Workspace...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Create Workspace (1000 pts)
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}
