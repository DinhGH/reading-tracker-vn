import express from "express";
import SandboxController from "../controllers/sandbox.controller.js";

const router = express.Router();

router.get("/config", SandboxController.getConfig);

// Stripe Sandbox Payment Endpoints
router.post(
  "/payments/checkout-session",
  SandboxController.createCheckoutSession,
);
router.get(
  "/payments/checkout-session/:sessionId",
  SandboxController.getCheckoutSession,
);
router.post(
  "/payments/test-intent",
  SandboxController.createTestPaymentIntent,
);
router.get("/payments/recent", SandboxController.listRecentPayments);

// Internal AI Chatbox Endpoint
router.post("/chat", SandboxController.chat);

export default router;
