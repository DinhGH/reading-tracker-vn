import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SANDBOX_DATA_DIR = path.resolve(__dirname, "../data/sandbox");

function loadSandboxPromptAssets() {
  const knowledgePath = path.join(SANDBOX_DATA_DIR, "project-knowledge.md");
  const systemPromptPath = path.join(SANDBOX_DATA_DIR, "system-prompt.txt");
  const faqPromptsPath = path.join(SANDBOX_DATA_DIR, "faq-prompts.json");

  const projectKnowledge = fs.existsSync(knowledgePath)
    ? fs.readFileSync(knowledgePath, "utf-8").trim()
    : "";
  const baseSystemPrompt = fs.existsSync(systemPromptPath)
    ? fs.readFileSync(systemPromptPath, "utf-8").trim()
    : "You are an internal AI assistant for the DiiD project.";

  let faqPrompts = { modes: [], quickQuestions: [] };
  if (fs.existsSync(faqPromptsPath)) {
    try {
      faqPrompts = JSON.parse(fs.readFileSync(faqPromptsPath, "utf-8"));
    } catch {
      faqPrompts = { modes: [], quickQuestions: [] };
    }
  }

  return { projectKnowledge, baseSystemPrompt, faqPrompts };
}

const ZERO_DECIMAL_CURRENCIES = new Set(["vnd", "jpy", "krw"]);

export const SANDBOX_PLANS = [
  {
    id: "starter",
    name: "Starter Test Pack",
    description: "Basic sandbox tier for quick checkout verification",
    amount: 5,
    currency: "usd",
  },
  {
    id: "pro",
    name: "Pro Sandbox Plan",
    description: "Standard subscription-style one-time test payment",
    amount: 19,
    currency: "usd",
  },
  {
    id: "enterprise",
    name: "Enterprise Test Pack",
    description: "High-value checkout flow for testing receipts & limits",
    amount: 49,
    currency: "usd",
  },
];

export const AVAILABLE_AI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
];

export const TEST_PAYMENT_METHODS = {
  visa_success: {
    paymentMethod: "pm_card_visa",
    label: "Visa (Success)",
    expectedOutcome: "succeeded",
  },
  mastercard_success: {
    paymentMethod: "pm_card_mastercard",
    label: "Mastercard (Success)",
    expectedOutcome: "succeeded",
  },
  declined: {
    paymentMethod: "pm_card_chargeDeclined",
    label: "Generic Decline",
    expectedOutcome: "card_declined",
  },
  insufficient_funds: {
    paymentMethod: "pm_card_chargeDeclinedInsufficientFunds",
    label: "Insufficient Funds",
    expectedOutcome: "insufficient_funds",
  },
  expired: {
    paymentMethod: "pm_card_chargeDeclinedExpiredCard",
    label: "Expired Card",
    expectedOutcome: "expired_card",
  },
  requires_3ds: {
    paymentMethod: "pm_card_authenticationRequired",
    label: "3D Secure Required",
    expectedOutcome: "requires_action",
  },
};

function toStripeUnitAmount(amount, currency) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  const normalizedCurrency = String(currency || "usd").toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    return Math.round(numericAmount);
  }
  return Math.round(numericAmount * 100);
}

function fromStripeUnitAmount(unitAmount, currency) {
  const normalizedCurrency = String(currency || "usd").toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    return unitAmount;
  }
  return Number((unitAmount / 100).toFixed(2));
}

function sanitizeReturnBaseUrl(rawUrl) {
  const fallback = "http://localhost:5173/sandbox";
  if (!rawUrl || typeof rawUrl !== "string") {
    return fallback;
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return fallback;
  }
}

class SandboxService {
  constructor() {
    this.stripeClient = null;
    this.geminiClient = null;
  }

  getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured in server .env.");
    }
    if (!this.stripeClient) {
      this.stripeClient = new Stripe(secretKey);
    }
    return this.stripeClient;
  }

  getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in server .env.");
    }
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenerativeAI(apiKey);
    }
    return this.geminiClient;
  }

  getConfigStatus() {
    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    const geminiKey = process.env.GEMINI_API_KEY || "";
    const { baseSystemPrompt, faqPrompts, projectKnowledge } =
      loadSandboxPromptAssets();

    return {
      stripeConfigured: Boolean(stripeKey),
      stripeMode: stripeKey.startsWith("sk_test_")
        ? "test"
        : stripeKey
          ? "live"
          : "unconfigured",
      geminiConfigured: Boolean(geminiKey),
      defaultModel: AVAILABLE_AI_MODELS[0],
      availableModels: AVAILABLE_AI_MODELS,
      defaultAiMode: faqPrompts.modes?.[0]?.id || "internal_qa",
      aiModes: faqPrompts.modes || [],
      quickQuestions: faqPrompts.quickQuestions || [],
      defaultSystemPrompt: baseSystemPrompt,
      knowledgeLoaded: Boolean(projectKnowledge),
      plans: SANDBOX_PLANS,
      testCards: Object.entries(TEST_PAYMENT_METHODS).map(([key, value]) => ({
        key,
        label: value.label,
        expectedOutcome: value.expectedOutcome,
      })),
    };
  }

  resolvePaymentItem({ planId, productName, amount, currency }) {
    const preset = planId
      ? SANDBOX_PLANS.find((plan) => plan.id === planId)
      : null;

    const resolvedName =
      (productName && String(productName).trim()) ||
      preset?.name ||
      "Sandbox Test Item";
    const resolvedCurrency = String(
      currency || preset?.currency || "usd",
    ).toLowerCase();
    const resolvedAmount =
      amount !== undefined && amount !== null && amount !== ""
        ? Number(amount)
        : preset?.amount;

    const unitAmount = toStripeUnitAmount(resolvedAmount, resolvedCurrency);

    return {
      productName: resolvedName,
      currency: resolvedCurrency,
      displayAmount: Number(resolvedAmount),
      unitAmount,
      planId: preset?.id || "custom",
    };
  }

  async createCheckoutSession(payload) {
    const stripe = this.getStripeClient();
    const item = this.resolvePaymentItem(payload);
    const baseReturnUrl = sanitizeReturnBaseUrl(payload.returnUrl);

    const separator = baseReturnUrl.includes("?") ? "&" : "?";
    const successUrl = `${baseReturnUrl}${separator}payment_status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseReturnUrl}${separator}payment_status=canceled`;

    const metadata = {
      source: "diid-sandbox",
      planId: item.planId,
      ...(payload.metadata && typeof payload.metadata === "object"
        ? Object.fromEntries(
            Object.entries(payload.metadata).map(([k, v]) => [k, String(v)]),
          )
        : {}),
    };

    const sessionParams = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: item.currency,
            product_data: {
              name: item.productName,
              description: `Sandbox test checkout (${item.planId})`,
            },
            unit_amount: item.unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    };

    if (payload.customerEmail && String(payload.customerEmail).trim()) {
      sessionParams.customer_email = String(payload.customerEmail).trim();
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      url: session.url,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: fromStripeUnitAmount(session.amount_total, session.currency),
      currency: session.currency,
      productName: item.productName,
    };
  }

  async getCheckoutSession(sessionId) {
    if (!sessionId || typeof sessionId !== "string") {
      throw new Error("sessionId is required.");
    }

    const stripe = this.getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const paymentIntent =
      session.payment_intent && typeof session.payment_intent === "object"
        ? session.payment_intent
        : null;

    return {
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: fromStripeUnitAmount(
        session.amount_total || 0,
        session.currency,
      ),
      currency: session.currency,
      customerEmail:
        session.customer_details?.email || session.customer_email || null,
      paymentIntentId: paymentIntent?.id || session.payment_intent || null,
      paymentIntentStatus: paymentIntent?.status || null,
      createdAt: new Date(session.created * 1000).toISOString(),
      metadata: session.metadata || {},
    };
  }

  async createTestPaymentIntent(payload) {
    const stripe = this.getStripeClient();
    const item = this.resolvePaymentItem(payload);
    const cardPreset =
      TEST_PAYMENT_METHODS[payload.testCardType || "visa_success"];

    if (!cardPreset) {
      throw new Error("Unsupported testCardType.");
    }

    const metadata = {
      source: "diid-sandbox-instant",
      planId: item.planId,
      testCardType: payload.testCardType || "visa_success",
      ...(payload.metadata && typeof payload.metadata === "object"
        ? Object.fromEntries(
            Object.entries(payload.metadata).map(([k, v]) => [k, String(v)]),
          )
        : {}),
    };

    try {
      const intentParams = {
        amount: item.unitAmount,
        currency: item.currency,
        payment_method: cardPreset.paymentMethod,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        description: `${item.productName} (Sandbox Instant Test)`,
        metadata,
      };

      if (payload.customerEmail && String(payload.customerEmail).trim()) {
        intentParams.receipt_email = String(payload.customerEmail).trim();
      }

      const intent = await stripe.paymentIntents.create(intentParams);

      return {
        success: intent.status === "succeeded",
        paymentIntentId: intent.id,
        status: intent.status,
        amount: fromStripeUnitAmount(intent.amount, intent.currency),
        currency: intent.currency,
        testCard: cardPreset.label,
        nextActionType: intent.next_action?.type || null,
        createdAt: new Date(intent.created * 1000).toISOString(),
      };
    } catch (err) {
      if (err?.type === "StripeCardError" || err?.raw?.payment_intent) {
        const failedIntent = err.raw?.payment_intent;
        return {
          success: false,
          paymentIntentId: failedIntent?.id || null,
          status: failedIntent?.status || "failed",
          amount: item.displayAmount,
          currency: item.currency,
          testCard: cardPreset.label,
          declineCode: err.decline_code || err.code || "card_declined",
          errorMessage: err.message,
          createdAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  }

  async listRecentPayments(limit = 8) {
    const stripe = this.getStripeClient();
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 25);

    const [sessionsRes, intentsRes] = await Promise.all([
      stripe.checkout.sessions.list({ limit: safeLimit }),
      stripe.paymentIntents.list({ limit: safeLimit }),
    ]);

    const checkoutSessions = sessionsRes.data.map((s) => ({
      id: s.id,
      type: "checkout_session",
      status: s.payment_status || s.status,
      amount: fromStripeUnitAmount(s.amount_total || 0, s.currency || "usd"),
      currency: s.currency || "usd",
      customerEmail: s.customer_details?.email || s.customer_email || null,
      description: s.metadata?.planId
        ? `Checkout (${s.metadata.planId})`
        : "Checkout Session",
      createdAt: new Date(s.created * 1000).toISOString(),
    }));

    const paymentIntents = intentsRes.data.map((pi) => ({
      id: pi.id,
      type: "payment_intent",
      status: pi.status,
      amount: fromStripeUnitAmount(pi.amount || 0, pi.currency || "usd"),
      currency: pi.currency || "usd",
      customerEmail: pi.receipt_email || null,
      description: pi.description || "PaymentIntent",
      createdAt: new Date(pi.created * 1000).toISOString(),
    }));

    return {
      checkoutSessions,
      paymentIntents,
    };
  }

  async chatWithAI({
    message,
    history = [],
    mode = "internal_qa",
    systemPrompt,
    includeProjectKnowledge = true,
    model = AVAILABLE_AI_MODELS[0],
    temperature = 0.3,
    maxOutputTokens = 1024,
  }) {
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new Error("Message cannot be empty.");
    }

    const selectedModel = AVAILABLE_AI_MODELS.includes(model)
      ? model
      : AVAILABLE_AI_MODELS[0];

    const safeTemp = Math.min(Math.max(Number(temperature) ?? 0.3, 0), 2);
    const safeMaxTokens = Math.min(
      Math.max(Number(maxOutputTokens) || 1024, 64),
      4096,
    );

    const { projectKnowledge, baseSystemPrompt, faqPrompts } =
      loadSandboxPromptAssets();
    const activeMode =
      (faqPrompts.modes || []).find((m) => m.id === mode) ||
      faqPrompts.modes?.[0] ||
      null;

    const instructionParts = [];
    const customOrBasePrompt =
      typeof systemPrompt === "string" && systemPrompt.trim()
        ? systemPrompt.trim()
        : baseSystemPrompt;
    if (customOrBasePrompt) {
      instructionParts.push(customOrBasePrompt);
    }
    if (activeMode?.extraInstruction) {
      instructionParts.push(
        `[Chế độ trả lời: ${activeMode.label}]\n${activeMode.extraInstruction}`,
      );
    }
    if (includeProjectKnowledge !== false && projectKnowledge) {
      instructionParts.push(
        `=== TÀI LIỆU KIẾN THỨC NỘI BỘ DỰ ÁN ===\n${projectKnowledge}`,
      );
    }

    const genAI = this.getGeminiClient();

    const modelConfig = {
      model: selectedModel,
      generationConfig: {
        temperature: safeTemp,
        maxOutputTokens: safeMaxTokens,
      },
    };

    if (instructionParts.length > 0) {
      modelConfig.systemInstruction = instructionParts.join("\n\n");
    }

    // Use v1beta when systemInstruction is set, or always v1beta (verified HTTP 200)
    const generativeModel = genAI.getGenerativeModel(modelConfig, {
      apiVersion: "v1beta",
    });

    const normalizedHistory = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              typeof item.text === "string" &&
              item.text.trim().length > 0 &&
              (item.role === "user" || item.role === "model"),
          )
          .map((item) => ({
            role: item.role,
            parts: [{ text: item.text }],
          }))
      : [];

    // Gemini requires chat history to start with a user turn
    while (normalizedHistory.length > 0 && normalizedHistory[0].role !== "user") {
      normalizedHistory.shift();
    }

    const startedAt = Date.now();
    const chat = generativeModel.startChat({ history: normalizedHistory });
    const result = await chat.sendMessage(message.trim());
    const latencyMs = Date.now() - startedAt;

    const response = result.response;
    const reply = response.text();

    return {
      reply,
      model: selectedModel,
      mode: activeMode?.id || mode,
      knowledgeAttached:
        includeProjectKnowledge !== false && Boolean(projectKnowledge),
      latencyMs,
      usageMetadata: response.usageMetadata || null,
    };
  }
}

export default new SandboxService();
