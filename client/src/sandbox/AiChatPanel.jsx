import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  Copy,
  Check,
  User,
  BookOpen,
} from "lucide-react";
import { sendAiChatMessage } from "./sandboxApi";

const FALLBACK_MODES = [
  {
    id: "internal_qa",
    label: "Hỏi đáp chức năng nội bộ",
    description: "Giải đáp kiến trúc, API, luồng hoạt động và tính năng trong dự án DiiD.",
  },
];

const FALLBACK_QUESTIONS = [
  "Tổng quan kiến trúc 3 tầng của dự án DiiD hoạt động như thế nào?",
  "Luồng gửi sự kiện từ Chrome Extension lên POST /api/events và cách chống trùng lặp?",
  "Database Prisma gồm những bảng nào và các trường chính là gì?",
];

export default function AiChatPanel({ config }) {
  const models = config?.availableModels || ["gemini-3.5-flash-lite"];
  const aiModes = config?.aiModes?.length ? config.aiModes : FALLBACK_MODES;
  const quickQuestions = config?.quickQuestions?.length
    ? config.quickQuestions
    : FALLBACK_QUESTIONS;

  const [selectedModel, setSelectedModel] = useState(
    config?.defaultModel || "gemini-3.5-flash-lite",
  );
  const [selectedMode, setSelectedMode] = useState(
    config?.defaultAiMode || "internal_qa",
  );
  const [systemPromptOverride, setSystemPromptOverride] = useState("");
  const [includeKnowledge, setIncludeKnowledge] = useState(true);
  const [temperature, setTemperature] = useState(0.3);
  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      role: "model",
      text: "Trợ lý AI nội bộ dự án DiiD đã sẵn sàng. Bạn có thể hỏi về luồng Chrome Extension, API backend (/api/events, /api/articles, /api/sessions, /api/stats, /api/summarize), Prisma schema, Cron/Socket.io hoặc khu vực /sandbox.",
      meta: null,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const bottomRef = useRef(null);
  const msgSeqRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const activeModeObj =
    aiModes.find((m) => m.id === selectedMode) || aiModes[0];

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? inputValue).trim();
    if (!text || sending) return;

    setErrorMessage("");
    if (!overrideText) {
      setInputValue("");
    }

    msgSeqRef.current += 1;
    const userMsg = {
      id: `user-${msgSeqRef.current}`,
      role: "user",
      text,
      meta: null,
    };

    const historyForApi = messages
      .filter((m) => m.id !== "welcome-1")
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const data = await sendAiChatMessage({
        message: text,
        history: historyForApi,
        mode: selectedMode,
        systemPrompt: systemPromptOverride.trim() || undefined,
        includeProjectKnowledge: includeKnowledge,
        model: selectedModel,
        temperature,
      });

      msgSeqRef.current += 1;
      const assistantMsg = {
        id: `model-${msgSeqRef.current}`,
        role: "model",
        text: data.reply,
        meta: {
          model: data.model,
          mode: data.mode,
          knowledgeAttached: data.knowledgeAttached,
          latencyMs: data.latencyMs,
          tokens: data.usageMetadata?.totalTokenCount || null,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error ||
          err.message ||
          "Failed to get response from Gemini AI.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setErrorMessage("");
    setMessages([
      {
        id: "welcome-1",
        role: "model",
        text: "Đã xóa lịch sử hội thoại. Hãy đặt câu hỏi về chức năng nội bộ của dự án DiiD.",
        meta: null,
      },
    ]);
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard may be unavailable in headless contexts
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section
      data-testid="ai-chat-panel"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl min-h-[650px] max-h-[860px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>Internal Project AI Chatbox</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Hỏi đáp chức năng nội bộ dự án
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Trả lời dựa trên dữ liệu dự án (
            <code className="text-cyan-300">project-knowledge.md</code> &{" "}
            <code className="text-cyan-300">faq-prompts.json</code>).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            data-testid="knowledge-status-badge"
            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              config?.knowledgeLoaded
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            {config?.knowledgeLoaded ? "Docs Loaded" : "Docs N/A"}
          </span>
          <span
            data-testid="gemini-status-badge"
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              config?.geminiConfigured
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
            }`}
          >
            {config?.geminiConfigured ? "Gemini Ready" : "Key Missing"}
          </span>
          <button
            type="button"
            data-testid="toggle-ai-settings-btn"
            onClick={() => setShowSettings((prev) => !prev)}
            title="Model & Prompt Settings"
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="clear-chat-btn"
            onClick={handleClear}
            title="Clear chat"
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-rose-300 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-1.5" data-testid="ai-mode-selector">
        {aiModes.map((mode) => {
          const active = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              data-testid={`ai-mode-${mode.id}`}
              onClick={() => setSelectedMode(mode.id)}
              title={mode.description}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                active
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      {activeModeObj?.description && (
        <div className="text-[11px] text-slate-400 -mt-2">
          {activeModeObj.description}
        </div>
      )}

      {/* Settings Drawer */}
      {showSettings && (
        <div
          data-testid="ai-settings-panel"
          className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Gemini Model</label>
              <select
                data-testid="ai-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full mt-2 accent-cyan-400"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer select-none">
            <input
              data-testid="attach-knowledge-checkbox"
              type="checkbox"
              checked={includeKnowledge}
              onChange={(e) => setIncludeKnowledge(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500"
            />
            Đính kèm file dữ liệu nội bộ dự án (`project-knowledge.md`) vào ngữ
            cảnh AI
          </label>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400">
                Override System Prompt (để trống = dùng{" "}
                <code>system-prompt.txt</code>)
              </span>
              {systemPromptOverride && (
                <button
                  type="button"
                  onClick={() => setSystemPromptOverride("")}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Reset mặc định
                </button>
              )}
            </div>
            <textarea
              data-testid="ai-system-prompt-input"
              rows={2}
              placeholder={
                config?.defaultSystemPrompt ||
                "Mặc định dùng system-prompt.txt trên server..."
              }
              value={systemPromptOverride}
              onChange={(e) => setSystemPromptOverride(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5">
        {quickQuestions.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={sending || !config?.geminiConfigured}
            title={prompt}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-cyan-200 transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate max-w-[260px]">{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div
        data-testid="chat-messages-list"
        className="flex-1 overflow-y-auto rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              data-testid={isUser ? "chat-message-user" : "chat-message-ai"}
              className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-cyan-300" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                {!isUser && msg.meta && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                    <span>
                      {msg.meta.model} • {msg.meta.mode} • {msg.meta.latencyMs}
                      ms{msg.meta.tokens ? ` • ${msg.meta.tokens} tokens` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copiedId === msg.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-indigo-300" />
                </div>
              )}
            </div>
          );
        })}

        {sending && (
          <div
            data-testid="chat-loading-indicator"
            className="flex items-center gap-2.5 text-xs text-cyan-300"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <span>Gemini đang tra cứu tài liệu nội bộ...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {errorMessage && (
        <div
          data-testid="chat-error"
          className="rounded-xl p-3 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs"
        >
          {errorMessage}
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2.5">
        <textarea
          data-testid="chat-input"
          rows={2}
          placeholder="Hỏi về chức năng, API, schema, extension hoặc cron job trong dự án... (Enter để gửi)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!config?.geminiConfigured}
          className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
        />
        <button
          type="button"
          data-testid="chat-send-btn"
          disabled={sending || !inputValue.trim() || !config?.geminiConfigured}
          onClick={() => handleSend()}
          className="h-[62px] px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm inline-flex items-center gap-2 transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </section>
  );
}
