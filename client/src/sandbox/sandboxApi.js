import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/sandbox",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function fetchSandboxConfig() {
  const res = await apiClient.get("/config");
  return res.data.data;
}

export async function createCheckoutSession(payload) {
  const res = await apiClient.post("/payments/checkout-session", payload);
  return res.data.data;
}

export async function fetchCheckoutSession(sessionId) {
  const res = await apiClient.get(
    `/payments/checkout-session/${encodeURIComponent(sessionId)}`,
  );
  return res.data.data;
}

export async function createTestPaymentIntent(payload) {
  const res = await apiClient.post("/payments/test-intent", payload);
  return res.data.data;
}

export async function fetchRecentPayments(limit = 8) {
  const res = await apiClient.get("/payments/recent", { params: { limit } });
  return res.data.data;
}

export async function sendAiChatMessage(payload) {
  const res = await apiClient.post("/chat", payload);
  return res.data.data;
}
