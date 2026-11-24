import { useEffect, useState } from "react";
import { FlaskConical, Code2, ShieldCheck } from "lucide-react";
import { fetchSandboxConfig } from "./sandboxApi";
import PaymentPanel from "./PaymentPanel";
import AiChatPanel from "./AiChatPanel";

export default function SandboxPage() {
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState("");
  const [viewMode, setViewMode] = useState("split");
  const [showApiGuide, setShowApiGuide] = useState(false);

  useEffect(() => {
    document.title = "DiiD Test Sandbox — Stripe Payment & Internal AI Chat";
    let cancelled = false;

    async function loadConfig() {
      try {
        const data = await fetchSandboxConfig();
        if (!cancelled) {
          setConfig(data);
        }
      } catch (err) {
        if (!cancelled) {
          setConfigError(
            err.response?.data?.error ||
              err.message ||
              "Cannot reach sandbox backend API (/api/sandbox/config).",
          );
        }
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800/90 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Isolated Test Sandbox
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  /sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Standalone environment for external QA & integration testing
                (Stripe + Gemini AI)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
              {[
                { id: "split", label: "Split View" },
                { id: "payment", label: "Payment Only" },
                { id: "chat", label: "AI Chat Only" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    viewMode === tab.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              data-testid="toggle-api-guide-btn"
              onClick={() => setShowApiGuide((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-indigo-400" />
              API Endpoints
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {configError && (
          <div
            data-testid="sandbox-config-error"
            className="rounded-xl bg-rose-950/60 border border-rose-500/40 p-4 text-sm text-rose-200"
          >
            {configError}
          </div>
        )}

        {showApiGuide && (
          <div
            data-testid="api-guide-panel"
            className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-xs space-y-3"
          >
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sandbox REST Endpoints (CORS Enabled)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-slate-300">
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
                <div className="text-indigo-300 font-semibold">
                  Stripe Payments
                </div>
                <div>GET /api/sandbox/config</div>
                <div>POST /api/sandbox/payments/checkout-session</div>
                <div>GET /api/sandbox/payments/checkout-session/:sessionId</div>
                <div>POST /api/sandbox/payments/test-intent</div>
                <div>GET /api/sandbox/payments/recent</div>
              </div>
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
                <div className="text-cyan-300 font-semibold">
                  Internal Project Q&A Chatbox
                </div>
                <div>POST /api/sandbox/chat</div>
                <div className="text-slate-400">
                  Body: {"{ message, history, mode, includeProjectKnowledge, systemPrompt, model, temperature }"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={`grid gap-6 ${
            viewMode === "split"
              ? "grid-cols-1 lg:grid-cols-2 items-start"
              : "grid-cols-1 max-w-3xl mx-auto"
          }`}
        >
          {(viewMode === "split" || viewMode === "payment") && (
            <PaymentPanel config={config} />
          )}
          {(viewMode === "split" || viewMode === "chat") && (
            <AiChatPanel config={config} />
          )}
        </div>
      </main>
    </div>
  );
}
