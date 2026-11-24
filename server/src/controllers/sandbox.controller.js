import SandboxService from "../services/sandbox.service.js";

class SandboxController {
  static getConfig(req, res) {
    try {
      const config = SandboxService.getConfigStatus();
      return res.status(200).json({ success: true, data: config });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createCheckoutSession(req, res) {
    try {
      const fallbackOrigin =
        req.headers.origin || `${req.protocol}://${req.get("host")}`;
      const payload = {
        ...req.body,
        returnUrl: req.body?.returnUrl || `${fallbackOrigin}/sandbox`,
      };
      const session = await SandboxService.createCheckoutSession(payload);
      return res.status(200).json({ success: true, data: session });
    } catch (err) {
      console.error("Sandbox checkout session error:", err.message);
      const status = err.message.includes("Amount must be") ? 400 : 500;
      return res.status(status).json({ success: false, error: err.message });
    }
  }

  static async getCheckoutSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await SandboxService.getCheckoutSession(sessionId);
      return res.status(200).json({ success: true, data: session });
    } catch (err) {
      console.error("Sandbox retrieve session error:", err.message);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async createTestPaymentIntent(req, res) {
    try {
      const result = await SandboxService.createTestPaymentIntent(
        req.body || {},
      );
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error("Sandbox test payment intent error:", err.message);
      const status =
        err.message.includes("Amount must be") ||
        err.message.includes("Unsupported testCardType")
          ? 400
          : 500;
      return res.status(status).json({ success: false, error: err.message });
    }
  }

  static async listRecentPayments(req, res) {
    try {
      const limit = req.query.limit;
      const data = await SandboxService.listRecentPayments(limit);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Sandbox list payments error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async chat(req, res) {
    try {
      const data = await SandboxService.chatWithAI(req.body || {});
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Sandbox AI chat error:", err.message);
      const status = err.message.includes("cannot be empty") ? 400 : 500;
      return res.status(status).json({ success: false, error: err.message });
    }
  }
}

export default SandboxController;
