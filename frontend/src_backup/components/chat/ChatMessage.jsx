import { useState } from "react";
import { User, Sparkles, Copy, Check, HelpCircle, Code, Zap, FileText, BookOpenCheck } from "lucide-react";

function formatInline(str) {
  if (!str) return null;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px] border border-slate-200/80"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts;
}

function parseMarkdownBlocks(text) {
  if (!text) return [];
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Fenced Code Block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // 2. Table Block: starts and ends with |
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = tableLines[0].split("|").slice(1, -1).map((c) => c.trim());
        const rows = tableLines.slice(2).map((r) => r.split("|").slice(1, -1).map((c) => c.trim()));
        blocks.push({ type: "table", headers, rows });
      } else {
        blocks.push({ type: "paragraph", text: tableLines.join(" ") });
      }
      continue;
    }

    // 3. Headings
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.replace("### ", "") });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.replace("## ", "") });
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.replace("# ", "") });
      i++;
      continue;
    }

    // 4. Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // 5. Unordered List
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // 6. Ordered List
    if (/^\d+\.\s+/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // 7. Empty line spacer
    if (!line.trim()) {
      blocks.push({ type: "spacer" });
      i++;
      continue;
    }

    // 8. Regular paragraph
    const pLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("* ") &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      lines[i].trim() !== "---"
    ) {
      pLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", text: pLines.join(" ") });
  }

  return blocks;
}

function CodeBlockRenderer({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-slate-700/60 bg-slate-900 overflow-hidden text-slate-100 shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[11px] font-mono text-slate-400">
        <span>{lang || "code"}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ChatMessage({ message, onTopicSelectForQuiz }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const styleLabels = {
    quick: { label: "Quick Answer", icon: Zap, color: "text-amber-700 bg-amber-50 border-amber-200" },
    exam_ready: { label: "Exam Ready", icon: FileText, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    detailed: { label: "Detailed Masterclass", icon: BookOpenCheck, color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
  };

  const activeStyleInfo = message.answerStyle ? styleLabels[message.answerStyle] : null;

  const renderBlocks = (content) => {
    const blocks = parseMarkdownBlocks(content);

    return blocks.map((block, idx) => {
      switch (block.type) {
        case "h1":
          return (
            <h2 key={idx} className="text-lg font-bold text-slate-900 mt-3 mb-1.5 border-b border-slate-200 pb-1">
              {formatInline(block.text)}
            </h2>
          );
        case "h2":
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1.5">
              {formatInline(block.text)}
            </h3>
          );
        case "h3":
          return (
            <h4 key={idx} className="text-sm font-bold text-indigo-950 mt-3 mb-1">
              {formatInline(block.text)}
            </h4>
          );
        case "ul":
          return (
            <ul key={idx} className="my-2 space-y-1 list-disc list-outside ml-4 text-slate-700">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {formatInline(item)}
                </li>
              ))}
            </ul>
          );
        case "ol":
          return (
            <ol key={idx} className="my-2 space-y-1 list-decimal list-outside ml-5 text-slate-700">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {formatInline(item)}
                </li>
              ))}
            </ol>
          );
        case "code":
          return <CodeBlockRenderer key={idx} code={block.code} lang={block.lang} />;
        case "table":
          return (
            <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/70">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-700 border-r border-slate-100 last:border-r-0 leading-relaxed">
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        case "hr":
          return <hr key={idx} className="my-3 border-slate-200" />;
        case "spacer":
          return <div key={idx} className="h-1.5" />;
        case "paragraph":
        default:
          return (
            <p key={idx} className="my-1.5 leading-relaxed text-slate-700">
              {formatInline(block.text)}
            </p>
          );
      }
    });
  };

  return (
    <div className={`flex gap-3 text-sm ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
          isUser
            ? "bg-slate-800 text-white"
            : "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[88%] rounded-2xl p-4 transition-all ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-xs"
            : "bg-white border border-slate-200/90 shadow-xs rounded-tl-xs text-slate-800"
        }`}
      >
        {/* Subject & Style Tags */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {message.subject && (
            <span
              className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                isUser
                  ? "bg-indigo-700 text-indigo-100"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-100"
              }`}
            >
              {message.subject}
            </span>
          )}

          {!isUser && activeStyleInfo && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${activeStyleInfo.color}`}
            >
              <activeStyleInfo.icon className="w-3 h-3" />
              {activeStyleInfo.label}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className={`prose-sm ${isUser ? "text-white" : "text-slate-800"}`}>
          {isUser ? <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p> : renderBlocks(message.content)}
        </div>

        {/* Footer Actions for Assistant response */}
        {!isUser && (
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[10px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Powered by Groq
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer text-[11px]"
                title="Copy response to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {onTopicSelectForQuiz && (
                <button
                  onClick={() => onTopicSelectForQuiz(message.subject || "Current Course Topic")}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-[11px] cursor-pointer"
                  title="Generate a practice quiz on this concept"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Generate Quiz</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
