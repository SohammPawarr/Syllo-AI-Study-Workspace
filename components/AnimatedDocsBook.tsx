"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Layers, Cpu, Server, Code, ChevronRight } from "lucide-react";

const initialPages = [
  {
    id: "cover",
    content: (
      <div className="flex flex-col items-center justify-center h-full p-6 md:p-8 text-center bg-[var(--brand-yellow)] transition-colors relative">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white border-[4px] border-[var(--black)] rounded-full flex items-center justify-center mb-6 shadow-solid">
          <Code className="w-8 h-8 md:w-10 md:h-10 text-[var(--black)]" />
        </div>
        <h2 className="font-heading text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-[var(--black)] mb-2">Docs</h2>
        <p className="font-bold text-base md:text-lg border-t-4 border-[var(--black)] pt-4 mt-2 w-full">Under the Hood</p>
        
        <div className="mt-auto px-6 py-3 bg-[var(--black)] text-white font-bold text-sm rounded-full border-2 border-[var(--black)] shadow-solid flex items-center gap-2">
          Start Reading <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    )
  },
  {
    id: "rag",
    content: (
      <div className="flex flex-col h-full p-6 md:p-8 bg-gray-50 relative">
        <div className="p-3 md:p-4 bg-blue-100 rounded-xl border-2 border-[var(--black)] w-fit mb-6 shadow-solid transform -rotate-3">
          <Database className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
        </div>
        <h3 className="font-heading text-2xl md:text-3xl font-extrabold mb-3 text-[var(--black)]">RAG Pipeline</h3>
        <p className="text-sm md:text-base text-[var(--gray-700)] font-medium leading-relaxed">
          We use Retrieval-Augmented Generation (RAG) to ensure the AI only quizzes you on *your* actual course material, eliminating hallucinations.
        </p>
        <div className="mt-auto flex justify-between items-center text-sm font-bold text-gray-400 border-t-2 border-gray-200 pt-4">
          <span>Page 1</span>
          <ChevronRight className="w-5 h-5 text-[var(--black)] animate-pulse" />
        </div>
      </div>
    )
  },
  {
    id: "embeddings",
    content: (
      <div className="flex flex-col h-full p-6 md:p-8 bg-white relative">
        <div className="p-3 md:p-4 bg-purple-100 rounded-xl border-2 border-[var(--black)] w-fit mb-6 shadow-solid transform rotate-3">
          <Layers className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
        </div>
        <h3 className="font-heading text-2xl md:text-3xl font-extrabold mb-3 text-[var(--black)]">Semantic Embeddings</h3>
        <p className="text-sm md:text-base text-[var(--gray-700)] font-medium leading-relaxed">
          Documents are chunked and vectorized using high-dimensional embedding models, allowing the AI to perfectly retrieve relevant context for any question.
        </p>
        <div className="mt-auto flex justify-between items-center text-sm font-bold text-gray-400 border-t-2 border-gray-200 pt-4">
          <span>Page 2</span>
          <ChevronRight className="w-5 h-5 text-[var(--black)] animate-pulse" />
        </div>
      </div>
    )
  },
  {
    id: "groq",
    content: (
      <div className="flex flex-col h-full p-6 md:p-8 bg-gray-50 relative">
        <div className="p-3 md:p-4 bg-green-100 rounded-xl border-2 border-[var(--black)] w-fit mb-6 shadow-solid transform -rotate-1">
          <Cpu className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
        </div>
        <h3 className="font-heading text-2xl md:text-3xl font-extrabold mb-3 text-[var(--black)]">Groq Llama 3</h3>
        <p className="text-sm md:text-base text-[var(--gray-700)] font-medium leading-relaxed">
          Powered by Groq's lightning-fast LPU inference engine running Llama 3.1, enabling instantaneous quiz generation and real-time chat.
        </p>
        <div className="mt-auto flex justify-between items-center text-sm font-bold text-gray-400 border-t-2 border-gray-200 pt-4">
          <span>Page 3</span>
          <ChevronRight className="w-5 h-5 text-[var(--black)] animate-pulse" />
        </div>
      </div>
    )
  },
  {
    id: "techstack",
    content: (
      <div className="flex flex-col h-full p-6 md:p-8 bg-white relative">
        <div className="p-3 md:p-4 bg-orange-100 rounded-xl border-2 border-[var(--black)] w-fit mb-6 shadow-solid transform rotate-2">
          <Server className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
        </div>
        <h3 className="font-heading text-2xl md:text-3xl font-extrabold mb-3 text-[var(--black)]">Modern Tech Stack</h3>
        <p className="text-sm md:text-base text-[var(--gray-700)] font-medium leading-relaxed">
          Built with Next.js 15, React 19, FastAPI, MongoDB, and TailwindCSS. Styled with a custom Neo-Brutalist design system.
        </p>
        <div className="mt-auto flex justify-between items-center text-sm font-bold text-gray-400 border-t-2 border-gray-200 pt-4">
          <span>Page 4</span>
          <ChevronRight className="w-5 h-5 text-[var(--black)] animate-pulse" />
        </div>
      </div>
    )
  }
];

export default function AnimatedDocsBook() {
  const [cards, setCards] = useState(initialPages);
  const [flippingCardId, setFlippingCardId] = useState<string | null>(null);

  const turnPage = () => {
    if (flippingCardId) return; // prevent spamming while animating
    
    const topCard = cards[0];
    setFlippingCardId(topCard.id);
    
    // Wait for the flip animation to finish before moving the card to the back of the deck
    setTimeout(() => {
      setCards(prev => {
        const newCards = [...prev];
        const first = newCards.shift();
        if (first) newCards.push(first);
        return newCards;
      });
      setFlippingCardId(null);
    }, 400); // 400ms is the duration of the flip out animation
  };

  return (
    <div className="w-full flex justify-center py-4 md:py-8 relative z-10 perspective-[1500px]">
      <div className="relative w-full max-w-[320px] md:max-w-[360px] h-[450px] md:h-[500px]">
        
        {/* We render in reverse so index 0 is at the top of the DOM stack (highest visual z-index) */}
        {[...cards].reverse().map((card, i) => {
          
          // Because we reversed the array, the "top" card in state (index 0) is now at the end of the mapped array
          const isTop = i === cards.length - 1;
          const isFlipping = card.id === flippingCardId;
          
          // depthIndex indicates how far down the stack a card is. (0 = top, 1 = second, etc.)
          const depthIndex = cards.length - 1 - i;
          
          // Only render the top 3 cards to keep the DOM clean
          if (depthIndex > 2) return null;

          return (
            <motion.div
              key={card.id}
              className="absolute inset-0 border-[4px] border-[var(--black)] rounded-r-3xl rounded-l-lg overflow-hidden bg-white cursor-pointer select-none origin-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              onClick={turnPage}
              animate={{
                // If flipping out, swing left and fade out
                rotateY: isFlipping ? -100 : 0,
                x: isFlipping ? -100 : 0,
                opacity: isFlipping ? 0 : 1,
                
                // Stack effect: lower cards are pushed down and scaled down slightly
                y: isTop ? 0 : depthIndex * 12, 
                scale: isTop ? 1 : 1 - (depthIndex * 0.04),
                
                // Z-index management
                zIndex: isTop ? 50 : 50 - depthIndex,
              }}
              transition={{
                duration: isFlipping ? 0.4 : 0.5,
                type: "spring",
                bounce: isFlipping ? 0 : 0.3 // No bounce when throwing it away
              }}
            >
              {/* Spiral Binding Holes (Left Edge) */}
              <div className="absolute top-0 left-0 bottom-0 w-8 border-r-2 border-[var(--black)] bg-[#e5e5e5] flex flex-col justify-evenly items-center z-20">
                 {[1,2,3,4,5,6].map(n => (
                   <div key={n} className="w-3.5 h-3.5 rounded-full bg-[var(--black)] shadow-inner"></div>
                 ))}
              </div>
              
              {/* Content area shifted right to avoid the spiral holes */}
              <div className="absolute inset-0 ml-8 bg-white">
                {card.content}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
