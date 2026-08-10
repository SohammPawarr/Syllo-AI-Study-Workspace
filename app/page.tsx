import Link from "next/link";
import { ArrowRight, Bot, Image as ImageIcon, Zap, BookOpen, Brain, CheckCircle, Code, Layers, FileText, Database, Server, Mail, Code2, Briefcase, ExternalLink, Cpu } from "lucide-react";
import ClientGoogleButton from "../components/ClientGoogleButton";
import FloatingIcons from "../components/FloatingIcons";
import AnimatedDocsBook from "../components/AnimatedDocsBook";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-notebook-grid flex flex-col w-full relative overflow-x-hidden">
        
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between p-6 md:px-12 pt-8 z-10 w-full max-w-[1920px] mx-auto absolute top-0 left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-blue)] border-4 border-[var(--black)] flex items-center justify-center shadow-solid overflow-hidden">
             <span className="text-xl">🤖</span>
          </div>
          <span className="font-heading text-xl md:text-2xl font-extrabold tracking-widest text-[var(--black)] mt-1">
            SYLLO
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-[var(--brand-blue)]/10 border border-[var(--brand-blue)]/20 rounded-full">
          <p className="text-xs md:text-sm font-extrabold text-[var(--brand-blue)] uppercase tracking-widest">
            START WITH 10,000 FREE CREDITS
          </p>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-6 relative z-10 w-full max-w-[1920px] mx-auto pt-20">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-yellow)] border-2 border-[var(--black)] text-sm font-bold text-[var(--black)] mb-8 shadow-solid transform -rotate-2">
          <span>✨</span> The smarter way to study
        </div>

        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-[var(--black)] mb-6 drop-shadow-sm leading-none max-w-5xl z-10 relative">
          MASTER ANY <br/> 
          <span className="text-[var(--black)]">SUBJECT</span>{" "}
          <span className="text-[var(--brand-yellow)]" style={{ textShadow: "2px 2px 0px var(--black)" }}>
            FASTER
          </span>
        </h1>

        <p className="mt-4 text-lg md:text-xl text-[var(--gray-700)] font-medium max-w-3xl mb-8 leading-relaxed px-4">
          Upload your lecture slides, notes, or textbooks and let Syllo instantly generate <br className="hidden md:block" />
          <strong className="text-[var(--brand-blue)] font-bold">interactive quizzes, flashcards, and visual explanations</strong>.
        </p>

        <div className="flex flex-col items-center gap-5">
          <div className="relative group z-20">
            <ClientGoogleButton />
          </div>
        </div>

        {/* Floating UI Elements (Decorative & Animated) */}
        <FloatingIcons />
      </main>

      {/* What is Syllo Section */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-24 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="flex flex-col items-start text-left">
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-[var(--black)] mb-4 md:mb-6 uppercase tracking-tight">
              Stop <span className="text-red-500 underline decoration-4 underline-offset-4">Reading.</span><br/>Start Learning.
            </h2>
            <p className="text-base md:text-lg text-[var(--gray-700)] font-medium mb-4 md:mb-6 leading-relaxed">
              Syllo is your personal AI study companion. It takes your boring, static documents and transforms them into an interactive learning environment. 
            </p>
            <p className="text-base md:text-lg text-[var(--gray-700)] font-medium leading-relaxed">
              No more endless highlighting or re-reading paragraphs. Syllo automatically extracts the core concepts and builds active-recall exercises so you actually remember what you read.
            </p>
          </div>
          <div className="bg-[var(--brand-blue)] p-5 md:p-8 rounded-[24px] md:rounded-[32px] border-4 border-[var(--black)] shadow-solid transform rotate-1 hover:rotate-0 transition-transform">
            <div className="bg-white rounded-xl md:rounded-2xl border-4 border-[var(--black)] p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 border-b-2 border-gray-100 pb-4">
                <Bot className="w-8 h-8 text-[var(--brand-blue)]" />
                <div>
                  <h3 className="font-bold text-gray-900">Syllo AI</h3>
                  <p className="text-xs text-gray-500 font-medium">Ready to help</p>
                </div>
              </div>
              <p className="text-gray-700 font-medium text-sm leading-relaxed mb-4">
                "I've analyzed Chapter 4. I found 12 key concepts. Want to try a quick quiz, or should we create some flashcards?"
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-[var(--brand-yellow)] border-2 border-[var(--black)] rounded-lg text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Quiz Me</button>
                <button className="flex-1 py-2 bg-white border-2 border-[var(--black)] rounded-lg text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Flashcards</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full bg-[var(--brand-yellow)] border-y-4 border-[var(--black)] py-12 md:py-24 relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="font-heading text-3xl md:text-6xl font-extrabold text-[var(--black)] uppercase tracking-tight">How It Works</h2>
            <p className="mt-2 md:mt-4 text-lg md:text-xl font-bold text-[var(--black)]">Three simple steps to better grades.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-2 bg-[var(--black)] -z-10 -translate-y-1/2"></div>
            
            {/* Step 1 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border-4 border-[var(--black)] shadow-solid flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[var(--brand-blue)] text-white rounded-xl md:rounded-2xl border-4 border-[var(--black)] flex items-center justify-center mb-4 md:mb-6 shadow-sm transform -rotate-6">
                <FileText className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-extrabold mb-2 md:mb-3">1. Upload</h3>
              <p className="text-sm md:text-base text-[var(--gray-700)] font-medium">Drop in your PDFs, lecture slides, or textbook chapters. Syllo handles the heavy lifting.</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border-4 border-[var(--black)] shadow-solid flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform md:translate-y-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-400 text-white rounded-xl md:rounded-2xl border-4 border-[var(--black)] flex items-center justify-center mb-4 md:mb-6 shadow-sm transform rotate-3">
                <Brain className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-extrabold mb-2 md:mb-3">2. Generate</h3>
              <p className="text-sm md:text-base text-[var(--gray-700)] font-medium">Syllo's AI reads, understands, and extracts the most important concepts from your content.</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border-4 border-[var(--black)] shadow-solid flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-400 text-white rounded-xl md:rounded-2xl border-4 border-[var(--black)] flex items-center justify-center mb-4 md:mb-6 shadow-sm transform -rotate-3">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-extrabold mb-2 md:mb-3">3. Study</h3>
              <p className="text-sm md:text-base text-[var(--gray-700)] font-medium">Instantly practice with interactive flashcards, personalized quizzes, and visual mind maps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Docs / Under the Hood Section */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-6 pt-12 pb-6 md:pt-16 md:pb-12 relative z-10 overflow-hidden">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-[var(--black)] uppercase tracking-tight">Under the Hood</h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-[var(--gray-700)] font-medium max-w-2xl mx-auto">
            Syllo isn't just a basic prompt wrapper. It's a robust AI pipeline designed specifically for high-accuracy educational context retrieval.
          </p>
        </div>

        {/* Desktop View: 2x2 Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-[var(--white)] p-5 md:p-6 rounded-2xl border-4 border-[var(--black)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-3 md:gap-4 items-start hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <div className="p-2 md:p-3 bg-blue-100 rounded-xl border-2 border-[var(--black)] shrink-0">
              <Database className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2 text-[var(--black)]">RAG Pipeline</h3>
              <p className="text-xs md:text-sm text-[var(--gray-700)] font-medium leading-relaxed">We use Retrieval-Augmented Generation (RAG) to ensure the AI only quizzes you on *your* actual course material, eliminating hallucinations.</p>
            </div>
          </div>

          <div className="bg-[var(--white)] p-5 md:p-6 rounded-2xl border-4 border-[var(--black)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-3 md:gap-4 items-start hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <div className="p-2 md:p-3 bg-purple-100 rounded-xl border-2 border-[var(--black)] shrink-0">
              <Layers className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2 text-[var(--black)]">Semantic Embeddings</h3>
              <p className="text-xs md:text-sm text-[var(--gray-700)] font-medium leading-relaxed">Documents are chunked and vectorized using high-dimensional embedding models, allowing the AI to perfectly retrieve relevant context for any question.</p>
            </div>
          </div>

          <div className="bg-[var(--white)] p-5 md:p-6 rounded-2xl border-4 border-[var(--black)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-3 md:gap-4 items-start hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <div className="p-2 md:p-3 bg-green-100 rounded-xl border-2 border-[var(--black)] shrink-0">
              <Cpu className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2 text-[var(--black)]">Groq Llama 3</h3>
              <p className="text-xs md:text-sm text-[var(--gray-700)] font-medium leading-relaxed">Powered by Groq's lightning-fast LPU inference engine running Llama 3.1, enabling instantaneous quiz generation and real-time chat.</p>
            </div>
          </div>

          <div className="bg-[var(--white)] p-5 md:p-6 rounded-2xl border-4 border-[var(--black)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-3 md:gap-4 items-start hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <div className="p-2 md:p-3 bg-orange-100 rounded-xl border-2 border-[var(--black)] shrink-0">
              <Server className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2 text-[var(--black)]">Modern Tech Stack</h3>
              <p className="text-xs md:text-sm text-[var(--gray-700)] font-medium leading-relaxed">Built with Next.js 15, React 19, FastAPI, MongoDB, and TailwindCSS. Styled with a custom Neo-Brutalist design system.</p>
            </div>
          </div>
        </div>

        {/* Mobile View: 3D Notebook */}
        <div className="block md:hidden">
          <AnimatedDocsBook />
        </div>
      </section>

      {/* Footer / Creator Section */}
      <footer className="w-full bg-[var(--black)] text-white pt-10 pb-4 md:pt-12 md:pb-6 px-4 md:px-6 border-t-[8px] border-[var(--brand-yellow)] relative z-10 overflow-hidden">
        {/* Giant Watermark Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-heading text-[8rem] md:text-[14rem] font-extrabold text-white/5 whitespace-nowrap pointer-events-none select-none -z-0">
          SYLLO
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Brand Info (Spans 5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-4 mb-4 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-blue)] border-2 border-[var(--brand-yellow)] flex items-center justify-center overflow-hidden">
                <span className="text-xl">🤖</span>
              </div>
              <span className="font-heading text-2xl font-extrabold tracking-widest text-white">
                SYLLO
              </span>
            </div>
            <p className="text-gray-400 font-medium text-base max-w-sm mb-6 leading-relaxed">
              The smartest way to interact with your study materials and crush your exams. Stop reading, start learning.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--brand-yellow)] hover:text-black hover:-translate-y-1 transition-all border border-white/20">
                <Code className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--brand-yellow)] hover:text-black hover:-translate-y-1 transition-all border border-white/20">
                <Zap className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-2"></div>

          {/* Creator Info (Spans 5 cols) */}
          <div className="md:col-span-5 w-full">
            <div className="bg-white text-black p-6 rounded-3xl border-4 border-[var(--brand-blue)] shadow-[6px_6px_0px_0px_rgba(250,204,21,1)] transform md:rotate-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-gray-500">
                  Developed By
                </h3>
              </div>
              <p className="font-heading text-3xl font-extrabold mb-4 text-[var(--black)] uppercase tracking-tight">Soham Pawar</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="mailto:soham2005pawar@gmail.com" className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl hover:bg-[var(--brand-blue)] hover:text-white transition-colors border-2 border-transparent hover:border-black font-bold text-xs">
                  <Mail className="w-4 h-4" /> Email Me
                </a>
                <a href="https://sohammpawar.me" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl hover:bg-[var(--brand-blue)] hover:text-white transition-colors border-2 border-transparent hover:border-black font-bold text-xs">
                  <ExternalLink className="w-4 h-4" /> Portfolio
                </a>
                <a href="https://linkedin.com/in/sohammpawarr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl hover:bg-[var(--brand-blue)] hover:text-white transition-colors border-2 border-transparent hover:border-black font-bold text-xs">
                  <Briefcase className="w-4 h-4" /> LinkedIn
                </a>
                <a href="https://github.com/sohammpawar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl hover:bg-[var(--brand-blue)] hover:text-white transition-colors border-2 border-transparent hover:border-black font-bold text-xs">
                  <Code2 className="w-4 h-4" /> GitHub
                </a>
              </div>

              <a href="https://sohammresume.vercel.app" target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full p-3 bg-[var(--brand-yellow)] text-black rounded-xl hover:bg-yellow-300 transition-colors border-2 border-black font-bold shadow-sm uppercase tracking-wide text-sm">
                <FileText className="w-4 h-4" /> View Full Resume
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-4 border-t border-white/10 text-center flex flex-col md:flex-row justify-between items-center gap-3 relative z-10">
          <p className="text-gray-500 font-medium text-xs">
            © {new Date().getFullYear()} Syllo. All rights reserved.
          </p>
          <div className="text-gray-400 font-bold text-xs flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            Built with <span className="text-[var(--brand-yellow)] mx-1">⚡</span> by Soham
          </div>
        </div>
      </footer>
    </div>
  );
}
