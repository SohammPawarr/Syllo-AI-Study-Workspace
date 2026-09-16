"use client";

import { FileText, Network, Images, Wrench, Volume2, PieChart, Zap, BookOpen } from "lucide-react";

export default function ToolsPanel() {
  const insertTag = (tag: string) => {
    const event = new CustomEvent("syllo:insert_tag", { detail: { tag } });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--gray-50)]">
      <div className="hidden lg:flex p-4 md:p-6 border-b border-[var(--gray-200)] bg-[var(--white)] items-center justify-center">
        <h2 className="font-heading text-2xl font-extrabold tracking-[0.1em] text-[var(--brand-blue)] uppercase flex items-center justify-center gap-2 mt-1">
          <Wrench className="w-7 h-7" />
          Tools
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 lg:p-4 lg:space-y-3">
        <ToolButton
          icon={<FileText className="w-5 h-5" />}
          label="Quiz Form"
          cost={300}
          onClick={() => insertTag("#quiz ")}
          iconBg="bg-[var(--brand-yellow)]"
          iconText="text-[var(--brand-blue)]"
        />
        <ToolButton
          icon={<Images className="w-5 h-5" />}
          label="Flashcards"
          cost={200}
          onClick={() => insertTag("#flashcards ")}
          iconBg="bg-[var(--brand-light-blue)]"
          iconText="text-[var(--white)]"
        />
        <ToolButton
          icon={<Network className="w-5 h-5" />}
          label="Mind Map"
          cost={500}
          onClick={() => insertTag("#mindmap ")}
          iconBg="bg-[var(--brand-blue)]"
          iconText="text-[var(--white)]"
        />
        <ToolButton
          icon={<FileText className="w-5 h-5" />}
          label="Summary"
          cost={100}
          onClick={() => insertTag("#summary ")}
          iconBg="bg-[var(--gray-700)]"
          iconText="text-[var(--white)]"
        />
        <ToolButton
          icon={<BookOpen className="w-5 h-5" />}
          label="Study Planner"
          cost={250}
          onClick={() => insertTag("#studyplan ")}
          iconBg="bg-[var(--brand-yellow)]"
          iconText="text-[var(--brand-blue)]"
        />
        <ToolButton
          icon={<Volume2 className="w-5 h-5" />}
          label="Voice Summary"
          cost={600}
          onClick={() => insertTag("#voice ")}
          iconBg="bg-[var(--brand-yellow)]"
          iconText="text-[var(--brand-blue)]"
        />
        <ToolButton
          icon={<PieChart className="w-5 h-5" />}
          label="PDF Report"
          cost={400}
          onClick={() => insertTag("#report ")}
          iconBg="bg-[var(--brand-light-blue)]"
          iconText="text-[var(--white)]"
        />
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  cost,
  onClick,
  iconBg,
  iconText,
}: {
  icon: React.ReactNode;
  label: string;
  cost: number;
  onClick: () => void;
  iconBg: string;
  iconText: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 bg-[var(--white)] text-[var(--brand-blue)] border-2 border-[var(--gray-200)] hover:border-[var(--brand-blue)] rounded-2xl text-left transition-all font-bold group hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-solid"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-[var(--black)]/10 group-hover:border-[var(--brand-blue)] transition-colors ${iconBg} ${iconText}`}>
          {icon}
        </div>
        <span className="truncate text-sm sm:text-base">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-[var(--gray-50)] group-hover:bg-[var(--brand-light-blue)]/20 rounded-lg transition-colors border border-[var(--gray-200)] group-hover:border-[var(--brand-blue)]/30">
        <Zap className="w-3 h-3 fill-[var(--brand-yellow)] text-[var(--brand-blue)]" />
        <span className="text-xs font-extrabold text-[var(--gray-600)] group-hover:text-[var(--brand-blue)]">{cost}</span>
      </div>
    </button>
  );
}
