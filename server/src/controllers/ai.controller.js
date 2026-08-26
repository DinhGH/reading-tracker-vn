import AIService from "../services/ai.service.js";

class AIController {
  // Endpoint for summarizing an article
  static async summarize(req, res) {
    try {
      const { content } = req.body;
      if (!content) {
        return res
          .status(400)
          .json({ error: "Missing 'content' in request body." });
      }

      const result = await AIService.summarizeAndClassify(content);
      return res.status(200).json({ summary: result.summary });
    } catch (err) {
      console.error("Error in summarization:", err.message);
      return res
        .status(500)
        .json({ error: "Summarization failed.", details: err.message });
    }
  }

  // Endpoint for classifying article topics
  static async classify(req, res) {
    try {
      const { content } = req.body;
      if (!content) {
        return res
          .status(400)
          .json({ error: "Missing 'content' in request body." });
      }

      const result = await AIService.summarizeAndClassify(content);
      return res.status(200).json({ topics: result.topics });
    } catch (err) {
      console.error("Error in classification:", err.message);
      return res
        .status(500)
        .json({ error: "Classification failed.", details: err.message });
    }
  }
}

export default AIController;
