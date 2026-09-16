"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Plus, BookOpen, Layers, Trash2, Edit2, Check, X, MoreVertical, AlertTriangle, ChevronDown, ChevronRight, Folder, Upload } from "lucide-react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import FileUpload from "@/components/FileUpload";
import ChatInterface, { type ChatMessage } from "@/components/ChatInterface";
import ToolsPanel from "@/components/GenerateForm";
import FlashcardModal from "@/components/FlashcardViewer";
import ProcessingState from "@/components/ProcessingState";
import { createPortal } from "react-dom";

interface DocumentEntry {
  id: string;
  name: string;
  status: "processing" | "ready" | "failed";
}

interface WorkspaceEntry {
  id: string;
  name: string;
  status: "processing" | "ready" | "failed";
  documents: DocumentEntry[];
}

export default function DashboardPage() {
  /* ── Workspaces state ── */
  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingWsName, setEditingWsName] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [wsToDelete, setWsToDelete] = useState<string | null>(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});

  /* ── Chat state ── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /* ── Add files to workspace state ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addingToWsId, setAddingToWsId] = useState<string | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  /* ── Flashcard modal ── */
  const [flashcardData, setFlashcardData] = useState<any[] | null>(null);

  /* ── Client Portal Targets ── */
  const [leftPortal, setLeftPortal] = useState<HTMLElement | null>(null);
  const [rightPortal, setRightPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setLeftPortal(document.getElementById("mobile-left-panel"));
    setRightPortal(document.getElementById("mobile-right-panel"));
  }, []);

  const fetchWorkspaces = useCallback(() => {
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => {
        if (data.workspaces) {
          setWorkspaces(data.workspaces);
        }
      })
      .catch(console.error);
  }, []);

  /* ── Fetch Workspaces on Mount ── */
  useEffect(() => {
    // Wake up backend server invisibly
    const backendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860';
    fetch(`${backendUrl.replace(/\/$/, '')}/health`).catch(() => {});
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  /* ── Upload Handlers ── */
  const handleUploadComplete = useCallback(
    (workspaceId: string) => {
      fetchWorkspaces();
      setActiveWorkspaceId(workspaceId);
      setMessages([]);
    },
    [fetchWorkspaces]
  );

  const handleJobStarted = useCallback((jobId: string) => {
    setActiveJobId(jobId);
  }, []);

  const handleWsReady = useCallback(() => {
    fetchWorkspaces();
    setActiveJobId(null);
  }, [fetchWorkspaces]);

  const handleSelectWorkspace = (wsId: string) => {
    setActiveWorkspaceId(wsId);
    setMessages([]);
    setActiveJobId(null);
  };

  const toggleExpandWorkspace = (wsId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedWorkspaces(prev => ({
      ...prev,
      [wsId]: !prev[wsId]
    }));
  };

  const handleDeleteWs = async (id: string) => {
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
        if (activeWorkspaceId === id) setActiveWorkspaceId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWsToDelete(null);
    }
  };

  const handleEditWsName = async (id: string) => {
    if (!editingWsName.trim()) return;
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingWsName })
      });
      if (res.ok) {
        setWorkspaces((prev) =>
          prev.map((w) => (w.id === id ? { ...w, name: editingWsName } : w))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingWsId(null);
    }
  };

  const handleAddFiles = async (files: FileList) => {
    if (!addingToWsId || files.length === 0) return;
    const ws = workspaces.find(w => w.id === addingToWsId);
    if (!ws) return;
    
    if (ws.documents.length + files.length > 5) {
      alert("You can only have up to 5 files per workspace.");
      setAddingToWsId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    
    setIsUploadingFiles(true);
    try {
      const backendUrl = (process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860').replace(/\/$/, '');
      const uploadUrl = `${backendUrl}/v1/upload`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 20MB limit.`);
          continue;
        }

        const formData = new FormData();
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, '_');
        const cleanBlob = new Blob([file], { type: file.type });
        formData.append("file", cleanBlob, safeName);

        const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Backend upload failed for " + file.name);

        const backendData = await uploadRes.json();
        const fileUri = backendData.file_path;

        await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileUri, workspaceId: addingToWsId }),
        });

        await fetch("/api/jobs/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: addingToWsId, fileUrl: fileUri }),
        });
      }
      fetchWorkspaces();
      setActiveJobId(addingToWsId);
      setActiveWorkspaceId(addingToWsId);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setIsUploadingFiles(false);
      setAddingToWsId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isWsReady = activeWorkspace?.status === "ready";

  const renderLeftPanel = () => (
    <div className="flex flex-col h-full bg-[var(--gray-50)]">
      {/* Hidden input for adding files to workspace */}
      <input
        type="file"
        multiple
        accept=".pdf,.docx,.pptx"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
        }}
      />
      <div className="p-4 md:p-6 border-b border-[var(--gray-200)] bg-[var(--white)]">
        <h2 className="hidden lg:flex font-heading text-2xl font-extrabold tracking-[0.1em] text-[var(--brand-blue)] uppercase mb-4 items-center justify-center gap-2 mt-1">
          <BookOpen className="w-7 h-7" />
          <span>Library</span>
        </h2>
        <FileUpload
          onUploadComplete={handleUploadComplete}
          onJobStarted={handleJobStarted}
          compact
        />
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {workspaces.length === 0 ? (
          <div className="p-8 text-center text-[var(--gray-400)] flex flex-col items-center gap-2">
            <Layers className="w-8 h-8 opacity-50" />
            <p className="text-sm font-medium">No history yet</p>
          </div>
        ) : (
          workspaces.map((ws) => (
            <div key={ws.id} className="flex flex-col gap-1">
              {/* Workspace Tab */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (editingWsId !== ws.id) handleSelectWorkspace(ws.id);
                }}
                className={`relative w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all font-bold text-sm border-2 border-[var(--brand-blue)] group ${
                  openDropdownId === ws.id ? "z-50" : "z-10"
                } ${
                  ws.id === activeWorkspaceId
                    ? "bg-[var(--brand-light-blue)] text-[var(--white)] shadow-solid -translate-y-[2px] -translate-x-[2px]"
                    : "bg-[var(--white)] text-[var(--brand-blue)] hover:bg-[var(--gray-50)] hover:shadow-solid hover:-translate-y-[2px] hover:-translate-x-[2px]"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border-2 border-[var(--brand-blue)] ${ws.id === activeWorkspaceId ? "bg-[var(--brand-yellow)] text-[var(--brand-blue)]" : "bg-[var(--brand-light-blue)]/20 text-[var(--brand-blue)]"
                  }`}>
                  <Folder className="w-3.5 h-3.5" />
                </div>
                
                {editingWsId === ws.id ? (
                  <div className="flex-1 flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingWsName}
                      onChange={(e) => setEditingWsName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditWsName(ws.id);
                        if (e.key === "Escape") setEditingWsId(null);
                      }}
                      autoFocus
                      className={`flex-1 min-w-0 px-1 py-0.5 text-sm font-bold bg-transparent border-b-2 border-dashed outline-none transition-colors ${
                        ws.id === activeWorkspaceId
                          ? "text-[var(--white)] border-[var(--white)]/40 focus:border-[var(--white)] placeholder:text-[var(--white)]/50"
                          : "text-[var(--brand-blue)] border-[var(--brand-blue)]/40 focus:border-[var(--brand-blue)] placeholder:text-[var(--brand-blue)]/50"
                      }`}
                    />
                    <div className="flex items-center shrink-0 gap-0.5">
                      <button onClick={() => handleEditWsName(ws.id)} className={`p-1 rounded transition-colors ${
                          ws.id === activeWorkspaceId ? "hover:bg-white/20 text-[var(--white)]" : "hover:bg-[var(--brand-yellow)] text-[var(--brand-blue)]"
                      }`}>
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingWsId(null)} className={`p-1 rounded transition-colors ${
                          ws.id === activeWorkspaceId ? "hover:bg-red-500 hover:text-white text-[var(--white)]" : "hover:bg-red-500 hover:text-white text-[var(--gray-400)]"
                      }`}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="truncate flex-1">
                      {ws.name}
                    </span>
                    
                    <div 
                      className="relative flex items-center gap-1 shrink-0"
                      onMouseEnter={() => setOpenDropdownId(ws.id)}
                      onMouseLeave={() => setOpenDropdownId(null)}
                    >
                      {ws.status === "processing" && (
                        <span className={`w-2 h-2 rounded-full animate-pulse border border-[var(--black)] ${ws.id === activeWorkspaceId ? "bg-[var(--brand-blue)]" : "bg-[var(--brand-yellow)]"}`} />
                      )}

                      {ws.documents.length > 0 && (
                        <button 
                          onClick={(e) => toggleExpandWorkspace(ws.id, e)}
                          className={`p-1 rounded transition-colors ${ws.id === activeWorkspaceId ? 'hover:bg-white/20 text-white' : 'hover:bg-[var(--gray-200)] text-[var(--brand-blue)]'}`}
                        >
                          {expandedWorkspaces[ws.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === ws.id ? null : ws.id);
                        }}
                        className={`p-1 rounded transition-colors ${ws.id === activeWorkspaceId ? 'hover:bg-white/20 text-white' : 'hover:bg-[var(--gray-200)] text-[var(--brand-blue)]'}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openDropdownId === ws.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                          <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--white)] border-2 border-[var(--gray-200)] shadow-solid rounded-xl overflow-hidden min-w-[140px] flex flex-col font-bold">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddingToWsId(ws.id);
                                setOpenDropdownId(null);
                                setTimeout(() => fileInputRef.current?.click(), 10);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-[var(--gray-50)] hover:text-[var(--brand-blue)] flex items-center gap-2 text-sm text-[var(--gray-700)] transition-colors border-b border-[var(--gray-100)]"
                            >
                              <Upload className="w-4 h-4" /> Add Files
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingWsId(ws.id);
                                setEditingWsName(ws.name);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-[var(--gray-50)] hover:text-[var(--brand-blue)] flex items-center gap-2 text-sm text-[var(--gray-700)] transition-colors border-b border-[var(--gray-100)]"
                            >
                              <Edit2 className="w-4 h-4" /> Rename
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setWsToDelete(ws.id);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-sm text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Nested Documents Accordion */}
              {expandedWorkspaces[ws.id] && ws.documents.length > 0 && (
                <div className="flex flex-col gap-1 pl-4 pr-1 mb-2 border-l-2 border-[var(--brand-light-blue)]/30 ml-3">
                  {ws.documents.map((doc, idx) => (
                    <div key={doc.id || idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--gray-100)] transition-colors text-[var(--gray-600)] text-xs font-bold group">
                      <FileText className="w-3.5 h-3.5 text-[var(--gray-400)] group-hover:text-[var(--brand-blue)] shrink-0" />
                      <span className="truncate flex-1" title={doc.name}>{doc.name}</span>
                      {doc.status === "processing" && (
                         <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-yellow)] animate-pulse shrink-0 border border-[var(--black)]" />
                      )}
                      {doc.status === "failed" && (
                         <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {wsToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--black)]/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-[var(--white)] w-full max-w-sm rounded-[32px] border-4 border-[var(--brand-blue)] shadow-solid p-6 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-[20px] bg-red-100 border-2 border-red-200 flex items-center justify-center mb-4 shadow-sm text-red-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-xl font-extrabold text-[var(--brand-blue)] mb-2 uppercase tracking-wide">Delete Workspace</h3>
              <p className="text-sm font-medium text-[var(--gray-600)] mb-6">
                Are you sure you want to permanently delete this workspace and all its study history? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setWsToDelete(null)}
                  className="flex-1 py-2.5 bg-[var(--gray-100)] border-2 border-[var(--gray-200)] text-[var(--gray-700)] font-bold rounded-xl hover:bg-[var(--gray-200)] transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteWs(wsToDelete)}
                  className="flex-1 py-2.5 bg-red-500 border-2 border-red-600 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing status */}
      {activeJobId && activeWorkspaceId && (
        <div className="p-4 bg-[var(--white)] border-t border-[var(--gray-200)]">
          <ProcessingState
            jobId={activeJobId}
            documentId={activeWorkspaceId}
            onReady={handleWsReady}
          />
        </div>
      )}
    </div>
  );

  const renderCenterPanel = () => (
    <>
      {isUploadingFiles && (
        <div className="absolute inset-0 z-50 bg-[var(--white)]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
           <div className="w-16 h-16 rounded-[24px] bg-[var(--white)] border-4 border-[var(--brand-blue)] flex items-center justify-center mb-4 shadow-solid animate-pulse">
             <Upload className="w-8 h-8 text-[var(--brand-blue)]" />
           </div>
           <h2 className="font-heading text-xl font-extrabold tracking-wider text-[var(--brand-blue)] mb-2">
             UPLOADING FILES...
           </h2>
           <p className="text-sm font-medium text-[var(--gray-600)]">
             Adding documents to workspace
           </p>
        </div>
      )}
      {!activeWorkspaceId ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-slide-up">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-24 h-24 rounded-[32px] bg-[var(--white)] border-4 border-[var(--brand-blue)] shadow-solid flex items-center justify-center mb-6 relative"
          >
            <Plus className="w-10 h-10 text-[var(--brand-blue)]" />
          </motion.div>
          <h2 className="font-heading text-2xl font-extrabold tracking-wide text-[var(--brand-blue)] mb-3 drop-shadow-sm">
            NEW STUDY SESSION
          </h2>
          <p className="text-sm font-medium text-[var(--gray-600)] max-w-sm mb-8">
            Upload study materials from the Library panel to start analyzing, generating quizzes, and building flashcards.
          </p>
        </div>
      ) : !isWsReady ? (
        /* Processing state */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="w-20 h-20 rounded-[28px] bg-[var(--white)] border-4 border-[var(--brand-light-blue)] flex items-center justify-center mb-6 shadow-soft animate-pulse">
            <Layers className="w-10 h-10 text-[var(--brand-light-blue)]" />
          </div>
          <h2 className="font-heading text-lg font-extrabold tracking-wider text-[var(--brand-blue)] mb-2">
            READING WORKSPACE...
          </h2>
          <p className="text-sm font-medium text-[var(--gray-500)] mb-6">
            Preparing your study materials.
          </p>
          {activeJobId && (
            <div className="w-64 bg-[var(--white)] p-4 rounded-2xl border border-[var(--gray-200)] shadow-sm">
              <ProcessingState
                jobId={activeJobId}
                documentId={activeWorkspaceId}
                onReady={handleWsReady}
              />
            </div>
          )}
        </div>
      ) : (
        /* Chat interface */
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            documentId={activeWorkspaceId}
            messages={messages}
            setMessages={setMessages}
            onFlashcardTrigger={(cards) => setFlashcardData(cards)}
          />
        </div>
      )}
    </>
  );

  const renderRightPanel = () => (
    <>
      {activeWorkspaceId && isWsReady ? (
        <div className="h-full overflow-y-auto">
          <ToolsPanel />
        </div>
      ) : (
        <div className="h-full flex items-center justify-center p-6 text-center">
          <p className="text-sm font-medium text-[var(--gray-400)]">Open a workspace to access study tools</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP RESIZABLE LAYOUT
          ═══════════════════════════════════════════ */}
      <div className="hidden lg:flex w-full h-full">
        <PanelGroup orientation="horizontal">
          <Panel defaultSize={20} minSize={15} className="bg-[var(--gray-50)] border-r border-[var(--black)]">
            {renderLeftPanel()}
          </Panel>
          
          <PanelResizeHandle className="w-[1px] bg-[var(--black)] hover:bg-[var(--brand-blue)] transition-colors active:bg-[var(--brand-blue)] z-10" />
          
          <Panel defaultSize={60} minSize={30} className="flex flex-col min-w-0 bg-notebook-grid relative z-0">
            {renderCenterPanel()}
          </Panel>
          
          <PanelResizeHandle className="w-[1px] bg-[var(--black)] hover:bg-[var(--brand-blue)] transition-colors active:bg-[var(--brand-blue)] z-10" />
          
          <Panel defaultSize={20} minSize={15} className="bg-[var(--gray-50)] border-l border-[var(--black)]">
            {renderRightPanel()}
          </Panel>
        </PanelGroup>
      </div>

      {/* ═══════════════════════════════════════════
          MOBILE LAYOUT (Uses Portals for sidebars)
          ═══════════════════════════════════════════ */}
      <main className="lg:hidden flex-1 flex flex-col min-w-0 bg-notebook-grid relative z-0">
        {renderCenterPanel()}
      </main>

      {/* Mobile portal for Left Panel */}
      {leftPortal && createPortal(renderLeftPanel(), leftPortal)}

      {/* Mobile portal for Right Panel */}
      {rightPortal && createPortal(
        renderRightPanel(),
        rightPortal
      )}

      {/* ═══════════════════════════════════════════
          FLASHCARD MODAL
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {flashcardData && (
          <FlashcardModal
            flashcards={flashcardData}
            onClose={() => setFlashcardData(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
