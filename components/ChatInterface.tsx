"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, Download, ClipboardList, Wrench, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useCredits } from "@/app/dashboard/layout";
import { useSession } from "next-auth/react";
import CustomAudioPlayer from "./CustomAudioPlayer";
import CustomMindMap from "./CustomMindMap";
import ToolsPanel from "./GenerateForm";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  type?: "text" | "mindmap" | "form-link" | "flashcard-trigger" | "voice" | "report";
  meta?: any;
}

interface ChatInterfaceProps {
  documentId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onFlashcardTrigger?: (data: any) => void;
}

export default function ChatInterface({
  documentId,
  messages,
  setMessages,
  onFlashcardTrigger,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState("Intermediate");
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [summaryLength, setSummaryLength] = useState("medium");
  const [voiceLanguage, setVoiceLanguage] = useState("English");
  const [reportFormat, setReportFormat] = useState("Briefing Doc");
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshCredits } = useCredits();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleInsertTag = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { tag } = customEvent.detail;
      setInput(tag);
      setIsToolsOpen(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    };

    window.addEventListener("syllo:insert_tag", handleInsertTag);
    return () => window.removeEventListener("syllo:insert_tag", handleInsertTag);
  }, []);

  useEffect(() => {
    async function loadHistory() {
      if (!documentId) return;
      try {
        const res = await fetch(`/api/messages?documentId=${documentId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
    }
    loadHistory();
  }, [documentId, setMessages]);

  const saveMessageToDB = async (msg: ChatMessage) => {
    if (!documentId) return;
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, ...msg }),
      });
    } catch (err) {
      console.error("Failed to save message", err);
    }
  };

  const addMessage = async (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
    await saveMessageToDB(msg);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    let apiUrl = "/api/chat";
    let apiBody: any = {};
    let userMessageContent = currentInput;

    const isQuiz = currentInput.startsWith("#quiz");
    const isFlashcards = currentInput.startsWith("#flashcards");
    const isMindMap = currentInput.startsWith("#mindmap");
    const isSummary = currentInput.startsWith("#summary");
    const isVoice = currentInput.startsWith("#voice");
    const isReport = currentInput.startsWith("#report");

    if (isQuiz) {
      let topic = currentInput.replace("#quiz", "").trim();
      if (!topic) topic = "the whole document";
      userMessageContent = `📝 Generate a quiz about "${topic}" (${quizDifficulty}, ${quizQuestionCount} questions)`;
      apiUrl = "/api/generate-quiz";
      apiBody = {
        documentId,
        topic,
        difficulty: quizDifficulty,
        question_count: quizQuestionCount,
      };
    } else if (isFlashcards) {
      let topic = currentInput.replace("#flashcards", "").trim();
      if (!topic) topic = "the whole document";
      userMessageContent = `📇 Generate flashcards about "${topic}"`;
      apiUrl = "/api/generate-flashcards";
      apiBody = { documentId, topic, count: 10 };
    } else if (isMindMap) {
      let topic = currentInput.replace("#mindmap", "").trim();
      if (!topic) topic = "the whole document";
      userMessageContent = `🧠 Generate a Mind Map about "${topic}"`;
      apiUrl = "/api/generate-mindmap";
      apiBody = { documentId, topic };
    } else if (isSummary) {
      let topic = currentInput.replace("#summary", "").trim();
      if (!topic) topic = "the whole document";
      userMessageContent = `📄 Generate a ${summaryLength} summary about "${topic}"`;
      apiUrl = "/api/generate-summary";
      apiBody = { documentId, topic: topic || "general overview", length: summaryLength };
    } else if (isVoice) {
      let topic = currentInput.replace("#voice", "").trim();
      if (!topic) topic = "the whole document";
      userMessageContent = `🎧 Generate a voice summary in ${voiceLanguage} about "${topic}"`;
      apiUrl = "/api/generate-voice";
      apiBody = { documentId, topic: topic || "general overview", language: voiceLanguage };
    } else if (isReport) {
      let topic = currentInput.replace("#report", "").trim();
      if (!topic) topic = "the whole document";
      userMessageContent = `📑 Generate a PDF ${reportFormat} about "${topic}"`;
      apiUrl = "/api/generate-report";
      apiBody = { documentId, topic: topic || "general overview", format_type: reportFormat };
    } else {
      apiBody = { documentId, messages: [...messages, { role: "user", content: currentInput }] };
    }

    const userMsg: ChatMessage = { role: "user", content: userMessageContent };
    await addMessage(userMsg);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });

      const data = await res.json();

      if (isQuiz || isFlashcards || isMindMap || isSummary || isVoice || isReport) {
        refreshCredits();
      }

      if (res.ok) {
        if (isQuiz && data.quiz) {
          const exportRes = await fetch("/api/export-forms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Syllo Quiz: ${apiBody.topic}`,
              questions: data.quiz.questions,
            }),
          });
          if (exportRes.ok) {
            const exportData = await exportRes.json();
            await addMessage({
              role: "model",
              content: "Google Form created successfully!",
              type: "form-link",
              meta: {
                title: `Syllo Quiz: ${apiBody.topic}`,
                publishedUrl: exportData.formUrl,
                editUrl: exportData.editUrl,
              },
            });
          } else {
            await addMessage({ role: "model", content: "Quiz generated but failed to export to Google Forms." });
          }
        } else if (isFlashcards && data.flashcards) {
          const actualFlashcards = Array.isArray(data.flashcards) 
            ? data.flashcards 
            : (data.flashcards.flashcards || []);
            
          await addMessage({
            role: "model",
            content: "Flashcards generated!",
            type: "flashcard-trigger",
            meta: { flashcards: actualFlashcards },
          });
        } else if (isMindMap) {
          await addMessage({
            role: "model",
            content: "Mind Map generated!",
            type: "mindmap",
            meta: { mindmap: data.mindmap },
          });
        } else if (isSummary) {
          await addMessage({
            role: "model",
            content: data.summary || data.reply,
          });
        } else if (isVoice) {
          await addMessage({
            role: "model",
            content: "Voice summary generated!",
            type: "voice",
            meta: { audioUrl: data.audio_url, language: voiceLanguage },
          });
        } else if (isReport) {
          await addMessage({
            role: "model",
            content: `${data.format_type} PDF generated!`,
            type: "report",
            meta: { pdfUrl: data.pdf_url, reportFormat: data.format_type },
          });
        } else {
          await addMessage({
            role: "model",
            content: data.reply,
          });
        }
      } else {
        await addMessage({
          role: "model",
          content: `❌ ${data.error || "Failed to process request"}`,
        });
      }
    } catch {
      await addMessage({
        role: "model",
        content: "❌ Network error connecting to server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg: ChatMessage, idx: number) => {
    const isUser = msg.role === "user";

    // Special: mindmap
    if (msg.type === "mindmap" && msg.meta?.mindmap) {
      return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-start w-full"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--white)] border-2 border-[var(--black)] flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden">
             <span className="text-sm">🤖</span>
          </div>
          <div className="rounded-3xl rounded-tl-sm overflow-hidden border-2 border-[var(--gray-200)] bg-[var(--white)] shadow-soft w-full">
            <div className="p-4 flex justify-between items-center border-b border-[var(--gray-100)] bg-[var(--gray-50)]">
              <span className="text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider">Syllo AI - Mind Map Generated</span>
            </div>
            <CustomMindMap data={msg.meta.mindmap} />
          </div>
        </motion.div>
      );
    }

    // Special: form link
    if (msg.type === "form-link" && msg.meta?.publishedUrl) {
      return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-start max-w-[85%]"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--white)] border-2 border-[var(--black)] flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden">
             <span className="text-sm">🤖</span>
          </div>
          <div className="rounded-3xl rounded-tl-sm border-2 border-[var(--gray-200)] bg-[var(--white)] p-6 shadow-soft max-w-sm w-full">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--brand-yellow)] border-2 border-[var(--black)]/10 flex items-center justify-center text-2xl shadow-sm">
                <ClipboardList className="w-7 h-7 text-[var(--brand-blue)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--gray-500)] font-extrabold uppercase tracking-widest mb-1">Quiz Generated!</p>
                <h3 className="text-lg font-heading font-extrabold text-[var(--brand-blue)] leading-tight">{msg.meta.title}</h3>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <a
                href={msg.meta.publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center py-3 bg-[var(--brand-blue)] border-2 border-[var(--brand-blue)] text-[var(--white)] text-sm font-bold rounded-2xl hover:bg-[var(--white)] hover:text-[var(--brand-blue)] shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                Take Quiz
              </a>
              {msg.meta.editUrl && (
                <a
                  href={msg.meta.editUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-3 bg-[var(--white)] border-2 border-[var(--gray-200)] text-[var(--gray-700)] text-sm font-bold rounded-2xl hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  Edit Form
                </a>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    // Special: voice summary
    if (msg.type === "voice" && msg.meta?.audioUrl) {
      return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-start w-full sm:max-w-[75%]"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--white)] border-2 border-[var(--black)] flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden">
             <span className="text-sm">🤖</span>
          </div>
          <div className="rounded-3xl rounded-tl-sm border-2 border-[var(--gray-200)] bg-[var(--white)] p-5 shadow-soft w-full flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-yellow)] border border-[var(--black)]/10 flex items-center justify-center text-sm shadow-sm">
                🎧
              </div>
              <p className="text-sm text-[var(--brand-blue)] font-bold">Voice Summary Ready!</p>
            </div>
            <CustomAudioPlayer src={msg.meta.audioUrl} />
          </div>
        </motion.div>
      );
    }

    // Special: pdf report
    if (msg.type === "report" && msg.meta?.pdfUrl) {
      return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-start max-w-[85%]"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--white)] border-2 border-[var(--black)] flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden">
             <span className="text-sm">🤖</span>
          </div>
          <div className="rounded-3xl rounded-tl-sm border-2 border-[var(--gray-200)] bg-[var(--white)] p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-light-blue)] border border-[var(--black)]/10 flex items-center justify-center text-sm shadow-sm text-[var(--brand-blue)]">
                <Download className="w-4 h-4" />
              </div>
              <p className="text-sm text-[var(--brand-blue)] font-bold">{msg.meta.reportFormat} Report Generated!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={msg.meta.pdfUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--brand-blue)] text-[var(--white)] text-sm font-bold rounded-xl hover:bg-[var(--brand-light-blue)] shadow-sm transition-colors px-4"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          </div>
        </motion.div>
      );
    }

    // Special: flashcard trigger
    if (msg.type === "flashcard-trigger" && msg.meta?.flashcards) {
      return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-start max-w-[85%]"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--white)] border-2 border-[var(--black)] flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden">
             <span className="text-sm">🤖</span>
          </div>
          <button
            onClick={() => onFlashcardTrigger?.(msg.meta.flashcards)}
            className="rounded-3xl rounded-tl-sm border-2 border-[var(--gray-200)] bg-[var(--white)] p-5 text-left hover:border-[var(--brand-light-blue)] shadow-soft transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-yellow)]/20 border border-[var(--brand-yellow)] flex items-center justify-center text-lg shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              📇
            </div>
            <div>
              <p className="text-sm text-[var(--brand-blue)] font-bold mb-1">{msg.meta.flashcards.length} Flashcards Ready!</p>
              <p className="text-sm text-[var(--gray-500)] font-medium group-hover:text-[var(--brand-light-blue)] transition-colors">Click to flip through cards →</p>
            </div>
          </button>
        </motion.div>
      );
    }

    // Standard text message
    return (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`flex gap-3 w-full ${isUser ? "justify-end" : "justify-start"}`}
      >
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-[var(--white)] border-2 border-[var(--black)] flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden">
            <span className="text-sm">🤖</span>
          </div>
        )}

        <div
          className={`px-5 py-3.5 rounded-[24px] max-w-[85%] sm:max-w-[75%] shadow-sm ${
            isUser
              ? "bg-[var(--brand-light-blue)] text-[var(--white)] rounded-tr-sm"
              : "bg-[var(--white)] border border-[var(--gray-200)] text-[var(--gray-800)] rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm font-medium">{msg.content}</p>
          ) : (
            <div className="light-prose text-sm font-medium leading-relaxed">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full border-2 border-[var(--black)] flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden bg-[var(--brand-blue)] text-[var(--white)] text-xs font-bold">
            {session?.user?.image ? (
              <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
            ) : (
              session?.user?.name?.[0] || "U"
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full relative bg-transparent">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--gray-400)] animate-fade-in">
            <div className="w-16 h-16 rounded-[24px] bg-[var(--white)] border-2 border-[var(--gray-200)] flex items-center justify-center mb-4 shadow-sm">
              <Bot className="w-8 h-8 text-[var(--gray-300)]" />
            </div>
            <p className="font-heading text-sm font-extrabold tracking-wider text-[var(--gray-400)] mb-1">
              ASK A QUESTION
            </p>
            <p className="text-xs font-medium">
              Start chatting about your document
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => renderMessage(msg, idx))}
          </AnimatePresence>
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[var(--white)] border-2 border-[var(--black)] flex items-center justify-center shrink-0 mt-1 shadow-sm">
              <span className="text-sm">🤖</span>
            </div>
            <div className="px-5 py-4 rounded-[24px] bg-[var(--white)] border border-[var(--gray-200)] rounded-tl-sm flex items-center gap-1.5 shadow-sm">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 pb-6 md:pb-8 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto flex flex-col items-center">
          {input.startsWith("#quiz ") && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center justify-end gap-2 mb-3"
            >
              <select
                 value={quizDifficulty}
                 onChange={(e) => setQuizDifficulty(e.target.value)}
                 className="px-3 py-1.5 bg-[var(--white)] border-2 border-[var(--gray-200)] rounded-[12px] text-xs font-bold text-[var(--gray-700)] focus:outline-none focus:border-[var(--brand-light-blue)] shadow-sm cursor-pointer"
               >
                 <option value="Beginner">Beginner</option>
                 <option value="Intermediate">Intermediate</option>
                 <option value="Advanced">Advanced</option>
               </select>
               <select
                 value={quizQuestionCount}
                 onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                 className="px-3 py-1.5 bg-[var(--white)] border-2 border-[var(--gray-200)] rounded-[12px] text-xs font-bold text-[var(--gray-700)] focus:outline-none focus:border-[var(--brand-light-blue)] shadow-sm cursor-pointer"
               >
                 <option value={5}>5 Questions</option>
                 <option value={10}>10 Questions</option>
                 <option value={15}>15 Questions</option>
               </select>
            </motion.div>
          )}

          {input.startsWith("#summary ") && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center justify-end gap-2 mb-3"
            >
              <select
                 value={summaryLength}
                 onChange={(e) => setSummaryLength(e.target.value)}
                 className="px-3 py-1.5 bg-[var(--white)] border-2 border-[var(--gray-200)] rounded-[12px] text-xs font-bold text-[var(--gray-700)] focus:outline-none focus:border-[var(--brand-light-blue)] shadow-sm cursor-pointer"
               >
                 <option value="short">Short</option>
                 <option value="medium">Medium</option>
                 <option value="in-depth">In-Depth</option>
               </select>
            </motion.div>
          )}

          {input.startsWith("#voice ") && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center justify-end gap-2 mb-3"
            >
              <select
                 value={voiceLanguage}
                 onChange={(e) => setVoiceLanguage(e.target.value)}
                 className="px-3 py-1.5 bg-[var(--white)] border-2 border-[var(--gray-200)] rounded-[12px] text-xs font-bold text-[var(--gray-700)] focus:outline-none focus:border-[var(--brand-light-blue)] shadow-sm cursor-pointer"
               >
                 <option value="English">English</option>
                 <option value="Hindi">Hindi</option>
               </select>
            </motion.div>
          )}

          {input.startsWith("#report ") && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center justify-end gap-2 mb-3"
            >
              <select
                 value={reportFormat}
                 onChange={(e) => setReportFormat(e.target.value)}
                 className="px-3 py-1.5 bg-[var(--white)] border-2 border-[var(--gray-200)] rounded-[12px] text-xs font-bold text-[var(--gray-700)] focus:outline-none focus:border-[var(--brand-light-blue)] shadow-sm cursor-pointer"
               >
                 <option value="Briefing Doc">Briefing Doc</option>
                 <option value="Study Guide">Study Guide</option>
                 <option value="Blog Post">Blog Post</option>
               </select>
            </motion.div>
          )}

          <div className="relative w-full">
            <AnimatePresence>
              {isToolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: "100%", scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: "100%", scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute bottom-full left-0 mb-3 w-[calc(100vw-32px)] sm:w-80 bg-[var(--white)] border-2 border-[var(--black)] rounded-3xl shadow-solid overflow-hidden z-50 flex flex-col origin-bottom"
                >
                  <div className="relative flex justify-center items-center p-3 border-b-2 border-[var(--gray-200)] bg-[var(--gray-50)]">
                    <div className="flex items-center gap-2 text-[var(--brand-blue)] font-heading font-extrabold tracking-wider text-lg">
                      <Wrench className="w-5 h-5" /> TOOLS
                    </div>
                    <button onClick={() => setIsToolsOpen(false)} className="absolute right-3 p-1.5 hover:bg-[var(--gray-200)] rounded-full text-[var(--gray-500)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <ToolsPanel />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="w-full flex items-center gap-2 p-2 bg-[var(--white)] border-2 border-[var(--gray-200)] rounded-[32px] shadow-sm transition-shadow !outline-none !ring-0"
            >
              <button
                type="button"
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="w-10 h-10 lg:hidden flex items-center justify-center rounded-full bg-[var(--gray-100)] text-[var(--brand-blue)] hover:bg-[var(--gray-200)] transition-colors shrink-0"
              >
                <Wrench className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question (50 credits) or select a tool..."
                className="flex-1 px-2 py-2 bg-transparent text-sm font-medium text-[var(--gray-900)] placeholder:text-[var(--gray-400)] !outline-none !ring-0 !border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--brand-light-blue)] text-[var(--white)] hover:bg-[var(--brand-blue)] shadow-sm disabled:opacity-40 disabled:hover:bg-[var(--brand-light-blue)] transition-colors cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
