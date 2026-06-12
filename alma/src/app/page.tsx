"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Shield,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Upload,
  ClipboardCheck,
  ArrowRight,
  BookOpen,
  FileWarning,
  RotateCcw,
  Check,
  Paperclip,
  Type,
  FileUp,
  ArrowUpRight,
  Minus,
  CircleDot,
  TriangleAlert,
  Scale,
  MessageCircle,
  X,
  Send,
  Settings2,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { runAudit, type AuditResult, type PetitionInputs } from "@/utils/rulesEngine";
import { PRESETS, type Preset } from "@/utils/presets";
import { getEvidenceForCategory, type EvidenceItem } from "@/utils/evidenceMap";

// ─── Types ──────────────────────────────────────────
type DocTab = "i129" | "lca" | "support" | "credentials" | "rfeLetter";
type InputMode = "paste" | "upload";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DOC_ICONS: Record<DocTab, React.ReactNode> = {
  i129: <FileText size={14} strokeWidth={1.5} />,
  lca: <Scale size={14} strokeWidth={1.5} />,
  support: <BookOpen size={14} strokeWidth={1.5} />,
  credentials: <FileWarning size={14} strokeWidth={1.5} />,
  rfeLetter: <FileWarning size={14} strokeWidth={1.5} className="text-alma-red" />,
};

// ─── Risk Meter ─────────────────────────────────────
function RiskMeter({ score }: { score: number }) {
  const segments = [
    { max: 15, label: "Aligned", color: "#0B4619" },
    { max: 35, label: "Low", color: "#2D7A3E" },
    { max: 55, label: "Moderate", color: "#D97706" },
    { max: 75, label: "Elevated", color: "#E05A2B" },
    { max: 100, label: "Critical", color: "#DC2626" },
  ];
  const activeSegment = segments.find((s) => score <= s.max) || segments[segments.length - 1];

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-5xl font-light tracking-tight tabular-nums" style={{ color: activeSegment.color, fontVariantNumeric: "tabular-nums" }}>
          {score}
        </span>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-[0.15em] font-semibold" style={{ color: activeSegment.color }}>{activeSegment.label} Risk</span>
          <span className="text-[10px] text-alma-slate tracking-wide">out of 100</span>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--alma-border)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out" style={{ width: `${score}%`, backgroundColor: activeSegment.color }} />
      </div>
      <div className="flex justify-between mt-1.5 px-0.5">
        {[0, 25, 50, 75, 100].map((n) => (
          <span key={n} className="text-[9px] text-alma-slate tabular-nums">{n}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Document Verification Row ──────────────────────
function DocVerificationRow({ docName, status, index }: { docName: string; status: "verified" | "flagged"; index: number }) {
  const isVerified = status === "verified";
  return (
    <div className="flex items-center gap-3 py-2.5 animate-fade-in" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="flex items-center justify-center w-5">
        {isVerified ? (
          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--alma-green)" }}>
            <Check size={10} color="white" strokeWidth={3} />
          </div>
        ) : (
          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--alma-red)" }}>
            <Minus size={10} color="white" strokeWidth={3} />
          </div>
        )}
      </div>
      <span className="text-[13px] text-alma-charcoal flex-1">{docName}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: isVerified ? "var(--alma-green)" : "var(--alma-red)" }}>
        {isVerified ? "Passed" : "Issue Found"}
      </span>
    </div>
  );
}

// ─── Evidence Checklist ─────────────────────────────
function EvidenceChecklist({ category }: { category: string }) {
  const evidence = getEvidenceForCategory(category);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  if (!evidence) return null;

  const toggle = (id: string) => {
    setChecked((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const priorityStyles = (p: EvidenceItem["priority"]) => {
    switch (p) {
      case "required": return { color: "#DC2626", bg: "#FEE2E2" };
      case "recommended": return { color: "#D97706", bg: "#FEF3C7" };
      default: return { color: "#8A928C", bg: "#F0EDE6" };
    }
  };

  return (
    <div className="mt-4 animate-fade-in">
      <div className="border-l-2 pl-4 ml-1" style={{ borderColor: "var(--alma-green)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-alma-charcoal">Supporting Evidence</span>
          <span className="text-[11px] text-alma-slate">{checked.size}/{evidence.items.length} gathered</span>
        </div>
        <div className="h-1 rounded-full mb-3" style={{ backgroundColor: "var(--alma-border)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(checked.size / evidence.items.length) * 100}%`, backgroundColor: "var(--alma-green)" }} />
        </div>
        <p className="text-[11px] text-alma-slate mb-3 leading-relaxed italic">{evidence.rationale}</p>
        <div className="space-y-2.5">
          {evidence.items.map((item) => {
            const ps = priorityStyles(item.priority);
            const done = checked.has(item.id);
            return (
              <div key={item.id} onClick={() => toggle(item.id)} className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-[3px] w-[15px] h-[15px] rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{ borderColor: done ? "var(--alma-green)" : "var(--alma-border)", backgroundColor: done ? "var(--alma-green)" : "transparent" }}>
                  {done && <Check size={9} color="white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[12.5px] leading-snug transition-all duration-200 ${done ? "line-through text-alma-slate" : "text-alma-charcoal group-hover:text-alma-green"}`}>{item.label}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-[1px] rounded-sm" style={{ color: ps.color, backgroundColor: ps.bg }}>{item.priority}</span>
                  </div>
                  <p className="text-[11px] text-alma-slate mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Flag Card with Apply Fix ───────────────────────
function FlagCard({
  flag,
  index,
  onApplyFix,
}: {
  flag: AuditResult["flags"][0];
  index: number;
  onApplyFix: (targetField: string, newContent: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [applied, setApplied] = useState(false);

  const isCritical = flag.severity === "critical";
  const hasFix = !!flag.suggested_replacement && !!flag.target_field;

  const handleApply = () => {
    if (flag.suggested_replacement && flag.target_field) {
      onApplyFix(flag.target_field, flag.suggested_replacement);
      setApplied(true);
    }
  };

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 0.08}s` }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-3 py-3 text-left cursor-pointer group" id={`flag-${flag.id}`}>
        <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isCritical ? "var(--alma-red)" : "var(--alma-amber)" }} />
          <div className="w-[1px] flex-1 min-h-[16px]" style={{ backgroundColor: "var(--alma-border)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-1.5 py-[2px]" style={{ color: isCritical ? "var(--alma-red)" : "var(--alma-amber)", backgroundColor: isCritical ? "#FEE2E2" : "#FEF3C7", borderRadius: "2px" }}>{flag.severity}</span>
            <span className="text-[10px] text-alma-slate font-mono">{flag.id}</span>
            {applied && <span className="text-[9px] font-semibold uppercase tracking-[0.12em] px-1.5 py-[1px] rounded-sm" style={{ color: "var(--alma-green)", backgroundColor: "var(--alma-green-muted)" }}>Applied</span>}
          </div>
          <p className="text-[13.5px] font-medium text-alma-charcoal leading-snug">{flag.category}</p>
          <p className="text-[12px] text-alma-slate mt-1 leading-relaxed">{flag.conflict_summary}</p>
        </div>
        <div className="flex items-center pt-1 text-alma-slate">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </button>

      {expanded && (
        <div className="pl-6 pb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3 text-[11px] text-alma-slate">
            <span className="font-medium">{flag.source_document}</span>
            <ArrowRight size={11} />
            <span className="font-medium">{flag.target_document}</span>
          </div>

          {/* Evidence blocks */}
          <div className="space-y-2 mb-3">
            <div className="p-3 rounded-md" style={{ backgroundColor: "var(--alma-highlight)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CircleDot size={10} className="text-alma-slate" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-alma-slate">Baseline · {flag.source_document}</span>
              </div>
              <p className="text-[12px] text-alma-charcoal font-mono leading-relaxed whitespace-pre-wrap">{flag.exact_source_snippet}</p>
            </div>
            <div className="p-3 rounded-md border-l-2" style={{ backgroundColor: isCritical ? "#FEF2F2" : "#FFFBEB", borderLeftColor: isCritical ? "var(--alma-red)" : "var(--alma-amber)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TriangleAlert size={10} style={{ color: isCritical ? "var(--alma-red)" : "var(--alma-amber)" }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: isCritical ? "var(--alma-red)" : "var(--alma-amber)" }}>Conflict · {flag.target_document}</span>
              </div>
              <p className="text-[12px] text-alma-charcoal font-mono leading-relaxed whitespace-pre-wrap">{flag.exact_target_snippet}</p>
            </div>
          </div>

          {/* Remediation */}
          <div className="p-3 rounded-md border-l-2" style={{ backgroundColor: "#F0FAF2", borderLeftColor: "var(--alma-green)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] block mb-1" style={{ color: "var(--alma-green)" }}>Recommended Fix</span>
            <p className="text-[12.5px] text-alma-charcoal leading-relaxed">{flag.remediation_action}</p>

            {/* Updated content preview */}
            {hasFix && (
              <div className="mt-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 text-[11px] font-medium cursor-pointer transition-colors mb-2"
                  style={{ color: "var(--alma-green)" }}
                >
                  {showPreview ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  {showPreview ? "Hide" : "Preview"} updated content
                </button>

                {showPreview && (
                  <div className="animate-fade-in">
                    <div
                      className="p-3 rounded-md border max-h-48 overflow-y-auto text-[11px] font-mono leading-relaxed text-alma-charcoal"
                      style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-cream)" }}
                    >
                      {flag.suggested_replacement!.slice(0, 1500)}
                      {flag.suggested_replacement!.length > 1500 && "…"}
                    </div>
                  </div>
                )}

                {/* Apply button */}
                <div className="flex items-center gap-2 mt-2">
                  {!applied ? (
                    <button
                      onClick={handleApply}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold text-white cursor-pointer transition-all"
                      style={{ backgroundColor: "var(--alma-green)" }}
                      id={`apply-fix-${flag.id}`}
                    >
                      <Check size={11} />
                      Apply Fix to Document
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold" style={{ backgroundColor: "var(--alma-green-muted)", color: "var(--alma-green)" }}>
                      <CheckCheck size={11} />
                      Fix Applied — Re-run audit to verify
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Evidence toggle */}
          <button onClick={() => setShowEvidence(!showEvidence)} className="mt-3 flex items-center gap-1.5 text-[12px] font-medium cursor-pointer transition-colors hover:underline" style={{ color: "var(--alma-green)" }} id={`evidence-toggle-${flag.id}`}>
            <ClipboardCheck size={12} />
            {showEvidence ? "Hide" : "View"} Supporting Evidence
            {showEvidence ? <ChevronDown size={12} /> : <ArrowUpRight size={11} />}
          </button>
          {showEvidence && <EvidenceChecklist category={flag.category} />}
        </div>
      )}
    </div>
  );
}

// ─── Safe Markdown Renderer ─────────────────────────
interface ListItem {
  text: string;
  subItems: string[];
}

type MarkdownBlock =
  | { type: "paragraph" | "heading2" | "heading3" | "code-block" | "blockquote"; content: string[]; lang?: string }
  | { type: "bullet-list" | "number-list"; items: ListItem[] };

function parseMarkdown(text: string): MarkdownBlock[] {
  const lines = text.split("\n");
  const blocks: MarkdownBlock[] = [];
  
  let currentBlock: MarkdownBlock | null = null;
  let codeBlockLang = "";

  const flush = () => {
    if (currentBlock) {
      if (currentBlock.type === "bullet-list" || currentBlock.type === "number-list") {
        if (currentBlock.items.length > 0) {
          blocks.push(currentBlock);
        }
      } else {
        const contentBlock = currentBlock as { type: "paragraph" | "heading2" | "heading3" | "code-block" | "blockquote"; content: string[] };
        if (contentBlock.content.length > 0) {
          blocks.push(currentBlock);
        }
      }
    }
    currentBlock = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block check
    if (trimmed.startsWith("```")) {
      if (currentBlock && currentBlock.type === "code-block") {
        flush();
      } else {
        flush();
        currentBlock = { type: "code-block", content: [], lang: trimmed.slice(3) };
      }
      continue;
    }

    if (currentBlock && currentBlock.type === "code-block") {
      currentBlock.content.push(line);
      continue;
    }

    if (trimmed === "") {
      if (currentBlock && (currentBlock.type === "bullet-list" || currentBlock.type === "number-list")) {
        continue;
      }
      flush();
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      if (!currentBlock || currentBlock.type !== "blockquote") {
        flush();
        currentBlock = { type: "blockquote", content: [] };
      }
      currentBlock.content.push(trimmed.replace(/^>\s*/, ""));
      continue;
    }

    // Headings
    if (trimmed.startsWith("###")) {
      flush();
      blocks.push({ type: "heading3", content: [trimmed.replace(/^###\s*/, "")] });
      continue;
    }
    if (trimmed.startsWith("##")) {
      flush();
      blocks.push({ type: "heading2", content: [trimmed.replace(/^##\s*/, "")] });
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const textVal = bulletMatch[2];

      // If we are currently in a list, and this item is indented or we are in a numbered list,
      // treat it as a nested item of the last parent item.
      if (currentBlock && (currentBlock.type === "bullet-list" || currentBlock.type === "number-list")) {
        const items = currentBlock.items;
        if (items.length > 0 && (indent > 0 || currentBlock.type === "number-list")) {
          items[items.length - 1].subItems.push(textVal);
          continue;
        }
      }

      if (!currentBlock || currentBlock.type !== "bullet-list") {
        flush();
        currentBlock = { type: "bullet-list", items: [] };
      }
      currentBlock.items.push({ text: textVal, subItems: [] });
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numMatch) {
      if (!currentBlock || currentBlock.type !== "number-list") {
        flush();
        currentBlock = { type: "number-list", items: [] };
      }
      currentBlock.items.push({ text: numMatch[2], subItems: [] });
      continue;
    }

    // Paragraph (standard line)
    if (!currentBlock || currentBlock.type !== "paragraph") {
      flush();
      currentBlock = { type: "paragraph", content: [] };
    }
    currentBlock.content.push(line);
  }

  flush();
  return blocks;
}

function renderInline(text: string, isUser: boolean, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const strongColor = isUser ? "text-white font-bold" : "text-alma-charcoal font-bold";
  const codeBg = isUser ? "bg-white/20 text-white font-mono px-1 rounded" : "bg-alma-border/40 text-[#b45309] font-mono px-1 py-[0.5px] rounded text-[11.5px] border border-alma-border/30";

  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const tokens = text.split(regex);

  tokens.forEach((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={key} className={strongColor}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={key} className={codeBg}>
          {token.slice(1, -1)}
        </code>
      );
    } else {
      if (token) {
        parts.push(token);
      }
    }
  });

  return parts;
}

function SafeMarkdown({ content, isUser }: { content: string; isUser: boolean }) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);
  const textColor = isUser ? "text-white" : "text-alma-charcoal";

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const key = `block-${i}`;
        switch (block.type) {
          case "heading2":
            return (
              <h3 key={key} className={`text-[14.5px] font-bold mt-4 mb-2 first:mt-1 ${textColor}`}>
                {renderInline(block.content[0], isUser, `h2-${i}`)}
              </h3>
            );
          case "heading3":
            return (
              <h4 key={key} className={`text-[13.5px] font-bold mt-3 mb-1.5 first:mt-1 ${textColor}`}>
                {renderInline(block.content[0], isUser, `h3-${i}`)}
              </h4>
            );
          case "paragraph":
            return (
              <p key={key} className={`text-[13px] leading-relaxed ${textColor}`}>
                {renderInline(block.content.join(" "), isUser, `p-${i}`)}
              </p>
            );
          case "bullet-list":
            return (
              <ul key={key} className={`list-disc pl-5 space-y-2 my-2.5 ${textColor}`}>
                {block.items.map((item, idx) => (
                  <li key={idx} className="text-[13px] leading-relaxed">
                    <div>{renderInline(item.text, isUser, `li-b-${i}-${idx}`)}</div>
                    {item.subItems.length > 0 && (
                      <ul className="list-disc pl-5 mt-1.5 space-y-1">
                        {item.subItems.map((sub, sIdx) => (
                          <li key={sIdx} className={`text-[12.5px] leading-relaxed ${isUser ? "text-white/95" : "text-alma-charcoal/90"}`}>
                            {renderInline(sub, isUser, `sub-b-${i}-${idx}-${sIdx}`)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            );
          case "number-list":
            return (
              <ol key={key} className={`list-decimal pl-5 space-y-2 my-2.5 ${textColor}`}>
                {block.items.map((item, idx) => (
                  <li key={idx} className="text-[13px] leading-relaxed">
                    <div>{renderInline(item.text, isUser, `li-n-${i}-${idx}`)}</div>
                    {item.subItems.length > 0 && (
                      <ul className="list-disc pl-5 mt-1.5 space-y-1">
                        {item.subItems.map((sub, sIdx) => (
                          <li key={sIdx} className={`text-[12.5px] leading-relaxed ${isUser ? "text-white/95" : "text-alma-charcoal/90"}`}>
                            {renderInline(sub, isUser, `sub-n-${i}-${idx}-${sIdx}`)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            );
          case "blockquote":
            return (
              <blockquote key={key} className={`pl-3 border-l-2 my-2.5 italic text-[12.5px] leading-relaxed ${isUser ? "border-white/50 text-white/90" : "border-alma-green/50 text-alma-slate"}`}>
                {block.content.map((line, idx) => (
                  <p key={idx} className="mb-1 last:mb-0">
                    {renderInline(line, isUser, `bq-${i}-${idx}`)}
                  </p>
                ))}
              </blockquote>
            );
          case "code-block":
            return (
              <pre key={key} className={`p-3 rounded my-2.5 overflow-x-auto text-[11.5px] font-mono leading-normal max-w-full border ${isUser ? "bg-white/10 border-white/20 text-white" : "bg-alma-cream border-alma-border text-alma-charcoal"}`}>
                <code>{block.content.join("\n")}</code>
              </pre>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

// ─── Alma Chatbot ───────────────────────────────────
function AlmaChatbot({ inputs, result }: { inputs: PetitionInputs; result: AuditResult | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Compute the current audit results dynamically so the chatbot always has access to in-sync data
  const currentAuditResult = useMemo(() => {
    if (result) return result;
    return runAudit(inputs);
  }, [inputs, result]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          context: {
            formI129: inputs.formI129,
            lcaText: inputs.lcaText,
            supportLetter: inputs.supportLetter,
            credentials: inputs.credentials,
            auditResult: currentAuditResult,
          },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages([...updatedMessages, { role: "assistant", content: "Error: " + data.error }]);
      } else {
        setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages([...updatedMessages, { role: "assistant", content: "Connection error. Check your network and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg"
          style={{ backgroundColor: "var(--alma-green)" }}
          id="alma-chat-btn"
        >
          <MessageCircle size={18} />
          <span className="text-[13px] font-semibold">Alma</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[450px] max-w-[calc(100vw-2rem)] rounded-xl border overflow-hidden shadow-2xl animate-slide-up flex flex-col"
          style={{
            borderColor: "var(--alma-border)",
            backgroundColor: "var(--alma-panel)",
            height: "620px",
            maxHeight: "calc(100vh-4rem)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-cream)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--alma-green)" }}>
                <Shield size={13} color="white" />
              </div>
              <div>
                <span className="text-[13px] font-semibold text-alma-charcoal">Alma</span>
                <span className="text-[10px] text-alma-slate block leading-tight">Filing Assistant</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md cursor-pointer text-alma-slate hover:text-alma-charcoal transition-colors" id="chat-close-btn">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "var(--alma-highlight)" }}>
                  <MessageCircle size={18} className="text-alma-slate opacity-50" />
                </div>
                <p className="text-[12px] text-alma-slate leading-relaxed max-w-[260px] mx-auto">
                  Ask about your audit findings, USCIS requirements, or how to strengthen your petition package.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "px-4 py-2.5 rounded-tr-[4px] shadow-sm text-white"
                      : "p-4 rounded-tl-[4px] border border-alma-border/40 shadow-sm w-full text-alma-charcoal"
                  }`}
                  style={{
                    backgroundColor: msg.role === "user" ? "var(--alma-green)" : "var(--alma-highlight)",
                  }}
                >
                  <SafeMarkdown content={msg.content} isUser={msg.role === "user"} />
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: "var(--alma-highlight)" }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--alma-green)" }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--alma-green)", animationDelay: "0.2s" }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--alma-green)", animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t" style={{ borderColor: "var(--alma-border)" }}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask Alma about your petition…"
                className="flex-1 px-3 py-2 rounded-md border text-[12.5px]"
                style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-cream)", color: "var(--alma-charcoal)" }}
                id="chat-input"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-md text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: "var(--alma-green)" }}
                id="chat-send-btn"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════
export default function Home() {
  const [inputs, setInputs] = useState<PetitionInputs>({ formI129: "", lcaText: "", supportLetter: "", credentials: "", rfeLetter: "" });
  const [selectedDoc, setSelectedDoc] = useState<DocTab>("lca");
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assessmentMode, setAssessmentMode] = useState<"pre-filing" | "post-filing">("pre-filing");

  const docFieldMap: Record<DocTab, keyof PetitionInputs> = {
    i129: "formI129",
    lca: "lcaText",
    support: "supportLetter",
    credentials: "credentials",
    rfeLetter: "rfeLetter"
  };

  const docOptions = useMemo(() => {
    const base = [
      { key: "i129" as DocTab, label: "Form I-129", shortLabel: "I-129" },
      { key: "lca" as DocTab, label: "Certified LCA (ETA 9035)", shortLabel: "LCA" },
      { key: "support" as DocTab, label: "Employer Support Letter", shortLabel: "Support" },
      { key: "credentials" as DocTab, label: "Beneficiary Credentials", shortLabel: "Credentials" },
    ];
    if (assessmentMode === "post-filing") {
      return [
        ...base,
        { key: "rfeLetter" as DocTab, label: "USCIS RFE Letter", shortLabel: "RFE Letter" }
      ];
    }
    return base;
  }, [assessmentMode]);

  const updateField = useCallback((tab: DocTab, value: string) => {
    setInputs((prev) => ({ ...prev, [docFieldMap[tab]]: value }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreset = useCallback((preset: Preset) => {
    setInputs(preset.inputs);
    setActivePreset(preset.id);
    setResult(null);
    setInputMode("paste");
    setAppliedFixes(new Set());
    if (preset.inputs.rfeLetter) {
      setAssessmentMode("post-filing");
      setSelectedDoc("rfeLetter");
    } else {
      setAssessmentMode("pre-filing");
      setSelectedDoc("lca");
    }
  }, []);

  const handleAudit = useCallback(() => {
    setIsAuditing(true);
    setAppliedFixes(new Set());
    setTimeout(() => {
      const auditResult = runAudit(inputs, assessmentMode);
      setResult(auditResult);
      setIsAuditing(false);
    }, 900);
  }, [inputs, assessmentMode]);

  const handleReset = useCallback(() => {
    setInputs({ formI129: "", lcaText: "", supportLetter: "", credentials: "", rfeLetter: "" });
    setResult(null);
    setActivePreset(null);
    setUploadedFiles({});
    setAppliedFixes(new Set());
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      updateField(selectedDoc, text);
      setUploadedFiles((prev) => ({ ...prev, [selectedDoc]: file.name }));
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedDoc, updateField]);

  const handleApplyFix = useCallback((targetField: string, newContent: string) => {
    setInputs((prev) => ({ ...prev, [targetField]: newContent }));
    setAppliedFixes((prev) => new Set(prev).add(targetField));
  }, []);

  const hasContent = useMemo(() => Object.values(inputs).some((v) => v.trim().length > 0), [inputs]);
  const loadedCount = useMemo(() => Object.values(inputs).filter((v) => v.trim().length > 0).length, [inputs]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--alma-cream)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-cream)" }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--alma-green)" }}>
              <Shield size={16} color="white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-alma-charcoal tracking-tight">Alma</h1>
              <p className="text-[11px] text-alma-slate tracking-wide">H1B RFE Assessment Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {docOptions.map((doc) => {
                const val = inputs[docFieldMap[doc.key]];
                const hasData = val ? val.trim().length > 0 : false;
                return <div key={doc.key} className="w-2 h-2 rounded-full transition-all duration-300" title={`${doc.label}: ${hasData ? "Loaded" : "Empty"}`} style={{ backgroundColor: hasData ? "var(--alma-green)" : "var(--alma-border)" }} />;
              })}
              <span className="text-[11px] text-alma-slate ml-1.5">{loadedCount}/{docOptions.length}</span>
            </div>
            {appliedFixes.size > 0 && (
              <button
                onClick={handleAudit}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md text-white cursor-pointer transition-all"
                style={{ backgroundColor: "var(--alma-green)" }}
                id="re-audit-btn"
              >
                <RefreshCw size={11} />
                Re-run Audit
              </button>
            )}
            {result && (
              <button onClick={handleReset} className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md border cursor-pointer transition-colors" style={{ borderColor: "var(--alma-border)", color: "var(--alma-slate)" }} id="reset-btn">
                <RotateCcw size={11} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-6">
        {/* Quick Start Templates */}
        <section className="mb-7 animate-fade-in">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-alma-slate mb-3">Quick Start Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              const isClean = preset.severity === "clean";
              return (
                <button key={preset.id} onClick={() => loadPreset(preset)}
                  className={`text-left p-4 rounded-lg transition-all duration-300 cursor-pointer group relative overflow-hidden ${isActive ? "ring-2 ring-white/30 shadow-lg scale-[1.02]" : "hover:shadow-md hover:scale-[1.01]"}`}
                  style={{ backgroundColor: isClean ? "var(--alma-green)" : "#0F5A28", color: "white" }} id={`preset-${preset.id}`}>
                  <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      {isClean ? <Check size={13} strokeWidth={2.5} className="opacity-80" /> : <AlertTriangle size={13} strokeWidth={2} className="opacity-80" />}
                      <span className="text-[13px] font-semibold leading-tight">{preset.label}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-75">{preset.description}</p>
                  </div>
                  {isActive && <div className="absolute top-2 right-2"><div className="w-2 h-2 rounded-full bg-white animate-pulse" /></div>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Mode Selector Switcher */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center rounded-lg p-1 border" style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-panel)" }}>
            <button
              onClick={() => {
                setAssessmentMode("pre-filing");
                if (selectedDoc === "rfeLetter") setSelectedDoc("lca");
                setResult(null);
              }}
              className="px-4 py-2 rounded-md text-[12.5px] font-semibold cursor-pointer transition-all flex items-center gap-2"
              style={{
                backgroundColor: assessmentMode === "pre-filing" ? "var(--alma-green)" : "transparent",
                color: assessmentMode === "pre-filing" ? "white" : "var(--alma-slate)"
              }}
              id="mode-pre-filing"
            >
              <Shield size={13} />
              Pre-Filing Prevention
            </button>
            <button
              onClick={() => {
                setAssessmentMode("post-filing");
                setResult(null);
                setSelectedDoc("rfeLetter");
              }}
              className="px-4 py-2 rounded-md text-[12.5px] font-semibold cursor-pointer transition-all flex items-center gap-2"
              style={{
                backgroundColor: assessmentMode === "post-filing" ? "var(--alma-green)" : "transparent",
                color: assessmentMode === "post-filing" ? "white" : "var(--alma-slate)"
              }}
              id="mode-post-filing"
            >
              <FileWarning size={13} />
              Post-Filing Mitigation
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Document Input */}
          <section className="lg:col-span-5 animate-slide-up">
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-panel)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--alma-border)" }}>
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-alma-charcoal">Document Input</span>
                <div className="flex items-center rounded-md overflow-hidden border" style={{ borderColor: "var(--alma-border)" }}>
                  <button onClick={() => setInputMode("paste")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-all"
                    style={{ backgroundColor: inputMode === "paste" ? "var(--alma-green)" : "transparent", color: inputMode === "paste" ? "white" : "var(--alma-slate)" }} id="mode-paste">
                    <Type size={11} /> Paste
                  </button>
                  <button onClick={() => setInputMode("upload")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-all"
                    style={{ backgroundColor: inputMode === "upload" ? "var(--alma-green)" : "transparent", color: inputMode === "upload" ? "white" : "var(--alma-slate)" }} id="mode-upload">
                    <FileUp size={11} /> Upload
                  </button>
                </div>
              </div>

              <div className="px-4 pt-3">
                <label className="text-[11px] text-alma-slate block mb-1.5">Select Document</label>
                <div className="relative">
                  <select value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value as DocTab)}
                    className="w-full appearance-none px-3 py-2.5 pr-8 rounded-md border text-[13px] font-medium cursor-pointer transition-all"
                    style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-cream)", color: "var(--alma-charcoal)" }} id="doc-selector">
                    {docOptions.map((doc) => {
                      const val = inputs[docFieldMap[doc.key]];
                      const hasData = val ? val.trim().length > 0 : false;
                      return <option key={doc.key} value={doc.key}>{doc.label} {hasData ? "✓" : ""}</option>;
                    })}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-alma-slate" />
                </div>
              </div>

              <div className="px-4 pt-2.5 flex gap-1.5 overflow-x-auto scrollbar-none">
                {docOptions.map((doc) => {
                  const val = inputs[docFieldMap[doc.key]];
                  const hasData = val ? val.trim().length > 0 : false;
                  const isActive = selectedDoc === doc.key;
                  return (
                    <button key={doc.key} onClick={() => setSelectedDoc(doc.key)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-all whitespace-nowrap"
                      style={{
                        backgroundColor: isActive ? (hasData ? "var(--alma-green)" : "var(--alma-charcoal)") : (hasData ? "var(--alma-green-muted)" : "var(--alma-highlight)"),
                        color: isActive ? "white" : (hasData ? "var(--alma-green)" : "var(--alma-slate)"),
                      }}>
                      {DOC_ICONS[doc.key]} {doc.shortLabel}
                    </button>
                  );
                })}
              </div>

              <div className="p-4">
                {inputMode === "paste" ? (
                  <textarea value={inputs[docFieldMap[selectedDoc]] || ""} onChange={(e) => updateField(selectedDoc, e.target.value)}
                    placeholder={`Paste raw text from ${docOptions.find((d) => d.key === selectedDoc)?.label}...`}
                    className="w-full h-64 p-3 rounded-md border text-[12.5px] font-mono leading-relaxed resize-none transition-all duration-200"
                    style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-cream)", color: "var(--alma-charcoal)" }} id={`input-${selectedDoc}`} />
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-alma-green/40"
                      style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-cream)", minHeight: "200px" }}
                      onClick={() => fileInputRef.current?.click()}>
                      <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.rtf" onChange={handleFileUpload} className="hidden" id="file-upload-input" />
                      <Upload size={24} className="text-alma-slate mb-3 opacity-50" />
                      <p className="text-[13px] font-medium text-alma-charcoal mb-1">Drop file or click to browse</p>
                      <p className="text-[11px] text-alma-slate">Supports .txt, .pdf, .doc, .docx, .rtf</p>
                    </div>
                    {uploadedFiles[selectedDoc] && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: "var(--alma-green-muted)" }}>
                        <Paperclip size={12} style={{ color: "var(--alma-green)" }} />
                        <span className="text-[12px] text-alma-charcoal">{uploadedFiles[selectedDoc]}</span>
                        <Check size={12} style={{ color: "var(--alma-green)" }} className="ml-auto" />
                      </div>
                    )}
                    {(() => {
                      const val = inputs[docFieldMap[selectedDoc]];
                      if (!val || val.trim().length === 0) return null;
                      return (
                        <div>
                          <span className="text-[10px] text-alma-slate uppercase tracking-wider">Extracted Content</span>
                          <div className="mt-1 p-2.5 rounded-md border text-[11px] font-mono text-alma-slate max-h-32 overflow-y-auto leading-relaxed"
                            style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-cream)" }}>
                            {val.slice(0, 500)}{val.length > 500 && "..."}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11px] text-alma-slate">{loadedCount}/{docOptions.length} documents loaded</span>
                  <button onClick={handleAudit} disabled={!hasContent || isAuditing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-semibold text-white transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "var(--alma-green)" }} id="run-audit-btn">
                    {isAuditing ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running audit…</>) : (<>Run Audit<ArrowRight size={14} /></>)}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Audit Results */}
          <section className="lg:col-span-7 animate-slide-up" style={{ animationDelay: "0.08s" }}>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--alma-border)", backgroundColor: "var(--alma-panel)" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "var(--alma-border)" }}>
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-alma-charcoal">Audit Report</span>
              </div>

              {!result ? (
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                  <div className="mb-5"><div className="w-[60px] h-[60px] rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--alma-highlight)" }}><Shield size={24} className="text-alma-slate opacity-40" /></div></div>
                  <p className="text-[14px] font-medium text-alma-charcoal mb-1.5">No audit results yet</p>
                  <p className="text-[12px] text-alma-slate max-w-sm leading-relaxed">Load a quick start template or paste your petition documents to begin the cross-document consistency check.</p>
                  <div className="mt-8 w-full max-w-xs">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-alma-slate text-left mb-2 font-semibold">Verification Passes</div>
                    {["Job Title & Identity Alignment", "Wage Level vs. Task Complexity", "Specialty Occupation & Degree Match"].map((pass, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-2 border-b" style={{ borderColor: "var(--alma-border)" }}>
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center" style={{ borderColor: "var(--alma-border)" }}>
                          <span className="text-[9px] font-semibold text-alma-slate">{i + 1}</span>
                        </div>
                        <span className="text-[12px] text-alma-slate">{pass}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                  <div className="px-5 py-5 border-b" style={{ borderColor: "var(--alma-border)" }}>
                    <RiskMeter score={result.rfe_risk_score} />
                    <p className="text-[13px] text-alma-charcoal mt-4 leading-relaxed">{result.scrutiny_summary}</p>
                  </div>

                  <div className="px-5 py-4 border-b" style={{ borderColor: "var(--alma-border)" }}>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-alma-slate">Document Verification</span>
                    <div className="mt-2 divide-y" style={{ borderColor: "var(--alma-border)" }}>
                      {result.document_status.map((ds, i) => <DocVerificationRow key={ds.document} docName={ds.document} status={ds.status} index={i} />)}
                    </div>
                  </div>

                  {result.flags.length > 0 ? (
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-alma-slate">Flagged Issues</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-alma-slate">{result.flags.filter((f) => f.severity === "critical").length} critical</span>
                          <span className="text-[10px] text-alma-border">·</span>
                          <span className="text-[10px] font-mono text-alma-slate">{result.flags.filter((f) => f.severity === "warning").length} advisory</span>
                        </div>
                      </div>
                      <div className="divide-y" style={{ borderColor: "var(--alma-border)" }}>
                        {result.flags.map((flag, i) => <FlagCard key={flag.id} flag={flag} index={i} onApplyFix={handleApplyFix} />)}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-12 text-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--alma-green)" }}>
                        <Check size={20} color="white" strokeWidth={2.5} />
                      </div>
                      <p className="text-[14px] font-medium text-alma-charcoal mb-1">All documents aligned</p>
                      <p className="text-[12px] text-alma-slate">No cross-document inconsistencies detected. Ready for attorney review.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-10 mb-6 flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--alma-border)" }} />
          <p className="text-[11px] text-alma-slate tracking-wide">Alma Pre-Flight · Cross-Document Consistency Engine</p>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--alma-border)" }} />
        </footer>
      </div>

      {/* Alma Chatbot */}
      <AlmaChatbot inputs={inputs} result={result} />
    </main>
  );
}
