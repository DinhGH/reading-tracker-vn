// ai.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const { GEMINI_API_KEY } = process.env;

// Service to summarize an article and classify its topic
class AIService {
  constructor() {
    this.client = null;
    this.model = "gemini-3.5-flash-lite";
  }

  ensureInitialized() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not configured in environment variables.",
      );
    }
    if (!this.client) {
      // Force API version v1 to avoid v1beta errors
      this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
        apiVersion: "v1",
      });
    }
  }

  /**
   * Summarize an article (3-5 sentences), classify main topics, and categorize the article.
   * @param {string} articleText - The input article content.
   * @returns {Promise<{summary: string, topics: string[], category: string, confidence: number}>}
   */
  async summarizeAndClassify(articleText) {
    if (
      !articleText ||
      typeof articleText !== "string" ||
      articleText.trim().length < 20
    ) {
      throw new Error(
        "Invalid article text. Please provide article content of sufficient length.",
      );
    }

    try {
      const prompt = `Please perform the following tasks on the provided article:

1. Provide a summary of 3-5 sentences capturing the main points.
2. Classify the main topics/subjects covered in the article.
3. Categorize the article into one of these categories: Technology, Economy, Politics, Sports, Education, Health, Entertainment, Others.
4. Provide a confidence score (0.0 to 1.0) for the category.

Article:
${articleText}

Respond in JSON format:
{
  "summary": "your 3-5 sentence summary here",
  "topics": ["topic1", "topic2", "topic3"],
  "category": "category_name",
  "confidence": 0.0
}`;

      this.ensureInitialized();
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
      });

      const result = await generativeModel.generateContent(prompt);
      const responseText = result.response.text();

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format from Gemini API");
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);

      let { summary, topics, category, confidence } = parsedResponse;

      // Validate and clean summary
      if (typeof summary === "string") {
        // Split into sentences and ensure 3-5 sentences
        let sentences = summary.match(/[^.!?]+[.!?]+/g) || [summary];
        sentences = sentences.map((s) => s.trim());

        if (sentences.length > 5) {
          sentences = sentences.slice(0, 5);
        } else if (sentences.length < 3) {
          sentences = [summary];
        }

        summary = sentences.join(" ").trim();
      }

      // Validate topics is an array
      if (!Array.isArray(topics)) {
        topics = [topics];
      }

      return {
        summary,
        topics,
        category: category || "Others",
        confidence: typeof confidence === "number" ? confidence : 0.0,
      };
    } catch (error) {
      let msg = "Failed to summarize and classify the article.";

      if (error.message.includes("API key")) {
        msg += " (Invalid API key - check GEMINI_API_KEY)";
      } else if (error.message.includes("rate limit")) {
        msg += " (Rate limit exceeded)";
      } else if (error.message.includes("Invalid response")) {
        msg += " (Could not parse API response)";
      } else {
        msg += ` (${error.message})`;
      }

      console.error("Error in AIService:", error.message);
      throw new Error(msg);
    }
  }
}

export default new AIService();
