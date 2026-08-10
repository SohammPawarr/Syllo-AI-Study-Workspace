"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Plus, BookOpen, Layers, Trash2, Edit2, Check, X, MoreVertical, AlertTriangle } from "lucide-react";
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
  status: "processing" | "ready";
}

export default function DashboardPage() {
  /* ── Documents state ── */
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  /* ── Chat state ── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /* ── Flashcard modal ── */
  const [flashcardData, setFlashcardData] = useState<any[] | null>(null);

  /* ── Client Portal Targets ── */
  const [leftPortal, setLeftPortal] = useState<HTMLElement | null>(null);
  const [rightPortal, setRightPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setLeftPortal(document.getElementById("mobile-left-panel"));
    setRightPortal(document.getElementById("mobile-right-panel"));
  }, []);

  /* ── Fetch Documents on Mount ── */
  useEffect(() => {
    // Wake up backend server invisibly
    const backendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860';
    fetch(`${backendUrl.replace(/\/$/, '')}/health`).catch(() => {});

    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.documents) {
          setDocuments(data.documents);
        }
      })
      .catch(console.error);
  }, []);

  /* ── Upload Handlers ── */
  const handleUploadComplete = useCallback(
    (documentId: string) => {
      const newDoc: DocumentEntry = {
        id: documentId,
        name: `Document ${documents.length + 1}`,
        status: "processing",
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocId(documentId);
      setMessages([]);
    },
    [documents.length]
  );

  const handleJobStarted = useCallback((jobId: string) => {
    setActiveJobId(jobId);
  }, []);

  const handleDocReady = useCallback(() => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDocId ? { ...d, status: "ready" as const } : d
      )
    );
    setActiveJobId(null);

    // Optionally refetch documents to get the exact name from the DB
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.documents) {
          setDocuments(data.documents);
        }
      })
      .catch(console.error);

  }, [activeDocId]);

  const handleSelectDocument = (docId: string) => {
    setActiveDocId(docId);
    setMessages([]);
    setActiveJobId(null);
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (activeDocId === id) setActiveDocId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDocToDelete(null);
    }
  };

  const handleEditDocName = async (id: string) => {
    if (!editingDocName.trim()) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingDocName })
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, name: editingDocName } : d))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingDocId(null);
    }
  };

  const activeDoc = documents.find((d) => d.id === activeDocId);
  const isDocReady = activeDoc?.status === "ready";

  const renderLeftPanel = () => (
    <div className="flex flex-col h-full bg-[var(--gray-50)]">
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

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {documents.length === 0 ? (
          <div className="p-8 text-center text-[var(--gray-400)] flex flex-col items-center gap-2">
            <Layers className="w-8 h-8 opacity-50" />
            <p className="text-sm font-medium">No history yet</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (editingDocId !== doc.id) handleSelectDocument(doc.id);
              }}
              className={`relative w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all font-bold text-sm border-2 border-[var(--brand-blue)] group ${
                openDropdownId === doc.id ? "z-50" : "z-10"
              } ${
                doc.id === activeDocId
                  ? "bg-[var(--brand-light-blue)] text-[var(--white)] shadow-solid -translate-y-[2px] -translate-x-[2px]"
                  : "bg-[var(--white)] text-[var(--brand-blue)] hover:bg-[var(--gray-50)] hover:shadow-solid hover:-translate-y-[2px] hover:-translate-x-[2px]"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border-2 border-[var(--brand-blue)] ${doc.id === activeDocId ? "bg-[var(--brand-yellow)] text-[var(--brand-blue)]" : "bg-[var(--brand-light-blue)]/20 text-[var(--brand-blue)]"
                }`}>
                <FileText className="w-3.5 h-3.5" />
              </div>
              
              {editingDocId === doc.id ? (
                <div className="flex-1 flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingDocName}
                    onChange={(e) => setEditingDocName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditDocName(doc.id);
                      if (e.key === "Escape") setEditingDocId(null);
                    }}
                    autoFocus
                    className={`flex-1 min-w-0 px-1 py-0.5 text-sm font-bold bg-transparent border-b-2 border-dashed outline-none transition-colors ${
                      doc.id === activeDocId
                        ? "text-[var(--white)] border-[var(--white)]/40 focus:border-[var(--white)] placeholder:text-[var(--white)]/50"
                        : "text-[var(--brand-blue)] border-[var(--brand-blue)]/40 focus:border-[var(--brand-blue)] placeholder:text-[var(--brand-blue)]/50"
                    }`}
                  />
                  <div className="flex items-center shrink-0 gap-0.5">
                    <button onClick={() => handleEditDocName(doc.id)} className={`p-1 rounded transition-colors ${
                        doc.id === activeDocId ? "hover:bg-white/20 text-[var(--white)]" : "hover:bg-[var(--brand-yellow)] text-[var(--brand-blue)]"
                    }`}>
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingDocId(null)} className={`p-1 rounded transition-colors ${
                        doc.id === activeDocId ? "hover:bg-red-500 hover:text-white text-[var(--white)]" : "hover:bg-red-500 hover:text-white text-[var(--gray-400)]"
                    }`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="truncate flex-1">
                    {doc.name}
                  </span>
                  
                  <div 
                    className="relative flex items-center gap-2 shrink-0"
                    onMouseEnter={() => setOpenDropdownId(doc.id)}
                    onMouseLeave={() => setOpenDropdownId(null)}
                  >
                    {doc.status === "processing" && (
                      <span className={`w-2 h-2 rounded-full animate-pulse border border-[var(--black)] ${doc.id === activeDocId ? "bg-[var(--brand-blue)]" : "bg-[var(--brand-yellow)]"}`} />
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === doc.id ? null : doc.id);
                      }}
                      className={`p-1 rounded transition-colors ${doc.id === activeDocId ? 'hover:bg-white/20 text-white' : 'hover:bg-[var(--gray-200)] text-[var(--brand-blue)]'}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openDropdownId === doc.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--white)] border-2 border-[var(--gray-200)] shadow-solid rounded-xl overflow-hidden min-w-[140px] flex flex-col font-bold">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDocId(doc.id);
                              setEditingDocName(doc.name);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-[var(--gray-50)] hover:text-[var(--brand-blue)] flex items-center gap-2 text-sm text-[var(--gray-700)] transition-colors border-b border-[var(--gray-100)]"
                          >
                            <Edit2 className="w-4 h-4" /> Rename
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocToDelete(doc.id);
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
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {docToDelete && (
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
              <h3 className="font-heading text-xl font-extrabold text-[var(--brand-blue)] mb-2 uppercase tracking-wide">Delete Document</h3>
              <p className="text-sm font-medium text-[var(--gray-600)] mb-6">
                Are you sure you want to permanently delete this document and all its study history? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setDocToDelete(null)}
                  className="flex-1 py-2.5 bg-[var(--gray-100)] border-2 border-[var(--gray-200)] text-[var(--gray-700)] font-bold rounded-xl hover:bg-[var(--gray-200)] transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteDoc(docToDelete)}
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
      {activeJobId && activeDocId && (
        <div className="p-4 bg-[var(--white)] border-t border-[var(--gray-200)]">
          <ProcessingState
            jobId={activeJobId}
            documentId={activeDocId}
            onReady={handleDocReady}
          />
        </div>
      )}
    </div>
  );

  const renderCenterPanel = () => (
    <>
      {!activeDocId ? (
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
            Upload a PDF from the Library panel to start analyzing, generating quizzes, and building flashcards.
          </p>
        </div>
      ) : !isDocReady ? (
        /* Processing state */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="w-20 h-20 rounded-[28px] bg-[var(--white)] border-4 border-[var(--brand-light-blue)] flex items-center justify-center mb-6 shadow-soft animate-pulse">
            <FileText className="w-10 h-10 text-[var(--brand-light-blue)]" />
          </div>
          <h2 className="font-heading text-lg font-extrabold tracking-wider text-[var(--brand-blue)] mb-2">
            READING DOCUMENT...
          </h2>
          <p className="text-sm font-medium text-[var(--gray-500)] mb-6">
            Preparing your study materials.
          </p>
          {activeJobId && (
            <div className="w-64 bg-[var(--white)] p-4 rounded-2xl border border-[var(--gray-200)] shadow-sm">
              <ProcessingState
                jobId={activeJobId}
                documentId={activeDocId}
                onReady={handleDocReady}
              />
            </div>
          )}
        </div>
      ) : (
        /* Chat interface */
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            documentId={activeDocId}
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
      {activeDocId && isDocReady ? (
        <div className="h-full overflow-y-auto">
          <ToolsPanel />
        </div>
      ) : (
        <div className="h-full flex items-center justify-center p-6 text-center">
          <p className="text-sm font-medium text-[var(--gray-400)]">Open a document to access study tools</p>
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
