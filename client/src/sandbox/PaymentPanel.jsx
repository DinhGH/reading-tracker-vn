import { useEffect, useState } from "react";
import {
  CreditCard,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import {
  createCheckoutSession,
  createTestPaymentIntent,
  fetchCheckoutSession,
  fetchRecentPayments,
} from "./sandboxApi";

function formatMoney(amount, currency = "usd") {
  const upper = String(currency).toUpperCase();
  if (upper === "VND") {
    return `${Number(amount || 0).toLocaleString("vi-VN")} VND`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: upper,
  }).format(Number(amount || 0));
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const isSuccess = normalized === "paid" || normalized === "succeeded";
  const isPending =
    normalized === "open" ||
    normalized === "unpaid" ||
    normalized === "requires_action" ||
    normalized === "processing";

  const colorClasses = isSuccess
    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    : isPending
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-rose-500/15 text-rose-300 border-rose-500/30";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      {status || "unknown"}
    </span>
  );
}

export default function PaymentPanel({ config }) {
  const plans = config?.plans || [];
  const testCards = config?.testCards || [];

  const [selectedPlanId, setSelectedPlanId] = useState("pro");
  const [customAmount, setCustomAmount] = useState("25");
  const [currency, setCurrency] = useState("usd");
  const [productName, setProductName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("tester@example.com");
  const [orderRef, setOrderRef] = useState("ext-test-001");
  const [testCardType, setTestCardType] = useState("visa_success");
  const [autoRedirect, setAutoRedirect] = useState(true);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [intentLoading, setIntentLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);

  const [checkoutResult, setCheckoutResult] = useState(null);
  const [intentResult, setIntentResult] = useState(null);
  const [returnSession, setReturnSession] = useState(null);
  const [returnStatusBanner, setReturnStatusBanner] = useState(null);
  const [recentPayments, setRecentPayments] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const activePlan = plans.find((p) => p.id === selectedPlanId);

  const loadRecentPayments = async () => {
    setRecentLoading(true);
    try {
      const data = await fetchRecentPayments(6);
      setRecentPayments(data);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || err.message || "Failed to load payments.",
      );
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const sessionId = params.get("session_id");

    let cancelled = false;

    async function handleInitialLoad() {
      if (paymentStatus === "canceled") {
        setReturnStatusBanner({
          type: "canceled",
          message: "Stripe Checkout was canceled before completion.",
        });
      } else if (paymentStatus === "success" && sessionId) {
        try {
          const verified = await fetchCheckoutSession(sessionId);
          if (!cancelled) {
            setReturnSession(verified);
            setReturnStatusBanner({
              type: "success",
              message: `Checkout verified (${verified.paymentStatus}).`,
            });
          }
        } catch (err) {
          if (!cancelled) {
            setErrorMessage(
              err.response?.data?.error || "Could not verify checkout session.",
            );
          }
        }
      }

      if (config?.stripeConfigured) {
        try {
          const data = await fetchRecentPayments(6);
          if (!cancelled) {
            setRecentPayments(data);
          }
        } catch {
          // Ignore initial recent list error; manual refresh will show details
        }
      }
    }

    handleInitialLoad();
    return () => {
      cancelled = true;
    };
  }, [config?.stripeConfigured]);

  const buildPayload = () => {
    const isCustom = selectedPlanId === "custom";
    return {
      planId: isCustom ? undefined : selectedPlanId,
      productName:
        productName.trim() ||
        (isCustom ? "Custom Sandbox Item" : activePlan?.name),
      amount: isCustom ? Number(customAmount) : activePlan?.amount,
      currency: isCustom ? currency : activePlan?.currency || "usd",
      customerEmail: customerEmail.trim() || undefined,
      returnUrl: `${window.location.origin}/sandbox`,
      metadata: {
        orderRef: orderRef.trim() || "manual-test",
      },
    };
  };

  const handleCreateCheckout = async () => {
    setErrorMessage("");
    setCheckoutResult(null);
    setCheckoutLoading(true);
    try {
      const data = await createCheckoutSession(buildPayload());
      setCheckoutResult(data);
      if (autoRedirect && data.url) {
        window.location.assign(data.url);
        return;
      }
      await loadRecentPayments();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error ||
          err.message ||
          "Failed to create Stripe Checkout Session.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRunTestIntent = async () => {
    setErrorMessage("");
    setIntentResult(null);
    setIntentLoading(true);
    try {
      const data = await createTestPaymentIntent({
        ...buildPayload(),
        testCardType,
      });
      setIntentResult(data);
      await loadRecentPayments();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error ||
          err.message ||
          "Failed to create test PaymentIntent.",
      );
    } finally {
      setIntentLoading(false);
    }
  };

  const dismissReturnBanner = () => {
    setReturnStatusBanner(null);
    setReturnSession(null);
    window.history.replaceState({}, "", "/sandbox");
  };

  return (
    <section
      data-testid="payment-panel"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <CreditCard className="w-4 h-4" />
            <span>Stripe Payment Sandbox</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Checkout & Instant Test Charge
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Supports real Stripe Checkout redirects and instant server-side
            test-card PaymentIntents.
          </p>
        </div>
        <span
          data-testid="stripe-mode-badge"
          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
            config?.stripeConfigured
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
          }`}
        >
          {config?.stripeConfigured
            ? `Stripe ${config.stripeMode.toUpperCase()}`
            : "Stripe Missing"}
        </span>
      </div>

      {returnStatusBanner && (
        <div
          data-testid="checkout-return-banner"
          className={`rounded-xl p-4 border flex flex-col gap-2 ${
            returnStatusBanner.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
              : "bg-amber-950/50 border-amber-500/40 text-amber-200"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              {returnStatusBanner.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>{returnStatusBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={dismissReturnBanner}
              className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Clear
            </button>
          </div>
          {returnSession && (
            <div className="text-xs font-mono bg-slate-950/60 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-300">
              <div>sessionId: {returnSession.sessionId}</div>
              <div>
                amount:{" "}
                {formatMoney(returnSession.amountTotal, returnSession.currency)}
              </div>
              <div>paymentIntent: {returnSession.paymentIntentId || "n/a"}</div>
              <div>email: {returnSession.customerEmail || "n/a"}</div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div
          data-testid="payment-error"
          className="rounded-xl p-3 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-sm flex items-center gap-2"
        >
          <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Plan selector */}
      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          1. Select Test Plan or Custom Amount
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {plans.map((plan) => {
            const active = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                data-testid={`plan-${plan.id}`}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                  active
                    ? "bg-indigo-600/20 border-indigo-400 text-white"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-semibold truncate">{plan.name}</div>
                <div className="text-lg font-bold mt-1">
                  {formatMoney(plan.amount, plan.currency)}
                </div>
              </button>
            );
          })}
          <button
            type="button"
            data-testid="plan-custom"
            onClick={() => setSelectedPlanId("custom")}
            className={`text-left p-3 rounded-xl border transition cursor-pointer ${
              selectedPlanId === "custom"
                ? "bg-indigo-600/20 border-indigo-400 text-white"
                : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <div className="text-xs font-semibold">Custom Amount</div>
            <div className="text-lg font-bold mt-1">Flexible</div>
          </button>
        </div>
      </div>

      {/* Form inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {selectedPlanId === "custom" && (
          <>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Amount
              </label>
              <input
                data-testid="payment-amount-input"
                type="number"
                min="1"
                step="any"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Currency
              </label>
              <select
                data-testid="payment-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
              >
                <option value="usd">USD ($)</option>
                <option value="vnd">VND (₫)</option>
                <option value="eur">EUR (€)</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Product / Description Override
          </label>
          <input
            data-testid="payment-product-input"
            type="text"
            placeholder={activePlan?.name || "Sandbox Test Item"}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Customer Email
          </label>
          <input
            data-testid="payment-email-input"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            External Order Reference (metadata.orderRef)
          </label>
          <input
            data-testid="payment-order-ref-input"
            type="text"
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Instant Test Card Preset
          </label>
          <select
            data-testid="test-card-select"
            value={testCardType}
            onChange={(e) => setTestCardType(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
          >
            {testCards.map((card) => (
              <option key={card.key} value={card.key}>
                {card.label} ({card.expectedOutcome})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-1">
        <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            data-testid="auto-redirect-checkbox"
            type="checkbox"
            checked={autoRedirect}
            onChange={(e) => setAutoRedirect(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-indigo-500"
          />
          Auto-redirect browser to Stripe Hosted Checkout URL (uncheck to
          inspect generated URL first)
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="stripe-checkout-btn"
            disabled={checkoutLoading || !config?.stripeConfigured}
            onClick={handleCreateCheckout}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            {checkoutLoading
              ? "Creating Checkout..."
              : "Pay via Stripe Checkout"}
          </button>

          <button
            type="button"
            data-testid="instant-test-charge-btn"
            disabled={intentLoading || !config?.stripeConfigured}
            onClick={handleRunTestIntent}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            {intentLoading ? "Processing Charge..." : "Run Instant Test Card"}
          </button>
        </div>
      </div>

      {/* Checkout URL Output */}
      {checkoutResult && (
        <div
          data-testid="checkout-session-result"
          className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-indigo-300">
              Checkout Session Created
            </span>
            <StatusBadge status={checkoutResult.paymentStatus} />
          </div>
          <div className="font-mono text-slate-300 break-all">
            ID: {checkoutResult.sessionId}
          </div>
          {checkoutResult.url && (
            <a
              href={checkoutResult.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 underline"
            >
              Open Stripe Checkout Page
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Instant PaymentIntent Output */}
      {intentResult && (
        <div
          data-testid="instant-charge-result"
          className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              Instant PaymentIntent Result ({intentResult.testCard})
            </span>
            <StatusBadge status={intentResult.status} />
          </div>
          <pre className="font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(intentResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Recent Stripe Transactions */}
      <div className="border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent Stripe Test Records
          </span>
          <button
            type="button"
            data-testid="refresh-payments-btn"
            onClick={loadRecentPayments}
            disabled={recentLoading}
            className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${recentLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {!recentPayments?.paymentIntents?.length &&
          !recentPayments?.checkoutSessions?.length ? (
            <div className="text-xs text-slate-500 py-2">
              No recent Stripe records loaded yet.
            </div>
          ) : (
            [
              ...(recentPayments?.checkoutSessions || []),
              ...(recentPayments?.paymentIntents || []),
            ]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 6)
              .map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/70 border border-slate-800/80 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="text-slate-200 font-medium truncate">
                      {item.description}
                    </div>
                    <div className="text-slate-500 font-mono truncate">
                      {item.id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-semibold text-slate-200">
                      {formatMoney(item.amount, item.currency)}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </section>
  );
}
